-- Task 4.1: orders + order_items + FS order number
begin;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  city text not null,
  notes text,
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'claimed', 'customer_contacted', 'out_for_delivery', 'delivered', 'completed', 'cancelled')),
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  currency text not null default 'EGP',
  claimed_by text,
  claimed_at timestamptz,
  expected_delivery date,
  customer_contacted_at timestamptz,
  delivered_at timestamptz,
  wa_confirmation_sent boolean not null default false,
  wa_group_alert_sent boolean not null default false,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name_ar text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start with 1;

create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'FS-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger orders_generate_order_number
before insert on public.orders
for each row
execute function public.generate_order_number();

create trigger orders_touch_updated_at
before update on public.orders
for each row
execute function public.touch_updated_at();

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

commit;
