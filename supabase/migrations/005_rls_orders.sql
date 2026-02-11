-- Task 4.2: RLS policies for orders
begin;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy if not exists orders_public_insert
on public.orders
for insert
to anon, authenticated
with check (payment_method = 'cod');

create policy if not exists orders_admin_read_all
on public.orders
for select
to authenticated
using (auth.role() = 'authenticated');

create policy if not exists orders_admin_update
on public.orders
for update
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy if not exists orders_no_public_read
on public.orders
for select
to anon
using (false);

create policy if not exists order_items_admin_read
on public.order_items
for select
to authenticated
using (auth.role() = 'authenticated');

create policy if not exists order_items_public_insert
on public.order_items
for insert
to anon, authenticated
with check (true);

create policy if not exists order_items_no_public_read
on public.order_items
for select
to anon
using (false);

commit;
