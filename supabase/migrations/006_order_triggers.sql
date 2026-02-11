-- Task 4.5: trigger for auto confirmation + group alert
begin;

create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer
as $$
declare
  base_url text;
  service_key text;
  payload jsonb;
begin
  base_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  payload := jsonb_build_object('order_id', new.id, 'order_number', new.order_number);

  if base_url is null or service_key is null then
    return new;
  end if;

  perform net.http_post(
    url := base_url || '/functions/v1/order-confirm',
    headers := jsonb_build_object('Authorization', 'Bearer ' || service_key, 'Content-Type', 'application/json'),
    body := payload
  );

  perform net.http_post(
    url := base_url || '/functions/v1/order-alert-group',
    headers := jsonb_build_object('Authorization', 'Bearer ' || service_key, 'Content-Type', 'application/json'),
    body := payload
  );

  return new;
end;
$$;

drop trigger if exists orders_notify_created on public.orders;
create trigger orders_notify_created
after insert on public.orders
for each row
execute function public.notify_order_created();

commit;
