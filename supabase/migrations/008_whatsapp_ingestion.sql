-- Task 2.9 support: conversation state and ingestion logs
begin;

create table if not exists public.wa_conversations (
  id uuid primary key default gen_random_uuid(),
  sender_phone text not null unique,
  state text not null default 'idle',
  pending_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ingestion_attempts (
  id uuid primary key default gen_random_uuid(),
  sender_phone text not null,
  source_type text not null check (source_type in ('link', 'manual_whatsapp')),
  source_value text,
  status text not null check (status in ('success', 'error', 'pending')),
  error_code text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger wa_conversations_touch_updated_at
before update on public.wa_conversations
for each row
execute function public.touch_updated_at();

alter table public.wa_conversations enable row level security;
alter table public.ingestion_attempts enable row level security;

create policy if not exists wa_admin_all
on public.wa_conversations
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy if not exists ingestion_admin_all
on public.ingestion_attempts
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

commit;
