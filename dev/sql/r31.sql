-- Round 31 (applied live as migration r31_chat_insights)
-- What Nifti read from a chat file, kept per business. Each business only sees its own rows,
-- and can only save a reading for a message in a conversation it is part of.
create table if not exists public.chat_insights (
  business_id uuid not null references public.businesses(id) on delete cascade,
  message_id uuid not null,
  kind text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (business_id, message_id)
);
alter table public.chat_insights enable row level security;
drop policy if exists chat_insights_own on public.chat_insights;
create policy chat_insights_own on public.chat_insights for all to authenticated
  using (business_id in (select public.my_business_ids()))
  with check (business_id in (select public.my_business_ids())
    and exists (select 1 from public.conversation_messages m where m.id = message_id and public.can_see_conversation(m.conversation_id::text)));
grant select, insert, update, delete on public.chat_insights to authenticated;
-- rollback: drop table public.chat_insights;
