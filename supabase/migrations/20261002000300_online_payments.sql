-- NOIRÉ — online payments (Paystack).
--
-- Online orders are created as pending_payment, keep the customer's cart, and reserve stock.
-- They are confirmed only after the server has verified the payment with the provider
-- (noire_confirm_payment), or cancelled with their stock returned (noire_cancel_unpaid_order).
-- Only noire_ objects are touched: this database is shared with another application.

alter table public.noire_orders
  add column cart_id uuid references public.noire_carts (id) on delete set null,
  add column payment_reference text unique,
  add column paid_at timestamptz;

create index noire_orders_pending_idx on public.noire_orders (cart_id) where status = 'pending_payment';

-- Cancel an unpaid order and return its stock. Safe to call more than once.
create or replace function public.noire_cancel_unpaid_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.noire_orders;
begin
  select * into target from public.noire_orders where id = p_order_id for update;
  if not found or target.status <> 'pending_payment' then
    return false;
  end if;

  update public.noire_product_variants v
  set stock_quantity = v.stock_quantity + oi.quantity
  from public.noire_order_items oi
  where oi.order_id = target.id and oi.product_variant_id = v.id;

  update public.noire_products p
  set sales_count = greatest(0, p.sales_count - t.quantity)
  from (
    select product_id, sum(quantity)::int as quantity
    from public.noire_order_items
    where order_id = target.id and product_id is not null
    group by product_id
  ) t
  where t.product_id = p.id;

  update public.noire_orders
  set status = 'cancelled', payment_status = 'failed'
  where id = target.id;
  return true;
end;
$$;

-- Mark an order paid after the server has verified the payment with the provider.
-- Checks the exact amount (in kobo) and currency; empties the cart that placed the order.
create or replace function public.noire_confirm_payment(
  p_order_id uuid,
  p_reference text,
  p_amount_minor bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.noire_orders;
begin
  select * into target from public.noire_orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if target.payment_status = 'paid' then
    return jsonb_build_object('confirmed', true, 'newly_confirmed', false);
  end if;

  if target.status <> 'pending_payment' then
    raise exception 'ORDER_NOT_PAYABLE' using errcode = 'P0001', detail = target.status::text;
  end if;

  if p_currency <> target.currency or p_amount_minor <> round(target.total * 100)::bigint then
    raise exception 'AMOUNT_MISMATCH' using errcode = 'P0001';
  end if;

  update public.noire_orders
  set status = 'confirmed', payment_status = 'paid', paid_at = now(), payment_reference = p_reference
  where id = target.id;

  if target.cart_id is not null then
    delete from public.noire_cart_items where cart_id = target.cart_id;
  end if;

  return jsonb_build_object('confirmed', true, 'newly_confirmed', true);
end;
$$;

-- Release stock held by checkouts that were never paid.
create or replace function public.noire_cancel_stale_unpaid_orders(p_older_than interval default interval '30 minutes')
returns integer
language sql
security definer
set search_path = ''
as $$
  select count(*)::int from (
    select public.noire_cancel_unpaid_order(o.id) as cancelled
    from public.noire_orders o
    where o.status = 'pending_payment' and o.created_at < now() - p_older_than
  ) t where t.cancelled;
$$;

-- Replace the order function: it now records the cart and can keep it for online payments.
drop function public.noire_place_order(uuid, uuid, uuid, jsonb, numeric, numeric, text, text, public.noire_order_status);

create or replace function public.noire_place_order(
  p_cart_id uuid,
  p_user_id uuid,
  p_idempotency_key uuid,
  p_customer jsonb,
  p_shipping_fee numeric,
  p_free_shipping_threshold numeric,
  p_currency text,
  p_payment_method text,
  p_status public.noire_order_status default 'confirmed',
  p_clear_cart boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.noire_orders;
  created public.noire_orders;
  line record;
  unavailable jsonb := '[]'::jsonb;
  inactive jsonb := '[]'::jsonb;
  v_subtotal numeric(12, 2) := 0;
  v_shipping numeric(12, 2);
  v_number text;
  v_attempts int := 0;
begin
  -- Serialise concurrent submissions of the same checkout and of the same cart.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_cart_id::text, 1));

  select * into existing from public.noire_orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'id', existing.id,
      'order_number', existing.order_number,
      'access_token', existing.access_token,
      'status', existing.status,
      'total', existing.total,
      'created', false
    );
  end if;

  -- A new attempt from this cart replaces any earlier unpaid one and returns its stock first.
  perform public.noire_cancel_unpaid_order(o.id)
  from public.noire_orders o
  where o.cart_id = p_cart_id and o.status = 'pending_payment';

  if not exists (select 1 from public.noire_cart_items where cart_id = p_cart_id) then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  -- Lock variant rows in a stable order to avoid deadlocks, then validate every line.
  for line in
    select
      ci.quantity,
      v.id as variant_id,
      v.size_ml,
      v.price,
      v.stock_quantity,
      p.name,
      p.is_active
    from public.noire_cart_items ci
    join public.noire_product_variants v on v.id = ci.product_variant_id
    join public.noire_products p on p.id = v.product_id
    where ci.cart_id = p_cart_id
    order by v.id
    for update of v
  loop
    if not line.is_active then
      inactive := inactive || jsonb_build_object('name', line.name, 'size_ml', line.size_ml);
    elsif line.stock_quantity < line.quantity then
      unavailable := unavailable || jsonb_build_object(
        'variant_id', line.variant_id,
        'name', line.name,
        'size_ml', line.size_ml,
        'available', line.stock_quantity
      );
    end if;
    v_subtotal := v_subtotal + line.price * line.quantity;
  end loop;

  if jsonb_array_length(inactive) > 0 then
    raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'P0001', detail = inactive::text;
  end if;

  if jsonb_array_length(unavailable) > 0 then
    raise exception 'OUT_OF_STOCK' using errcode = 'P0001', detail = unavailable::text;
  end if;

  v_shipping := case when v_subtotal >= p_free_shipping_threshold then 0 else p_shipping_fee end;

  -- Human-friendly order number: NO-YYYYMMDD-NNNN (Lagos calendar day).
  loop
    v_attempts := v_attempts + 1;
    v_number := 'NO-' || to_char(now() at time zone 'Africa/Lagos', 'YYYYMMDD') || '-' ||
      lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from public.noire_orders where order_number = v_number);
    if v_attempts > 20 then
      v_number := 'NO-' || to_char(now() at time zone 'Africa/Lagos', 'YYYYMMDD') || '-' ||
        upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      exit;
    end if;
  end loop;

  insert into public.noire_orders (
    user_id, order_number, status, payment_status, payment_method,
    subtotal, shipping_fee, total, currency,
    customer_email, customer_name, customer_phone,
    shipping_address, city, state, country, postal_code, delivery_notes,
    idempotency_key, cart_id
  ) values (
    p_user_id, v_number, p_status, 'pending', p_payment_method,
    v_subtotal, v_shipping, v_subtotal + v_shipping, p_currency,
    lower(btrim(p_customer ->> 'email')),
    btrim(p_customer ->> 'full_name'),
    btrim(p_customer ->> 'phone'),
    btrim(p_customer ->> 'address'),
    btrim(p_customer ->> 'city'),
    btrim(p_customer ->> 'state'),
    btrim(p_customer ->> 'country'),
    nullif(btrim(coalesce(p_customer ->> 'postal_code', '')), ''),
    nullif(btrim(coalesce(p_customer ->> 'delivery_notes', '')), ''),
    p_idempotency_key, p_cart_id
  )
  returning * into created;

  insert into public.noire_order_items (
    order_id, product_id, product_variant_id, product_name, product_number, product_slug,
    image_url, sku, size_ml, quantity, unit_price, total_price
  )
  select
    created.id, p.id, v.id, p.name, p.number, p.slug,
    p.image_url, v.sku, v.size_ml, ci.quantity, v.price, v.price * ci.quantity
  from public.noire_cart_items ci
  join public.noire_product_variants v on v.id = ci.product_variant_id
  join public.noire_products p on p.id = v.product_id
  where ci.cart_id = p_cart_id;

  update public.noire_product_variants v
  set stock_quantity = v.stock_quantity - ci.quantity
  from public.noire_cart_items ci
  where ci.cart_id = p_cart_id and ci.product_variant_id = v.id;

  update public.noire_products p
  set sales_count = p.sales_count + totals.quantity
  from (
    select product_id, sum(quantity)::int as quantity
    from public.noire_cart_items
    where cart_id = p_cart_id
    group by product_id
  ) totals
  where totals.product_id = p.id;

  -- Online payments keep the cart until the payment is confirmed.
  if p_clear_cart then
    delete from public.noire_cart_items where cart_id = p_cart_id;
  end if;

  return jsonb_build_object(
    'id', created.id,
    'order_number', created.order_number,
    'access_token', created.access_token,
    'status', created.status,
    'total', created.total,
    'created', true
  );
end;
$$;

revoke all on function public.noire_place_order(uuid, uuid, uuid, jsonb, numeric, numeric, text, text, public.noire_order_status, boolean) from public, anon, authenticated;
grant execute on function public.noire_place_order(uuid, uuid, uuid, jsonb, numeric, numeric, text, text, public.noire_order_status, boolean) to service_role;

revoke all on function public.noire_cancel_unpaid_order(uuid) from public, anon, authenticated;
revoke all on function public.noire_confirm_payment(uuid, text, bigint, text) from public, anon, authenticated;
revoke all on function public.noire_cancel_stale_unpaid_orders(interval) from public, anon, authenticated;
grant execute on function public.noire_cancel_unpaid_order(uuid) to service_role;
grant execute on function public.noire_confirm_payment(uuid, text, bigint, text) to service_role;
grant execute on function public.noire_cancel_stale_unpaid_orders(interval) to service_role;
