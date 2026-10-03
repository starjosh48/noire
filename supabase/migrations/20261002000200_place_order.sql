-- NOIRÉ — transactional order placement.
--
-- Reads the cart itself (never trusting client-supplied lines or prices), locks the affected
-- variants, validates availability, prices everything from the catalog, writes the order and
-- its line-item snapshots, decrements inventory and empties the cart — all in one transaction.
--
-- Idempotent: calling again with the same idempotency key returns the original order.
-- Errors are raised with stable codes in the message (EMPTY_CART, OUT_OF_STOCK,
-- PRODUCT_UNAVAILABLE) and JSON in the detail, so the server can show human-readable copy.

create or replace function public.noire_place_order(
  p_cart_id uuid,
  p_user_id uuid,
  p_idempotency_key uuid,
  p_customer jsonb,
  p_shipping_fee numeric,
  p_free_shipping_threshold numeric,
  p_currency text,
  p_payment_method text,
  p_status public.noire_order_status default 'confirmed'
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
      'created', false
    );
  end if;

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
    idempotency_key
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
    p_idempotency_key
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

  delete from public.noire_cart_items where cart_id = p_cart_id;

  return jsonb_build_object(
    'id', created.id,
    'order_number', created.order_number,
    'access_token', created.access_token,
    'created', true
  );
end;
$$;

-- Only trusted server code (service role) may place orders.
revoke all on function public.noire_place_order(uuid, uuid, uuid, jsonb, numeric, numeric, text, text, public.noire_order_status)
  from public, anon, authenticated;
grant execute on function public.noire_place_order(uuid, uuid, uuid, jsonb, numeric, numeric, text, text, public.noire_order_status)
  to service_role;
