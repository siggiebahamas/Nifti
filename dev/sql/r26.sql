-- Round 26 (applied live Nov 13, 2026 as migration r26_real_features).
-- Who sees what for the whole team, supplier credit slips kept with the business, morning post reminders,
-- a help inbox to the Nifti owner, payment receipts on upgrades, setup check-ins.

-- 1. Who sees what: one row per business, read by every member, written by the owner / general manager
create table if not exists public.role_pages (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  pages jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(), updated_by text);
alter table public.role_pages enable row level security;
drop policy if exists role_pages_read on public.role_pages;
create policy role_pages_read on public.role_pages for select to authenticated using (business_id in (select public.my_business_ids()));
revoke all on public.role_pages from anon, public;
grant select on public.role_pages to authenticated;
create or replace function public.set_role_pages(p_pages jsonb) returns void language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); who text;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only the owner can change who sees what.'; end if;
  if p_pages is null or jsonb_typeof(p_pages) <> 'object' or length(p_pages::text) > 20000 then raise exception 'That list is not valid.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  insert into role_pages(business_id, pages, updated_at, updated_by) values (me, p_pages - 'Owner', now(), who)
    on conflict (business_id) do update set pages = excluded.pages, updated_at = now(), updated_by = excluded.updated_by;
end $$;
revoke all on function public.set_role_pages(jsonb) from public, anon;
grant execute on function public.set_role_pages(jsonb) to authenticated;

-- 2. Credit slips a supplier gave you (also suppliers who are not on Nifti); the photo sits in the receipts bucket
create table if not exists public.supplier_credit_slips (
  business_id uuid not null references public.businesses(id) on delete cascade, id text not null,
  data jsonb not null, proof_path text, created_by_name text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (business_id, id));
alter table public.supplier_credit_slips enable row level security;
drop policy if exists scs_all on public.supplier_credit_slips;
create policy scs_all on public.supplier_credit_slips for all to authenticated
  using (business_id in (select public.my_business_ids())) with check (business_id in (select public.my_business_ids()));
revoke all on public.supplier_credit_slips from anon, public;
grant select, insert, update, delete on public.supplier_credit_slips to authenticated;

-- 3. The week's post plan, and the morning reminder itself
create table if not exists public.post_plans (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  plan jsonb not null default '{}'::jsonb, last_reminded date, updated_at timestamptz not null default now());
alter table public.post_plans enable row level security;
drop policy if exists post_plans_all on public.post_plans;
create policy post_plans_all on public.post_plans for all to authenticated
  using (business_id in (select public.my_business_ids())) with check (business_id in (select public.my_business_ids()));
revoke all on public.post_plans from anon, public;
grant select, insert, update on public.post_plans to authenticated;
create or replace function public.send_post_reminders() returns integer language plpgsql security definer set search_path to 'public' as $$
declare r record; n int := 0; today date := (now() at time zone 'Asia/Manila')::date; hr int := extract(hour from now() at time zone 'Asia/Manila')::int;
  dow text := (extract(isodow from (now() at time zone 'Asia/Manila'))::int - 1)::text; iso text := to_char((now() at time zone 'Asia/Manila')::date, 'YYYY-MM-DD'); typ text; label text;
begin
  for r in select p.business_id, p.plan from post_plans p join businesses b on b.id = p.business_id
    where p.plan->>'remind' = 'true' and (p.last_reminded is null or p.last_reminded < today) and b.paused_at is null and b.banned_at is null
      and (case when p.plan->>'time' ~ '^\d{1,2}:' then split_part(p.plan->>'time', ':', 1)::int else 9 end) <= hr
  loop
    update post_plans set last_reminded = today where business_id = r.business_id;
    if jsonb_typeof(r.plan->'on') = 'object' and (r.plan->'on') ? iso then typ := coalesce(r.plan->'on'->>iso, '');
    else typ := coalesce(r.plan->'days'->>dow, ''); end if;
    if typ = '' then continue; end if;
    label := case typ when 'list' then 'your price list' when 'spot' then 'one item in the spotlight' when 'sale' then 'a sale'
      when 'deliver' then 'your delivery days' when 'new' then 'what just arrived' when 'thanks' then 'a thank-you to customers' else 'today''s post' end;
    perform public.nifti_notify(r.business_id, 'Time to post: ' || label,
      'Your post for today is written and ready. Open Nifti, tap Copy, then share it on Facebook or Viber. It takes one minute.', './#store', 'summary');
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.send_post_reminders() from public, anon, authenticated;

-- 4. Help: a two-way thread between a business and the Nifti owner
alter table public.support_messages add column if not exists from_admin boolean not null default false;
alter table public.support_messages add column if not exists read_at timestamptz;
alter table public.support_messages add column if not exists attachment_path text;
alter table public.support_messages add column if not exists member_id uuid;
drop policy if exists tenant_update on public.support_messages;
drop policy if exists tenant_delete on public.support_messages;
drop policy if exists tenant_insert on public.support_messages;
create policy tenant_insert on public.support_messages for insert to authenticated
  with check (business_id in (select public.my_business_ids()) and from_admin = false);
create index if not exists support_messages_biz_idx on public.support_messages (business_id, created_at);

create or replace function public.nifti_admin_business() returns uuid language sql stable security definer set search_path to 'public' as $$
  select tm.business_id from team_members tm join auth.users u on u.id = tm.auth_user_id
  where lower(u.email) = lower((select value from app_secrets where name = 'platform_admin_email')) and tm.status = 'active'
  order by tm.created_at limit 1
$$;
revoke all on function public.nifti_admin_business() from public, anon, authenticated;

create or replace function public.help_send(p_message text, p_category text default 'question', p_attachment text default null) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); who text; mid uuid; biz text; rid uuid; adm uuid;
  msg text := left(btrim(regexp_replace(coalesce(p_message, ''), '[<>]', '', 'g')), 2000); cat text := left(coalesce(nullif(btrim(p_category), ''), 'question'), 30);
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if length(msg) < 2 and p_attachment is null then raise exception 'Type your question first.'; end if;
  if (select count(*) from support_messages where business_id = me and not from_admin and created_at > now() - interval '1 day') >= 40 then
    raise exception 'That is a lot of messages for one day. We will answer the ones you sent.'; end if;
  if p_attachment is not null and split_part(p_attachment, '/', 1) <> me::text then raise exception 'That file is not yours.'; end if;
  select id, name into mid, who from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  select name into biz from businesses where id = me;
  insert into support_messages(business_id, category, message, from_name, member_id, attachment_path)
    values (me, cat, msg, who, mid, p_attachment) returning id into rid;
  insert into notification_outbox(business_id, title, body, url, category)
    values (me, left('Help (' || cat || '): ' || coalesce(biz, '?'), 120),
            msg || E'\n\nFrom ' || coalesce(who, '?') || case when p_attachment is not null then ' (with a file)' else '' end || E'.\nAnswer in Nifti: Admin, Help inbox.', './#admin', 'support');
  adm := public.nifti_admin_business();
  if adm is not null and adm <> me then
    perform public.nifti_notify(adm, left('Help: ' || coalesce(biz, '?'), 120), left(coalesce(nullif(msg, ''), 'They sent a file.'), 300), './#admin', 'messages');
  end if;
  perform public.nifti_kick_dispatch();
  return rid;
end $$;
revoke all on function public.help_send(text, text, text) from public, anon;
grant execute on function public.help_send(text, text, text) to authenticated;

create or replace function public.help_thread() returns table(id uuid, from_admin boolean, message text, from_name text, category text, has_file boolean, created_at timestamptz)
language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business();
begin
  if me is null then return; end if;
  update support_messages s set read_at = now() where s.business_id = me and s.from_admin and s.read_at is null;
  return query select x.id, x.from_admin, x.message, x.from_name, x.category, x.attachment_path is not null, x.created_at
    from (select * from support_messages s where s.business_id = me order by s.created_at desc limit 200) x order by x.created_at;
end $$;
revoke all on function public.help_thread() from public, anon;
grant execute on function public.help_thread() to authenticated;

create or replace function public.help_unread() returns integer language sql stable security definer set search_path to 'public' as $$
  select count(*)::int from support_messages where business_id = public.nifti_my_business() and from_admin and read_at is null
$$;
revoke all on function public.help_unread() from public, anon;
grant execute on function public.help_unread() to authenticated;

create or replace function public.admin_help_inbox() returns table(business_id uuid, business_name text, plan text, last_message text, last_from_admin boolean, last_at timestamptz, unread integer, total integer)
language sql stable security definer set search_path to 'public' as $$
  select b.id, b.name, public.business_plan(b.id), l.message, l.from_admin, l.created_at,
    (select count(*)::int from support_messages s where s.business_id = b.id and not s.from_admin and s.read_at is null),
    (select count(*)::int from support_messages s where s.business_id = b.id)
  from businesses b join lateral (select s.message, s.from_admin, s.created_at from support_messages s where s.business_id = b.id order by s.created_at desc limit 1) l on true
  where public.is_platform_admin()
  order by (select count(*) from support_messages s where s.business_id = b.id and not s.from_admin and s.read_at is null) > 0 desc,
    (public.business_plan(b.id) = 'business') desc, l.created_at desc limit 200
$$;
revoke all on function public.admin_help_inbox() from public, anon;
grant execute on function public.admin_help_inbox() to authenticated;

create or replace function public.admin_help_thread(p_business uuid) returns table(id uuid, from_admin boolean, message text, from_name text, category text, attachment_path text, created_at timestamptz)
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  update support_messages s set read_at = now() where s.business_id = p_business and not s.from_admin and s.read_at is null;
  return query select s.id, s.from_admin, s.message, s.from_name, s.category, s.attachment_path, s.created_at
    from support_messages s where s.business_id = p_business order by s.created_at;
end $$;
revoke all on function public.admin_help_thread(uuid) from public, anon;
grant execute on function public.admin_help_thread(uuid) to authenticated;

create or replace function public.admin_help_reply(p_business uuid, p_message text) returns uuid language plpgsql security definer set search_path to 'public' as $$
declare rid uuid; msg text := left(btrim(coalesce(p_message, '')), 2000);
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if length(msg) < 1 then raise exception 'Type an answer first.'; end if;
  if not exists (select 1 from businesses where id = p_business) then raise exception 'That business is gone.'; end if;
  insert into support_messages(business_id, category, message, from_name, from_admin) values (p_business, 'answer', msg, 'Nifti team', true) returning id into rid;
  perform public.nifti_notify(p_business, 'The Nifti team answered you', left(msg, 300), './#help', 'messages');
  insert into admin_actions (admin_email, action, target, detail) values (auth.jwt()->>'email', 'help_reply', p_business::text, jsonb_build_object('chars', length(msg)));
  return rid;
end $$;
revoke all on function public.admin_help_reply(uuid, text) from public, anon;
grant execute on function public.admin_help_reply(uuid, text) to authenticated;

-- the Viber number and hours the owner chooses to show under "Need help?"
create or replace function public.support_contacts() returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('viber', (select value from app_secrets where name = 'support_viber'), 'hours', (select value from app_secrets where name = 'support_hours'))
$$;
revoke all on function public.support_contacts() from public, anon;
grant execute on function public.support_contacts() to authenticated;

create or replace function public.admin_set_secret(p_name text, p_value text) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_name not in ('telegram_bot_token', 'telegram_bot_username', 'anthropic_api_key', 'support_viber', 'support_hours') then raise exception 'Unknown setting.'; end if;
  if coalesce(btrim(p_value), '') = '' then delete from app_secrets where name = p_name;
  else insert into app_secrets (name, value) values (p_name, btrim(p_value)) on conflict (name) do update set value = excluded.value; end if;
  if p_name = 'telegram_bot_token' and coalesce(btrim(p_value), '') <> '' then
    insert into app_secrets (name, value) values ('telegram_webhook_secret', translate(encode(extensions.gen_random_bytes(24), 'base64'), '/+=', '_-'))
      on conflict (name) do update set value = excluded.value;
  end if;
  insert into admin_actions (admin_email, action, target, detail) values (auth.jwt()->>'email', 'set_secret', p_name,
    jsonb_build_object('result', case when coalesce(p_value,'') = '' then 'removed' else 'saved' end));
end $$;

-- which admin settings are filled in (never the values of keys)
create or replace function public.admin_support_settings() returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when public.is_platform_admin() then jsonb_build_object(
    'viber', (select value from app_secrets where name = 'support_viber'), 'hours', (select value from app_secrets where name = 'support_hours'),
    'unread', (select count(*) from support_messages where not from_admin and read_at is null)) else null end
$$;
revoke all on function public.admin_support_settings() from public, anon;
grant execute on function public.admin_support_settings() to authenticated;

-- 5. Done-for-you setup: free for the first 20 shops that ask
create or replace function public.setup_offer() returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('free_left', greatest(0, 20 - (select count(distinct business_id) from support_messages where category = 'setup'))::int, 'price', 3500,
    'asked', exists (select 1 from support_messages where category = 'setup' and business_id = public.nifti_my_business()),
    'included', public.business_plan(public.nifti_my_business()) = 'business')
$$;
revoke all on function public.setup_offer() from public, anon;
grant execute on function public.setup_offer() to authenticated;

-- 6. Upgrades: a photo of the payment receipt can go with the request; payroll is a Pro feature
alter table public.upgrade_requests add column if not exists receipt_path text;
create or replace function public.request_upgrade(p_plan text, p_cycle text, p_method text, p_reference text, p_receipt text) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); rid uuid; ref text := btrim(coalesce(p_reference, ''));
begin
  if p_receipt is not null and (me is null or split_part(p_receipt, '/', 1) <> me::text) then raise exception 'That photo is not yours.'; end if;
  if length(ref) < 4 and p_receipt is not null then ref := 'See the receipt photo'; end if;
  rid := public.request_upgrade(p_plan, p_cycle, p_method, ref);
  if p_receipt is not null then update upgrade_requests set receipt_path = p_receipt where id = rid; end if;
  return rid;
end $$;
revoke all on function public.request_upgrade(text, text, text, text, text) from public, anon;
grant execute on function public.request_upgrade(text, text, text, text, text) to authenticated;
create or replace function public.admin_upgrade_receipt(p_request uuid) returns text language sql stable security definer set search_path to 'public' as $$
  select receipt_path from upgrade_requests where id = p_request and public.is_platform_admin()
$$;
revoke all on function public.admin_upgrade_receipt(uuid) from public, anon;
grant execute on function public.admin_upgrade_receipt(uuid) to authenticated;
drop policy if exists receipts_admin_read on storage.objects;
create policy receipts_admin_read on storage.objects for select to authenticated using (bucket_id = 'receipts' and public.is_platform_admin());

create or replace function public.plan_features(p_plan text) returns text[] language sql immutable set search_path to 'public' as $$
  select case
    when p_plan in ('pro','supplier_pro','buyer_pro') then array['statements','bir2307','store_insights','store_promos','auto_reminders','late_payers','full_history','credit_limits',
         'cheques','routes','price_blast','credit_memos','reorder_reminders','vat_books','reconcile','watchdog','market_price','price_alerts','spending_caps','scorecard','owner_books','payroll']
    when p_plan = 'business' then array['statements','bir2307','store_insights','store_promos','auto_reminders','late_payers','full_history','credit_limits',
         'watchdog','market_price','price_alerts','verified_badge','priority_support','featured_listing','setup_service',
         'cheques','routes','price_blast','credit_memos','reorder_reminders','vat_books','spending_caps','scorecard','reconcile','owner_books','payroll']
    else array[]::text[] end
$$;

-- 7. First-week check-ins about the notebook (day 2: price list, day 5: utang notebook); the day 1, 3, 7 ones already exist
create or replace function public.send_setup_checkins() returns integer language plpgsql security definer set search_path to 'public' as $$
declare b record; age int; n int := 0;
begin
  for b in select biz.id, biz.created_at from businesses biz
    where not biz.is_outside and biz.paused_at is null and biz.banned_at is null and biz.created_at > now() - interval '9 days'
      and exists (select 1 from team_members t where t.business_id = biz.id and t.auth_user_id is not null and t.status = 'active')
  loop
    age := ((now() at time zone 'Asia/Manila')::date - (b.created_at at time zone 'Asia/Manila')::date);
    if age = 2 and not exists (select 1 from inventory_items i where i.business_id = b.id) then
      perform public.nifti_notify(b.id, 'Snap your price list today', 'Take one photo of your price list. Nifti types in the items and prices, and you say yes to each line. About 5 minutes.', './#start', 'setup');
      n := n + 1;
    elsif age = 5 and not exists (select 1 from nb_reads r where r.business_id = b.id) then
      perform public.nifti_notify(b.id, 'Snap one page of your utang notebook', 'One photo and Nifti lists who owes you, then reminds them politely for you. Try one page today.', './#start', 'setup');
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke all on function public.send_setup_checkins() from public, anon, authenticated;

-- 8. Schedules (UTC): post reminders every hour on the hour; setup check-ins at 9:15 AM Manila
select cron.unschedule(jobid) from cron.job where jobname in ('nifti-post-reminders', 'nifti-setup-checkins');
select cron.schedule('nifti-post-reminders', '0 * * * *', $$select public.send_post_reminders()$$);
select cron.schedule('nifti-setup-checkins', '15 1 * * *', $$select public.send_setup_checkins()$$);

-- 9. (migration r26b_business_plan_features) Business earns its price: routes, spending caps and watchdog, credit limits,
-- who-pays-late, supplier report card and price checks moved from Pro to Business; Pro is up to 8 people.
-- See plan_features() and plan_seat_limit() in the live database.
