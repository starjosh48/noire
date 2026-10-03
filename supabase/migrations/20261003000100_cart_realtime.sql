-- ---------------------------------------------------------------------------
-- Live cart sync between the website and the mobile app.
--
-- Carts are still only written by server code (service role); nothing here lets a client
-- change a cart. Signed-in customers may now *read* their own cart row, which is what Supabase
-- Realtime needs to deliver change events for it. Any change to a cart's items touches the
-- cart row, so a client subscribes to exactly one row (its own cart) and refetches the cart
-- from the server when it changes. Item rows stay private: no other customer's cart, item ids
-- or quantities are ever broadcast.
-- ---------------------------------------------------------------------------

create policy "Carts are visible to their owner"
  on public.noire_carts for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.noire_touch_cart()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.noire_carts
     set updated_at = now()
   where id = coalesce(new.cart_id, old.cart_id);
  return null;
end;
$$;

create trigger cart_items_touch_cart
  after insert or update or delete on public.noire_cart_items
  for each row execute function public.noire_touch_cart();

alter publication supabase_realtime add table public.noire_carts;
