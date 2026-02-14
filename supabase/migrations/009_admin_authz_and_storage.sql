-- Task 8.1: secure admin authorization and product image storage policies
begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_users_touch_updated_at
before update on public.admin_users
for each row
execute function public.touch_updated_at();

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

alter table public.admin_users enable row level security;

create policy if not exists admin_users_read_self
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users admin
    where admin.user_id = auth.uid()
      and admin.is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists products_admin_read_all on public.products;
drop policy if exists products_admin_write on public.products;

create policy if not exists products_admin_read_all
on public.products
for select
to authenticated
using (public.is_admin());

create policy if not exists products_admin_write
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists categories_admin_write on public.categories;

create policy if not exists categories_admin_write
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_public_read on storage.objects;
drop policy if exists product_images_admin_insert on storage.objects;
drop policy if exists product_images_admin_update on storage.objects;
drop policy if exists product_images_admin_delete on storage.objects;

create policy if not exists product_images_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'products');

create policy if not exists product_images_admin_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'products' and public.is_admin());

create policy if not exists product_images_admin_update
on storage.objects
for update
to authenticated
using (bucket_id = 'products' and public.is_admin())
with check (bucket_id = 'products' and public.is_admin());

create policy if not exists product_images_admin_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'products' and public.is_admin());

commit;
