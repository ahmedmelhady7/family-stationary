-- Task 1.1: products + categories foundation
begin;

create extension if not exists pgcrypto;
create extension if not exists pg_net;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text not null unique,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text not null unique,
  description_ar text,
  description_en text,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'EGP',
  images text[] not null default '{}',
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'active' check (status in ('draft', 'active', 'inactive', 'out_of_stock', 'archived')),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_featured boolean not null default false,
  source_type text not null default 'manual_whatsapp' check (source_type in ('link', 'manual_whatsapp', 'dashboard')),
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('arabic', coalesce(name_ar, '') || ' ' || coalesce(description_ar, ''))
  ) stored
);

create unique index if not exists products_source_url_unique on public.products (source_url) where source_url is not null;
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_stock_idx on public.products (stock_quantity);
create index if not exists products_fts_idx on public.products using gin (fts);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_touch_updated_at
before update on public.categories
for each row
execute function public.touch_updated_at();

create trigger products_touch_updated_at
before update on public.products
for each row
execute function public.touch_updated_at();

commit;
