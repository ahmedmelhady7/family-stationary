-- Task 1.2: RLS policies for product and category reads/writes
begin;

alter table public.products enable row level security;
alter table public.categories enable row level security;

create policy if not exists products_public_read_active
on public.products
for select
to anon, authenticated
using (status = 'active');

create policy if not exists products_admin_read_all
on public.products
for select
to authenticated
using (auth.role() = 'authenticated');

create policy if not exists products_admin_write
on public.products
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy if not exists categories_public_read
on public.categories
for select
to anon, authenticated
using (true);

create policy if not exists categories_admin_write
on public.categories
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

commit;
