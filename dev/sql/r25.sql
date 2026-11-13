-- Round 25 database changes (already applied to the live project; kept here as the record).
-- Applied as migrations: r25_lock_down_functions_and_admin_fields, r25_admin_notes_read_from_own_table,
-- r25_notebook_reader_and_telegram, r25_telegram_fixes, r25_low_stock_alerts, r25_full_data_export.
-- The exact statements are also stored in supabase_migrations.schema_migrations on the live project.

-- ===================================================================================================
-- 1. Security: every business sees only its own data and its own scope
-- ===================================================================================================
-- 1a) Internal helpers take a business id and return that business's data without checking who asks.
--     Only other Nifti functions, scheduled jobs and server code may call them.
do $$ declare r record; begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any (array[
      'admin_funnel_data','books_discounts_for','business_plan','buyer_item_history','credit_exposure','ewt_lines',
      'forms_2307_pending','has_feature','ledger_open_date','market_lines','nifti_message_buyer','nifti_month_locked',
      'nifti_paid_since','nifti_quote_answer','send_payment_reminders','send_quote_nudges','send_reorder_nudges',
      'service_price','setup_stage','statement_data','nifti_sale_price_issues','nifti_stamp_list_prices',
      'nifti_list_price','nifti_listable','nifti_price_lock'])
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
  -- 1b) Trigger functions run by themselves when data changes; no one calls them directly.
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
  -- 1c) Visitors who are not signed in only get the public store and secret-link functions.
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prorettype <> 'trigger'::regtype
      and has_function_privilege('anon', p.oid, 'execute')
      and p.proname <> all (array['answer_order_by_link','confirm_receipt_by_link','get_business_share','get_reorder_cart',
        'get_shared_order','get_statement','report_payment_by_link','report_payment_by_order_link','respond_shared_order',
        'get_store','list_public_stores','submit_store_order','submit_store_inquiry','business_is_verified',
        'get_push_public_key','email_notifications_available','nifti_pilot_free','nifti_require_review','nifti_health'])
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated, service_role', r.sig);
  end loop;
end $$;
-- New functions are not open to visitors unless granted on purpose.
alter default privileges in schema public revoke execute on functions from public, anon;

-- 1d) Admin-only fields on a business can only be changed by Nifti's admin.
create or replace function public.guard_business_admin_fields() returns trigger
language plpgsql set search_path to 'public' as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_platform_admin() and (
       new.banned_at is distinct from old.banned_at or new.ban_reason is distinct from old.ban_reason
    or new.reviewed_at is distinct from old.reviewed_at or new.admin_note is distinct from old.admin_note) then
    raise exception 'That part of a business can only be changed by Nifti.';
  end if;
  return new;
end $$;
revoke execute on function public.guard_business_admin_fields() from public, anon, authenticated;
drop trigger if exists guard_business_admin_fields on public.businesses;
create trigger guard_business_admin_fields before update on public.businesses
  for each row execute function public.guard_business_admin_fields();

-- 1e) Notes the admin writes about a business live in their own table, which no business can read.
create table if not exists public.business_admin_notes (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  note text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.business_admin_notes enable row level security;
insert into public.business_admin_notes (business_id, note)
  select id, admin_note from public.businesses where coalesce(admin_note, '') <> ''
  on conflict (business_id) do nothing;
update public.businesses set admin_note = null where admin_note is not null;
create or replace function public.admin_set_note(p_id uuid, p_note text) returns void
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  insert into business_admin_notes (business_id, note, updated_at) values (p_id, left(coalesce(p_note, ''), 2000), now())
    on conflict (business_id) do update set note = excluded.note, updated_at = now();
end $$;
revoke execute on function public.admin_set_note(uuid, text) from public, anon;
grant execute on function public.admin_set_note(uuid, text) to authenticated, service_role;
do $$ declare d text; begin
  select pg_get_functiondef('public.admin_business_detail(uuid)'::regprocedure) into d;
  d := replace(d, $q$'admin_note', b.admin_note$q$, $q$'admin_note', (select note from business_admin_notes where business_id = b.id)$q$);
  execute d;
  select pg_get_functiondef('public.admin_businesses(text, text, integer, integer)'::regprocedure) into d;
  d := replace(d, $q$b.reviewed_at, b.admin_note,$q$, $q$b.reviewed_at, (select note from business_admin_notes n where n.business_id = b.id) as admin_note,$q$);
  execute d;
end $$;

-- ===================================================================================================
-- 2. Notebook reader: pages saved to the business, the shop's own shorthand, a monthly page allowance
--    Reading itself happens in the nb-read edge function (dev/edge_functions/nb-read.index.ts).
-- ===================================================================================================
create table if not exists public.nb_pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null default 'unsure' check (kind in ('sales','utang','bills','stock','exp','unsure')),
  photo text,
  status text not null default 'waiting' check (status in ('waiting','added','skipped')),
  lines jsonb,
  added_count int,
  created_by uuid references public.team_members(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  done_by_name text
);
create index if not exists nb_pages_business_status on public.nb_pages (business_id, status, created_at);
alter table public.nb_pages enable row level security;
create policy nb_pages_select on public.nb_pages for select using (business_id in (select public.my_business_ids()));
create policy nb_pages_insert on public.nb_pages for insert with check (business_id in (select public.my_business_ids()));
create policy nb_pages_update on public.nb_pages for update using (business_id in (select public.my_business_ids())) with check (business_id in (select public.my_business_ids()));
create policy nb_pages_delete on public.nb_pages for delete using (business_id in (select public.my_business_ids()) and public.is_business_admin(business_id));
create or replace function public.nb_pages_stamp() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := public.nifti_me_member(new.business_id);
    new.created_by_name := (select name from team_members where id = new.created_by);
  elsif new.status is distinct from old.status and new.status <> 'waiting' then
    new.done_at := now();
    new.done_by_name := (select name from team_members where id = public.nifti_me_member(new.business_id));
  end if;
  return new;
end $$;
revoke execute on function public.nb_pages_stamp() from public, anon, authenticated;
create trigger nb_pages_stamp before insert or update on public.nb_pages for each row execute function public.nb_pages_stamp();

create table if not exists public.nb_words (
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('who','what')),
  raw text not null,
  meaning text not null,
  updated_at timestamptz not null default now(),
  primary key (business_id, kind, raw)
);
alter table public.nb_words enable row level security;
create policy nb_words_all on public.nb_words for all using (business_id in (select public.my_business_ids())) with check (business_id in (select public.my_business_ids()));

create table if not exists public.nb_reads (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  member_id uuid, page_id uuid, kind text, lines int, ok boolean, error text,
  created_at timestamptz not null default now()
);
create index if not exists nb_reads_business_month on public.nb_reads (business_id, created_at);
alter table public.nb_reads enable row level security;
create policy nb_reads_select on public.nb_reads for select using (business_id in (select public.my_business_ids()));

-- Pages a month: Free 10, Pro 300, Business 1,500 (300 for everyone while the pilot is free).
create or replace function public.nb_quota(p_business uuid) returns int language sql stable security definer set search_path to 'public' as $$
  select case public.business_plan(p_business) when 'business' then 1500 when 'pro' then 300
    else case when public.nifti_pilot_free() then 300 else 10 end end
$$;
revoke execute on function public.nb_quota(uuid) from public, anon, authenticated;
grant execute on function public.nb_quota(uuid) to service_role;

create or replace function public.nb_usage() returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business();
begin
  if me is null then return null; end if;
  return jsonb_build_object('plan', public.business_plan(me), 'pilot', public.nifti_pilot_free(), 'limit', public.nb_quota(me),
    'used', (select count(*) from nb_reads where business_id = me and ok and created_at >= (date_trunc('month', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila')),
    'ready', exists (select 1 from app_secrets where name = 'anthropic_api_key' and coalesce(value,'') <> ''),
    'waiting', (select count(*) from nb_pages where business_id = me and status = 'waiting'));
end $$;
revoke execute on function public.nb_usage() from public, anon;
grant execute on function public.nb_usage() to authenticated, service_role;

-- Called by the reading service with the person's own sign-in, so it only ever sees their business.
create or replace function public.nb_read_start(p_kind text, p_page uuid default null) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); mid uuid; used int; lim int; rid bigint;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  mid := public.nifti_me_member(me);
  lim := public.nb_quota(me);
  select count(*) into used from nb_reads where business_id = me and ok and created_at >= (date_trunc('month', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila');
  if used >= lim then
    raise exception 'You have used all % notebook pages for this month. Pro reads 300 pages a month.', lim;
  end if;
  if (select count(*) from nb_reads where business_id = me and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many pages at once. Wait a minute and try again.';
  end if;
  insert into nb_reads (business_id, member_id, page_id, kind) values (me, mid, p_page, left(coalesce(p_kind, 'unsure'), 20)) returning id into rid;
  return jsonb_build_object('read_id', rid, 'used', used, 'limit', lim,
    'customers', (select coalesce(jsonb_agg(n), '[]'::jsonb) from (select distinct n from (
        select b.name n from purchase_orders p join businesses b on b.id = p.buyer_business_id where p.supplier_business_id = me
        union select name from downstream_customers where business_id = me
        union select customer_name from downstream_sales where business_id = me and customer_name is not null) a where coalesce(n,'') <> '' limit 300) x),
    'suppliers', (select coalesce(jsonb_agg(n), '[]'::jsonb) from (select distinct b.name n from purchase_orders p join businesses b on b.id = p.supplier_business_id where p.buyer_business_id = me limit 200) x),
    'items', (select coalesce(jsonb_agg(n), '[]'::jsonb) from (select distinct n from (
        select c->>'product' n from businesses b, jsonb_array_elements(coalesce(b.catalog, '[]'::jsonb)) c where b.id = me
        union select name from inventory_items where business_id = me) a where coalesce(n,'') <> '' limit 400) x),
    'words', (select coalesce(jsonb_agg(jsonb_build_object('kind', kind, 'raw', raw, 'meaning', meaning)), '[]'::jsonb) from (select * from nb_words where business_id = me order by updated_at desc limit 300) w));
end $$;
revoke execute on function public.nb_read_start(text, uuid) from public, anon;
grant execute on function public.nb_read_start(text, uuid) to authenticated, service_role;

create or replace function public.nb_read_finish(p_read bigint, p_lines int, p_ok boolean, p_error text) returns void
language sql security definer set search_path to 'public' as $$
  update nb_reads set lines = p_lines, ok = p_ok, error = left(p_error, 300) where id = p_read;
$$;
revoke execute on function public.nb_read_finish(bigint, int, boolean, text) from public, anon, authenticated;
grant execute on function public.nb_read_finish(bigint, int, boolean, text) to service_role;

-- ===================================================================================================
-- 3. Telegram alerts: each person links their own Telegram once (telegram-bot edge function),
--    alerts go out from push-dispatch with an "Open in Nifti" button.
-- ===================================================================================================
create table if not exists public.telegram_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  chat_id bigint not null,
  tg_name text,
  alerts jsonb not null default '{}'::jsonb,   -- {orders, money, stock, messages, team, summary: false to switch off; quiet: true}
  linked_at timestamptz not null default now(),
  last_sent_at timestamptz,
  unique (team_member_id),
  unique (business_id, chat_id)
);
alter table public.telegram_links enable row level security;
create policy telegram_links_select on public.telegram_links for select using (
  business_id in (select public.my_business_ids()) and (team_member_id = public.nifti_me_member(business_id) or public.is_business_admin(business_id)));
create table if not exists public.telegram_link_codes (
  code text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
alter table public.telegram_link_codes enable row level security;  -- no policies: server only

create or replace function public.telegram_status() returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); mid uuid;
begin
  if me is null then return null; end if;
  mid := public.nifti_me_member(me);
  return jsonb_build_object(
    'ready', exists (select 1 from app_secrets where name = 'telegram_bot_token' and coalesce(value,'') <> ''),
    'bot', (select value from app_secrets where name = 'telegram_bot_username'),
    'me', (select jsonb_build_object('name', tg_name, 'alerts', alerts, 'linked_at', linked_at) from telegram_links where team_member_id = mid),
    'team', case when public.is_business_admin(me) then (select coalesce(jsonb_agg(jsonb_build_object('member', t.name, 'tg', l.tg_name, 'linked_at', l.linked_at) order by t.name), '[]'::jsonb)
                 from telegram_links l join team_members t on t.id = l.team_member_id where l.business_id = me) end);
end $$;
create or replace function public.telegram_link_code() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); mid uuid; c text; bot text;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  mid := public.nifti_me_member(me);
  bot := (select value from app_secrets where name = 'telegram_bot_username');
  if bot is null or not exists (select 1 from app_secrets where name = 'telegram_bot_token' and coalesce(value,'') <> '') then
    return jsonb_build_object('ready', false);
  end if;
  delete from telegram_link_codes where team_member_id = mid or created_at < now() - interval '1 day';
  c := translate(encode(extensions.gen_random_bytes(12), 'base64'), '/+=', '_-');
  insert into telegram_link_codes (code, business_id, team_member_id) values (c, me, mid);
  return jsonb_build_object('ready', true, 'bot', bot, 'code', c, 'url', 'https://t.me/' || bot || '?start=' || c);
end $$;
create or replace function public.telegram_set_alerts(p_alerts jsonb) returns void language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business();
begin
  if me is null then raise exception 'Sign in first.'; end if;
  update telegram_links set alerts = coalesce(p_alerts, '{}'::jsonb) where team_member_id = public.nifti_me_member(me);
end $$;
create or replace function public.telegram_unlink(p_member uuid default null) returns void language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); mid uuid;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  mid := public.nifti_me_member(me);
  if p_member is not null and p_member <> mid and not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can unlink someone else.'; end if;
  delete from telegram_links where business_id = me and team_member_id = coalesce(p_member, mid);
end $$;
create or replace function public.telegram_test() returns void language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); mid uuid;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  mid := public.nifti_me_member(me);
  if not exists (select 1 from telegram_links where team_member_id = mid) then raise exception 'Link your Telegram first.'; end if;
  perform public.nifti_notify(me, 'Nifti test message', 'If you can read this, alerts work. Tap the button to open Nifti.', './', 'test', mid);
end $$;
-- server only (telegram-bot edge function)
create or replace function public.telegram_consume_code(p_code text, p_chat bigint, p_name text) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r telegram_link_codes; bname text; mname text;
begin
  select * into r from telegram_link_codes where code = p_code and used_at is null and created_at > now() - interval '1 day';
  if r.code is null then return jsonb_build_object('ok', false); end if;
  update telegram_link_codes set used_at = now() where code = r.code;
  delete from telegram_links where business_id = r.business_id and chat_id = p_chat and team_member_id <> r.team_member_id;
  insert into telegram_links (business_id, team_member_id, chat_id, tg_name) values (r.business_id, r.team_member_id, p_chat, left(p_name, 80))
    on conflict (team_member_id) do update set chat_id = excluded.chat_id, tg_name = excluded.tg_name, linked_at = now();
  select name into bname from businesses where id = r.business_id;
  select name into mname from team_members where id = r.team_member_id;
  return jsonb_build_object('ok', true, 'business', bname, 'member', mname);
end $$;
create or replace function public.telegram_unlink_chat(p_chat bigint) returns int language sql security definer set search_path to 'public' as $$
  with d as (delete from telegram_links where chat_id = p_chat returning 1) select count(*)::int from d;
$$;
create or replace function public.telegram_brief(p_chat bigint) returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare l telegram_links; today date := (now() at time zone 'Asia/Manila')::date;
begin
  select * into l from telegram_links where chat_id = p_chat limit 1;
  if l.id is null then return null; end if;
  return jsonb_build_object(
    'business', (select name from businesses where id = l.business_id),
    'to_confirm', (select count(*) from purchase_orders where supplier_business_id = l.business_id and status = 'sent'),
    'to_deliver', (select count(*) from purchase_orders where supplier_business_id = l.business_id and status in ('confirmed','preparing','shipped','in_customs','partially_delivered')),
    'arriving', (select count(*) from purchase_orders where buyer_business_id = l.business_id and status in ('shipped','in_customs')),
    'owed_to_you', (select coalesce(sum(public.nifti_open_balance(invoice)), 0) from purchase_orders where supplier_business_id = l.business_id and invoice is not null and status not in ('cancelled','draft')),
    'you_owe', (select coalesce(sum(public.nifti_open_balance(invoice)), 0) from purchase_orders where buyer_business_id = l.business_id and invoice is not null and status not in ('cancelled','draft')),
    'sales_today', (select coalesce(sum(total), 0) from downstream_sales where business_id = l.business_id and sale_date = today and voided_at is null),
    'low_stock', (select count(*) from inventory_items where business_id = l.business_id and rop is not null and on_hand <= rop));
end $$;
do $$ declare r record; begin
  for r in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
    and p.proname in ('telegram_status','telegram_link_code','telegram_set_alerts','telegram_unlink','telegram_test') loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated, service_role', r.sig);
  end loop;
  for r in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
    and p.proname in ('telegram_consume_code','telegram_unlink_chat','telegram_brief') loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;

-- One alert the moment an item drops to its reorder point (not on every sale after that).
create or replace function public.notify_low_stock() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.rop is not null and new.rop > 0 and new.on_hand <= new.rop and (old.on_hand is null or old.on_hand > old.rop or old.rop is null) then
    perform public.nifti_notify(new.business_id,
      case when new.on_hand <= 0 then '🔴 Out of stock: ' else '🟡 Running low: ' end || new.name,
      'Only ' || trim(to_char(greatest(new.on_hand, 0), 'FM999,999,990.##')) || coalesce(' ' || nullif(new.unit, ''), '') || ' left. Reorder point is ' || trim(to_char(new.rop, 'FM999,999,990.##')) || '.',
      './#inventory', 'stock');
  end if;
  return new;
end $$;
revoke execute on function public.notify_low_stock() from public, anon, authenticated;
create trigger notify_low_stock after update of on_hand, rop on public.inventory_items for each row execute function public.notify_low_stock();

-- ===================================================================================================
-- 4. The Nifti owner switches the services on (admin screen)
-- ===================================================================================================
create or replace function public.admin_set_secret(p_name text, p_value text) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_name not in ('telegram_bot_token', 'telegram_bot_username', 'anthropic_api_key') then raise exception 'Unknown setting.'; end if;
  if coalesce(btrim(p_value), '') = '' then delete from app_secrets where name = p_name;
  else insert into app_secrets (name, value) values (p_name, btrim(p_value)) on conflict (name) do update set value = excluded.value; end if;
  if p_name = 'telegram_bot_token' and coalesce(btrim(p_value), '') <> '' then
    insert into app_secrets (name, value) values ('telegram_webhook_secret', translate(encode(extensions.gen_random_bytes(24), 'base64'), '/+=', '_-'))
      on conflict (name) do update set value = excluded.value;
  end if;
  insert into admin_actions (admin_email, action, target, detail) values (auth.jwt()->>'email', 'set_secret', p_name,
    jsonb_build_object('result', case when coalesce(p_value,'') = '' then 'removed' else 'saved' end));
end $$;
create or replace function public.admin_service_status() returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return jsonb_build_object(
    'telegram', exists (select 1 from app_secrets where name = 'telegram_bot_token' and coalesce(value,'') <> ''),
    'telegram_bot', (select value from app_secrets where name = 'telegram_bot_username'),
    'telegram_links', (select count(*) from telegram_links),
    'reader', exists (select 1 from app_secrets where name = 'anthropic_api_key' and coalesce(value,'') <> ''),
    'reader_pages_month', (select count(*) from nb_reads where ok and created_at >= date_trunc('month', now())));
end $$;
revoke execute on function public.admin_set_secret(text, text) from public, anon;
revoke execute on function public.admin_service_status() from public, anon;
grant execute on function public.admin_set_secret(text, text) to authenticated, service_role;
grant execute on function public.admin_service_status() to authenticated, service_role;

-- ===================================================================================================
-- 5. Export my data now includes every record the business keeps
--    (see the live definition of public.my_data_export(); added: price_list, price_approvals, stock_moves,
--    supply_items, expenses, cash_counts, payroll with lines, journal with lines, bank_matches,
--    payment_promises, team_tasks, team_notes, notebook_pages (no photos), notebook_words, store_visits)
-- ===================================================================================================
