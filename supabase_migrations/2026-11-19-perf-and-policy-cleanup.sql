-- Round 49: database health, from Supabase's performance and security checks.
-- Applied to the live project on 2026-11-19. Safe to run more than once.

-- Small helpers had no fixed search_path.
alter function public.viber_digits(text) set search_path = public;
alter function public.viber_norm(text) set search_path = public;

-- 1) An index for every foreign key that has none (faster lookups by business/order, faster deletes).
do $$
declare r record; idx text;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname, a.attname as col, cl.relname
    from pg_constraint c
    join pg_class cl on cl.oid = c.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and n.nspname = 'public' and array_length(c.conkey, 1) = 1
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
  loop
    idx := left(r.relname || '_' || r.col || '_fk_idx', 63);
    execute format('create index if not exists %I on %s (%I)', idx, r.tbl, r.col);
  end loop;
end $$;

-- 2) team_tasks had every rule twice (team_tasks_* and tenant_* are identical). Keep one set.
drop policy if exists tenant_delete on public.team_tasks;
drop policy if exists tenant_insert on public.team_tasks;
drop policy if exists tenant_select on public.team_tasks;
drop policy if exists tenant_update on public.team_tasks;

-- 3) Check the login once per query, not once per row (same rules, faster).
drop policy if exists team_messages_insert on public.team_messages;
create policy team_messages_insert on public.team_messages for insert with check (
  (business_id in (select my_business_ids())) and (author_id in (select team_members.id from team_members where team_members.auth_user_id = (select auth.uid()))));
drop policy if exists order_photos_insert on public.order_photos;
create policy order_photos_insert on public.order_photos for insert to authenticated with check (
  (business_id in (select my_business_ids())) and can_see_po((po_id)::text) and (created_by = (select auth.uid())));
drop policy if exists viber_threads_sel on public.viber_threads;
create policy viber_threads_sel on public.viber_threads for select using (
  (business_id in (select my_business_ids())) and ((owner_user_id = (select auth.uid())) or (status = 'linked'::text)));

-- 4) conversations had the same unique rule twice.
alter table public.conversations drop constraint if exists conversations_buyer_supplier_unique;
