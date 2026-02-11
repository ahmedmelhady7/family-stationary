-- Task 5.7: create_order RPC with stock validation + idempotency
begin;

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_city text,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10,2) := 0;
  v_delivery_fee numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_item record;
  v_product record;
  v_idempotency text;
begin
  if p_customer_name is null or length(trim(p_customer_name)) < 3 then
    raise exception 'name_required';
  end if;

  if p_customer_phone is null or p_customer_phone !~ '^\\+20[0-9]{10}$' then
    raise exception 'phone_required';
  end if;

  if p_city is null or length(trim(p_city)) = 0 then
    raise exception 'city_required';
  end if;

  if p_customer_address is null or length(trim(p_customer_address)) < 10 then
    raise exception 'address_required';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_items';
  end if;

  v_idempotency := coalesce(nullif(trim(p_idempotency_key), ''), encode(gen_random_bytes(16), 'hex'));

  select id, order_number, total into v_order_id, v_order_number, v_total
  from public.orders
  where idempotency_key = v_idempotency
  limit 1;

  if v_order_id is not null then
    return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'total', v_total, 'duplicate', true);
  end if;

  for v_item in
    select
      (entry->>'product_id')::uuid as product_id,
      greatest(1, (entry->>'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) as entry
  loop
    select * into v_product from public.products where id = v_item.product_id for update;
    if not found then
      raise exception 'product_not_found';
    end if;

    if v_product.status <> 'active' then
      raise exception 'product_inactive';
    end if;

    if v_product.stock_quantity < v_item.quantity then
      raise exception 'out_of_stock';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  end loop;

  v_total := v_subtotal + v_delivery_fee;

  insert into public.orders (
    customer_name,
    customer_phone,
    customer_address,
    city,
    notes,
    payment_method,
    status,
    subtotal,
    delivery_fee,
    total,
    idempotency_key
  )
  values (
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_customer_address),
    trim(p_city),
    nullif(trim(p_notes), ''),
    'cod',
    'pending',
    v_subtotal,
    v_delivery_fee,
    v_total,
    v_idempotency
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_item in
    select
      (entry->>'product_id')::uuid as product_id,
      greatest(1, (entry->>'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) as entry
  loop
    select * into v_product from public.products where id = v_item.product_id for update;

    insert into public.order_items (
      order_id,
      product_id,
      product_name_ar,
      quantity,
      unit_price,
      subtotal
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name_ar,
      v_item.quantity,
      v_product.price,
      v_product.price * v_item.quantity
    );

    update public.products
    set stock_quantity = stock_quantity - v_item.quantity,
        status = case
          when stock_quantity - v_item.quantity <= 0 then 'out_of_stock'
          else status
        end
    where id = v_product.id;
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'total', v_total, 'duplicate', false);
end;
$$;

grant execute on function public.create_order(text, text, text, text, text, jsonb, text) to anon, authenticated;

commit;
