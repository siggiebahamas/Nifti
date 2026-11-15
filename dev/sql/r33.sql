-- Round 33 (applied live as migrations r33_task_started and r33_contact_prefs)
alter table public.team_tasks add column if not exists started_at timestamptz;  -- the Doing column on the Team board
-- each customer's preferred app for reminders (Viber, WhatsApp, Messenger, SMS, email, Nifti chat); one business sees only its own rows
create table if not exists public.contact_prefs (
  business_id uuid not null references public.businesses(id) on delete cascade,
  party_id text not null,
  channel text not null default 'viber' check (channel in ('viber','whatsapp','messenger','sms','email','chat')),
  phone text, handle text, email text,
  updated_at timestamptz not null default now(),
  primary key (business_id, party_id)
);
alter table public.contact_prefs enable row level security;
drop policy if exists contact_prefs_own on public.contact_prefs;
create policy contact_prefs_own on public.contact_prefs for all to authenticated
  using (business_id in (select public.my_business_ids()))
  with check (business_id in (select public.my_business_ids()));
grant select, insert, update, delete on public.contact_prefs to authenticated;
-- rollback: drop table public.contact_prefs; alter table public.team_tasks drop column started_at;
