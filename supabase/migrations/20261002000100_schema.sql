-- NOIRÉ — core commerce schema
-- Profiles, catalog, carts, orders, wishlist and newsletter, with Row Level Security.

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.noire_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.noire_product_gender as enum ('unisex', 'feminine', 'masculine');

create type public.noire_order_status as enum (
  'pending_payment',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

create type public.noire_payment_status as enum ('pending', 'paid', 'refunded', 'failed');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.noire_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.noire_profiles
  for each row execute function public.noire_set_updated_at();

-- Create or refresh a profile whenever an auth user is created or changes.
create or replace function public.noire_handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.noire_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.noire_profiles.full_name, excluded.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.noire_profiles.avatar_url);
  return new;
end;
$$;

create trigger noire_on_auth_user_created
  after insert on auth.users
  for each row execute function public.noire_handle_auth_user_change();

create trigger noire_on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.noire_handle_auth_user_change();

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.noire_products (
  id uuid primary key default gen_random_uuid(),
  number smallint not null unique,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null,
  short_description text not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  category text not null default 'Eau de Parfum',
  gender public.noire_product_gender not null default 'unisex',
  fragrance_family text not null
    check (fragrance_family in ('woody', 'floral', 'fresh', 'amber', 'citrus', 'gourmand')),
  secondary_family text
    check (secondary_family in ('woody', 'floral', 'fresh', 'amber', 'citrus', 'gourmand', 'musk', 'spicy', 'leather', 'aquatic')),
  top_notes text[] not null default '{}',
  heart_notes text[] not null default '{}',
  base_notes text[] not null default '{}',
  moods text[] not null default '{}',
  scent_profiles text[] not null default '{}',
  longevity text,
  sillage text,
  accent_color text not null default '#B8A486',
  image_url text not null,
  gallery_images text[] not null default '{}',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sales_count integer not null default 0 check (sales_count >= 0),
  sort_order integer not null default 0,
  featured boolean not null default false,
  bestseller boolean not null default false,
  new_arrival boolean not null default false,
  is_active boolean not null default true,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.noire_products.price is 'Starting price: the lowest active variant price. Maintained by trigger.';
comment on column public.noire_products.stock_quantity is 'Total units across variants. Maintained by trigger.';

create index noire_products_family_idx on public.noire_products (fragrance_family);
create index noire_products_moods_idx on public.noire_products using gin (moods);
create index noire_products_profiles_idx on public.noire_products using gin (scent_profiles);
create index noire_products_search_idx on public.noire_products using gin (search_vector);

create table public.noire_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.noire_products (id) on delete cascade,
  size_ml smallint not null check (size_ml > 0),
  price numeric(12, 2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size_ml)
);

create index noire_product_variants_product_idx on public.noire_product_variants (product_id);

create trigger products_set_updated_at
  before update on public.noire_products
  for each row execute function public.noire_set_updated_at();

create trigger product_variants_set_updated_at
  before update on public.noire_product_variants
  for each row execute function public.noire_set_updated_at();

-- Keep the product's starting price and total stock in sync with its variants.
create or replace function public.noire_sync_product_from_variants()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_product uuid := coalesce(new.product_id, old.product_id);
begin
  update public.noire_products p
  set
    price = coalesce((select min(v.price) from public.noire_product_variants v where v.product_id = target_product), 0),
    stock_quantity = coalesce((select sum(v.stock_quantity) from public.noire_product_variants v where v.product_id = target_product), 0)
  where p.id = target_product;
  return null;
end;
$$;

create trigger product_variants_sync_product
  after insert or update of price, stock_quantity or delete on public.noire_product_variants
  for each row execute function public.noire_sync_product_from_variants();

-- Full-text search document: name and number weigh most, then family and notes, then mood and copy.
create or replace function public.noire_products_build_search_vector()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', extensions.unaccent(
      coalesce(new.name, '') || ' noire ' || lpad(new.number::text, 2, '0'))), 'A') ||
    setweight(to_tsvector('simple', extensions.unaccent(
      coalesce(new.fragrance_family, '') || ' ' || coalesce(new.secondary_family, '') || ' ' ||
      array_to_string(new.scent_profiles, ' '))), 'B') ||
    setweight(to_tsvector('simple', extensions.unaccent(
      array_to_string(new.top_notes || new.heart_notes || new.base_notes, ' '))), 'B') ||
    setweight(to_tsvector('simple', extensions.unaccent(
      replace(array_to_string(new.moods, ' '), '-', ' '))), 'C') ||
    setweight(to_tsvector('simple', extensions.unaccent(
      coalesce(new.short_description, '') || ' ' || coalesce(new.description, ''))), 'D');
  return new;
end;
$$;

create trigger products_search_vector
  before insert or update of name, number, fragrance_family, secondary_family, scent_profiles,
    top_notes, heart_notes, base_notes, moods, short_description, description
  on public.noire_products
  for each row execute function public.noire_products_build_search_vector();

-- Search active products. All terms must match (prefix matching); falls back to any term.
create or replace function public.noire_search_products(search_query text)
returns setof public.noire_products
language plpgsql
stable
set search_path = ''
as $$
declare
  cleaned text;
  terms text[];
  strict_query tsquery;
  loose_query tsquery;
begin
  cleaned := lower(extensions.unaccent(coalesce(search_query, '')));
  cleaned := regexp_replace(cleaned, '[^a-z0-9]+', ' ', 'g');
  cleaned := btrim(cleaned);
  if cleaned = '' then
    return;
  end if;

  terms := (select array_agg(t || ':*') from unnest(string_to_array(cleaned, ' ')) as t where t <> '');
  strict_query := to_tsquery('simple', array_to_string(terms, ' & '));
  loose_query := to_tsquery('simple', array_to_string(terms, ' | '));

  return query
    select p.*
    from public.noire_products p
    where p.is_active and p.search_vector @@ strict_query
    order by ts_rank(p.search_vector, strict_query) desc, p.sort_order;

  if not found then
    return query
      select p.*
      from public.noire_products p
      where p.is_active and p.search_vector @@ loose_query
      order by ts_rank(p.search_vector, loose_query) desc, p.sort_order;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Carts — one per signed-in customer, or one per guest browser (cookie-bound id).
-- Only reachable through the server (service role); no client policies.
-- ---------------------------------------------------------------------------

create table public.noire_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.noire_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.noire_carts (id) on delete cascade,
  product_id uuid not null references public.noire_products (id) on delete cascade,
  product_variant_id uuid not null references public.noire_product_variants (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_variant_id)
);

create index noire_cart_items_cart_idx on public.noire_cart_items (cart_id);

create trigger carts_set_updated_at
  before update on public.noire_carts
  for each row execute function public.noire_set_updated_at();

create trigger cart_items_set_updated_at
  before update on public.noire_cart_items
  for each row execute function public.noire_set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.noire_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  order_number text not null unique,
  status public.noire_order_status not null default 'confirmed',
  payment_status public.noire_payment_status not null default 'pending',
  payment_method text not null default 'pay_on_delivery',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping_fee numeric(12, 2) not null check (shipping_fee >= 0),
  total numeric(12, 2) not null check (total >= 0),
  currency text not null default 'NGN',
  customer_email text not null,
  customer_name text not null,
  customer_phone text not null,
  shipping_address text not null,
  city text not null,
  state text not null,
  country text not null,
  postal_code text,
  delivery_notes text,
  access_token uuid not null default gen_random_uuid(),
  idempotency_key uuid not null unique,
  confirmation_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.noire_orders.access_token is 'Secret used in emailed links so guests can view their own order.';

create index noire_orders_user_idx on public.noire_orders (user_id, created_at desc);

create trigger orders_set_updated_at
  before update on public.noire_orders
  for each row execute function public.noire_set_updated_at();

-- Line items are snapshots: names, sizes and prices survive later catalog changes.
create table public.noire_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.noire_orders (id) on delete cascade,
  product_id uuid references public.noire_products (id) on delete set null,
  product_variant_id uuid references public.noire_product_variants (id) on delete set null,
  product_name text not null,
  product_number smallint not null,
  product_slug text not null,
  image_url text not null,
  sku text not null,
  size_ml smallint not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

create index noire_order_items_order_idx on public.noire_order_items (order_id);

-- ---------------------------------------------------------------------------
-- Wishlist & newsletter
-- ---------------------------------------------------------------------------

create table public.noire_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.noire_products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table public.noire_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.noire_profiles enable row level security;
alter table public.noire_products enable row level security;
alter table public.noire_product_variants enable row level security;
alter table public.noire_carts enable row level security;
alter table public.noire_cart_items enable row level security;
alter table public.noire_orders enable row level security;
alter table public.noire_order_items enable row level security;
alter table public.noire_wishlist_items enable row level security;
alter table public.noire_newsletter_subscribers enable row level security;

create policy "Profiles are visible to their owner"
  on public.noire_profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are editable by their owner"
  on public.noire_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Active products are public"
  on public.noire_products for select to anon, authenticated
  using (is_active);

create policy "Variants of active products are public"
  on public.noire_product_variants for select to anon, authenticated
  using (exists (select 1 from public.noire_products p where p.id = product_id and p.is_active));

create policy "Orders are visible to their owner"
  on public.noire_orders for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Order items are visible to the order owner"
  on public.noire_order_items for select to authenticated
  using (exists (
    select 1 from public.noire_orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));

create policy "Wishlist is visible to its owner"
  on public.noire_wishlist_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Wishlist items can be added by their owner"
  on public.noire_wishlist_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Wishlist items can be removed by their owner"
  on public.noire_wishlist_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- carts, cart_items and newsletter_subscribers intentionally have no client policies:
-- they are only read and written by server code using the service role.
