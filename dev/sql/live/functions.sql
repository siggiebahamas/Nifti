CREATE OR REPLACE FUNCTION public.admin_backup_now()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  perform public.nifti_kick_backup();
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_ban_business(p_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_id = public.nifti_my_business() then raise exception 'You can''t ban your own business.'; end if;
  update businesses set banned_at = now(), ban_reason = left(coalesce(nullif(btrim(p_reason),''), 'Violation of Nifti rules'), 300) where id = p_id;
  update auth.users set banned_until = 'infinity' where id in (select auth_user_id from team_members where business_id = p_id and auth_user_id is not null);
  delete from push_subscriptions where business_id = p_id;
  perform public.nifti_admin_log('ban_business', p_id, null, jsonb_build_object('reason', p_reason));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_ban_person(p_member uuid, p_ban boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t team_members;
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  select * into t from team_members where id = p_member;
  if t.auth_user_id is null then raise exception 'This person hasn''t signed up yet.'; end if;
  if t.auth_user_id = auth.uid() then raise exception 'You can''t ban yourself.'; end if;
  update auth.users set banned_until = case when p_ban then 'infinity'::timestamptz end where id = t.auth_user_id;
  if p_ban then delete from push_subscriptions where team_member_id = t.id; end if;
  perform public.nifti_admin_log(case when p_ban then 'ban_person' else 'unban_person' end, t.business_id, coalesce(t.email, t.name), null);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_business_detail(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b businesses;
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  select * into b from businesses where id = p_id;
  if b.id is null then raise exception 'Not found.'; end if;
  return jsonb_build_object(
    'business', jsonb_build_object('id', b.id, 'name', b.name, 'type', b.type, 'created_at', b.created_at, 'banned_at', b.banned_at, 'ban_reason', b.ban_reason, 'reviewed_at', b.reviewed_at,
       'admin_note', b.admin_note, 'store_slug', b.store_slug, 'store_on', coalesce((b.store->>'enabled')::boolean, false), 'paused_at', b.paused_at, 'profile', b.public_profile,
       'contact', b.shared_contact, 'catalog_count', jsonb_array_length(coalesce(b.catalog,'[]'::jsonb)), 'verified', public.business_is_verified(b.id), 'verified_until', b.verified_until,
       'plan', public.business_plan(b.id), 'paid_until', (select paid_until from subscriptions where business_id = b.id), 'plan_note', (select plan_note from subscriptions where business_id = b.id)),
    'members', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'email', coalesce(t.email, u.email), 'roles', t.roles, 'status', t.status,
                  'last_sign_in', u.last_sign_in_at, 'banned', u.banned_until is not null and u.banned_until > now(), 'auth', t.auth_user_id is not null) order by t.created_at), '[]'::jsonb)
                from team_members t left join auth.users u on u.id = t.auth_user_id where t.business_id = b.id),
    'stats', jsonb_build_object(
       'orders', (select count(*) from purchase_orders where (buyer_business_id = b.id or supplier_business_id = b.id) and status <> 'draft'),
       'orders_30d', (select count(*) from purchase_orders where (buyer_business_id = b.id or supplier_business_id = b.id) and status <> 'draft' and created_at > now() - interval '30 days'),
       'gmv_30d', (select coalesce(sum(public.nifti_po_total(po)), 0) from purchase_orders po where (buyer_business_id = b.id or supplier_business_id = b.id) and status not in ('draft','cancelled') and created_at > now() - interval '30 days'),
       'partners', (select count(*) from business_relationships where buyer_business_id = b.id or supplier_business_id = b.id),
       'messages_30d', (select count(*) from conversation_messages where sender_business_id = b.id and sent_at > now() - interval '30 days'),
       'store_views_30d', (select count(*) from store_events where business_id = b.id and kind = 'view' and created_at > now() - interval '30 days'),
       'last_active', public.nifti_last_active(b.id)),
    'orders', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select po.po_number, po.status, po.created_date, public.nifti_po_total(po) total,
                 case when po.buyer_business_id = b.id then 'bought from ' || (select name from businesses where id = po.supplier_business_id) else 'sold to ' || (select name from businesses where id = po.buyer_business_id) end who
               from purchase_orders po where (po.buyer_business_id = b.id or po.supplier_business_id = b.id) and po.status <> 'draft' order by po.created_at desc limit 10) x),
    'payments', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) from upgrade_requests r where r.business_id = b.id),
    'services', (select coalesce(jsonb_agg(jsonb_build_object('kind', s.kind, 'status', s.status, 'amount', s.amount, 'created_at', s.created_at) order by s.created_at desc), '[]'::jsonb) from service_requests s where s.business_id = b.id),
    'support', (select coalesce(jsonb_agg(jsonb_build_object('category', m.category, 'message', m.message, 'from_name', m.from_name, 'created_at', m.created_at) order by m.created_at desc), '[]'::jsonb)
                from (select * from support_messages where business_id = b.id order by created_at desc limit 20) m),
    'actions', (select coalesce(jsonb_agg(jsonb_build_object('action', a.action, 'target', a.target, 'detail', a.detail, 'at', a.created_at, 'by', a.admin_email) order by a.created_at desc), '[]'::jsonb)
                from (select * from admin_actions where business_id = b.id order by created_at desc limit 30) a));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_businesses(p_query text, p_filter text, p_limit integer, p_offset integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return (select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc), '[]'::jsonb) from (
    select b.id, b.name, b.type, b.created_at, public.business_plan(b.id) plan, s.paid_until, public.business_is_verified(b.id) verified,
           b.banned_at, b.ban_reason, b.reviewed_at, b.admin_note, b.store_slug, coalesce((b.store->>'enabled')::boolean, false) store_on,
           (select count(*) from team_members t where t.business_id = b.id and t.status = 'active') members,
           (select string_agg(t.email, ', ') from team_members t where t.business_id = b.id and 'Owner' = any(t.roles)) owner_email,
           (select count(*) from purchase_orders po where (po.buyer_business_id = b.id or po.supplier_business_id = b.id) and po.status <> 'draft' and po.created_at > now() - interval '30 days') orders_30d,
           public.nifti_last_active(b.id) last_active
    from businesses b left join subscriptions s on s.business_id = b.id
    where not b.is_outside
      and (coalesce(p_query,'') = '' or b.name ilike '%' || p_query || '%' or exists (select 1 from team_members t where t.business_id = b.id and t.email ilike '%' || p_query || '%'))
      and case coalesce(p_filter,'all')
            when 'new' then b.created_at > now() - interval '7 days'
            when 'unreviewed' then b.reviewed_at is null and b.banned_at is null
            when 'paying' then public.business_plan(b.id) <> 'free'
            when 'banned' then b.banned_at is not null
            when 'suppliers' then b.type in ('supplier','both')
            when 'buyers' then b.type in ('buyer','both')
            when 'inactive' then coalesce(public.nifti_last_active(b.id), b.created_at) < now() - interval '30 days'
            else true end
    order by b.created_at desc limit least(coalesce(p_limit, 50), 200) offset coalesce(p_offset, 0)) x);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_decide_upgrade(p_request uuid, p_approve boolean, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r upgrade_requests; cur date; base date; until date;
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  select * into r from upgrade_requests where id = p_request for update;
  if r.id is null or r.status <> 'pending' then raise exception 'That request was already handled.'; end if;
  update upgrade_requests set status = case when p_approve then 'approved' else 'rejected' end, decided_at = now(), admin_note = p_note where id = r.id;
  if p_approve then
    select paid_until into cur from subscriptions where business_id = r.business_id and plan_id = r.plan;
    base := greatest(coalesce(cur, (now() at time zone 'Asia/Manila')::date), (now() at time zone 'Asia/Manila')::date);
    until := (base + case when r.cycle = 'yearly' then interval '1 year' else interval '1 month' end)::date;
    perform public.admin_set_plan(r.business_id, r.plan, until, 'Paid ' || coalesce(r.method,'') || ' ref ' || coalesce(r.reference,''));
    perform public.nifti_notify(r.business_id, '🎉 You''re on ' || public.plan_label(r.plan),
      'Payment confirmed. Paid until ' || to_char(until, 'Mon DD, YYYY') || '.' ||
      case when r.plan = 'business' then ' Your Verified badge and setup help are in Settings → Your plan.' else '' end || ' Salamat!', './#settings', 'orders');
  else
    perform public.nifti_notify(r.business_id, 'We couldn''t confirm your upgrade payment', coalesce(p_note, 'Please check the reference number and send it again from Settings.'), './#settings', 'orders');
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_delete_business(p_id uuid, p_confirm text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_id = public.nifti_my_business() then raise exception 'You can''t delete your own business here.'; end if;
  perform public.nifti_admin_log('delete_business', p_id, (select name from businesses where id = p_id), null);
  return public.nifti_delete_business_core(p_id, p_confirm);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_end_notice(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  update system_notices set ends_at = now() where id = p_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_find_businesses(p_query text)
 RETURNS TABLE(id uuid, name text, type text, plan text, paid_until date, members integer, verified boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select b.id, b.name, b.type, public.business_plan(b.id), s.paid_until,
         (select count(*)::int from team_members t where t.business_id = b.id and t.status = 'active'),
         public.business_is_verified(b.id)
  from businesses b left join subscriptions s on s.business_id = b.id
  where public.is_platform_admin() and not b.is_outside and b.name ilike '%' || coalesce(p_query,'') || '%'
  order by b.created_at desc limit 30 $function$
;

CREATE OR REPLACE FUNCTION public.admin_funnel()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  return public.admin_funnel_data();
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_funnel_data()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with b as (select * from businesses where not is_outside),
  t as (select (now() at time zone 'Asia/Manila')::date d)
  select jsonb_build_object(
    'businesses', (select count(*) from b),
    'buyers', (select count(*) from b where type in ('buyer','both')), 'suppliers', (select count(*) from b where type in ('supplier','both')),
    'new_7d', (select count(*) from b where created_at > now() - interval '7 days'),
    'active_7d', (select count(distinct x) from (select buyer_business_id x from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft' union select supplier_business_id from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft') q where x in (select id from b)),
    'orders_7d', (select count(*) from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft'),
    'outside_partners', (select count(*) from businesses where is_outside),
    'claimed_from_links', (select count(*) from b where created_by_business is not null),
    'stores_open', (select count(*) from b where store_slug is not null and coalesce((store->>'enabled')::boolean, false)),
    'store_views_7d', (select count(*) from store_events where kind = 'view' and created_at > now() - interval '7 days'),
    'store_orders_7d', (select count(*) from store_events where kind = 'order' and created_at > now() - interval '7 days'),
    'pro_paying', (select count(*) from subscriptions where plan_id in ('pro','supplier_pro','buyer_pro','business') and (paid_until is null or paid_until >= (select d from t))),
    'upgrade_pending', (select count(*) from upgrade_requests where status = 'pending'),
    'stuck', (select coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) from (
       select jsonb_build_object('business', b.name, 'type', b.type, 'stage', public.setup_stage(b.id),
         'days', (select d from t) - (b.created_at at time zone 'Asia/Manila')::date, 'created_at', b.created_at,
         'owner', (select name from team_members m where m.business_id = b.id and m.roles && array['Owner'] limit 1),
         'email', (select email from team_members m where m.business_id = b.id and m.roles && array['Owner'] limit 1),
         'phone', b.shared_contact->>'phone') x
       from b where public.setup_stage(b.id) <> 'active' order by b.created_at desc limit 40) s),
    'leads', (select jsonb_build_object('new', count(*) filter (where status = 'new'), 'contacted', count(*) filter (where status = 'contacted'), 'interested', count(*) filter (where status = 'interested'), 'onboarded', count(*) filter (where status = 'onboarded')) from growth_leads)
  )
$function$
;

CREATE OR REPLACE FUNCTION public.admin_growth_target(p_value text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_value is not null then
    insert into app_secrets(name, value) values ('growth_target', left(regexp_replace(p_value, '[<>]', '', 'g'), 300))
      on conflict (name) do update set value = excluded.value;
  end if;
  return (select value from app_secrets where name = 'growth_target');
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_mark_reviewed(p_id uuid, p_ok boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  update businesses set reviewed_at = case when p_ok then now() end where id = p_id;
  perform public.nifti_admin_log(case when p_ok then 'reviewed' else 'unreviewed' end, p_id, null, null);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_notice(p_title text, p_body text, p_level text, p_hours integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  insert into system_notices(title, body, level, starts_at, ends_at) values (left(p_title, 120), left(p_body, 1000), coalesce(nullif(p_level,''), 'info'), now(),
    case when coalesce(p_hours, 0) > 0 then now() + make_interval(hours => p_hours) end);
  perform public.nifti_admin_log('notice', null, p_title, null);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_notices()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc), '[]'::jsonb) from (select * from system_notices order by created_at desc limit 20) n);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return jsonb_build_object(
    'businesses', (select count(*) from businesses where not is_outside),
    'suppliers', (select count(*) from businesses where not is_outside and type in ('supplier','both')),
    'buyers', (select count(*) from businesses where not is_outside and type in ('buyer','both')),
    'outside', (select count(*) from businesses where is_outside),
    'people', (select count(*) from auth.users),
    'new_7d', (select count(*) from businesses where not is_outside and created_at > now() - interval '7 days'),
    'new_30d', (select count(*) from businesses where not is_outside and created_at > now() - interval '30 days'),
    'active_7d', (select count(distinct b) from (select buyer_business_id b from purchase_orders where updated_at > now() - interval '7 days' union select supplier_business_id from purchase_orders where updated_at > now() - interval '7 days'
                  union select sender_business_id from conversation_messages where sent_at > now() - interval '7 days') x join businesses z on z.id = x.b and not z.is_outside),
    'orders_7d', (select count(*) from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft'),
    'gmv_30d', (select coalesce(sum(public.nifti_po_total(po)), 0) from purchase_orders po where created_at > now() - interval '30 days' and status not in ('draft','cancelled')),
    'paying', (select count(*) from subscriptions where plan_id in ('pro','supplier_pro','buyer_pro','business') and status = 'active' and (paid_until is null or paid_until >= public.nifti_today())),
    'mrr', (select coalesce(sum(case plan_id when 'business' then 2990 else 990 end), 0) from subscriptions where plan_id in ('pro','supplier_pro','buyer_pro','business') and status = 'active' and paid_until >= public.nifti_today()),
    'banned', (select count(*) from businesses where banned_at is not null),
    'unreviewed', (select count(*) from businesses where not is_outside and reviewed_at is null and banned_at is null),
    'pending_payments', (select count(*) from upgrade_requests where status = 'pending'),
    'open_services', (select count(*) from service_requests where status in ('pending','in_progress')),
    'support_7d', (select count(*) from support_messages where created_at > now() - interval '7 days'),
    'errors_24h', (select count(*) from client_error_log where created_at > now() - interval '1 day'),
    'push_errors_24h', (select count(*) from notification_outbox where error is not null and created_at > now() - interval '1 day'),
    'require_review', public.nifti_require_review(),
    'pilot', public.nifti_pilot_free());
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_people(p_query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return (select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc), '[]'::jsonb) from (
    select u.id auth_id, u.email, u.created_at, u.last_sign_in_at, (u.banned_until is not null and u.banned_until > now()) banned,
           t.id member_id, t.name, t.roles, b.id business_id, b.name business_name, b.type business_type
    from auth.users u left join team_members t on t.auth_user_id = u.id left join businesses b on b.id = t.business_id
    where coalesce(p_query,'') = '' or u.email ilike '%' || p_query || '%' or t.name ilike '%' || p_query || '%' or b.name ilike '%' || p_query || '%'
    order by u.created_at desc limit 200) x);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_recent_actions()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('action', a.action, 'business', b.name, 'target', a.target, 'at', a.created_at) order by a.created_at desc), '[]'::jsonb)
          from (select * from admin_actions order by created_at desc limit 40) a left join businesses b on b.id = a.business_id);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_reply_support(p_business uuid, p_text text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if length(btrim(coalesce(p_text,''))) < 2 then raise exception 'Write a reply.'; end if;
  perform public.nifti_notify(p_business, '💬 Nifti support replied', left(p_text, 240), './#settings', 'orders');
  perform public.nifti_admin_log('support_reply', p_business, null, jsonb_build_object('text', left(p_text, 500)));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_service_requests()
 RETURNS TABLE(id uuid, business_id uuid, business_name text, business_type text, plan text, kind text, status text, amount numeric, method text, reference text, details jsonb, created_by_name text, created_at timestamp with time zone, verified boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.id, s.business_id, b.name, b.type, public.business_plan(b.id), s.kind, s.status, s.amount, s.method, s.reference, s.details, s.created_by_name, s.created_at, public.business_is_verified(b.id)
  from service_requests s join businesses b on b.id = s.business_id
  where public.is_platform_admin()
  order by (s.status in ('pending','in_progress')) desc, (public.business_plan(b.id) = 'business') desc, s.created_at desc limit 100 $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_billing_instructions(p_text text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  insert into app_secrets(name, value) values ('billing_instructions', left(regexp_replace(coalesce(p_text,''), '[<>]', '', 'g'), 600))
    on conflict (name) do update set value = excluded.value;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_note(p_id uuid, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  update businesses set admin_note = left(p_note, 2000) where id = p_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_pilot(p_all_free boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  insert into app_secrets(name, value) values ('pilot_all_free', case when p_all_free then 'true' else 'false' end)
    on conflict (name) do update set value = excluded.value;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_plan(p_business uuid, p_plan text, p_paid_until date, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_plan not in ('free','pro','supplier_pro','buyer_pro','business') then raise exception 'Unknown plan.'; end if;
  insert into subscriptions(business_id, plan_id, status, paid_until, plan_note, started_at)
    values (p_business, p_plan, 'active', p_paid_until, p_note, (now() at time zone 'Asia/Manila')::date)
    on conflict (business_id) do update set plan_id = excluded.plan_id, status = 'active', paid_until = excluded.paid_until, plan_note = excluded.plan_note;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_plan_until(p_id uuid, p_plan text, p_until date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  perform public.admin_set_plan(p_id, p_plan, case when p_plan = 'free' then null else p_until end, 'Set by Nifti owner');
  perform public.nifti_admin_log('set_plan', p_id, p_plan, jsonb_build_object('until', p_until));
  if p_plan <> 'free' then
    perform public.nifti_notify(p_id, '🎉 You''re on ' || public.plan_label(p_plan), 'Active until ' || to_char(p_until, 'Mon DD, YYYY') || '.', './#settings', 'orders');
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_require_review(p_on boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  insert into app_secrets(name, value) values ('require_review', case when p_on then 'true' else 'false' end) on conflict (name) do update set value = excluded.value;
  perform public.nifti_admin_log('require_review', null, p_on::text, null);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_service_prices(p_setup numeric, p_verify numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_setup < 0 or p_verify < 0 then raise exception 'Prices can''t be negative.'; end if;
  insert into app_secrets(name, value) values ('service_prices', jsonb_build_object('setup', p_setup, 'verify', p_verify)::text)
    on conflict (name) do update set value = excluded.value;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_verified(p_business uuid, p_on boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_on then update businesses set verified_at = coalesce(verified_at, now()), verified_until = ((now() at time zone 'Asia/Manila')::date + interval '1 year')::date where id = p_business;
  else update businesses set verified_at = null, verified_until = null where id = p_business; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_support_inbox()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return (select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc), '[]'::jsonb) from (
    select m.id, m.business_id, b.name business_name, public.business_plan(b.id) plan, m.category, m.message, m.from_name, m.created_at
    from support_messages m left join businesses b on b.id = m.business_id order by m.created_at desc limit 100) x);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_unban_business(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  update businesses set banned_at = null, ban_reason = null where id = p_id;
  update auth.users set banned_until = null where id in (select auth_user_id from team_members where business_id = p_id and auth_user_id is not null);
  perform public.nifti_admin_log('unban_business', p_id, null, null);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_update_lead(p_id bigint, p_status text, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  update growth_leads set status = p_status, notes = coalesce(nullif(left(btrim(regexp_replace(coalesce(p_notes,''), '[<>]', '', 'g')), 500), ''), notes), updated_at = now() where id = p_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_update_service(p_id uuid, p_action text, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r service_requests; until date;
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  select * into r from service_requests where id = p_id for update;
  if r.id is null or r.status in ('done','rejected') then raise exception 'That request was already handled.'; end if;
  if p_action = 'start' then
    update service_requests set status = 'in_progress', updated_at = now(), admin_note = coalesce(p_note, admin_note) where id = r.id;
    perform public.nifti_notify(r.business_id, case r.kind when 'setup' then '🛠 We''re setting up your Nifti' else '✔ We''re checking your papers' end,
      coalesce(p_note, case r.kind when 'setup' then 'Payment received. We''ll message you if we need anything.' else 'We may call your number to confirm. Usually done in 1–2 days.' end), './#settings', 'orders');
  elsif p_action = 'done' then
    update service_requests set status = 'done', updated_at = now(), admin_note = coalesce(p_note, admin_note) where id = r.id;
    if r.kind = 'verify' then
      select greatest(coalesce(verified_until, (now() at time zone 'Asia/Manila')::date), (now() at time zone 'Asia/Manila')::date) + interval '1 year' into until from businesses where id = r.business_id;
      update businesses set verified_at = coalesce(verified_at, now()), verified_until = until where id = r.business_id;
      perform public.nifti_notify(r.business_id, '✔ You''re verified', 'Your store, profile and order links now show the Verified badge until ' || to_char(until, 'Mon DD, YYYY') || '.', './#store', 'orders');
    else
      perform public.nifti_notify(r.business_id, '✅ Your setup is done', coalesce(p_note, 'Your products, prices and customers are loaded. Take a look!'), './#dashboard', 'orders');
    end if;
  elsif p_action = 'reject' then
    update service_requests set status = 'rejected', updated_at = now(), admin_note = p_note where id = r.id;
    perform public.nifti_notify(r.business_id, case r.kind when 'setup' then 'About your setup request' else 'About your verification' end,
      coalesce(p_note, 'We couldn''t complete this. Message us from Help.'), './#settings', 'orders');
  else raise exception 'Unknown action.'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_upgrade_requests()
 RETURNS TABLE(id uuid, business_id uuid, business_name text, business_type text, plan text, cycle text, amount numeric, method text, reference text, status text, created_by_name text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select r.id, r.business_id, b.name, b.type, r.plan, r.cycle, r.amount, r.method, r.reference, r.status, r.created_by_name, r.created_at
  from upgrade_requests r join businesses b on b.id = r.business_id
  where public.is_platform_admin()
  order by (r.status = 'pending') desc, r.created_at desc limit 100
$function$
;

CREATE OR REPLACE FUNCTION public.announce_price_changes(p_changes jsonb, p_effective date, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); who text; c jsonb; oldp numeric; unitv text; msg text := ''; n int := 0; buyers int := 0; rr record; cid uuid; eff date := coalesce(p_effective, public.nifti_today()); sent_today int;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can announce price changes.'; end if;
  if (select type from businesses where id = me) <> 'supplier' then raise exception 'This is for suppliers.'; end if;
  if not public.has_feature(me, 'price_blast') then raise exception 'Price-change announcements are part of Supplier Pro.'; end if;
  if eff < public.nifti_today() then raise exception 'The date can''t be in the past.'; end if;
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) = 0 or jsonb_array_length(p_changes) > 100 then raise exception 'Pick the products that change.'; end if;
  select count(distinct created_at) into sent_today from price_changes where business_id = me and created_at > now() - interval '1 day';
  if sent_today >= 5 then raise exception 'You''ve sent 5 price announcements today. Try again tomorrow.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  for c in select value from jsonb_array_elements(p_changes) loop
    if coalesce(c->>'product','') = '' or coalesce(nullif(c->>'new_price','')::numeric, -1) < 0 then continue; end if;
    select (x->>'price')::numeric, x->>'unit' into oldp, unitv from businesses b, jsonb_array_elements(coalesce(b.catalog,'[]'::jsonb)) x
      where b.id = me and public.nifti_norm(x->>'product') = public.nifti_norm(c->>'product') limit 1;
    insert into price_changes(business_id, product, unit, old_price, new_price, effective_date, note, created_by_name)
      values (me, left(c->>'product', 200), coalesce(unitv, left(c->>'unit', 30)), oldp, (c->>'new_price')::numeric, eff, left(p_note, 300), who);
    msg := msg || E'\n• ' || (c->>'product') || ': ' || coalesce(public.nifti_peso(oldp) || ' → ', '') || public.nifti_peso((c->>'new_price')::numeric) || coalesce('/' || unitv, '')
           || case when oldp is not null and (c->>'new_price')::numeric > oldp then ' ▲' when oldp is not null and (c->>'new_price')::numeric < oldp then ' ▼' else '' end;
    n := n + 1;
  end loop;
  if n = 0 then raise exception 'Enter at least one new price.'; end if;
  msg := '📢 Price update from ' || (select name from businesses where id = me) || ', effective ' || case when eff = public.nifti_today() then 'today' else to_char(eff, 'Mon DD') end || ':' || msg
         || coalesce(E'\n\n' || nullif(btrim(p_note), ''), '') || case when eff > public.nifti_today() then E'\n\nOrders sent before then keep the old price.' else '' end;
  for rr in select distinct br.buyer_business_id bid from business_relationships br join businesses b on b.id = br.buyer_business_id
            where br.supplier_business_id = me and not b.is_outside and b.paused_at is null loop
    select id into cid from conversations where buyer_business_id = rr.bid and supplier_business_id = me limit 1;
    if cid is null then insert into conversations(buyer_business_id, supplier_business_id) values (rr.bid, me) returning id into cid; end if;
    insert into conversation_messages(conversation_id, sender_business_id, text) values (cid, me, left(msg, 3000));
    update conversations set buyer_unread_count = coalesce(buyer_unread_count, 0) + 1 where id = cid;
    buyers := buyers + 1;
  end loop;
  update price_changes set sent_to = buyers where business_id = me and created_at = now();
  if eff <= public.nifti_today() then perform public.nifti_apply_price_changes(me); end if;
  return jsonb_build_object('changes', n, 'buyers', buyers, 'effective', eff);
end $function$
;

CREATE OR REPLACE FUNCTION public.answer_order_by_link(p_token text, p_action text, p_name text, p_items jsonb DEFAULT NULL::jsonb, p_note text DEFAULT NULL::text, p_remind_on date DEFAULT NULL::date, p_needed_by date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l order_links; po purchase_orders; b businesses;
begin
  select * into l from order_links where token = p_token and revoked_at is null and expires_at > now() and coalesce(kind, 'order') = 'order';
  if l.token is null then raise exception 'This link has expired. Ask for a new one.'; end if;
  select * into po from purchase_orders where id = l.po_id;
  select * into b from businesses where id = po.buyer_business_id;
  if not b.is_outside then raise exception '% uses Nifti. Please answer in the app.', b.name; end if;
  if (select count(*) from jsonb_array_elements(coalesce(po.history,'[]'::jsonb)) e where e->>'action' like '🕒 Not yet%' and e->>'date' = public.nifti_today_ph()) >= 3 then
    raise exception 'Please message them directly.';
  end if;
  return public.nifti_quote_answer(po.id, p_action, p_items, p_note, p_remind_on, p_needed_by, p_name, 'link');
end $function$
;

CREATE OR REPLACE FUNCTION public.answer_quote(p_po uuid, p_action text, p_items jsonb DEFAULT NULL::jsonb, p_note text DEFAULT NULL::text, p_remind_on date DEFAULT NULL::date, p_needed_by date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare po purchase_orders; who text;
begin
  select * into po from purchase_orders where id = p_po;
  if po.id is null or not (po.buyer_business_id in (select public.my_business_ids())) then raise exception 'Order not found.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() and business_id = po.buyer_business_id limit 1;
  return public.nifti_quote_answer(po.id, p_action, p_items, p_note, p_remind_on, p_needed_by, coalesce(who, 'Buyer'), 'app');
end $function$
;

CREATE OR REPLACE FUNCTION public.apply_due_price_changes()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b uuid; n int := 0;
begin
  for b in select distinct business_id from price_changes where applied_at is null and cancelled_at is null and effective_date <= public.nifti_today() loop
    n := n + public.nifti_apply_price_changes(b);
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.backup_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t text; rows jsonb; out jsonb := '{}'::jsonb;
begin
  for t in select table_name from information_schema.tables
           where table_schema = 'public' and table_type = 'BASE TABLE'
             and table_name not in ('app_secrets','password_reset_log','notification_outbox','analytics_events','client_error_log','push_log','store_events')
           order by table_name loop
    execute format('select coalesce(jsonb_agg(x), ''[]''::jsonb) from public.%I x', t) into rows;
    out := out || jsonb_build_object(t, rows);
  end loop;
  return jsonb_build_object('made_at', now(), 'project', 'nifti', 'tables', out);
end $function$
;

CREATE OR REPLACE FUNCTION public.billing_instructions()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select value from app_secrets where name = 'billing_instructions'
$function$
;

CREATE OR REPLACE FUNCTION public.books_day_for(p_business uuid, p_day date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'sales', (select coalesce(sum(total), 0) from downstream_sales where business_id = p_business and voided_at is null and sale_date = p_day),
    'sales_count', (select count(*) from downstream_sales where business_id = p_business and voided_at is null and sale_date = p_day),
    'utang', (select coalesce(sum(total), 0) from downstream_sales where business_id = p_business and voided_at is null and sale_date = p_day and paid_with = 'credit'),
    'voided', (select count(*) from downstream_sales where business_id = p_business and voided_at is not null and (voided_at at time zone 'Asia/Manila')::date = p_day),
    'expenses', (select coalesce(sum(amount), 0) from expenses where business_id = p_business and deleted_at is null and spent_on = p_day
                  and category not in ('Owner took money', 'Cash to bank', 'Owner put in cash')),
    'expenses_removed', (select count(*) from expenses where business_id = p_business and deleted_at is not null and (deleted_at at time zone 'Asia/Manila')::date = p_day),
    'cash_diff', (select coalesce(sum(difference), 0) from cash_counts where business_id = p_business and count_day = p_day),
    'cash_counted', (select count(*) from cash_counts where business_id = p_business and count_day = p_day),
    'bad_stock', (select coalesce(sum(-qty * coalesce(unit_cost, 0)), 0) from stock_moves where business_id = p_business and kind = 'bad' and moved_on = p_day),
    'missing_stock', (select coalesce(sum(-qty * coalesce(unit_cost, 0)), 0) from stock_moves where business_id = p_business and kind = 'count' and qty < 0 and moved_on = p_day),
    'hand_changes', (select count(*) from stock_moves where business_id = p_business and kind = 'adjust' and moved_on = p_day)
  )
$function$
;

CREATE OR REPLACE FUNCTION public.broadcast_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() id)
  select jsonb_build_object(
    'buyers', (select count(distinct br.buyer_business_id) from business_relationships br join businesses b on b.id = br.buyer_business_id where br.supplier_business_id = me.id and not b.is_outside and b.paused_at is null),
    'next_at', (select max(created_at) + interval '20 hours' from broadcast_log where business_id = me.id having max(created_at) + interval '20 hours' > now())
  ) from me where me.id is not null $function$
;

CREATE OR REPLACE FUNCTION public.broadcast_to_buyers(p_text text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); t text := btrim(regexp_replace(coalesce(p_text,''), '[<>]', '', 'g')); r record; cid uuid; n int := 0; last timestamptz;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can send to all buyers.'; end if;
  if (select type from businesses where id = me) <> 'supplier' then raise exception 'This is for suppliers.'; end if;
  if length(t) < 5 then raise exception 'Write the post first.'; end if;
  select max(created_at) into last from broadcast_log where business_id = me;
  if last > now() - interval '20 hours' then raise exception 'You can send to all buyers once a day, so they don''t mute you. Next one after %.', to_char((last + interval '20 hours') at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM'); end if;
  for r in select distinct br.buyer_business_id bid from business_relationships br join businesses b on b.id = br.buyer_business_id
           where br.supplier_business_id = me and not b.is_outside and b.paused_at is null loop
    select id into cid from conversations where buyer_business_id = r.bid and supplier_business_id = me limit 1;
    if cid is null then insert into conversations(buyer_business_id, supplier_business_id) values (r.bid, me) returning id into cid; end if;
    insert into conversation_messages(conversation_id, sender_business_id, text) values (cid, me, left(t, 2000));
    update conversations set buyer_unread_count = coalesce(buyer_unread_count, 0) + 1 where id = cid;
    n := n + 1;
  end loop;
  if n > 0 then insert into broadcast_log(business_id, sent) values (me, n); end if;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.business_is_verified(p_business uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from businesses b where b.id = p_business and b.verified_at is not null
    and (b.verified_until is null or b.verified_until >= (now() at time zone 'Asia/Manila')::date)) $function$
;

CREATE OR REPLACE FUNCTION public.business_plan(p_business uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((
    select case when s.plan_id = 'business' then 'business' else 'pro' end from subscriptions s
    where s.business_id = p_business and s.plan_id in ('pro','supplier_pro','buyer_pro','business') and s.status = 'active'
      and (s.paid_until is null or s.paid_until >= (now() at time zone 'Asia/Manila')::date)
  ), 'free')
$function$
;

CREATE OR REPLACE FUNCTION public.buyer_item_history(p_buyer uuid, p_exclude uuid, p_days integer)
 RETURNS TABLE(po_id uuid, supplier_business_id uuid, supplier_name text, product_key text, qty numeric, unit_price numeric, created_date date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select po.id, po.supplier_business_id, b.name, public.nifti_norm(li->>'product'),
         nullif(li->>'qty','')::numeric, nullif(li->>'unitPrice','')::numeric, po.created_date
  from purchase_orders po join businesses b on b.id = po.supplier_business_id, jsonb_array_elements(coalesce(po.line_items,'[]'::jsonb)) li
  where po.buyer_business_id = p_buyer and po.id <> p_exclude
    and po.status not in ('draft','cancelled')
    and po.created_date >= (now() at time zone 'Asia/Manila')::date - p_days
    and nullif(li->>'unitPrice','') is not null
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_price_change(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update price_changes set cancelled_at = now() where id = p_id and applied_at is null and business_id = public.nifti_my_business() and public.is_business_admin(business_id);
  if not found then raise exception 'Only a change that hasn''t started yet can be cancelled.'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.check_supplier_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Early access: no plan limits. (Kept as a trigger so a limit can come back later without
  -- touching business_relationships.)
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.claim_business_with_code(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); mine businesses; claim_biz businesses; mem team_members;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  select * into mine from businesses where id = me;
  select * into mem from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  select * into claim_biz from businesses where claim_code = btrim(coalesce(p_code,'')) and is_outside limit 1;
  if claim_biz.id is null then raise exception 'That join link has already been used or has expired.'; end if;
  if mine.name <> 'New Business' or exists (select 1 from purchase_orders where buyer_business_id = me or supplier_business_id = me)
     or exists (select 1 from business_relationships where buyer_business_id = me or supplier_business_id = me)
     or (select count(*) from team_members where business_id = me) > 1 then
    raise exception 'Your account already has its own business, so this link can''t be added to it.';
  end if;
  update businesses set is_outside = false, claim_code = null, type = 'both' where id = claim_biz.id;
  update team_members set business_id = claim_biz.id, roles = array['Owner'] where id = mem.id;
  insert into business_settings (business_id) select claim_biz.id where not exists (select 1 from business_settings where business_id = claim_biz.id);
  insert into notification_settings (business_id) select claim_biz.id where not exists (select 1 from notification_settings where business_id = claim_biz.id);
  insert into tax_profiles (business_id, business_name) select claim_biz.id, claim_biz.name where not exists (select 1 from tax_profiles where business_id = claim_biz.id);
  insert into subscriptions (business_id) select claim_biz.id where not exists (select 1 from subscriptions where business_id = claim_biz.id);
  insert into referrals (business_id) select claim_biz.id where not exists (select 1 from referrals where business_id = claim_biz.id);
  if claim_biz.created_by_business is not null then
    if claim_biz.type = 'buyer' then
      insert into conversations (buyer_business_id, supplier_business_id) values (claim_biz.id, claim_biz.created_by_business) on conflict do nothing;
    else
      insert into conversations (buyer_business_id, supplier_business_id) values (claim_biz.created_by_business, claim_biz.id) on conflict do nothing;
    end if;
  end if;
  perform public.nifti_delete_business_core(me, 'New Business');
  return jsonb_build_object('business_id', claim_biz.id, 'name', claim_biz.name, 'type', claim_biz.type);
end $function$
;

CREATE OR REPLACE FUNCTION public.claim_notifications(p_limit integer DEFAULT 100)
 RETURNS SETOF notification_outbox
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update notification_outbox set claimed_at = now(), attempts = attempts + 1
  where id in (
    select id from notification_outbox
    where sent_at is null and attempts < 5 and (claimed_at is null or claimed_at < now() - interval '2 minutes')
    order by id limit p_limit for update skip locked)
  returning *
$function$
;

CREATE OR REPLACE FUNCTION public.clear_email_sender()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can change this.'; end if;
  delete from app_secrets where name in ('smtp_user', 'smtp_pass');
end $function$
;

CREATE OR REPLACE FUNCTION public.complete_route_stop(p_stop uuid, p_result jsonb, p_proof text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s route_stops; r routes; me uuid; mid uuid; who text; outcome text := coalesce(p_result->>'outcome','done');
  method text := coalesce(nullif(p_result->'collected'->>'method',''), 'none'); amt numeric := coalesce(nullif(p_result->'collected'->>'amount','')::numeric, 0);
  left_amt numeric; po purchase_orders; take numeric; pay jsonb; newinv jsonb; hist jsonb; today date := public.nifti_today(); label text; cash_total numeric; chq_total numeric; pending_n int;
  collected_on jsonb := '[]'::jsonb; prev jsonb;
begin
  select * into s from route_stops where id = p_stop for update;
  if s.id is null then raise exception 'Stop not found.'; end if;
  me := s.business_id;
  if me not in (select public.my_business_ids()) then raise exception 'Not your route.'; end if;
  select * into r from routes where id = s.route_id for update;
  mid := public.nifti_me_member(me);
  if not (r.driver_member_id = mid or public.nifti_route_planner(me)) then raise exception 'Only the assigned driver or an Owner/Manager can update this stop.'; end if;
  if s.status <> 'pending' then raise exception 'This stop is already done.'; end if;
  select name into who from team_members where id = mid;
  if p_proof is not null and (length(p_proof) > 900000 or p_proof !~ '^data:image/(jpeg|png|webp);base64,') then raise exception 'The photo is too big or not an image.'; end if;
  select coalesce(jsonb_object_agg(id::text, jsonb_build_object('status', status, 'inv', invoice->>'status')), '{}'::jsonb) into prev
    from purchase_orders where id = any(s.deliver_po_ids || s.collect_po_ids) and supplier_business_id = me;
  hist := jsonb_build_object('date', today, 'time', to_char(now() at time zone 'Asia/Manila', 'HH12:MI AM'), 'actor', 'supplier');

  if outcome = 'failed' then
    update route_stops set status = 'failed', result = jsonb_build_object('outcome','failed','reason', left(coalesce(p_result->>'reason','Not done'), 120), 'note', left(p_result->>'note', 300)),
      proof = p_proof, done_at = now(), done_by = who where id = s.id;
    perform public.nifti_notify(me, '⚠ Route: ' || s.buyer_name || ' — ' || left(coalesce(p_result->>'reason','not done'), 60),
      coalesce(who, 'Driver') || ' couldn''t finish this stop.' || coalesce(' ' || left(p_result->>'note', 120), ''), './#routes', 'orders', null, mid);
  else
    -- deliveries
    if coalesce((p_result->>'delivered')::boolean, true) and array_length(s.deliver_po_ids, 1) > 0 then
      update purchase_orders set status = 'delivered',
        history = coalesce(history,'[]'::jsonb) || (hist || jsonb_build_object('action', '📦 Delivered by ' || coalesce(who,'driver') || ' (route)' || coalesce(' · received by ' || left(nullif(p_result->>'received_by',''), 60), ''))),
        delivery_confirmation = coalesce(delivery_confirmation, '{}'::jsonb) || jsonb_build_object('date', today, 'by', who, 'via', 'route', 'stopId', s.id, 'receivedBy', left(p_result->>'received_by', 60))
      where id = any(s.deliver_po_ids) and supplier_business_id = me and status in ('confirmed','preparing','shipped','in_customs','sent');
    end if;
    -- collections: spread the amount over the stop's invoices, oldest due date first
    if amt > 0 and method <> 'none' then
      if method not in ('cash','check','gcash','bank_transfer','maya') then raise exception 'Unknown payment method.'; end if;
      if method = 'check' and (coalesce(p_result->'collected'->>'check_no','') = '' or coalesce(p_result->'collected'->>'check_date','') !~ '^\d{4}-\d{2}-\d{2}$') then
        raise exception 'Enter the cheque number and the date on the cheque.'; end if;
      left_amt := amt;
      for po in select * from purchase_orders where id = any(s.collect_po_ids) and supplier_business_id = me and invoice is not null and status not in ('cancelled','paid')
                order by coalesce(nullif(invoice->>'dueDate','')::date, created_date) loop
        exit when left_amt < 0.5;
        take := least(left_amt, greatest(public.nifti_open_balance(po.invoice), 0));
        continue when take < 0.5;
        pay := jsonb_build_object('id', 'rt' || replace(gen_random_uuid()::text, '-', ''), 'method', method, 'amount', take, 'date', today, 'submittedBy', 'supplier', 'via', 'route', 'routeStopId', s.id,
                 'reference', case when method = 'check' then left(p_result->'collected'->>'check_no', 40) else coalesce(nullif(left(p_result->'collected'->>'reference', 60), ''), 'Collected by ' || coalesce(who,'driver')) end,
                 'checkDate', case when method = 'check' then p_result->'collected'->>'check_date' end,
                 'bank', case when method = 'check' then left(p_result->'collected'->>'bank', 40) end);
        if method = 'check' then pay := pay || jsonb_build_object('confirmStatus', 'pending', 'checkStatus', 'pending');
        else pay := pay || jsonb_build_object('confirmStatus', 'confirmed', 'confirmedAt', today); end if;
        newinv := jsonb_set(po.invoice, '{payments}', coalesce(po.invoice->'payments','[]'::jsonb) || pay);
        if public.nifti_invoice_balance(newinv) <= 0.5 and public.nifti_open_balance(newinv) > -0.5 and not exists (
             select 1 from jsonb_array_elements(newinv->'payments') p where p->>'method' = 'check' and coalesce(p->>'checkStatus','') = 'pending' and coalesce(p->>'confirmStatus','') <> 'rejected') then
          newinv := newinv || jsonb_build_object('status', 'paid');
          update purchase_orders set invoice = newinv, status = 'paid',
            history = coalesce(history,'[]'::jsonb) || (hist || jsonb_build_object('action', '💰 Collected ' || public.nifti_peso(take) || ' ' || case method when 'check' then 'cheque' else method end || ' by ' || coalesce(who,'driver') || ' (route) — invoice fully paid'))
          where id = po.id;
        else
          update purchase_orders set invoice = newinv,
            history = coalesce(history,'[]'::jsonb) || (hist || jsonb_build_object('action', '💰 Collected ' || public.nifti_peso(take) || ' ' || case method when 'check' then 'cheque (waiting to clear)' else method end || ' by ' || coalesce(who,'driver') || ' (route)'))
          where id = po.id;
        end if;
        collected_on := collected_on || jsonb_build_object('po_id', po.id, 'po_number', po.po_number, 'amount', take);
        left_amt := left_amt - take;
      end loop;
      -- cash on delivery for an order that has no invoice yet: kept as the order's COD payment
      if left_amt >= 0.5 then
        select * into po from purchase_orders where id = any(s.deliver_po_ids) and supplier_business_id = me and invoice is null and cod_payment is null
          and public.nifti_po_total(purchase_orders) >= left_amt - 0.5 order by created_date limit 1;
        if po.id is not null then
          pay := jsonb_build_object('id', 'rt' || replace(gen_random_uuid()::text, '-', ''), 'method', method, 'amount', left_amt, 'date', today, 'submittedBy', 'supplier', 'via', 'route',
                   'routeStopId', s.id, 'reference', case when method = 'check' then left(p_result->'collected'->>'check_no', 40) else 'Collected at delivery' end,
                   'checkDate', case when method = 'check' then p_result->'collected'->>'check_date' end, 'bank', case when method = 'check' then left(p_result->'collected'->>'bank', 40) end)
                 || case when method = 'check' then jsonb_build_object('confirmStatus','pending','checkStatus','pending') else jsonb_build_object('confirmStatus','confirmed','confirmedAt', today) end;
          update purchase_orders set cod_payment = pay,
            history = coalesce(history,'[]'::jsonb) || (hist || jsonb_build_object('action', '💰 Collected ' || public.nifti_peso(left_amt) || ' at delivery by ' || coalesce(who,'driver') || ' (route)'))
          where id = po.id;
          collected_on := collected_on || jsonb_build_object('po_id', po.id, 'po_number', po.po_number, 'amount', left_amt, 'cod', true);
          left_amt := 0;
        end if;
      end if;
      if left_amt >= 0.5 then raise exception 'That''s % more than this stop owes. Check the amount.', public.nifti_peso(left_amt); end if;
    end if;
    update route_stops set status = 'done', proof = p_proof, done_at = now(), done_by = who,
      result = jsonb_build_object('outcome','done', 'delivered', coalesce((p_result->>'delivered')::boolean, true), 'received_by', left(p_result->>'received_by', 60), 'note', left(p_result->>'note', 300),
                 'collected', case when amt > 0 and method <> 'none' then jsonb_build_object('method', method, 'amount', amt, 'bank', left(p_result->'collected'->>'bank', 40),
                   'check_no', left(p_result->'collected'->>'check_no', 40), 'check_date', p_result->'collected'->>'check_date', 'on', collected_on) end,
                 'short_reason', left(p_result->>'short_reason', 120), 'prev', prev)
      where id = s.id;
    if s.amount_due >= 1 and amt < s.amount_due - 0.5 then
      perform public.nifti_notify(me, '💸 Route: ' || s.buyer_name || ' paid ' || public.nifti_peso(amt) || ' of ' || public.nifti_peso(s.amount_due),
        coalesce(left(nullif(p_result->>'short_reason',''), 120), 'Short collection.') , './#routes', 'orders', null, mid);
    end if;
  end if;
  if r.status = 'planned' then update routes set status = 'on_road', updated_at = now() where id = r.id; end if;
  select count(*) into pending_n from route_stops where route_id = r.id and status = 'pending';
  if pending_n = 0 then
    select coalesce(sum(case when result->'collected'->>'method' <> 'check' then (result->'collected'->>'amount')::numeric end), 0),
           coalesce(sum(case when result->'collected'->>'method' = 'check' then (result->'collected'->>'amount')::numeric end), 0)
      into cash_total, chq_total from route_stops where route_id = r.id and status = 'done';
    update routes set status = 'done', updated_at = now() where id = r.id;
    perform public.nifti_notify(me, '✅ Route done: ' || coalesce(r.driver_name, 'driver'),
      'Collected ' || public.nifti_peso(cash_total) || ' cash/e-wallet and ' || public.nifti_peso(chq_total) || ' in cheques. Confirm the remittance in Routes.', './#routes', 'orders', null, mid);
  end if;
  return jsonb_build_object('ok', true, 'collected_on', collected_on, 'route_done', pending_n = 0);
end $function$
;

CREATE OR REPLACE FUNCTION public.confirm_receipt_by_link(p_token text, p_ok boolean, p_name text, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l order_links; po purchase_orders; who text; note text; today text := public.nifti_today_ph();
begin
  select * into l from order_links where token = p_token and revoked_at is null and expires_at > now() and coalesce(kind, 'order') = 'order';
  if l.token is null then raise exception 'This link has expired.'; end if;
  select * into po from purchase_orders where id = l.po_id for update;
  if po.status not in ('confirmed','preparing','shipped','in_customs') then raise exception 'This order can''t be marked received right now.'; end if;
  if po.delivery_confirmation is not null and po.delivery_confirmation <> 'null'::jsonb then raise exception 'Already confirmed. Thank you!'; end if;
  who := left(btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g')), 60);
  note := nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>`]', '', 'g')), 400), '');
  if length(who) < 2 then raise exception 'Please enter the name of the person who received it.'; end if;
  if coalesce(p_ok, true) then
    update purchase_orders set status = 'delivered',
      delivery_confirmation = jsonb_strip_nulls(jsonb_build_object('confirmedDate', today, 'confirmedBy', who, 'via', 'link', 'complete', true, 'note', note)),
      history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', today, 'time', 'Just now', 'actor', 'buyer',
        'action', '📦 Received by ' || who || ' (from the tracking link)' || coalesce(': ' || note, ''))), updated_at = now()
    where id = po.id;
    perform public.nifti_notify(po.supplier_business_id, '📦 Delivered: ' || po.po_number, 'Received by ' || who || coalesce('. ' || note, '') || '. You can send the invoice now.', './#orders', 'orders');
  else
    if note is null then raise exception 'Tell them what''s wrong so they can fix it.'; end if;
    update purchase_orders set history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', today, 'time', 'Just now', 'actor', 'buyer',
        'action', '⚠ Problem reported by ' || who || ' (from the tracking link): ' || note)), at_risk = true, risk_note = left('Receiver: ' || note, 300), updated_at = now()
    where id = po.id;
    perform public.nifti_notify(po.supplier_business_id, '⚠ Delivery problem: ' || po.po_number, who || ': ' || note, './#orders', 'orders');
  end if;
  return jsonb_build_object('ok', true);
end $function$
;

CREATE OR REPLACE FUNCTION public.create_business_share_link(p_scope text, p_days integer, p_label text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); tok text; who text;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can share access.'; end if;
  if p_scope not in ('orders','invoices','full') then raise exception 'Unknown access type.'; end if;
  if p_days not in (1, 7, 30, 90) then raise exception 'Pick how long the link should work.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() limit 1;
  tok := public.nifti_random_token(24);
  insert into business_share_links(token, business_id, scope, label, created_by_name, expires_at)
    values (tok, me, p_scope, nullif(left(btrim(regexp_replace(coalesce(p_label,''), '[<>]', '', 'g')), 80), ''), who, now() + make_interval(days => p_days));
  return tok;
end $function$
;

CREATE OR REPLACE FUNCTION public.create_delivery_link(p_po_id uuid, p_partner text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare po purchase_orders; tok text; my_biz uuid;
begin
  select * into po from purchase_orders where id = p_po_id;
  if po.id is null then raise exception 'Order not found.'; end if;
  select business_id into my_biz from team_members where auth_user_id = auth.uid() and status = 'active' and business_id in (po.buyer_business_id, po.supplier_business_id) limit 1;
  if my_biz is null then raise exception 'You are not part of this order.'; end if;
  if po.status in ('draft','sent','cancelled','countered') then raise exception 'Confirm the order first, then send it to your delivery partner.'; end if;
  tok := public.nifti_random_token(24);
  insert into order_links(token, po_id, created_by_business, kind, partner_name, expires_at)
    values (tok, p_po_id, my_biz, 'delivery', left(btrim(regexp_replace(coalesce(p_partner,''), '[<>"`]', '', 'g')), 80), now() + interval '30 days');
  return tok;
end $function$
;

CREATE OR REPLACE FUNCTION public.create_order_link(p_po_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare po purchase_orders; tok text; my_biz uuid;
begin
  select * into po from purchase_orders where id = p_po_id;
  if po.id is null then raise exception 'Order not found.'; end if;
  select business_id into my_biz from team_members where auth_user_id = auth.uid() and status = 'active'
    and business_id in (po.buyer_business_id, po.supplier_business_id) limit 1;
  if my_biz is null then raise exception 'You are not part of this order.'; end if;
  if po.status = 'draft' then raise exception 'Send the order first, then share the link.'; end if;
  select token into tok from order_links where po_id = p_po_id and kind = 'order' and revoked_at is null and expires_at > now() + interval '7 days'
    order by created_at desc limit 1;
  if tok is not null then return tok; end if;
  tok := public.nifti_random_token(24);
  insert into order_links(token, po_id, created_by_business) values (tok, p_po_id, my_biz);
  return tok;
end $function$
;

CREATE OR REPLACE FUNCTION public.create_outside_supplier(p_name text, p_phone text DEFAULT NULL::text, p_email text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  my_biz uuid; my_type text; new_id uuid;
  clean_name text := btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g'));
  clean_phone text := nullif(btrim(regexp_replace(coalesce(p_phone,''), '[^0-9+ ]', '', 'g')), '');
  clean_email text := nullif(lower(btrim(coalesce(p_email,''))), '');
begin
  select tm.business_id, b.type into my_biz, my_type
    from team_members tm join businesses b on b.id = tm.business_id
    where tm.auth_user_id = auth.uid() and tm.status = 'active' limit 1;
  if my_biz is null then raise exception 'Please sign in first.'; end if;
  if my_type is null then raise exception 'Sign in first.'; end if;
  if length(clean_name) < 2 or length(clean_name) > 120 then raise exception 'Enter the supplier''s business name.'; end if;
  if clean_email is not null and clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email doesn''t look right.'; end if;
  select b.id into new_id from businesses b
    join business_relationships r on r.supplier_business_id = b.id and r.buyer_business_id = my_biz
    where b.is_outside and lower(b.name) = lower(clean_name) limit 1;
  if new_id is not null then return new_id; end if;
  insert into businesses(name, type, is_outside, outside_contact, created_by_business, claim_code)
    values (clean_name, 'supplier', true,
            jsonb_strip_nulls(jsonb_build_object('phone', clean_phone, 'email', clean_email)),
            my_biz, public.nifti_random_token(12))
    returning id into new_id;
  insert into business_relationships(buyer_business_id, supplier_business_id) values (my_biz, new_id) on conflict do nothing;
  return new_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.create_reorder_link(p_buyer uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from business_relationships where supplier_business_id = me and buyer_business_id = p_buyer) then raise exception 'Not one of your buyers.'; end if;
  return public.nifti_make_reorder_link(me, p_buyer);
end $function$
;

CREATE OR REPLACE FUNCTION public.create_statement_link(p_buyer uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); tok text; who text;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not public.has_feature(me, 'statements') then raise exception 'Statements are part of Supplier Pro.'; end if;
  if not exists (select 1 from purchase_orders where supplier_business_id = me and buyer_business_id = p_buyer) then raise exception 'No orders with this buyer yet.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() limit 1;
  tok := public.nifti_random_token(24);
  insert into statement_links(token, supplier_business_id, buyer_business_id, created_by_name) values (tok, me, p_buyer, who);
  return tok;
end $function$
;

CREATE OR REPLACE FUNCTION public.credit_exposure(p_buyer uuid, p_supplier uuid, p_exclude uuid DEFAULT NULL::uuid)
 RETURNS TABLE(owed numeric, open_orders numeric, max_days_late integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with t as (select (now() at time zone 'Asia/Manila')::date d)
  select
    coalesce(sum(greatest(public.nifti_invoice_balance(po.invoice), 0)) filter (where po.invoice is not null and po.status <> 'paid'), 0),
    coalesce(sum((select sum(nullif(li->>'qty','')::numeric * nullif(li->>'unitPrice','')::numeric) from jsonb_array_elements(coalesce(po.line_items,'[]'::jsonb)) li) * (1 + coalesce(po.tax_rate,0)))
             filter (where po.invoice is null and po.status in ('sent','confirmed','preparing','shipped','in_customs','delivered','partially_delivered','countered')), 0),
    coalesce(max(greatest(t.d - public.nifti_iso_date(po.invoice->>'dueDate'), 0)) filter (where po.invoice is not null and po.status <> 'paid' and public.nifti_invoice_balance(po.invoice) >= 1), 0)::int
  from purchase_orders po, t
  where po.buyer_business_id = p_buyer and po.supplier_business_id = p_supplier and po.status not in ('draft','cancelled')
    and (p_exclude is null or po.id <> p_exclude)
$function$
;

CREATE OR REPLACE FUNCTION public.credit_overview()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() id)
  select coalesce(jsonb_agg(jsonb_build_object(
      'buyer_id', r.buyer_business_id, 'supplier_id', r.supplier_business_id,
      'counterparty', (select name from businesses where id = case when r.supplier_business_id = me.id then r.buyer_business_id else r.supplier_business_id end),
      'role', case when r.supplier_business_id = me.id then 'supplier' else 'buyer' end,
      'limit', r.credit_limit, 'hold_days', r.credit_hold_days, 'mode', r.credit_mode,
      'owed', ex.owed, 'open_orders', ex.open_orders, 'days_late', ex.max_days_late,
      'on_hold', (r.credit_hold_days is not null and ex.max_days_late > r.credit_hold_days) or (r.credit_limit is not null and ex.owed + ex.open_orders >= r.credit_limit))
    ), '[]'::jsonb)
  from me, business_relationships r, lateral public.credit_exposure(r.buyer_business_id, r.supplier_business_id, null) ex
  where me.id in (r.buyer_business_id, r.supplier_business_id) and (r.credit_limit is not null or r.credit_hold_days is not null)
$function$
;

CREATE OR REPLACE FUNCTION public.daily_summary_for(p_business uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with today as (select (now() at time zone 'Asia/Manila')::date d),
  sup as (
    select po.* from purchase_orders po where po.supplier_business_id = p_business and po.status not in ('draft','cancelled')
  ), buy as (
    select po.* from purchase_orders po where po.buyer_business_id = p_business and po.status not in ('draft','cancelled')
  )
  select jsonb_build_object(
    'to_confirm', (select count(*) from sup where status = 'sent'),
    'to_deliver', (select count(*) from sup, today where status in ('confirmed','preparing') and requested_delivery_date <= today.d),
    'payments_to_check', (select count(*) from sup where public.nifti_count_payments(invoice, deposit_payments, 'pending') > 0),
    'owed_to_you', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from sup where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'),
    'owed_to_you_overdue', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from sup, today where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'
                              and coalesce(invoice->>'dueDate','') ~ '^\d{4}-\d{2}-\d{2}$' and (invoice->>'dueDate')::date < today.d),
    'arriving', (select count(*) from buy, today where status in ('shipped','in_customs') or (status in ('confirmed','preparing') and requested_delivery_date = today.d)),
    'price_changes', (select count(*) from buy where status = 'countered'),
    'bills_due', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from buy, today where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'
                   and coalesce(invoice->>'dueDate','') ~ '^\d{4}-\d{2}-\d{2}$' and (invoice->>'dueDate')::date <= today.d + 3),
    'payments_rejected', (select count(*) from buy where public.nifti_count_payments(invoice, deposit_payments, 'rejected') > 0 and status <> 'paid'),
    'unread_messages', (select coalesce(sum(case when c.buyer_business_id = p_business then c.buyer_unread_count else c.supplier_unread_count end), 0)
                        from conversations c where p_business in (c.buyer_business_id, c.supplier_business_id))
  )
$function$
;

CREATE OR REPLACE FUNCTION public.delete_my_business(p_confirm text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.nifti_has_role(me, array['Owner']) then raise exception 'Only the Owner can delete the business account.'; end if;
  insert into admin_actions(admin_email, action, business_id, target, detail) values (auth.jwt()->>'email', 'self_delete', me, (select name from businesses where id = me), null);
  return public.nifti_delete_business_core(me, p_confirm);
end $function$
;

CREATE OR REPLACE FUNCTION public.delete_route(p_route uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r routes;
begin
  select * into r from routes where id = p_route;
  if r.id is null or not public.nifti_route_planner(r.business_id) then raise exception 'Only an Owner or Manager can delete a route.'; end if;
  if exists (select 1 from route_stops where route_id = r.id and status = 'done') then raise exception 'This route already has finished stops. It stays as a record.'; end if;
  delete from routes where id = r.id;
end $function$
;

CREATE OR REPLACE FUNCTION public.discover_businesses(p_type text)
 RETURNS TABLE(id uuid, name text, type text, profile jsonb, catalog jsonb, connected boolean, request_status text, verified boolean, featured boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() as id)
  select b.id, b.name, b.type, b.public_profile,
         case when p_type = 'supplier' then (select coalesce(jsonb_agg(jsonb_build_object('product', c->>'product', 'price', c->'price', 'unit', c->>'unit', 'moq', c->'moq')), '[]'::jsonb) from jsonb_array_elements(b.catalog) c) else '[]'::jsonb end,
         exists(select 1 from business_relationships r where (r.buyer_business_id = b.id and r.supplier_business_id = me.id) or (r.supplier_business_id = b.id and r.buyer_business_id = me.id)),
         (select cr.status from connection_requests cr where cr.from_business = me.id and cr.to_business = b.id order by cr.created_at desc limit 1),
         public.business_is_verified(b.id),
         public.business_plan(b.id) = 'business'
  from businesses b, me
  where b.catalog_public and not b.is_outside and public.nifti_listable(b.id) and b.paused_at is null and (b.type = p_type or b.type = 'both') and (p_type = 'buyer' or jsonb_array_length(coalesce(b.catalog, '[]'::jsonb)) > 0) and b.id <> me.id and me.id is not null
  order by (public.business_plan(b.id) = 'business') desc, public.business_is_verified(b.id) desc, b.name
  limit 200 $function$
;

CREATE OR REPLACE FUNCTION public.downstream_sales_stamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    new.created_by := public.nifti_me_member(new.business_id);
    new.created_by_name := public.nifti_member_name(new.business_id);
    new.created_at := now();
    return new;
  end if;
  new.business_id := old.business_id; new.created_by := old.created_by; new.created_by_name := old.created_by_name; new.created_at := old.created_at;
  if old.voided_at is not null then raise exception 'This sale was already voided.'; end if;
  if new.voided_at is not null then
    if not public.nifti_books_viewer(old.business_id) then raise exception 'Only the owner can void a sale.'; end if;
    new.voided_at := now(); new.voided_by_name := public.nifti_member_name(old.business_id);
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (old.business_id, 'sale_voided', 'sale', old.id::text, 'sale', to_jsonb(old.total), to_jsonb(coalesce(new.void_reason,'')), coalesce(new.voided_by_name,'someone'));
    return new;
  end if;
  -- anyone else may only add payments; items, totals and the date stay as recorded
  if not public.nifti_books_viewer(old.business_id) and (new.line_items is distinct from old.line_items or new.total is distinct from old.total or new.sale_date is distinct from old.sale_date) then
    raise exception 'Only the owner can change a recorded sale.';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.edit_route_stop(p_stop uuid, p_result jsonb, p_proof text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare old_proof text;
begin
  select proof into old_proof from route_stops where id = p_stop and business_id in (select public.my_business_ids());
  perform public.undo_route_stop(p_stop);   -- takes back what was recorded (same checks: driver/manager, not yet remitted)
  return public.complete_route_stop(p_stop, p_result, coalesce(p_proof, old_proof));
end $function$
;

CREATE OR REPLACE FUNCTION public.email_notifications_available()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select (exists(select 1 from app_secrets where name = 'resend_api_key') and exists(select 1 from app_secrets where name = 'email_from'))
      or (exists(select 1 from app_secrets where name = 'smtp_user') and exists(select 1 from app_secrets where name = 'smtp_pass'))
$function$
;

CREATE OR REPLACE FUNCTION public.email_sender_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case when public.is_platform_admin() then jsonb_build_object(
      'is_admin', true,
      'configured', exists(select 1 from app_secrets where name = 'smtp_user') and exists(select 1 from app_secrets where name = 'smtp_pass'),
      'user', (select value from app_secrets where name = 'smtp_user'),
      'support_inbox', (select value from app_secrets where name = 'support_inbox'))
    else jsonb_build_object('is_admin', false) end
$function$
;

CREATE OR REPLACE FUNCTION public.ewt_lines(p_business uuid)
 RETURNS TABLE(buyer_business_id uuid, supplier_business_id uuid, quarter text, month_in_quarter integer, pay_date date, atc text, rate numeric, base numeric, tax numeric, po_number text, invoice_number text, confirm_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select po.buyer_business_id, po.supplier_business_id,
         public.nifti_quarter_of(coalesce(public.nifti_iso_date(p->>'date'), po.created_date)),
         ((extract(month from coalesce(public.nifti_iso_date(p->>'date'), po.created_date))::int - 1) % 3) + 1,
         coalesce(public.nifti_iso_date(p->>'date'), po.created_date),
         coalesce(p->>'atc', ''), coalesce((p->>'ewtRate')::numeric, 0),
         coalesce((p->>'ewtBase')::numeric, 0), coalesce((p->>'amount')::numeric, 0),
         po.po_number, po.invoice->>'number', coalesce(p->>'confirmStatus', 'confirmed')
  from purchase_orders po, jsonb_array_elements(coalesce(po.invoice->'payments', '[]'::jsonb)) p
  where (po.buyer_business_id = p_business or po.supplier_business_id = p_business)
    and po.status not in ('draft','cancelled') and p->>'method' = 'ewt' and coalesce(p->>'confirmStatus','confirmed') <> 'rejected'
$function$
;

CREATE OR REPLACE FUNCTION public.ewt_tracker()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); today date := (now() at time zone 'Asia/Manila')::date;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not public.has_feature(me, 'bir2307') then raise exception 'The 2307 tracker is part of Pro.'; end if;
  return (
    with l as (select * from public.ewt_lines(me)),
    g as (
      select l.buyer_business_id, l.supplier_business_id, l.quarter,
             sum(l.tax) tax, sum(l.base) base, count(*) n,
             sum(l.tax) filter (where l.confirm_status = 'pending') tax_pending,
             jsonb_agg(jsonb_build_object('month', l.month_in_quarter, 'date', l.pay_date, 'atc', l.atc, 'rate', l.rate, 'base', l.base, 'tax', l.tax, 'po_number', l.po_number, 'invoice_number', l.invoice_number, 'status', l.confirm_status) order by l.pay_date) lines
      from l group by 1, 2, 3
    )
    select coalesce(jsonb_agg(jsonb_build_object(
        'role', case when g.buyer_business_id = me then 'buyer' else 'supplier' end,
        'counterparty_id', case when g.buyer_business_id = me then g.supplier_business_id else g.buyer_business_id end,
        'counterparty', (select name from businesses where id = case when g.buyer_business_id = me then g.supplier_business_id else g.buyer_business_id end),
        'quarter', g.quarter, 'due', public.nifti_quarter_due(g.quarter),
        'quarter_ended', today > (make_date(left(g.quarter,4)::int, right(g.quarter,1)::int * 3, 1) + interval '1 month' - interval '1 day')::date,
        'overdue', today > public.nifti_quarter_due(g.quarter) and coalesce(s.status, 'owed') = 'owed',
        'tax', g.tax, 'base', g.base, 'count', g.n, 'tax_pending', coalesce(g.tax_pending, 0),
        'status', coalesce(s.status, 'owed'), 'sent_at', s.sent_at, 'sent_by', s.sent_by_name, 'received_at', s.received_at, 'note', s.note,
        'lines', g.lines) order by g.quarter desc, g.tax desc), '[]'::jsonb)
    from g left join form2307_status s on s.buyer_business_id = g.buyer_business_id and s.supplier_business_id = g.supplier_business_id and s.quarter = g.quarter
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.expenses_stamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare boss boolean; limit_amt numeric; dual boolean; roles text[]; me uuid;
begin
  boss := public.nifti_books_viewer(new.business_id);
  me := public.nifti_me_member(new.business_id);
  select t.roles into roles from team_members t where t.id = me;
  select coalesce((books_settings->>'approve_over')::numeric, 2000), coalesce((books_settings->>'dual_approval')::boolean, false)
    into limit_amt, dual from businesses where id = new.business_id;
  if tg_op = 'INSERT' then
    new.created_by := me;
    new.created_by_name := coalesce(public.nifti_member_name(new.business_id), new.created_by_name);
    new.created_at := now();
    -- big expenses from staff (or from anyone but the owner, when two-person approval is on) wait for an OK
    if new.amount >= limit_amt and (not boss or (dual and not ('Owner' = any(coalesce(roles, '{}'))))) then new.status := 'submitted';
    else new.status := 'approved'; new.approved_by_name := new.created_by_name; new.approved_at := now(); end if;
    return new;
  end if;
  new.created_by := old.created_by; new.created_by_name := old.created_by_name; new.created_at := old.created_at; new.business_id := old.business_id;
  if not boss then
    -- the person who entered it fixes what the owner sent back, and it goes back for review
    if old.status <> 'needs_correction' or old.created_by is distinct from me then raise exception 'Only the owner can change this.'; end if;
    new.status := 'submitted'; new.approved_by_name := null; new.approved_at := null; new.deleted_at := old.deleted_at;
  elsif new.status = 'approved' and old.status <> 'approved' then
    if dual and old.created_by = me and not ('Owner' = any(coalesce(roles, '{}'))) then raise exception 'Someone else has to approve your own expense.'; end if;
    new.approved_by_name := public.nifti_member_name(new.business_id); new.approved_at := now();
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (new.business_id, 'expense_approved', 'expense', new.id::text, 'status', to_jsonb(old.status), to_jsonb(new.status), coalesce(new.approved_by_name, 'someone'));
  elsif new.status = 'needs_correction' and old.status <> 'needs_correction' then
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (new.business_id, 'expense_sent_back', 'expense', new.id::text, 'status', to_jsonb(old.status), to_jsonb(coalesce(new.review_note, '')), coalesce(public.nifti_member_name(new.business_id), 'someone'));
  end if;
  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_at := now(); new.deleted_by_name := public.nifti_member_name(new.business_id);
  elsif (new.amount, new.category, new.spent_on, new.paid_from, coalesce(new.vendor,''), coalesce(new.note,''), coalesce(new.staff_name,''))
        is distinct from (old.amount, old.category, old.spent_on, old.paid_from, coalesce(old.vendor,''), coalesce(old.note,''), coalesce(old.staff_name,'')) then
    new.edited_at := now(); new.edited_by_name := public.nifti_member_name(new.business_id);
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (new.business_id, 'expense_edited', 'expense', new.id::text, 'expense',
        jsonb_build_object('amount', old.amount, 'category', old.category, 'spent_on', old.spent_on, 'paid_from', old.paid_from),
        jsonb_build_object('amount', new.amount, 'category', new.category, 'spent_on', new.spent_on, 'paid_from', new.paid_from),
        coalesce(new.edited_by_name, 'someone'));
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.finish_business_setup(p_name text, p_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); clean text := btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g'));
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only the Owner can do this.'; end if;
  if p_type not in ('buyer','supplier') then raise exception 'Pick buyer or supplier.'; end if;
  if length(clean) < 2 or length(clean) > 120 then raise exception 'Enter your business name.'; end if;
  if exists (select 1 from purchase_orders where buyer_business_id = me or supplier_business_id = me)
     or exists (select 1 from business_relationships where buyer_business_id = me or supplier_business_id = me) then
    raise exception 'Your business is already set up.';
  end if;
  update businesses set name = clean, type = p_type where id = me;
  update tax_profiles set business_name = clean where business_id = me;
end $function$
;

CREATE OR REPLACE FUNCTION public.form2307_worksheet(p_counterparty uuid, p_quarter text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); my_type text; buyer uuid; supplier uuid;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not public.has_feature(me, 'bir2307') then raise exception 'The 2307 tracker is part of Pro.'; end if;
  select type into my_type from businesses where id = me;
  if exists (select 1 from purchase_orders where buyer_business_id = me and supplier_business_id = p_counterparty) then buyer := me; supplier := p_counterparty;
  elsif exists (select 1 from purchase_orders where supplier_business_id = me and buyer_business_id = p_counterparty) then buyer := p_counterparty; supplier := me;
  else raise exception 'No orders with this business.'; end if;
  return jsonb_build_object(
    'quarter', p_quarter,
    'period_from', make_date(left(p_quarter,4)::int, right(p_quarter,1)::int * 3 - 2, 1),
    'period_to', (make_date(left(p_quarter,4)::int, right(p_quarter,1)::int * 3, 1) + interval '1 month' - interval '1 day')::date,
    'payee', (select jsonb_build_object('name', coalesce(tp.business_name, b.name), 'tin', tp.tin, 'address', tp.registered_address) from businesses b left join tax_profiles tp on tp.business_id = b.id where b.id = supplier),
    'payor', (select jsonb_build_object('name', coalesce(tp.business_name, b.name), 'tin', tp.tin, 'address', tp.registered_address) from businesses b left join tax_profiles tp on tp.business_id = b.id where b.id = buyer),
    'rows', (select coalesce(jsonb_agg(r order by r->>'atc'), '[]'::jsonb) from (
       select jsonb_build_object('atc', atc, 'rate', max(rate),
         'm1', coalesce(sum(base) filter (where month_in_quarter = 1), 0), 'm2', coalesce(sum(base) filter (where month_in_quarter = 2), 0),
         'm3', coalesce(sum(base) filter (where month_in_quarter = 3), 0), 'total', sum(base), 'tax', sum(tax)) r
       from public.ewt_lines(me) l where l.buyer_business_id = buyer and l.supplier_business_id = supplier and l.quarter = p_quarter
       group by atc) x)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.forms_2307_pending(p_business uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with today as (select (now() at time zone 'Asia/Manila')::date d),
  g as (select l.buyer_business_id b, l.supplier_business_id s, l.quarter q, sum(l.tax) tax from public.ewt_lines(p_business) l, today
        where today.d > (make_date(left(l.quarter,4)::int, right(l.quarter,1)::int * 3, 1) + interval '1 month' - interval '1 day')::date
          and l.confirm_status = 'confirmed' group by 1,2,3)
  select jsonb_build_object(
    'to_send', (select count(*) from g left join form2307_status f on f.buyer_business_id = g.b and f.supplier_business_id = g.s and f.quarter = g.q where g.b = p_business and coalesce(f.status,'owed') = 'owed'),
    'missing', (select count(*) from g left join form2307_status f on f.buyer_business_id = g.b and f.supplier_business_id = g.s and f.quarter = g.q where g.s = p_business and coalesce(f.status,'owed') <> 'received'),
    'missing_tax', (select coalesce(sum(g.tax),0) from g left join form2307_status f on f.buyer_business_id = g.b and f.supplier_business_id = g.s and f.quarter = g.q where g.s = p_business and coalesce(f.status,'owed') <> 'received'))
$function$
;

CREATE OR REPLACE FUNCTION public.get_business_share(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l business_share_links; b businesses; rows jsonb;
begin
  if p_token is null or length(p_token) < 20 then return null; end if;
  select * into l from business_share_links where token = p_token;
  if l.token is null or l.revoked_at is not null or l.expires_at < now() then return null; end if;
  select * into b from businesses where id = l.business_id;
  update business_share_links set view_count = view_count + 1, last_viewed_at = now() where token = p_token;
  select coalesce(jsonb_agg(x order by x->>'created_date' desc), '[]'::jsonb) into rows from (
    select jsonb_strip_nulls(jsonb_build_object(
      'po_number', po.po_number,
      'side', case when po.buyer_business_id = b.id then 'bought' else 'sold' end,
      'counterpart', (select name from businesses where id = case when po.buyer_business_id = b.id then po.supplier_business_id else po.buyer_business_id end),
      'status', po.status, 'created_date', po.created_date,
      'total', public.nifti_po_total(po),
      'items', case when l.scope in ('orders','full') then (select jsonb_agg(jsonb_build_object('product', li->>'product', 'qty', li->'qty', 'unitPrice', li->'unitPrice')) from jsonb_array_elements(coalesce(po.line_items,'[]'::jsonb)) li) end,
      'requested_delivery_date', case when l.scope in ('orders','full') then po.requested_delivery_date end,
      'invoice', case when l.scope in ('invoices','full') and po.invoice is not null then jsonb_build_object(
          'number', po.invoice->>'number', 'status', po.invoice->>'status', 'due_date', po.invoice->>'dueDate',
          'stated_total', po.invoice->'statedTotal', 'balance', public.nifti_invoice_balance(po.invoice),
          'payments', (select jsonb_agg(jsonb_build_object('date', p->>'date', 'method', p->>'method', 'amount', p->'amount', 'reference', p->>'reference', 'status', coalesce(p->>'confirmStatus','confirmed')))
                       from jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb)) p)) end
    )) x
    from purchase_orders po
    where (po.buyer_business_id = b.id or po.supplier_business_id = b.id) and po.status <> 'draft'
      and (l.scope <> 'invoices' or po.invoice is not null)
    order by po.created_date desc limit 300) t;
  return jsonb_build_object('business', b.name, 'scope', l.scope, 'label', l.label, 'expires_at', l.expires_at, 'orders', rows);
end $function$
;

CREATE OR REPLACE FUNCTION public.get_push_public_key()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select value from app_secrets where name = 'vapid_public'
$function$
;

CREATE OR REPLACE FUNCTION public.get_reorder_cart(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l reorder_links; b businesses; sup businesses;
begin
  if p_token is null or length(p_token) < 20 then return null; end if;
  select * into l from reorder_links where token = p_token and expires_at > now();
  if l.token is null then return null; end if;
  select * into b from businesses where id = l.buyer_business_id;
  select * into sup from businesses where id = l.business_id;
  return jsonb_build_object('slug', sup.store_slug, 'items', l.items,
    'buyer', jsonb_build_object('name', coalesce(b.outside_contact->>'name', b.name), 'biz', case when b.is_outside and b.outside_contact->>'name' is distinct from b.name then b.name end,
      'phone', b.outside_contact->>'phone', 'addr', coalesce(b.outside_contact->>'address',
        (select delivery_address from purchase_orders where buyer_business_id = b.id and supplier_business_id = sup.id and delivery_address is not null order by created_at desc limit 1))));
end $function$
;

CREATE OR REPLACE FUNCTION public.get_shared_order(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l order_links; po purchase_orders; buyer businesses; sup businesses; is_party boolean := false; hist jsonb; items jsonb;
begin
  if p_token is null or length(p_token) < 20 then return null; end if;
  select * into l from order_links where token = p_token;
  if l.token is null or l.revoked_at is not null or l.expires_at < now() then return null; end if;
  select * into po from purchase_orders where id = l.po_id;
  if po.id is null then return null; end if;
  select * into buyer from businesses where id = po.buyer_business_id;
  select * into sup from businesses where id = po.supplier_business_id;
  if auth.uid() is not null then
    is_party := exists (select 1 from team_members where auth_user_id = auth.uid() and business_id in (po.buyer_business_id, po.supplier_business_id));
  end if;
  if not is_party then
    update order_links set view_count = view_count + 1, last_viewed_at = now(), first_viewed_at = coalesce(first_viewed_at, now()) where token = p_token;
    if l.first_viewed_at is null and l.kind = 'order' and sup.is_outside then
      update purchase_orders set history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier', 'action', '👀 ' || sup.name || ' opened the order'))
      where id = po.id;
    end if;
  end if;
  if not is_party and po.status = 'quote' and coalesce(l.kind,'order') = 'order' then
    update purchase_orders set quote = coalesce(quote,'{}'::jsonb) || jsonb_build_object('seen_at', now(), 'views', coalesce((quote->>'views')::int, 0) + 1,
      'first_seen_at', coalesce(quote->>'first_seen_at', now()::text)) where id = po.id;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('date', e->>'date', 'actor', e->>'actor', 'action', e->>'action') order by ord), '[]'::jsonb)
    into hist from (select e, ord from jsonb_array_elements(coalesce(po.history, '[]'::jsonb)) with ordinality x(e, ord) order by ord desc limit 12) t;
  -- a delivery partner never sees prices
  items := case when l.kind = 'delivery'
    then (select coalesce(jsonb_agg(jsonb_build_object('product', li->>'product', 'qty', li->'qty')), '[]'::jsonb) from jsonb_array_elements(coalesce(po.line_items,'[]'::jsonb)) li)
    else po.line_items end;
  return jsonb_build_object(
    'kind', l.kind, 'partner_name', l.partner_name,
    'po_number', po.po_number, 'status', po.status, 'type', po.type, 'currency', po.currency,
    'tax_rate', case when l.kind = 'delivery' then null else po.tax_rate end,
    'line_items', items, 'created_date', po.created_date, 'requested_delivery_date', po.requested_delivery_date,
    'delivery_address', po.delivery_address, 'notes', po.notes,
    'buyer_name', buyer.name, 'supplier_name', sup.name, 'supplier_is_outside', sup.is_outside,
    'buyer_contact', case when l.kind = 'delivery' then buyer.shared_contact end,
    'supplier_contact', sup.shared_contact,
    'claim_code', case when sup.is_outside and l.kind = 'order' then sup.claim_code end,
    'buyer_is_outside', buyer.is_outside,
    'buyer_claim_code', case when buyer.is_outside and not sup.is_outside and l.kind = 'order' and not is_party then buyer.claim_code end,
    'store_slug', case when l.kind = 'order' then sup.store_slug end,
    'shipping', case when l.kind = 'delivery' then null else po.shipping end,
    'history', case when l.kind = 'delivery' then '[]'::jsonb else hist end,
    'received', case when coalesce(l.kind,'order') = 'order' and po.delivery_confirmation is not null and po.delivery_confirmation <> 'null'::jsonb then jsonb_build_object('by', po.delivery_confirmation->>'confirmedBy', 'date', po.delivery_confirmation->>'confirmedDate') end,
    'can_confirm_receipt', coalesce(l.kind,'order') = 'order' and buyer.is_outside and not is_party and po.status in ('confirmed','preparing','shipped','in_customs')
      and (po.delivery_confirmation is null or po.delivery_confirmation = 'null'::jsonb),
    'quote', case when coalesce(l.kind,'order') = 'order' and po.quote is not null then jsonb_strip_nulls(jsonb_build_object('hold_until', po.quote->'hold_until', 'allow_edit', coalesce((po.quote->>'allow_edit')::boolean, true),
      'not_now', po.quote->'not_now', 'outcome', po.quote->'outcome', 'changed', po.quote->'changed')) end,
    'can_answer_quote', coalesce(l.kind,'order') = 'order' and buyer.is_outside and not is_party and po.status = 'quote',
    'customer_ref', case when coalesce(l.kind,'order') = 'order' then po.customer_ref end,
    'invoice', case when l.kind = 'order' and po.invoice is not null then jsonb_build_object('number', po.invoice->>'number', 'status', po.invoice->>'status', 'due_date', po.invoice->>'dueDate') end,
    -- Scan to pay: the seller's own payment details (with their GCash/Maya QR) and what's still due.
    'pay', case when coalesce(l.kind,'order') = 'order' and not sup.is_outside
                  and po.status in ('confirmed','preparing','shipped','in_customs','delivered','partially_delivered','invoiced')
                  and jsonb_array_length(coalesce(sup.payment_methods,'[]'::jsonb)) > 0 then
      jsonb_build_object(
        'accounts', (select coalesce(jsonb_agg(a - 'id'), '[]'::jsonb) from jsonb_array_elements(sup.payment_methods) a where coalesce(a->>'type','') <> 'check'),
        'updated_at', sup.payment_methods_updated_at,
        'has_invoice', po.invoice is not null,
        'due', greatest(round(case when po.invoice is not null then public.nifti_open_balance(po.invoice)
                    else public.nifti_po_total(po) - coalesce((select sum((p->>'amount')::numeric) from jsonb_array_elements(coalesce(po.deposit_payments,'[]'::jsonb)) p where coalesce(p->>'confirmStatus','confirmed') <> 'rejected'), 0) end, 2), 0),
        'pending', coalesce((select sum((p->>'amount')::numeric) from jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb) || coalesce(po.deposit_payments,'[]'::jsonb)) p where p->>'confirmStatus' = 'pending'), 0)) end
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.get_statement(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l statement_links; bname text; is_supplier boolean := false;
begin
  if p_token is null or length(p_token) < 20 then return null; end if;
  select * into l from statement_links where token = p_token;
  if l.token is null or l.expires_at < now() then return null; end if;
  if auth.uid() is not null then
    is_supplier := exists (select 1 from team_members where auth_user_id = auth.uid() and business_id = l.supplier_business_id);
  end if;
  if not is_supplier then
    update statement_links set view_count = view_count + 1, first_viewed_at = coalesce(first_viewed_at, now()) where token = p_token;
    if l.first_viewed_at is null then
      select name into bname from businesses where id = l.buyer_business_id;
      perform public.nifti_notify(l.supplier_business_id, '👀 ' || coalesce(bname, 'Your buyer') || ' opened their statement', null, './#dashboard', 'orders');
    end if;
  end if;
  return public.statement_data(l.supplier_business_id, l.buyer_business_id);
end $function$
;

CREATE OR REPLACE FUNCTION public.get_store(p_slug text, p_src text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b businesses; show_prices boolean; today date := (now() at time zone 'Asia/Manila')::date; promos jsonb; is_owner boolean := false; orders90 int;
begin
  select * into b from businesses where store_slug = lower(btrim(coalesce(p_slug,'')));
  if b.id is null or b.is_outside or not public.nifti_listable(b.id) or coalesce((b.store->>'enabled')::boolean, false) = false or b.paused_at is not null then return null; end if;
  if auth.uid() is not null then is_owner := exists (select 1 from team_members where auth_user_id = auth.uid() and business_id = b.id); end if;
  show_prices := case coalesce(b.store->>'price_mode','public') when 'public' then true when 'signup' then auth.uid() is not null else false end;
  promos := case when public.has_feature(b.id, 'store_promos') then coalesce(b.store->'promos', '{}'::jsonb) else '{}'::jsonb end;
  if not is_owner then
    insert into store_events(business_id, kind, src) values (b.id, 'view', left(regexp_replace(coalesce(p_src,''), '[^a-zA-Z0-9_-]', '', 'g'), 20));
  end if;
  select count(*) into orders90 from store_events where business_id = b.id and kind = 'order' and created_at > now() - interval '90 days';
  return jsonb_build_object(
    'id', b.id, 'slug', b.store_slug, 'name', b.name, 'type', b.type, 'is_owner', is_owner,
    'headline', b.store->>'headline', 'about', b.store->>'about', 'category', b.public_profile->>'category', 'location', b.public_profile->>'location',
    'delivery_areas', b.store->>'delivery_areas', 'delivery_days', b.store->>'delivery_days', 'lead_time', b.store->>'lead_time',
    'min_order', (b.store->>'min_order')::numeric, 'price_mode', coalesce(b.store->>'price_mode','public'), 'show_prices', show_prices,
    'cod', coalesce((b.store->>'cod')::boolean, false),
    'phone', case when coalesce((b.store->>'show_phone')::boolean, true) then b.shared_contact->>'phone' end,
    'contact_name', b.shared_contact->>'name',
    'pay_methods', (select coalesce(jsonb_agg(distinct coalesce(case when a->>'type' = 'bank' then a->>'bankName' end, a->>'type')), '[]'::jsonb) from jsonb_array_elements(coalesce(b.payment_methods,'[]'::jsonb)) a),
    'verified', public.business_is_verified(b.id), 'featured_seller', public.business_plan(b.id) = 'business',
    'since', to_char(b.created_at, 'YYYY'),
    'orders_band', case when orders90 >= 50 then '50+' when orders90 >= 20 then '20+' when orders90 >= 5 then '5+' end,
    'featured', coalesce(b.store->'featured', '[]'::jsonb),
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'product', c->>'product', 'unit', c->>'unit', 'moq', c->'moq',
        'price', case when show_prices then (c->>'price')::numeric end,
        'promo_price', case when show_prices and (promos->(c->>'product')->>'until')::date >= today then (promos->(c->>'product')->>'price')::numeric end,
        'promo_until', case when show_prices and (promos->(c->>'product')->>'until')::date >= today then promos->(c->>'product')->>'until' end)
        order by c->>'product'), '[]'::jsonb) from jsonb_array_elements(coalesce(b.catalog,'[]'::jsonb)) c)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.growth_brief_data()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'funnel', public.admin_funnel_data(),
    'target', (select value from app_secrets where name = 'growth_target'),
    'existing_lead_names', (select coalesce(jsonb_agg(name), '[]'::jsonb) from (select name from growth_leads order by id desc limit 5000) x),
    'last_brief', (select jsonb_build_object('body', body, 'created_at', created_at) from growth_briefs order by created_at desc limit 1),
    'site', public.nifti_app_url())
$function$
;

CREATE OR REPLACE FUNCTION public.growth_brief_save(p_brief text, p_leads jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l jsonb; added int := 0; nm text; saved boolean := false; clip text;
begin
  if jsonb_typeof(coalesce(p_leads, '[]'::jsonb)) <> 'array' then raise exception 'leads must be a JSON array'; end if;
  for l in select value from jsonb_array_elements(coalesce(p_leads, '[]'::jsonb)) limit 10 loop
    nm := nullif(left(btrim(regexp_replace(coalesce(l->>'name',''), '[<>]', '', 'g')), 150), '');
    continue when nm is null;
    continue when exists (select 1 from growth_leads where lower(name) = lower(nm));
    insert into growth_leads(name, kind, category, area, source_url, contact, why, opener)
    values (nm, case when l->>'kind' = 'buyer' then 'buyer' else 'supplier' end,
      nullif(left(btrim(regexp_replace(coalesce(l->>'category',''), '[<>]', '', 'g')), 100), ''),
      nullif(left(btrim(regexp_replace(coalesce(l->>'area',''), '[<>]', '', 'g')), 100), ''),
      case when coalesce(l->>'source_url','') ~ '^https?://' then left(l->>'source_url', 400) end,
      nullif(left(btrim(regexp_replace(coalesce(l->>'contact',''), '[<>]', '', 'g')), 200), ''),
      nullif(left(btrim(regexp_replace(coalesce(l->>'why',''), '[<>]', '', 'g')), 300), ''),
      nullif(left(btrim(regexp_replace(coalesce(l->>'opener',''), '[<>]', '', 'g')), 400), ''));
    added := added + 1;
  end loop;
  clip := nullif(left(btrim(regexp_replace(coalesce(p_brief,''), '[<>]', '', 'g')), 6000), '');
  if clip is not null then insert into growth_briefs(body) values (clip); saved := true; end if;
  return jsonb_build_object('ok', true, 'leads_added', added, 'brief_saved', saved);
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_banned_writes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then return new; end if;
  if tg_table_name = 'purchase_orders' then
    if exists (select 1 from businesses where id in (new.buyer_business_id, new.supplier_business_id) and banned_at is not null) then raise exception 'This business is suspended on Nifti.'; end if;
  elsif tg_table_name = 'conversation_messages' then
    if exists (select 1 from businesses where id = new.sender_business_id and banned_at is not null) then raise exception 'This business is suspended on Nifti.'; end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_business_payment_methods()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e jsonb; qr text;
begin
  if tg_op = 'INSERT' then
    if new.payment_methods = '[]'::jsonb then new.payment_methods_updated_at := null; return new; end if;
  elsif new.payment_methods is not distinct from old.payment_methods then
    -- the timestamp is server-owned: it can't be edited on its own to hide a recent change
    new.payment_methods_updated_at := old.payment_methods_updated_at;
    return new;
  end if;
  if auth.uid() is not null and not public.is_business_admin(new.id) and not public.is_platform_admin() then
    raise exception 'Only an Owner or General Manager can change where buyers send payments.' using errcode = '42501';
  end if;
  for e in select value from jsonb_array_elements(new.payment_methods) loop
    if jsonb_typeof(e) <> 'object' then raise exception 'Invalid payment method entry'; end if;
    if coalesce(e->>'type','') not in ('gcash','maya','grabpay','shopeepay','bank','remittance','check') then
      raise exception 'Unknown payment method type: %', e->>'type';
    end if;
    qr := e->>'qr';
    if qr is not null and qr !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' then
      raise exception 'QR code must be a PNG, JPEG or WebP image';
    end if;
    if length(coalesce(e->>'accountName','')) > 120 or length(coalesce(e->>'accountNumber','')) > 64
       or length(coalesce(e->>'bankName','')) > 80 or length(coalesce(e->>'notes','')) > 300 then
      raise exception 'Payment detail text is too long';
    end if;
  end loop;
  new.payment_methods_updated_at := now();
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_business_public()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (new.catalog_public is distinct from old.catalog_public or new.public_profile is distinct from old.public_profile)
     and auth.uid() is not null and not public.is_business_admin(new.id) and not public.is_platform_admin() then
    raise exception 'Only an Owner or General Manager can change your public profile.';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_business_verified()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if current_user in ('authenticated','anon') and not public.is_platform_admin()
     and (new.verified_at is distinct from old.verified_at or new.verified_until is distinct from old.verified_until) then
    raise exception 'The Verified badge is given by Nifti after checking your papers.';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_credit_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare rel business_relationships; ex record; this_total numeric; reason text; sup_name text; over numeric;
begin
  if new.status <> 'sent' or (tg_op = 'UPDATE' and old.status = 'sent') then return new; end if;
  select * into rel from business_relationships where buyer_business_id = new.buyer_business_id and supplier_business_id = new.supplier_business_id;
  new.credit_flag := null;
  if rel.id is null or (rel.credit_limit is null and rel.credit_hold_days is null) then return new; end if;
  if not public.has_feature(new.supplier_business_id, 'credit_limits') then return new; end if;
  select * into ex from public.credit_exposure(new.buyer_business_id, new.supplier_business_id, new.id);
  this_total := coalesce((select sum(nullif(li->>'qty','')::numeric * nullif(li->>'unitPrice','')::numeric) from jsonb_array_elements(coalesce(new.line_items,'[]'::jsonb)) li), 0) * (1 + coalesce(new.tax_rate,0));
  select name into sup_name from businesses where id = new.supplier_business_id;
  if rel.credit_hold_days is not null and ex.max_days_late > rel.credit_hold_days then
    reason := 'An invoice is ' || ex.max_days_late || ' days late (limit ' || rel.credit_hold_days || ' days).';
  elsif rel.credit_limit is not null and ex.owed + ex.open_orders + this_total > rel.credit_limit then
    over := ex.owed + ex.open_orders + this_total - rel.credit_limit;
    reason := 'This order would bring the balance to ₱' || to_char(ex.owed + ex.open_orders + this_total, 'FM999,999,999') || ', ₱' || to_char(over, 'FM999,999,999') || ' over the ₱' || to_char(rel.credit_limit, 'FM999,999,999') || ' credit limit.';
  end if;
  if reason is null then return new; end if;
  if rel.credit_mode = 'block' then
    raise exception '% has put new orders on hold. % Pay what''s due or ask them to raise your limit.', sup_name, reason;
  end if;
  new.credit_flag := jsonb_build_object('reason', reason, 'owed', ex.owed, 'open_orders', ex.open_orders, 'limit', rel.credit_limit, 'days_late', ex.max_days_late, 'hold_days', rel.credit_hold_days, 'this_order', round(this_total, 2));
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_paused_orders()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare paused_name text;
begin
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status is distinct from 'sent') then
    select name into paused_name from businesses where id in (new.buyer_business_id, new.supplier_business_id) and paused_at is not null limit 1;
    if paused_name is not null then raise exception '% has paused new orders on Nifti.', paused_name; end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_po_payments()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare guarded jsonb;
begin
  if auth.uid() is null then return new; end if; -- service role / dashboard maintenance
  if tg_op = 'INSERT' then
    -- supabase-js upsert = INSERT .. ON CONFLICT DO UPDATE: for an existing row the BEFORE UPDATE
    -- pass below does the real check, and touching NEW here would corrupt what it compares.
    if exists(select 1 from public.purchase_orders where id = new.id) then return new; end if;
    if new.supplier_business_id in (select public.my_business_ids()) then return new; end if;
    if new.status = 'paid' then new.status := 'invoiced'; end if;
    new.cod_payment := null;
    if new.deposit_payments is not null then
      new.deposit_payments := public.nifti_guard_payment_list('[]'::jsonb, new.deposit_payments);
    end if;
    if new.invoice is not null then
      new.invoice := new.invoice || jsonb_build_object('status', 'unpaid',
        'payments', public.nifti_guard_payment_list('[]'::jsonb, new.invoice->'payments'));
    end if;
    return new;
  end if;

  -- UPDATE
  if old.status <> 'draft' then
    new.buyer_business_id := old.buyer_business_id;
    new.supplier_business_id := old.supplier_business_id;
  end if;
  if old.supplier_business_id in (select public.my_business_ids()) then return new; end if;

  -- From here on the writer is the buyer side.
  if old.status = 'paid' then new.status := 'paid';
  elsif new.status = 'paid' then new.status := old.status;
  end if;
  new.cod_payment := old.cod_payment;
  new.deposit_required := old.deposit_required;
  if old.deposit_payments is not null or new.deposit_payments is not null then
    new.deposit_payments := public.nifti_guard_payment_list(old.deposit_payments, new.deposit_payments);
  end if;
  if old.invoice is null then
    new.invoice := null; -- only the supplier issues invoices
  else
    guarded := public.nifti_guard_payment_list(old.invoice->'payments', new.invoice->'payments');
    new.invoice := old.invoice || jsonb_build_object('payments', guarded); -- every other invoice field is supplier-owned
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_spending_caps()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare actor team_members; caps jsonb; total numeric; k text; cap jsonb; spent numeric; lim numeric; lbl text; mon date := date_trunc('month', public.nifti_today())::date; ins int; checks jsonb := '[]'::jsonb; c jsonb;
begin
  if new.status <> 'sent' or (tg_op = 'UPDATE' and old.status = 'sent') then return new; end if;
  if auth.uid() is null then return new; end if;
  select * into actor from team_members where auth_user_id = auth.uid() and business_id = new.buyer_business_id and status = 'active' limit 1;
  if actor.id is null then return new; end if;
  if new.placed_by_member is null then new.placed_by_member := actor.id; end if;
  if not public.has_feature(new.buyer_business_id, 'spending_caps') then return new; end if;
  select spending_caps into caps from business_settings where business_id = new.buyer_business_id;
  if caps is null then return new; end if;
  total := public.nifti_po_total(new);
  if (caps->'business'->>'amount')::numeric > 0 then checks := checks || jsonb_build_object('key','business','cap',caps->'business','member',null,'supplier',null,'label','the whole business'); end if;
  if (caps->'members'->(actor.id::text)->>'amount')::numeric > 0 then checks := checks || jsonb_build_object('key','m:'||actor.id,'cap',caps->'members'->(actor.id::text),'member',actor.id,'supplier',null,'label', actor.name); end if;
  if (caps->'suppliers'->(new.supplier_business_id::text)->>'amount')::numeric > 0 then
    checks := checks || jsonb_build_object('key','s:'||new.supplier_business_id,'cap',caps->'suppliers'->(new.supplier_business_id::text),'member',null,'supplier',new.supplier_business_id,'label',(select name from businesses where id = new.supplier_business_id)); end if;
  for c in select value from jsonb_array_elements(checks) loop
    lim := (c->'cap'->>'amount')::numeric;
    spent := public.nifti_month_spend(new.buyer_business_id, nullif(c->>'member','')::uuid, nullif(c->>'supplier','')::uuid, new.id);
    lbl := c->>'label';
    if spent + total > lim then
      if coalesce(c->'cap'->>'mode','warn') = 'block' and not (actor.roles && array['Owner']) then
        raise exception 'Monthly spending cap reached for %: % of % used this month. Ask the Owner to raise the cap or send this order.', lbl, public.nifti_peso(spent), public.nifti_peso(lim);
      end if;
      insert into cap_alert_log values (new.buyer_business_id, mon, c->>'key', 100) on conflict do nothing; get diagnostics ins = row_count;
      if ins > 0 then
        perform public.nifti_notify(new.buyer_business_id, '🔴 Over the monthly cap: ' || lbl, public.nifti_peso(spent + total) || ' of ' || public.nifti_peso(lim) || ' after ' || new.po_number || ' by ' || actor.name || '.', './#watchdog', 'orders', null, actor.id);
      end if;
    elsif spent + total >= lim * 0.8 then
      insert into cap_alert_log values (new.buyer_business_id, mon, c->>'key', 80) on conflict do nothing; get diagnostics ins = row_count;
      if ins > 0 then
        perform public.nifti_notify(new.buyer_business_id, '🟠 80% of the monthly cap used: ' || lbl, public.nifti_peso(spent + total) || ' of ' || public.nifti_peso(lim) || ' so far this month.', './#watchdog', 'orders');
      end if;
    end if;
  end loop;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_subscription_plan()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if current_user in ('authenticated', 'anon') and not public.is_platform_admin() then
    if tg_op = 'INSERT' then
      new.plan_id := 'free'; new.status := 'active'; new.paid_until := null; new.plan_note := null;
    elsif new.plan_id is distinct from old.plan_id or new.status is distinct from old.status
       or new.paid_until is distinct from old.paid_until or new.plan_note is distinct from old.plan_note
       or new.billing_history is distinct from old.billing_history then
      raise exception 'Plans are changed by Nifti after payment. Use Upgrade in Settings.';
    end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_team_seats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare lim int; used int; pl text;
begin
  if public.nifti_pilot_free() or new.status not in ('active','invited') then return new; end if;
  if tg_op = 'UPDATE' and old.status in ('active','invited') then return new; end if;
  pl := public.business_plan(new.business_id);
  lim := public.plan_seat_limit(pl);
  select count(*) into used from team_members where business_id = new.business_id and status in ('active','invited') and id <> new.id;
  if used >= lim then
    raise exception 'Your plan includes % teammates. %', lim, case when pl = 'business' then 'Message us from Help if you need more.' when pl = 'free' then 'Pro gives you up to 15, Business up to 50.' else 'Business gives you up to 50.' end;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_team_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.assigned_to is not null and not exists (select 1 from team_members where id = new.assigned_to and business_id = new.business_id) then
    raise exception 'That teammate is not part of this business.';
  end if;
  if tg_op = 'UPDATE' then
    new.business_id := old.business_id;
    new.created_by := old.created_by;
    new.created_by_name := old.created_by_name;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  new_business_id uuid;
  meta jsonb := new.raw_user_meta_data;
  invite_id uuid;
  biz_invite record;
  new_biz_type text;
  claim_biz businesses;
  inviter_type text;
begin
  select id into invite_id from team_members
    where lower(email) = lower(new.email) and status = 'invited' and auth_user_id is null
    order by created_at asc limit 1;
  if invite_id is not null then
    update team_members set auth_user_id = new.id, status = 'active' where id = invite_id;
    return new;
  end if;

  if coalesce(meta->>'claim_code', '') <> '' then
    select * into claim_biz from businesses where claim_code = meta->>'claim_code' and is_outside limit 1;
    if claim_biz.id is not null then
      update businesses set is_outside = false, claim_code = null, type = 'both',
        name = coalesce(nullif(btrim(meta->>'business_name'), ''), name)
        where id = claim_biz.id;
      insert into team_members (business_id, name, email, roles, auth_user_id, status)
        values (claim_biz.id, coalesce(meta->>'full_name', split_part(new.email,'@',1)), new.email, array['Owner'], new.id, 'active');
      insert into business_settings (business_id) select claim_biz.id where not exists (select 1 from business_settings where business_id = claim_biz.id);
      insert into notification_settings (business_id) select claim_biz.id where not exists (select 1 from notification_settings where business_id = claim_biz.id);
      insert into tax_profiles (business_id, business_name) select claim_biz.id, coalesce(nullif(btrim(meta->>'business_name'), ''), claim_biz.name) where not exists (select 1 from tax_profiles where business_id = claim_biz.id);
      insert into subscriptions (business_id) select claim_biz.id where not exists (select 1 from subscriptions where business_id = claim_biz.id);
      insert into referrals (business_id) select claim_biz.id where not exists (select 1 from referrals where business_id = claim_biz.id);
      if claim_biz.created_by_business is not null then
        if claim_biz.type = 'buyer' then
          insert into conversations (buyer_business_id, supplier_business_id) values (claim_biz.id, claim_biz.created_by_business) on conflict do nothing;
        else
          insert into conversations (buyer_business_id, supplier_business_id) values (claim_biz.created_by_business, claim_biz.id) on conflict do nothing;
        end if;
      end if;
      return new;
    end if;
  end if;

  new_biz_type := 'both';
  insert into businesses (name, type, public_profile) values (coalesce(meta->>'business_name', 'New Business'), new_biz_type,
    case when coalesce(meta->>'business_kind', '') ~ '^(store|restaurant|distributor|maker|services|other)$' then jsonb_build_object('kind', meta->>'business_kind') else '{}'::jsonb end) returning id into new_business_id;
  insert into team_members (business_id, name, email, roles, auth_user_id, status)
  values (new_business_id, coalesce(meta->>'full_name', split_part(new.email,'@',1)), new.email, array['Owner'], new.id, 'active');
  insert into business_settings (business_id) values (new_business_id);
  insert into notification_settings (business_id) values (new_business_id);
  insert into tax_profiles (business_id, business_name) values (new_business_id, meta->>'business_name');
  insert into subscriptions (business_id) values (new_business_id);
  insert into referrals (business_id) values (new_business_id);

  select * into biz_invite from business_invites
    where lower(invited_email) = lower(new.email) and status = 'pending'
    order by created_at asc limit 1;
  if biz_invite.id is not null then
    update business_invites set status = 'accepted', accepted_at = now() where id = biz_invite.id;
    select type into inviter_type from businesses where id = biz_invite.inviting_business_id;
    -- invited_as: what the new business is to the inviter. Old invites fall back to the inviter's old type.
    if coalesce(biz_invite.invited_as, case when inviter_type = 'supplier' then 'buyer' else 'supplier' end) = 'supplier' then
      insert into business_relationships (buyer_business_id, supplier_business_id) values (biz_invite.inviting_business_id, new_business_id) on conflict do nothing;
      insert into conversations (buyer_business_id, supplier_business_id) values (biz_invite.inviting_business_id, new_business_id) on conflict do nothing;
    else
      insert into business_relationships (buyer_business_id, supplier_business_id) values (new_business_id, biz_invite.inviting_business_id) on conflict do nothing;
      insert into conversations (buyer_business_id, supplier_business_id) values (new_business_id, biz_invite.inviting_business_id) on conflict do nothing;
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_feature(p_business uuid, p_feature text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.nifti_pilot_free() or p_feature = any(public.plan_features(public.business_plan(p_business)))
$function$
;

CREATE OR REPLACE FUNCTION public.incoming_connection_requests()
 RETURNS TABLE(id uuid, from_business uuid, from_name text, from_type text, profile jsonb, note text, status text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select cr.id, cr.from_business, b.name, b.type, b.public_profile, cr.note, cr.status, cr.created_at
  from connection_requests cr join businesses b on b.id = cr.from_business
  where cr.to_business = public.nifti_my_business()
  order by cr.created_at desc limit 50
$function$
;

CREATE OR REPLACE FUNCTION public.incoming_price_changes()
 RETURNS TABLE(id uuid, supplier_id uuid, supplier_name text, product text, unit text, old_price numeric, new_price numeric, effective_date date, applied boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select pc.id, pc.business_id, b.name, pc.product, pc.unit, pc.old_price, pc.new_price, pc.effective_date, pc.applied_at is not null
  from price_changes pc join businesses b on b.id = pc.business_id
  where pc.cancelled_at is null and pc.effective_date >= public.nifti_today() - 14
    and exists (select 1 from business_relationships br where br.supplier_business_id = pc.business_id and br.buyer_business_id = public.nifti_my_business())
  order by pc.effective_date desc, b.name limit 100 $function$
;

CREATE OR REPLACE FUNCTION public.increment_conversation_unread(p_conversation_id uuid, p_target text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if p_target = 'buyer' then
    update conversations set buyer_unread_count = buyer_unread_count + 1 where id = p_conversation_id;
  elsif p_target = 'supplier' then
    update conversations set supplier_unread_count = supplier_unread_count + 1 where id = p_conversation_id;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.inventory_log_move()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare lm jsonb := coalesce(new.meta->'last_move', '{}'::jsonb); k text; fresh boolean;
begin
  -- a label counts only when this very write set it (a later hand edit doesn't inherit the last label)
  fresh := (lm ? 'at') and (lm->>'at') ~ '^\d{4}-' and (lm->>'at')::timestamptz > now() - interval '5 minutes'
           and (tg_op = 'INSERT' or (new.meta->'last_move') is distinct from (old.meta->'last_move'));
  k := case when fresh and coalesce(lm->>'kind','') in ('opening','received','sold','delivered','bad','count','adjust','returned_in','returned_out','used','transfer') then lm->>'kind' end;
  if tg_op = 'INSERT' then
    if coalesce(new.on_hand, 0) <> 0 then
      insert into stock_moves(business_id, item_id, item_name, qty, kind, unit_cost, reason, ref, created_by, created_by_name)
        values (new.business_id, new.id, new.name, new.on_hand, coalesce(k, 'opening'), new.unit_cost,
          case when fresh then left(lm->>'reason', 200) else 'Starting stock' end, case when fresh then left(lm->>'ref', 80) end,
          public.nifti_me_member(new.business_id), public.nifti_member_name(new.business_id));
    end if;
  elsif coalesce(new.on_hand, 0) is distinct from coalesce(old.on_hand, 0) then
    insert into stock_moves(business_id, item_id, item_name, qty, kind, unit_cost, reason, ref, photo_path, created_by, created_by_name)
      values (new.business_id, new.id, new.name, coalesce(new.on_hand,0) - coalesce(old.on_hand,0), coalesce(k, 'adjust'), coalesce(new.unit_cost, old.unit_cost),
        case when fresh then left(lm->>'reason', 200) else 'Changed by hand' end, case when fresh then left(lm->>'ref', 80) end,
        case when fresh then left(lm->>'photo', 300) end,
        public.nifti_me_member(new.business_id), public.nifti_member_name(new.business_id));
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.is_business_admin(biz_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(
    select 1 from team_members
    where business_id = biz_id and auth_user_id = auth.uid() and roles && array['Owner','General Manager']
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(lower(auth.jwt()->>'email') = lower((select value from app_secrets where name = 'platform_admin_email')), false)
$function$
;

CREATE OR REPLACE FUNCTION public.issue_credit_memo(p_buyer uuid, p_amount numeric, p_source_po uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); who text; num text; m credit_memos;
begin
  if me is null or not public.nifti_has_role(me, array['Owner','General Manager','Finance']) then raise exception 'Only an Owner, General Manager or Finance can issue credits.'; end if;
  if coalesce(p_amount, 0) <= 0 then raise exception 'Enter the credit amount.'; end if;
  if not exists (select 1 from business_relationships where supplier_business_id = me and buyer_business_id = p_buyer)
     and not exists (select 1 from purchase_orders where supplier_business_id = me and buyer_business_id = p_buyer) then raise exception 'That buyer isn''t one of yours.'; end if;
  if p_source_po is not null and not exists (select 1 from purchase_orders where id = p_source_po and supplier_business_id = me and buyer_business_id = p_buyer) then raise exception 'Order not found.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  num := 'CM-' || lpad((select count(*) + 1 from credit_memos where supplier_business_id = me)::text, 5, '0');
  insert into credit_memos(supplier_business_id, buyer_business_id, number, amount, remaining, source_po_id, reason, created_by_name)
    values (me, p_buyer, num, round(p_amount, 2), round(p_amount, 2), p_source_po, left(p_reason, 300), who) returning * into m;
  perform public.nifti_notify(p_buyer, '💳 ' || (select name from businesses where id = me) || ' gave you a ' || public.nifti_peso(m.amount) || ' credit',
    num || coalesce(' · ' || left(p_reason, 100), '') || '. It comes off your next invoice.', './#returns', 'orders');
  return to_jsonb(m);
end $function$
;

CREATE OR REPLACE FUNCTION public.issue_decisions_stamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.decided_by_name := public.nifti_member_name(new.business_id); new.updated_at := now();
  new.history := (coalesce(case when tg_op = 'UPDATE' then old.history end, '[]'::jsonb)
    || jsonb_build_array(jsonb_build_object('status', new.status, 'by', new.decided_by_name, 'at', now(), 'note', new.note, 'to', new.assigned_to)));
  if jsonb_array_length(new.history) > 40 then new.history := new.history - 0; end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.jl(a text, amt numeric, side text, party text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when round(coalesce(amt, 0), 2) = 0 then null
    when (side = 'd') = (amt > 0) then jsonb_build_object('a', a, 'd', round(abs(amt), 2), 'c', 0, 'p', party)
    else jsonb_build_object('a', a, 'd', 0, 'c', round(abs(amt), 2), 'p', party) end
$function$
;

CREATE OR REPLACE FUNCTION public.jls(VARIADIC x jsonb[])
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select coalesce(jsonb_agg(v), '[]'::jsonb) from unnest(x) v where v is not null
$function$
;

CREATE OR REPLACE FUNCTION public.journal_immutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'DELETE' then raise exception 'Posted entries are never deleted. Reverse them instead.'; end if;
  if tg_table_name = 'journal_lines' then raise exception 'Posted lines are never changed. Reverse the entry instead.'; end if;
  if new.entry_date <> old.entry_date or new.business_id <> old.business_id or new.kind <> old.kind or coalesce(new.source_hash,'') <> coalesce(old.source_hash,'') then
    raise exception 'Posted entries are never changed. Reverse them instead.';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.ledger_accounts_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'UPDATE' and old.is_system and (new.code <> old.code or new.type <> old.type or not new.active or not new.is_system) then
    raise exception 'Built-in accounts can be renamed, but not changed or switched off.';
  end if;
  if tg_op = 'INSERT' then new.is_system := false; end if;
  new.business_id := coalesce(old.business_id, new.business_id);
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.ledger_acct_category(c text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case c
    when 'Electricity' then '6010' when 'Water' then '6020' when 'Internet & phone' then '6030' when 'Gas (LPG)' then '6040'
    when 'Rent' then '6100' when 'Salaries' then '6200' when 'Staff advance (vale)' then '1150' when 'Stock bought in cash' then '5000'
    when 'Fuel & transport' then '6300' when 'Delivery & shipping' then '6310' when 'Supplies' then '6400' when 'Repairs' then '6500'
    when 'Food & meals' then '6600' when 'Taxes & permits' then '6700' when 'Bank & GCash fees' then '6800' when 'Marketing' then '6900'
    when 'Owner took money' then '3100' when 'Cash to bank' then '1020' when 'Owner put in cash' then '1000'
    else '6990' end
$function$
;

CREATE OR REPLACE FUNCTION public.ledger_acct_method(m text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case lower(coalesce(m, ''))
    when 'cash' then '1000' when 'gcash' then '1010' when 'maya' then '1010' when 'grabpay' then '1010' when 'shopeepay' then '1010'
    when 'credit_note' then '4020' when 'ewt' then '1410'
    else '1020' end
$function$
;

CREATE OR REPLACE FUNCTION public.ledger_acct_paid_from(m text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case lower(coalesce(m, ''))
    when 'cash' then '1000' when 'gcash' then '1010' when 'maya' then '1010' when 'bank' then '1020'
    when 'card' then '2060' when 'owner' then '3000' when 'credit' then '2050' else '1000' end
$function$
;

CREATE OR REPLACE FUNCTION public.ledger_expected(p_business uuid)
 RETURNS TABLE(source_type text, source_id text, entry_date date, memo text, branch text, sticky boolean, lines jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with
  -- counter sales: money received that day (or utang), and the cost of what left the shelf
  s as (select * from downstream_sales where business_id = p_business and voided_at is null),
  s_pay as (select s.id, s.sale_date, p.value p, p.ordinality i from s, jsonb_array_elements(coalesce(s.payments, '[]'::jsonb)) with ordinality p),
  sale as (
    select 'sale'::text st, s.id::text sid, s.sale_date d, 'Counter sale' || case when coalesce(s.customer_name, 'Walk-in') <> 'Walk-in' then ' · ' || s.customer_name else '' end m, s.branch b, false sticky,
      public.jls(variadic array(
        select public.jl(public.ledger_acct_method(x.p->>'method'), sum((x.p->>'amount')::numeric), 'd') from s_pay x
          where x.id = s.id and coalesce(nullif(left(x.p->>'date', 10), ''), s.sale_date::text) = s.sale_date::text group by public.ledger_acct_method(x.p->>'method')
        union all select public.jl('1100', s.total - coalesce((select sum((x.p->>'amount')::numeric) from s_pay x where x.id = s.id and coalesce(nullif(left(x.p->>'date', 10), ''), s.sale_date::text) = s.sale_date::text), 0), 'd', coalesce(s.customer_name, 'Walk-in'))
        union all select public.jl('4000', s.total, 'c')
        union all select public.jl('5000', c.cost, 'd') from (select coalesce(sum((li->>'qty')::numeric * (li->>'unitCost')::numeric) filter (where coalesce((li->>'totalOnly')::boolean, false) = false and coalesce((li->>'unitCost')::numeric, 0) > 0), 0) cost from jsonb_array_elements(s.line_items) li) c
        union all select public.jl('1200', c.cost, 'c') from (select coalesce(sum((li->>'qty')::numeric * (li->>'unitCost')::numeric) filter (where coalesce((li->>'totalOnly')::boolean, false) = false and coalesce((li->>'unitCost')::numeric, 0) > 0), 0) cost from jsonb_array_elements(s.line_items) li) c
      )) l
    from s),
  sale_later as (
    select 'sale_pay', x.id::text || ':' || x.i, nullif(left(x.p->>'date', 10), '')::date, 'Utang paid', s.branch, false,
      public.jls(public.jl(public.ledger_acct_method(x.p->>'method'), (x.p->>'amount')::numeric, 'd'), public.jl('1100', (x.p->>'amount')::numeric, 'c', coalesce(s.customer_name, 'Walk-in')))
    from s_pay x join s on s.id = x.id where coalesce(nullif(left(x.p->>'date', 10), ''), s.sale_date::text) <> s.sale_date::text),
  -- expenses (approved ones only; removed ones get reversed)
  ex as (
    select 'expense', e.id::text, e.spent_on, e.category || coalesce(' · ' || coalesce(e.staff_name, e.vendor), ''), e.branch, false,
      case when e.category = 'Owner put in cash' then public.jls(public.jl('1000', e.amount, 'd'), public.jl('3000', e.amount, 'c'))
           else public.jls(public.jl(public.ledger_acct_category(e.category), e.amount, 'd', coalesce(e.staff_name, e.vendor)), public.jl(public.ledger_acct_paid_from(e.paid_from), e.amount, 'c')) end
    from expenses e where e.business_id = p_business and e.deleted_at is null and e.status = 'approved'),
  -- orders: sales to customers and bills from suppliers
  po as (select o.*, case when o.supplier_business_id = p_business then 'sell' else 'buy' end side,
           coalesce((o.invoice->>'statedTotal')::numeric, public.nifti_po_total(o)) tot,
           coalesce(public.nifti_iso_date(o.invoice->>'issuedDate'), o.created_date) inv_date,
           coalesce((o.invoice->>'opening')::boolean, false) opening,
           (select name from businesses where id = case when o.supplier_business_id = p_business then o.buyer_business_id else o.supplier_business_id end) party
         from purchase_orders o where p_business in (o.supplier_business_id, o.buyer_business_id) and o.status not in ('draft','cancelled')),
  inv as (
    select case when side = 'sell' then 'po_sale' else 'po_bill' end, po.id::text, po.inv_date,
      case when side = 'sell' then 'Invoice ' else 'Supplier bill ' end || coalesce(po.invoice->>'number', po.po_number) || ' · ' || coalesce(po.party, ''), null::text, false,
      case when po.opening and side = 'sell' then public.jls(public.jl('1100', po.tot, 'd', po.party), public.jl('3900', po.tot, 'c'))
           when po.opening then public.jls(public.jl('3900', po.tot, 'd'), public.jl('2000', po.tot, 'c', po.party))
           when side = 'sell' then public.jls(public.jl('1100', po.tot, 'd', po.party),
                public.jl('4010', po.tot - round(po.tot * coalesce(po.tax_rate, 0) / (1 + coalesce(po.tax_rate, 0)), 2), 'c'),
                public.jl('2100', round(po.tot * coalesce(po.tax_rate, 0) / (1 + coalesce(po.tax_rate, 0)), 2), 'c'))
           else public.jls(public.jl('1200', po.tot - round(po.tot * coalesce(po.tax_rate, 0) / (1 + coalesce(po.tax_rate, 0)), 2), 'd'),
                public.jl('1400', round(po.tot * coalesce(po.tax_rate, 0) / (1 + coalesce(po.tax_rate, 0)), 2), 'd'),
                public.jl('2000', po.tot, 'c', po.party)) end
    from po where po.invoice is not null),
  cogs as (
    select 'po_cogs', po.id::text, po.inv_date, 'Cost of order ' || po.po_number, null::text, true,
      public.jls(public.jl('5000', c.cost, 'd'), public.jl('1200', c.cost, 'c'))
    from po, lateral (select coalesce(sum((li->>'qty')::numeric * coalesce(nullif((li->>'unitCost')::numeric, 0),
          (select i.unit_cost from inventory_items i where i.business_id = p_business and lower(i.name) = lower(li->>'product') and i.unit_cost > 0 limit 1), 0)), 0) cost
        from jsonb_array_elements(coalesce(po.line_items, '[]'::jsonb)) li) c
    where po.side = 'sell' and po.invoice is not null and not po.opening),
  pays as (
    select po.*, p.value p, 'inv:' || coalesce(p.value->>'id', p.ordinality::text) k from po, jsonb_array_elements(coalesce(po.invoice->'payments', '[]'::jsonb)) with ordinality p
    union all
    select po.*, p.value, 'dep:' || coalesce(p.value->>'id', p.ordinality::text) from po, jsonb_array_elements(coalesce(po.deposit_payments, '[]'::jsonb)) with ordinality p
      where not exists (select 1 from jsonb_array_elements(coalesce(po.invoice->'payments', '[]'::jsonb)) q where q->>'id' is not null and q->>'id' = p.value->>'id')
    union all
    select po.*, po.cod_payment, 'cod' from po where jsonb_typeof(po.cod_payment) = 'object'),
  pay as (
    select case when side = 'sell' then 'po_pay' else 'po_bill_pay' end, pays.id::text || ':' || pays.k,
      coalesce(public.nifti_iso_date(pays.p->>'date'), pays.created_date), 'Payment · ' || coalesce(pays.party, '') || ' · ' || pays.po_number, null::text, false,
      case when side = 'sell' then public.jls(public.jl(public.ledger_acct_method(pays.p->>'method'), (pays.p->>'amount')::numeric, 'd'), public.jl('1100', (pays.p->>'amount')::numeric, 'c', pays.party))
           else public.jls(public.jl('2000', (pays.p->>'amount')::numeric, 'd', pays.party),
                  public.jl(case when lower(pays.p->>'method') = 'credit_note' then '1200' when lower(pays.p->>'method') = 'ewt' then '2100' else public.ledger_acct_method(pays.p->>'method') end, (pays.p->>'amount')::numeric, 'c')) end
    from pays
    where coalesce((pays.p->>'amount')::numeric, 0) > 0
      and case when side = 'sell'
        then coalesce(pays.p->>'confirmStatus', 'confirmed') = 'confirmed' and not (pays.p->>'method' = 'check' and coalesce(pays.p->>'checkStatus', '') <> 'cleared')
        else coalesce(pays.p->>'confirmStatus', '') <> 'rejected' end),
  -- stock that left without a sale: bad, missing, used, changed by hand; and the starting stock
  stk as (
    select 'stock', m.id::text, m.moved_on, case m.kind when 'opening' then 'Starting stock' when 'bad' then 'Bad stock' when 'count' then 'Count difference' when 'used' then 'Used in the store' else 'Stock changed by hand' end || ' · ' || m.item_name, null::text, false,
      case m.kind
        when 'opening' then public.jls(public.jl('1200', m.qty * m.unit_cost, 'd'), public.jl('3900', m.qty * m.unit_cost, 'c'))
        when 'used' then public.jls(public.jl('6400', -m.qty * m.unit_cost, 'd'), public.jl('1200', -m.qty * m.unit_cost, 'c'))
        else public.jls(public.jl(case when m.kind = 'adjust' then '5110' else '5100' end, -m.qty * m.unit_cost, 'd'), public.jl('1200', -m.qty * m.unit_cost, 'c')) end
    from stock_moves m where m.business_id = p_business and m.kind in ('opening','bad','count','adjust','used') and coalesce(m.unit_cost, 0) > 0 and m.qty <> 0),
  cc as (
    select 'cash_count', c.id::text, c.count_day, 'Cash count · ' || c.drawer || ' drawer', c.drawer, false,
      case when c.difference < 0 then public.jls(public.jl('6960', -c.difference, 'd'), public.jl('1000', -c.difference, 'c'))
           else public.jls(public.jl('1000', c.difference, 'd'), public.jl('4900', c.difference, 'c')) end
    from cash_counts c where c.business_id = p_business and c.reopened_at is null and abs(c.difference) >= 0.01),
  dep as (
    select 'deposit', d.id::text, d.deposited_on, 'Cash to bank' || coalesce(' · ' || d.bank, ''), d.branch, false,
      public.jls(public.jl('1020', d.amount, 'd'), public.jl('1000', d.amount, 'c'))
    from cash_deposits d where d.business_id = p_business),
  pr as (
    select 'payroll', r.id::text, r.paid_on, 'Payroll ' || to_char(r.period_from, 'Mon DD') || '–' || to_char(r.period_to, 'Mon DD'), r.branch, false,
      public.jls(public.jl('6200', sum(l.gross), 'd'), public.jl('6210', sum(l.contrib_employer), 'd'),
        public.jl('1150', sum(l.vale_deduct), 'c'), public.jl('2300', sum(l.contrib_employee) + sum(l.contrib_employer), 'c'),
        public.jl('2310', sum(l.other_deduct), 'c'), public.jl(public.ledger_acct_paid_from(r.paid_from), sum(l.net), 'c'))
    from payroll_runs r join payroll_lines l on l.run_id = r.id where r.business_id = p_business and r.status = 'paid'
    group by r.id)
  select * from sale union all select * from sale_later union all select * from ex union all select * from inv union all select * from cogs
  union all select * from pay union all select * from stk union all select * from cc union all select * from dep union all select * from pr
$function$
;

CREATE OR REPLACE FUNCTION public.ledger_open_date(p_business uuid, p_day date)
 RETURNS date
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare d date := p_day;
begin
  for i in 1..60 loop
    if not public.nifti_month_locked(p_business, d) then return d; end if;
    d := (date_trunc('month', d) + interval '1 month')::date;
  end loop;
  return d;
end $function$
;

CREATE OR REPLACE FUNCTION public.ledger_post(p_business uuid, p_kind text, p_type text, p_id text, p_date date, p_memo text, p_branch text, p_lines jsonb, p_hash text, p_reversal_of uuid, p_by text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare eid uuid; dsum numeric; csum numeric; bad text; d date := public.ledger_open_date(p_business, p_date); memo text := p_memo;
begin
  select round(coalesce(sum((l->>'d')::numeric), 0), 2), round(coalesce(sum((l->>'c')::numeric), 0), 2) into dsum, csum from jsonb_array_elements(p_lines) l;
  if dsum <> csum then raise exception 'Unbalanced entry for % %: debits % vs credits %', p_type, p_id, dsum, csum; end if;
  if dsum = 0 then return null; end if;
  select l->>'a' into bad from jsonb_array_elements(p_lines) l where not exists (select 1 from ledger_accounts a where a.business_id = p_business and a.code = l->>'a') limit 1;
  if bad is not null then raise exception 'Unknown account %', bad; end if;
  if d <> p_date then memo := memo || ' (dated ' || to_char(p_date, 'Mon DD, YYYY') || '; that month is closed)'; end if;
  insert into journal_entries(business_id, entry_date, memo, kind, source_type, source_id, source_hash, reversal_of, branch, created_by_name)
    values (p_business, d, left(memo, 300), p_kind, p_type, p_id, p_hash, p_reversal_of, p_branch, p_by) returning id into eid;
  insert into journal_lines(entry_id, business_id, account_code, debit, credit, party, memo)
    select eid, p_business, l->>'a', (l->>'d')::numeric, (l->>'c')::numeric, left(l->>'p', 120), left(l->>'m', 200) from jsonb_array_elements(p_lines) l;
  return eid;
end $function$
;

CREATE OR REPLACE FUNCTION public.ledger_reverse_entry(p_entry uuid, p_reason text, p_by text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e journal_entries; rid uuid; ls jsonb;
begin
  select * into e from journal_entries where id = p_entry for update;
  if e.id is null or e.status <> 'posted' then return null; end if;
  select jsonb_agg(jsonb_build_object('a', account_code, 'd', credit, 'c', debit, 'p', party)) into ls from journal_lines where entry_id = e.id;
  rid := public.ledger_post(e.business_id, 'reversal', e.source_type, e.source_id, greatest(e.entry_date, public.nifti_today() - 400), 'Reversed: ' || coalesce(e.memo, '') || ' — ' || p_reason, e.branch, ls, null, e.id, p_by);
  update journal_entries set status = 'reversed', reversed_by = rid where id = e.id;
  return rid;
end $function$
;

CREATE OR REPLACE FUNCTION public.ledger_seed(p_business uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into ledger_accounts(business_id, code, name, type, is_system)
  select p_business, t.code, t.name, t.type, true from public.ledger_template() t
  on conflict (business_id, code) do nothing;
$function$
;

CREATE OR REPLACE FUNCTION public.ledger_sync()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner side can open the books.'; end if;
  return public.ledger_sync_business(me);
end $function$
;

CREATE OR REPLACE FUNCTION public.ledger_sync_all()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b record; n int := 0;
begin
  for b in select id from businesses where not is_outside and banned_at is null loop
    begin perform public.ledger_sync_business(b.id); n := n + 1;
    exception when others then raise warning 'ledger sync failed for %: %', b.id, sqlerrm; end;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.ledger_sync_business(p_business uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; e journal_entries; h text; seen text[] := '{}'; n_new int := 0; n_changed int := 0; n_gone int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('ledger:' || p_business::text));
  perform public.ledger_seed(p_business);
  for r in select * from public.ledger_expected(p_business) x where x.entry_date is not null loop
    seen := seen || (r.source_type || '|' || r.source_id);
    h := md5(r.entry_date::text || '|' || r.lines::text);
    select * into e from journal_entries j where j.business_id = p_business and j.kind = 'auto' and j.status = 'posted' and j.source_type = r.source_type and j.source_id = r.source_id;
    if e.id is null then
      if jsonb_array_length(r.lines) > 0 then perform public.ledger_post(p_business, 'auto', r.source_type, r.source_id, r.entry_date, r.memo, r.branch, r.lines, h, null, 'Nifti'); n_new := n_new + 1; end if;
    elsif e.source_hash <> h and not r.sticky then
      perform public.ledger_reverse_entry(e.id, 'the record was changed', 'Nifti');
      if jsonb_array_length(r.lines) > 0 then perform public.ledger_post(p_business, 'auto', r.source_type, r.source_id, r.entry_date, r.memo, r.branch, r.lines, h, null, 'Nifti'); end if;
      n_changed := n_changed + 1;
    end if;
  end loop;
  for e in select * from journal_entries j where j.business_id = p_business and j.kind = 'auto' and j.status = 'posted' and not ((j.source_type || '|' || j.source_id) = any(seen)) loop
    perform public.ledger_reverse_entry(e.id, 'the record was removed or voided', 'Nifti'); n_gone := n_gone + 1;
  end loop;
  update businesses set books_settings = coalesce(books_settings, '{}'::jsonb) || jsonb_build_object('ledger_synced_at', now()) where id = p_business;
  return jsonb_build_object('posted', n_new, 'changed', n_changed, 'reversed', n_gone, 'at', now());
end $function$
;

CREATE OR REPLACE FUNCTION public.ledger_template()
 RETURNS TABLE(code text, name text, type text)
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  values ('1000','Cash in drawer','asset'), ('1010','GCash & Maya','asset'), ('1020','Bank','asset'),
    ('1100','Customers owe you (receivables)','asset'), ('1150','Staff advances (vale)','asset'), ('1200','Stock (inventory)','asset'),
    ('1400','Input VAT','asset'), ('1410','Tax withheld by customers','asset'),
    ('2000','You owe suppliers (payables)','liability'), ('2050','Unpaid bills','liability'), ('2060','Credit card','liability'),
    ('2100','Output VAT','liability'), ('2300','SSS, PhilHealth, Pag-IBIG to remit','liability'), ('2310','Other payroll deductions','liability'),
    ('3000','Owner''s money put in (capital)','equity'), ('3100','Owner took money (drawings)','equity'), ('3200','Retained earnings','equity'), ('3900','Opening balances','equity'),
    ('4000','Counter sales','income'), ('4010','Sales to customers (orders)','income'), ('4020','Credits and returns given','income'), ('4900','Other income (cash over)','income'),
    ('5000','Cost of goods sold','expense'), ('5100','Bad and missing stock','expense'), ('5110','Stock changed by hand','expense'),
    ('6010','Electricity','expense'), ('6020','Water','expense'), ('6030','Internet & phone','expense'), ('6040','Gas (LPG)','expense'), ('6100','Rent','expense'),
    ('6200','Salaries','expense'), ('6210','Employer contributions','expense'), ('6300','Fuel & transport','expense'), ('6310','Delivery & shipping','expense'),
    ('6400','Supplies','expense'), ('6500','Repairs','expense'), ('6600','Food & meals','expense'), ('6700','Taxes & permits','expense'),
    ('6800','Bank & GCash fees','expense'), ('6900','Marketing','expense'), ('6960','Cash short','expense'), ('6990','Other expenses','expense')
$function$
;

CREATE OR REPLACE FUNCTION public.list_public_stores()
 RETURNS TABLE(slug text, name text, headline text, about text, location text, items text, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select b.store_slug, b.name, b.store->>'headline', b.store->>'about', b.public_profile->>'location',
         (select string_agg(x, ' · ') from (select (c->>'product') || case when coalesce(b.store->>'price_mode','public') = 'public' and (c->>'price')::numeric > 0 then ' ₱' || to_char((c->>'price')::numeric, 'FM999,999,990.##') else '' end x
            from jsonb_array_elements(coalesce(b.catalog,'[]'::jsonb)) c limit 5) t),
         now()
  from businesses b
  where b.store_slug is not null and public.nifti_listable(b.id) and coalesce((b.store->>'enabled')::boolean, false) and not b.is_outside and b.paused_at is null
  order by b.store_slug limit 2000
$function$
;

CREATE OR REPLACE FUNCTION public.lock_period(p_month date, p_note text, p_checklist jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); m date := date_trunc('month', p_month)::date; who text;
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner side can close a month.'; end if;
  if m >= date_trunc('month', public.nifti_today())::date then raise exception 'You can only close a month that has ended.'; end if;
  if octet_length(coalesce(p_checklist, '{}')::text) > 8000 then raise exception 'Checklist too long.'; end if;
  perform public.ledger_sync_business(me);
  who := public.nifti_member_name(me);
  insert into accounting_periods(business_id, period, status, locked_at, locked_by_name, note, checklist)
    values (me, m, 'locked', now(), who, nullif(left(btrim(coalesce(p_note, '')), 300), ''), p_checklist)
  on conflict (business_id, period) do update set status = 'locked', locked_at = now(), locked_by_name = who, note = excluded.note, checklist = excluded.checklist;
  insert into audit_log(business_id, action, entity_type, entity_id, field, new_value, actor) values (me, 'period_locked', 'period', m::text, 'status', to_jsonb(coalesce(p_note, '')), coalesce(who, 'someone'));
end $function$
;

CREATE OR REPLACE FUNCTION public.log_manual_reminder(p_po uuid, p_stage text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from purchase_orders where id = p_po and supplier_business_id in (select public.my_business_ids())) then raise exception 'Not your order.'; end if;
  insert into payment_reminder_log(po_id, stage, automatic, channel) values (p_po, left(p_stage, 12), false, 'manual') on conflict do nothing;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_lines(p_days integer)
 RETURNS TABLE(buyer uuid, supplier uuid, item_key text, product text, unit_price numeric, created_date date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select po.buyer_business_id, po.supplier_business_id,
         public.nifti_norm(li->>'product') || case when coalesce(li->>'unit','') <> '' then '|' || public.nifti_norm(li->>'unit') else '' end,
         li->>'product', nullif(li->>'unitPrice','')::numeric, po.created_date
  from purchase_orders po join businesses bb on bb.id = po.buyer_business_id, jsonb_array_elements(coalesce(po.line_items,'[]'::jsonb)) li
  where po.status not in ('draft','cancelled') and not bb.is_outside
    and po.created_date >= (now() at time zone 'Asia/Manila')::date - p_days
    and nullif(li->>'unitPrice','')::numeric > 0
$function$
;

CREATE OR REPLACE FUNCTION public.menu_items_touch()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$ begin new.updated_at := now(); return new; end $function$
;

CREATE OR REPLACE FUNCTION public.my_account_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select jsonb_build_object('banned', b.banned_at is not null, 'reason', b.ban_reason, 'business', b.name)
    from team_members t join businesses b on b.id = t.business_id where t.auth_user_id = auth.uid() limit 1), jsonb_build_object('banned', false)) $function$
;

CREATE OR REPLACE FUNCTION public.my_business_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.business_id from team_members t join businesses b on b.id = t.business_id where t.auth_user_id = auth.uid() and b.banned_at is null $function$
;

CREATE OR REPLACE FUNCTION public.my_cash_count_days(p_days integer DEFAULT 7)
 RETURNS TABLE(count_day date, drawer text, closed_by_name text, reopened boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count_day, drawer, closed_by_name, reopened_at is not null from cash_counts
   where business_id = public.nifti_my_business() and count_day >= public.nifti_today() - greatest(least(coalesce(p_days, 7), 60), 1)
   order by count_day desc
$function$
;

CREATE OR REPLACE FUNCTION public.my_daily_summary()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.daily_summary_for(public.nifti_my_business()) where public.nifti_my_business() is not null
$function$
;

CREATE OR REPLACE FUNCTION public.my_data_export()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can download the data.'; end if;
  return jsonb_build_object(
    'exported_at', now(),
    'business', (select to_jsonb(b) - 'admin_note' - 'ban_reason' - 'reviewed_at' from businesses b where b.id = me),
    'team', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'email', email, 'roles', roles, 'status', status, 'joined', created_at)), '[]') from team_members where business_id = me),
    'partners', (select coalesce(jsonb_agg(to_jsonb(r)), '[]') from business_relationships r where me in (r.buyer_business_id, r.supplier_business_id)),
    'orders', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from purchase_orders p where me in (p.buyer_business_id, p.supplier_business_id)),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('conversation', m.conversation_id, 'from_me', m.sender_business_id = me, 'text', m.text, 'sent_at', m.sent_at) order by m.sent_at), '[]')
                 from conversation_messages m join conversations c on c.id = m.conversation_id where me in (c.buyer_business_id, c.supplier_business_id)),
    'price_agreements', (select coalesce(jsonb_agg(to_jsonb(a)), '[]') from price_agreements a where me in (a.buyer_business_id, a.supplier_business_id)),
    'inventory', (select coalesce(jsonb_agg(to_jsonb(i)), '[]') from inventory_items i where i.business_id = me),
    'customers', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from downstream_customers c where c.business_id = me),
    'sales', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from downstream_sales s where s.business_id = me),
    'routes', (select coalesce(jsonb_agg(to_jsonb(r) || jsonb_build_object('stops', (select coalesce(jsonb_agg(to_jsonb(s) - 'proof'), '[]') from route_stops s where s.route_id = r.id))), '[]') from routes r where r.business_id = me),
    'credit_memos', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from credit_memos c where me in (c.supplier_business_id, c.buyer_business_id)),
    'price_changes', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from price_changes p where p.business_id = me),
    'subscription', (select to_jsonb(s) from subscriptions s where s.business_id = me),
    'payments_to_nifti', (select coalesce(jsonb_agg(to_jsonb(u)), '[]') from upgrade_requests u where u.business_id = me));
end $function$
;

CREATE OR REPLACE FUNCTION public.my_market_prices()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not public.has_feature(me, 'market_price') then raise exception 'Market price check is part of Buyer Pro.'; end if;
  return (
    with l as (select * from public.market_lines(90)),
    mine as (
      select item_key, max(product) product, round(avg(unit_price), 2) my_avg,
             (array_agg(unit_price order by created_date desc))[1] my_last, count(*) my_n
      from l where buyer = me group by item_key
    ),
    others as (
      select l.item_key, count(distinct l.buyer) nb, count(distinct l.supplier) ns,
             percentile_cont(0.5) within group (order by l.unit_price) med,
             percentile_cont(0.25) within group (order by l.unit_price) p25,
             percentile_cont(0.75) within group (order by l.unit_price) p75
      from l where l.buyer <> me and l.item_key in (select item_key from mine) group by l.item_key
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'product', m.product, 'my_avg', m.my_avg, 'my_last', m.my_last, 'my_orders', m.my_n,
      'enough_data', coalesce(o.nb >= 5 and o.ns >= 3, false),
      'median', case when o.nb >= 5 and o.ns >= 3 then round(o.med::numeric, 2) end,
      'low', case when o.nb >= 5 and o.ns >= 3 then round(o.p25::numeric, 2) end,
      'high', case when o.nb >= 5 and o.ns >= 3 then round(o.p75::numeric, 2) end,
      'buyers_band', case when o.nb >= 20 then '20+' when o.nb >= 10 then '10+' when o.nb >= 5 then '5+' end,
      'diff_pct', case when o.nb >= 5 and o.ns >= 3 and o.med > 0 then round(((m.my_last / o.med::numeric) - 1) * 100, 1) end
    ) order by (o.nb >= 5 and o.ns >= 3) desc nulls last, m.my_n desc), '[]'::jsonb)
    from mine m left join others o on o.item_key = m.item_key
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.my_plan()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() id)
  select jsonb_build_object(
    'plan', public.business_plan(me.id),
    'pilot', public.nifti_pilot_free(),
    'paid_until', (select paid_until from subscriptions where business_id = me.id),
    'features', to_jsonb(public.plan_features(public.business_plan(me.id))),
    'seat_limit', public.plan_seat_limit(public.business_plan(me.id)),
    'seats_used', (select count(*) from team_members where business_id = me.id and status in ('active','invited')),
    'pending_request', (select jsonb_build_object('plan', plan, 'cycle', cycle, 'created_at', created_at) from upgrade_requests where business_id = me.id and status = 'pending' order by created_at desc limit 1)
  ) from me where me.id is not null
$function$
;

CREATE OR REPLACE FUNCTION public.my_reminder_log()
 RETURNS TABLE(po_id uuid, stage text, channel text, sent_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select l.po_id, l.stage, l.channel, l.sent_at from payment_reminder_log l join purchase_orders po on po.id = l.po_id
  where po.supplier_business_id in (select public.my_business_ids()) and l.sent_at > now() - interval '120 days'
$function$
;

CREATE OR REPLACE FUNCTION public.my_reorder_due()
 RETURNS TABLE(buyer_id uuid, buyer_name text, orders integer, usual_gap integer, days_since integer, last_order date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select * from public.reorder_due(public.nifti_my_business()) $function$
;

CREATE OR REPLACE FUNCTION public.my_routes(p_from date, p_to date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() id, public.nifti_me_member(public.nifti_my_business()) mid)
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'route_date', r.route_date, 'driver_member_id', r.driver_member_id, 'driver_name', r.driver_name, 'vehicle', r.vehicle,
      'status', r.status, 'remit', r.remit, 'created_by_name', r.created_by_name, 'mine', r.driver_member_id = me.mid,
      'stops', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'seq', s.seq, 'buyer_business_id', s.buyer_business_id, 'buyer_name', s.buyer_name,
                 'address', s.address, 'phone', s.phone, 'deliver_po_ids', s.deliver_po_ids, 'collect_po_ids', s.collect_po_ids, 'amount_due', case when s.status = 'pending' then (select coalesce(sum(greatest(public.nifti_open_balance(po.invoice), 0)), 0) from purchase_orders po where po.id = any(s.collect_po_ids) and po.status not in ('paid','cancelled')) else s.amount_due end,
                 'deliver_open', (select count(*) from purchase_orders po where po.id = any(s.deliver_po_ids) and po.status in ('confirmed','preparing','shipped','in_customs','sent')),
                 'items', s.items, 'note', s.note, 'status', s.status, 'result', s.result, 'has_proof', s.proof is not null, 'done_at', s.done_at, 'done_by', s.done_by) order by s.seq), '[]'::jsonb)
               from route_stops s where s.route_id = r.id)
    ) order by r.route_date desc, r.created_at), '[]'::jsonb)
  from routes r, me where r.business_id = me.id and r.route_date between p_from and p_to
    and (public.nifti_route_planner(me.id) or r.driver_member_id = me.mid) $function$
;

CREATE OR REPLACE FUNCTION public.my_services()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() id)
  select jsonb_build_object(
    'prices', jsonb_build_object('setup', public.service_price('setup'), 'verify', public.service_price('verify')),
    'due', jsonb_build_object('setup', public.service_amount_due(me.id, 'setup'), 'verify', public.service_amount_due(me.id, 'verify')),
    'verified', public.business_is_verified(me.id),
    'verified_until', (select verified_until from businesses where id = me.id),
    'requests', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'kind', s.kind, 'status', s.status, 'amount', s.amount, 'admin_note', s.admin_note, 'created_at', s.created_at) order by s.created_at desc), '[]'::jsonb)
                 from (select * from service_requests where business_id = me.id order by created_at desc limit 10) s)
  ) from me where me.id is not null $function$
;

CREATE OR REPLACE FUNCTION public.my_statement(p_buyer uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not public.has_feature(me, 'statements') then raise exception 'Statements are part of Supplier Pro.'; end if;
  if not exists (select 1 from purchase_orders where supplier_business_id = me and buyer_business_id = p_buyer) then raise exception 'No orders with this buyer yet.'; end if;
  return public.statement_data(me, p_buyer);
end $function$
;

CREATE OR REPLACE FUNCTION public.my_watchdog_settings()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select watchdog from business_settings where business_id = public.nifti_my_business()), '{}'::jsonb)
$function$
;

CREATE OR REPLACE FUNCTION public.my_weekly_recap(p_offset integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); today date := (now() at time zone 'Asia/Manila')::date; mon date; r jsonb;
begin
  if me is null then return null; end if;
  mon := date_trunc('week', today)::date - 7 * greatest(least(coalesce(p_offset, 1), 8), 0);
  r := public.weekly_recap_for(me, mon, least(mon + 6, today));
  if not public.nifti_books_viewer(me) then r := r - 'books'; end if;
  return r;
end $function$
;

CREATE OR REPLACE FUNCTION public.next_document_number(p_business_id uuid, p_counter_type text, p_start integer DEFAULT 1)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_next integer;
begin
  if p_business_id is null or not (p_business_id in (select my_business_ids())) then
    raise exception 'not authorized for this business';
  end if;
  insert into document_counters (business_id, counter_type, next_value)
  values (p_business_id, p_counter_type, p_start + 1)
  on conflict (business_id, counter_type)
  do update set next_value = document_counters.next_value + 1, updated_at = now()
  returning next_value - 1 into v_next;
  return v_next;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.next_po_number()
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  select 'PO-' || extract(year from now())::text || '-0' || nextval('po_number_seq')::text;
$function$
;

CREATE OR REPLACE FUNCTION public.next_rfq_number()
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  select 'RFQ-' || extract(year from now())::text || '-0' || nextval('rfq_number_seq')::text;
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_admin_log(p_action text, p_business uuid, p_target text, p_detail jsonb)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into admin_actions(admin_email, action, business_id, target, detail) values (auth.jwt()->>'email', p_action, p_business, p_target, p_detail) $function$
;

CREATE OR REPLACE FUNCTION public.nifti_app_url()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select coalesce((select value from app_secrets where name = 'app_url'), 'https://siggiebahamas.github.io/Nifti/') $function$
;

CREATE OR REPLACE FUNCTION public.nifti_apply_price_changes(p_business uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  with due as (select distinct on (public.nifti_norm(product)) id, product, new_price from price_changes
               where business_id = p_business and applied_at is null and cancelled_at is null and effective_date <= public.nifti_today()
               order by public.nifti_norm(product), effective_date desc, created_at desc)
  update businesses b set catalog = (
      select coalesce(jsonb_agg(case when d.id is not null then c || jsonb_build_object('price', d.new_price, 'updatedAt', public.nifti_today()) else c end), '[]'::jsonb)
      from jsonb_array_elements(coalesce(b.catalog,'[]'::jsonb)) c left join due d on public.nifti_norm(d.product) = public.nifti_norm(c->>'product'))
    where b.id = p_business and exists (select 1 from due);
  update price_changes set applied_at = now() where business_id = p_business and applied_at is null and cancelled_at is null and effective_date <= public.nifti_today();
  get diagnostics n = row_count;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_books_viewer(p_business uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from team_members where business_id = p_business and auth_user_id = auth.uid() and status = 'active'
                 and roles && array['Owner','General Manager','Finance'])
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_cheques()
 RETURNS TABLE(supplier_id uuid, buyer_id uuid, po_id uuid, po_number text, pay_id text, amount numeric, check_no text, bank text, check_date date, status text, deposited_at date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select distinct on (po.id, coalesce(p->>'id', md5(p::text))) po.supplier_business_id, po.buyer_business_id, po.id, po.po_number, p->>'id', (p->>'amount')::numeric, p->>'reference', p->>'bank',
         case when coalesce(p->>'checkDate','') ~ '^\d{4}-\d{2}-\d{2}' then left(p->>'checkDate', 10)::date end,
         case when p->>'confirmStatus' = 'rejected' or p->>'checkStatus' = 'bounced' then 'bounced' when p->>'checkStatus' = 'cleared' then 'cleared' else 'pending' end,
         case when coalesce(p->>'depositedAt','') ~ '^\d{4}-\d{2}-\d{2}' then left(p->>'depositedAt', 10)::date end
  from purchase_orders po,
       lateral (select x from jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb)) x
                union all select x from jsonb_array_elements(coalesce(po.deposit_payments,'[]'::jsonb)) x
                union all select po.cod_payment where po.cod_payment is not null) t(p)
  where p->>'method' = 'check' and po.status <> 'cancelled' $function$
;

CREATE OR REPLACE FUNCTION public.nifti_count_payments(inv jsonb, dep jsonb, st text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select count(*)::int from (
    select p from jsonb_array_elements(coalesce(inv->'payments', '[]'::jsonb)) p
    union all select p from jsonb_array_elements(coalesce(dep, '[]'::jsonb)) p) x
  where case st
    when 'pending' then coalesce(x.p->>'confirmStatus', '') = 'pending'
    when 'confirmed' then coalesce(x.p->>'confirmStatus', '') = 'confirmed' or (x.p->>'method' = 'check' and x.p->>'checkStatus' = 'cleared' and x.p->>'confirmStatus' is null)
    when 'rejected' then coalesce(x.p->>'confirmStatus', '') = 'rejected'
    else false end
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_current_member()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id from team_members where auth_user_id = auth.uid() limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_delete_business_core(p_id uuid, p_confirm text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b businesses; shared boolean; r record; pass int; left_n int; v_users uuid[];
begin
  select * into b from businesses where id = p_id;
  if b.id is null then raise exception 'Not found.'; end if;
  if lower(btrim(coalesce(p_confirm,''))) <> lower(btrim(b.name)) then raise exception 'Type the business name exactly to confirm.'; end if;
  select array_agg(auth_user_id) into v_users from team_members where business_id = p_id and auth_user_id is not null;
  shared := exists (select 1 from purchase_orders po join businesses o on o.id = case when po.buyer_business_id = p_id then po.supplier_business_id else po.buyer_business_id end
                    where (po.buyer_business_id = p_id or po.supplier_business_id = p_id) and not o.is_outside and o.id <> p_id)
         or exists (select 1 from conversation_messages m join conversations c on c.id = m.conversation_id
                    where (c.buyer_business_id = p_id or c.supplier_business_id = p_id) and m.sender_business_id <> p_id);
  if shared then
    update businesses set name = 'Deleted business', public_profile = '{}'::jsonb, catalog = '[]'::jsonb, catalog_public = false, store = '{}'::jsonb, store_slug = null,
      shared_contact = '{}'::jsonb, outside_contact = null, logistics_partners = '[]'::jsonb, payment_methods = '[]'::jsonb, banned_at = coalesce(banned_at, now()), ban_reason = 'Deleted by Nifti' where id = p_id;
    delete from team_members where business_id = p_id;
    if v_users is not null then
      begin delete from auth.users where id = any(v_users);
      exception when others then update auth.users set banned_until = 'infinity' where id = any(v_users); end;
    end if;
    return 'anonymized';
  end if;
  delete from conversation_messages where conversation_id in (select id from conversations where buyer_business_id = p_id or supplier_business_id = p_id);
  delete from route_stops where business_id = p_id or buyer_business_id = p_id;
  for pass in 1..6 loop
    left_n := 0;
    for r in select c.conrelid::regclass::text tbl, a.attname col from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
             where c.contype = 'f' and c.confrelid = 'public.businesses'::regclass and c.conrelid <> 'public.businesses'::regclass loop
      begin
        execute format('delete from %s where %I = $1', r.tbl, r.col) using p_id;
      exception when foreign_key_violation then left_n := left_n + 1; end;
    end loop;
    exit when left_n = 0;
  end loop;
  delete from businesses where created_by_business = p_id and is_outside
    and not exists (select 1 from purchase_orders where buyer_business_id = businesses.id or supplier_business_id = businesses.id);
  delete from businesses where id = p_id;
  if v_users is not null then
    begin delete from auth.users where id = any(v_users);
    exception when others then update auth.users set banned_until = 'infinity' where id = any(v_users); end;
  end if;
  return 'deleted';
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_guard_open_month()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare col text := case tg_table_name when 'expenses' then 'spent_on' when 'downstream_sales' then 'sale_date' else 'count_day' end;
  dnew date; dold date; b uuid;
begin
  b := coalesce(new.business_id, old.business_id);
  dnew := (to_jsonb(new)->>col)::date;
  if tg_op = 'UPDATE' then dold := (to_jsonb(old)->>col)::date; end if;
  if public.nifti_month_locked(b, dnew) or (dold is not null and public.nifti_month_locked(b, dold)) then
    raise exception 'That month is closed. Ask the owner to reopen it first.';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_guard_payment_list(old_list jsonb, new_list jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare
  owned text[] := array['confirmStatus','confirmedAt','confirmedBy','rejectReason','rejectedAt','checkStatus'];
  result jsonb := '[]'::jsonb;
  used int[] := '{}';
  e jsonb; m jsonb; idx int; rec record;
begin
  if old_list is null or jsonb_typeof(old_list) <> 'array' then old_list := '[]'::jsonb; end if;
  if new_list is null or jsonb_typeof(new_list) <> 'array' then new_list := '[]'::jsonb; end if;
  for e in select value from jsonb_array_elements(new_list) loop
    if jsonb_typeof(e) <> 'object' then continue; end if;
    idx := null;
    if e ? 'id' then
      select x.ord::int into idx from jsonb_array_elements(old_list) with ordinality x(value, ord)
        where x.value->>'id' = e->>'id' and not (x.ord::int = any(used)) limit 1;
    else
      select x.ord::int into idx from jsonb_array_elements(old_list) with ordinality x(value, ord)
        where x.value = e and not (x.ord::int = any(used)) limit 1;
    end if;
    if idx is not null then
      used := used || idx;
      m := old_list -> (idx - 1);
      if coalesce(m->>'confirmStatus', 'confirmed') <> 'pending' then
        e := m; -- settled: supplier-owned in full (amount, method, status, everything)
      else
        e := (e - owned) || coalesce((select jsonb_object_agg(k, m->k) from unnest(owned) k where m ? k), '{}'::jsonb);
      end if;
    else
      e := (e - owned) || '{"confirmStatus":"pending"}'::jsonb;
      if e->>'method' = 'check' then e := e || '{"checkStatus":"pending"}'::jsonb; end if;
    end if;
    result := result || jsonb_build_array(e);
  end loop;
  for rec in select value, ord::int as ord from jsonb_array_elements(old_list) with ordinality x(value, ord) loop
    if rec.ord = any(used) then continue; end if;
    if coalesce(rec.value->>'confirmStatus', 'confirmed') = 'pending' then continue; end if; -- buyer may withdraw their own unconfirmed submission
    result := result || jsonb_build_array(rec.value);
  end loop;
  return result;
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_has_role(p_business uuid, p_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from team_members where business_id = p_business and auth_user_id = auth.uid() and status = 'active' and roles && p_roles) $function$
;

CREATE OR REPLACE FUNCTION public.nifti_health()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object('ok', true, 'time', now(),
    'notifications_pending', (select count(*) from notification_outbox where sent_at is null and created_at < now() - interval '5 minutes'))
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_invoice_balance(inv jsonb)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select coalesce((inv->>'statedTotal')::numeric, 0) - coalesce((
    select sum((p->>'amount')::numeric) from jsonb_array_elements(coalesce(inv->'payments', '[]'::jsonb)) p
    where coalesce(p->>'confirmStatus', 'confirmed') = 'confirmed'
      and not (p->>'method' = 'check' and coalesce(p->>'checkStatus', '') <> 'cleared')
  ), 0)
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_iso_date(t text)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when t ~ '^\d{4}-\d{2}-\d{2}' then left(t, 10)::date else null end
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_kick_backup()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare secret text;
begin
  select value into secret from app_secrets where name = 'dispatch_secret';
  perform net.http_post(
    url := 'https://ctryvcloavfpecbrbzxy.supabase.co/functions/v1/backup-export',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-dispatch-secret', secret),
    body := '{}'::jsonb, timeout_milliseconds := 120000);
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_kick_dispatch()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare secret text;
begin
  select value into secret from app_secrets where name = 'dispatch_secret';
  perform net.http_post(
    url := 'https://ctryvcloavfpecbrbzxy.supabase.co/functions/v1/push-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-dispatch-secret', secret),
    body := '{}'::jsonb);
exception when others then null; -- never let a notification problem break the real write
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_last_active(p_business uuid)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select greatest(
    (select max(updated_at) from purchase_orders where buyer_business_id = p_business or supplier_business_id = p_business),
    (select max(sent_at) from conversation_messages where sender_business_id = p_business),
    (select max(u.last_sign_in_at) from team_members t join auth.users u on u.id = t.auth_user_id where t.business_id = p_business)) $function$
;

CREATE OR REPLACE FUNCTION public.nifti_lead_autowin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b businesses;
begin
  if new.status in ('draft','cancelled','quote') then return new; end if;
  if coalesce(new.invoice->>'opening','') = 'true' then return new; end if; -- a balance from before Nifti isn't a first order
  if tg_op = 'UPDATE' and old.status not in ('draft','quote') then return new; end if;
  select * into b from businesses where id = new.buyer_business_id;
  update sales_leads l set stage = 'won', won_buyer_id = new.buyer_business_id, won_po_id = new.id, next_follow_up = null, updated_at = now(),
    log = l.log || jsonb_build_array(jsonb_build_object('at', now(), 'what', '🎉 First order: ' || new.po_number))
  where l.business_id = new.supplier_business_id and l.stage not in ('won','lost')
    and (l.won_buyer_id = new.buyer_business_id
      or (l.phone is not null and l.phone = b.outside_contact->>'phone')
      or (l.email is not null and lower(l.email) in (select lower(email) from team_members where business_id = b.id))
      or lower(btrim(coalesce(l.company, ''))) = lower(btrim(b.name))
      or lower(btrim(l.name)) = lower(btrim(b.name)));
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_listable(p_business uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from businesses b where b.id = p_business and b.banned_at is null and (b.reviewed_at is not null or not public.nifti_require_review())) $function$
;

CREATE OR REPLACE FUNCTION public.nifti_make_reorder_link(p_supplier uuid, p_buyer uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare sup businesses; lines jsonb; tok text;
begin
  select * into sup from businesses where id = p_supplier;
  if sup.store_slug is null or coalesce((sup.store->>'enabled')::boolean, false) = false then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('product', li->>'product', 'qty', li->'qty')), '[]'::jsonb) into lines
    from (select line_items from purchase_orders where supplier_business_id = p_supplier and buyer_business_id = p_buyer
          and status not in ('draft','cancelled') order by created_at desc limit 1) po, jsonb_array_elements(coalesce(po.line_items, '[]'::jsonb)) li
    where exists (select 1 from jsonb_array_elements(coalesce(sup.catalog, '[]'::jsonb)) c where c->>'product' = li->>'product');
  select token into tok from reorder_links where business_id = p_supplier and buyer_business_id = p_buyer and expires_at > now() + interval '20 days'
    and items = coalesce(lines, '[]'::jsonb) order by created_at desc limit 1;
  if tok is null then
    tok := public.nifti_random_token(24);
    insert into reorder_links(token, business_id, buyer_business_id, items, expires_at) values (tok, p_supplier, p_buyer, coalesce(lines, '[]'::jsonb), now() + interval '60 days');
  end if;
  return public.nifti_app_url() || 's/' || sup.store_slug || '/?re=' || tok || '&src=reorder';
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_me_member(p_business uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id from team_members where business_id = p_business and auth_user_id = auth.uid() and status = 'active' limit 1 $function$
;

CREATE OR REPLACE FUNCTION public.nifti_member_name(p_business uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(nullif(btrim(name), ''), split_part(email, '@', 1)) from team_members
   where business_id = p_business and auth_user_id = auth.uid() and status = 'active' limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_message_buyer(p_supplier uuid, p_buyer uuid, p_subject text, p_msg text, p_url text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b businesses; conv uuid;
begin
  select * into b from businesses where id = p_buyer;
  select id into conv from conversations where buyer_business_id = p_buyer and supplier_business_id = p_supplier;
  if not b.is_outside and conv is not null then
    insert into conversation_messages(conversation_id, sender_business_id, text) values (conv, p_supplier, p_msg);
    update conversations set buyer_unread_count = buyer_unread_count + 1 where id = conv;
    return 'chat';
  end if;
  if b.is_outside and nullif(b.outside_contact->>'email', '') is not null then
    insert into notification_outbox(business_id, category, title, body, url, to_email) values (p_supplier, 'customer_email', p_subject, p_msg, coalesce(p_url, './'), b.outside_contact->>'email');
    return 'email';
  end if;
  return null;
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_month_locked(p_business uuid, p_day date)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from accounting_periods where business_id = p_business and period = date_trunc('month', p_day)::date and status = 'locked')
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_month_spend(p_buyer uuid, p_member uuid, p_supplier uuid, p_exclude uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(sum(public.nifti_po_total(po)), 0) from purchase_orders po
  where po.buyer_business_id = p_buyer and po.status not in ('draft','cancelled') and po.id is distinct from p_exclude
    and date_trunc('month', po.created_date) = date_trunc('month', public.nifti_today())
    and (p_member is null or po.placed_by_member = p_member) and (p_supplier is null or po.supplier_business_id = p_supplier) $function$
;

CREATE OR REPLACE FUNCTION public.nifti_my_business()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.business_id from team_members t join businesses b on b.id = t.business_id where t.auth_user_id = auth.uid() and t.status = 'active' and b.banned_at is null limit 1 $function$
;

CREATE OR REPLACE FUNCTION public.nifti_norm(t text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select btrim(regexp_replace(lower(coalesce(t,'')), '[^a-z0-9]+', ' ', 'g'))
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_notify(p_business uuid, p_title text, p_body text, p_url text, p_category text, p_only_member uuid DEFAULT NULL::uuid, p_exclude_member uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_business is null then return; end if;
  if exists (select 1 from businesses where id = p_business and is_outside) then return; end if;
  insert into notification_outbox(business_id, title, body, url, category, only_member, exclude_member)
    values (p_business, left(p_title, 120), left(coalesce(p_body, ''), 240), coalesce(p_url, './'), p_category, p_only_member, p_exclude_member);
  perform public.nifti_kick_dispatch();
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_notify_books(p_business uuid, p_title text, p_body text, p_url text, p_category text DEFAULT 'money'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v record;
begin
  for v in select id from team_members where business_id = p_business and status = 'active' and auth_user_id is not null
             and roles && array['Owner','General Manager','Finance'] loop
    perform public.nifti_notify(p_business, p_title, p_body, p_url, p_category, v.id);
  end loop;
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_open_balance(inv jsonb)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select public.nifti_invoice_balance(inv) - coalesce((select sum((p->>'amount')::numeric) from jsonb_array_elements(coalesce(inv->'payments','[]'::jsonb)) p
    where coalesce(p->>'confirmStatus','') = 'pending' or (p->>'method' = 'check' and coalesce(p->>'checkStatus','') = 'pending' and coalesce(p->>'confirmStatus','') <> 'rejected')), 0) $function$
;

CREATE OR REPLACE FUNCTION public.nifti_order_url(p_po uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tok text; po purchase_orders;
begin
  select token into tok from order_links where po_id = p_po and kind = 'order' and revoked_at is null and expires_at > now() + interval '7 days' order by created_at desc limit 1;
  if tok is null then
    select * into po from purchase_orders where id = p_po;
    tok := public.nifti_random_token(24);
    insert into order_links(token, po_id, created_by_business, expires_at) values (tok, p_po, po.supplier_business_id, now() + interval '120 days');
  end if;
  return public.nifti_app_url() || '#o/' || tok;
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_paid_since(p_supplier uuid, p_buyer uuid, p_since date)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(sum((p->>'amount')::numeric), 0)
  from purchase_orders po, jsonb_array_elements(coalesce(po.invoice->'payments', '[]'::jsonb)) p
  where po.supplier_business_id = p_supplier and po.buyer_business_id = p_buyer
    and coalesce(p->>'confirmStatus', 'confirmed') <> 'rejected'
    and coalesce(public.nifti_iso_date(p->>'date'), p_since) >= p_since
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_peso(n numeric)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select '₱' || to_char(round(coalesce(n, 0)), 'FM999,999,999,990')
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_ph_mobile(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case
    when regexp_replace(coalesce(p,''), '[^0-9]', '', 'g') ~ '^639\d{9}$' then '0' || substr(regexp_replace(p, '[^0-9]', '', 'g'), 3)
    when regexp_replace(coalesce(p,''), '[^0-9]', '', 'g') ~ '^09\d{9}$' then regexp_replace(p, '[^0-9]', '', 'g')
    when regexp_replace(coalesce(p,''), '[^0-9]', '', 'g') ~ '^9\d{9}$' then '0' || regexp_replace(p, '[^0-9]', '', 'g')
    else null end
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_pilot_free()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select value from app_secrets where name = 'pilot_all_free'), 'false') = 'true'
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_po_total(po purchase_orders)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select round(coalesce((select sum((li->>'qty')::numeric * (li->>'unitPrice')::numeric) from jsonb_array_elements(coalesce(po.line_items,'[]'::jsonb)) li), 0) * (1 + coalesce(po.tax_rate, 0)))
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_quarter_due(q text)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  -- the certificate is due within 20 days after the quarter ends
  select (make_date(left(q, 4)::int, right(q, 1)::int * 3, 1) + interval '1 month' + interval '19 days')::date
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_quarter_of(d date)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select to_char(d, 'YYYY') || '-Q' || extract(quarter from d)::int
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_quote_answer(p_po uuid, p_action text, p_items jsonb, p_note text, p_remind_on date, p_needed_by date, p_who text, p_via text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare po purchase_orders; q jsonb; lines jsonb; it jsonb; idx int; qty numeric; changes text := ''; li jsonb; n int;
  note text := nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>"`]', '', 'g')), 300), '');
  who text := left(btrim(regexp_replace(coalesce(p_who,''), '[<>"`]', '', 'g')), 60);
  via text := case when p_via = 'link' then ' (via order link)' else '' end; act text; today date := (now() at time zone 'Asia/Manila')::date;
begin
  select * into po from purchase_orders where id = p_po for update;
  if po.id is null then raise exception 'Order not found.'; end if;
  if po.status = 'confirmed' and coalesce(po.quote->>'outcome','') = 'confirmed' and p_action = 'confirm' then return jsonb_build_object('ok', true, 'status', 'confirmed', 'already', true); end if;
  if po.status <> 'quote' then raise exception 'This order isn''t waiting for your OK anymore (it is %).', po.status; end if;
  q := coalesce(po.quote, '{}'::jsonb);
  if length(who) < 2 then raise exception 'Please enter your name.'; end if;
  if p_action = 'confirm' then
    lines := coalesce(po.line_items, '[]'::jsonb);
    if p_items is not null and jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) > 0 then
      if coalesce((q->>'allow_edit')::boolean, true) is not true then raise exception 'Message the seller to change quantities.'; end if;
      for it in select value from jsonb_array_elements(p_items) loop
        idx := nullif(it->>'i','')::int; qty := nullif(it->>'qty','')::numeric;
        if idx is null or idx < 0 or idx >= jsonb_array_length(lines) or qty is null or qty < 0 or qty > 10000000 then raise exception 'Check the quantities.'; end if;
        li := lines->idx;
        if qty <> (li->>'qty')::numeric then
          changes := changes || case when changes = '' then '' else ', ' end || (li->>'product') || ' ' || trim(to_char((li->>'qty')::numeric, 'FM999999990.##')) || '→' || trim(to_char(qty, 'FM999999990.##'));
          lines := jsonb_set(lines, array[idx::text, 'qty'], to_jsonb(qty));
        end if;
      end loop;
      select coalesce(jsonb_agg(x), '[]'::jsonb) into lines from jsonb_array_elements(lines) x where (x->>'qty')::numeric > 0;
      if jsonb_array_length(lines) = 0 then raise exception 'Keep at least one item, or tap "Not now".'; end if;
    end if;
    act := '✅ Confirmed by ' || who || via || case when changes <> '' then ' — changed: ' || changes else '' end || coalesce(' — "' || note || '"', '');
    update purchase_orders set status = 'confirmed', line_items = lines,
      requested_delivery_date = coalesce(p_needed_by, requested_delivery_date),
      quote = q || jsonb_build_object('outcome', 'confirmed', 'answered_at', now(), 'via', p_via, 'changed', changes <> '') - 'not_now',
      history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'buyer', 'action', act)),
      updated_at = now()
      where id = po.id;
    return jsonb_build_object('ok', true, 'status', 'confirmed', 'changed', changes <> '');
  elsif p_action = 'not_now' then
    if p_remind_on is not null and (p_remind_on <= today or p_remind_on > today + 120) then raise exception 'Pick a date in the next few months.'; end if;
    if note is null and p_remind_on is null then raise exception 'Tell them why, or pick when to ask again.'; end if;
    act := '🕒 Not yet — ' || who || via || coalesce(': "' || note || '"', '') || coalesce(' · ask again ' || to_char(p_remind_on, 'Mon DD'), '');
    update purchase_orders set quote = q || jsonb_build_object('not_now', jsonb_strip_nulls(jsonb_build_object('reason', note, 'remind_on', p_remind_on, 'at', now(), 'by', who))),
      history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'buyer', 'action', act)),
      updated_at = now()
      where id = po.id;
    return jsonb_build_object('ok', true, 'status', 'quote');
  elsif p_action = 'decline' then
    act := '✕ Declined by ' || who || via || coalesce(': "' || note || '"', '');
    update purchase_orders set status = 'cancelled',
      quote = q || jsonb_build_object('outcome', 'declined', 'answered_at', now(), 'via', p_via, 'reason', note),
      history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'buyer', 'action', act)),
      updated_at = now()
      where id = po.id;
    return jsonb_build_object('ok', true, 'status', 'cancelled');
  end if;
  raise exception 'Unknown action.';
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_quote_due(q jsonb, p_today date)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case
    when (q->'not_now'->>'remind_on') is not null and (q->'not_now'->>'remind_on')::date <= p_today then 'remind:' || (q->'not_now'->>'remind_on')
    when (q->'not_now') is not null then null
    when (q->>'hold_until') is not null and (q->>'hold_until')::date = p_today + 1 then 'hold-1:' || (q->>'hold_until')
    when (q->>'hold_until') is not null and (q->>'hold_until')::date < p_today then null
    when (q->>'sent_at') is not null and p_today - (q->>'sent_at')::date between 1 and 2 and (q->>'seen_at') is null then 'd1'
    when (q->>'sent_at') is not null and p_today - (q->>'sent_at')::date between 3 and 5 then 'd3'
    when (q->>'sent_at') is not null and p_today - (q->>'sent_at')::date between 7 and 9 then 'd7'
    else null end
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_random_token(n integer)
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'public', 'extensions'
AS $function$
  select translate(encode(extensions.gen_random_bytes(n), 'base64'), '+/=', '-_')
$function$
;

CREATE OR REPLACE FUNCTION public.nifti_require_review()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select value from app_secrets where name = 'require_review') = 'true', false) $function$
;

CREATE OR REPLACE FUNCTION public.nifti_route_planner(p_business uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.nifti_has_role(p_business, array['Owner','General Manager','Warehouse Manager','Dispatcher']) $function$
;

CREATE OR REPLACE FUNCTION public.nifti_statement_url(p_supplier uuid, p_buyer uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tok text;
begin
  select token into tok from statement_links where supplier_business_id = p_supplier and buyer_business_id = p_buyer
    and expires_at > now() + interval '7 days' order by created_at desc limit 1;
  if tok is null then
    tok := public.nifti_random_token(24);
    insert into statement_links(token, supplier_business_id, buyer_business_id, created_by_name, expires_at)
      values (tok, p_supplier, p_buyer, 'Automatic reminder', now() + interval '30 days');
  end if;
  return public.nifti_app_url() || '#st/' || tok;
end $function$
;

CREATE OR REPLACE FUNCTION public.nifti_today()
 RETURNS date
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$ select (now() at time zone 'Asia/Manila')::date $function$
;

CREATE OR REPLACE FUNCTION public.nifti_today_ph()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select to_char((now() at time zone 'Asia/Manila')::date, 'YYYY-MM-DD')
$function$
;

CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare from_name text; to_name text;
begin
  select name into from_name from businesses where id = new.from_business;
  select name into to_name from businesses where id = new.to_business;
  if tg_op = 'INSERT' then
    perform public.nifti_notify(new.to_business, '🤝 ' || from_name || ' wants to connect', coalesce(new.note, 'Open Discover to accept or decline.'), './', 'leads');
  elsif new.status = 'accepted' and old.status = 'pending' then
    perform public.nifti_notify(new.from_business, '✅ ' || to_name || ' accepted your request', 'You can message and order from each other now.', './#messages', 'leads');
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c conversations; recipient uuid; sender_name text;
begin
  select * into c from conversations where id = new.conversation_id;
  if c.id is null then return new; end if;
  recipient := case when new.sender_business_id = c.buyer_business_id then c.supplier_business_id else c.buyer_business_id end;
  select name into sender_name from businesses where id = new.sender_business_id;
  perform public.nifti_notify(recipient, coalesce(sender_name, 'New message'),
    case when coalesce(btrim(new.text), '') = '' then '📎 Sent an attachment' else left(new.text, 200) end,
    './#messages', 'messages');
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  buyer_name text; supplier_name text; actor text; target uuid;
  last_action text; msg text; url text := './#orders';
  old_status text := case when tg_op = 'UPDATE' then old.status else null end;
  old_hist int := case when tg_op = 'UPDATE' then jsonb_array_length(coalesce(old.history, '[]'::jsonb)) else 0 end;
  n_pending int; o_pending int; n_conf int; o_conf int; n_rej int; o_rej int;
begin
  select name into buyer_name from businesses where id = new.buyer_business_id;
  select name into supplier_name from businesses where id = new.supplier_business_id;
  actor := coalesce(new.history->-1->>'actor', 'buyer');
  last_action := coalesce(new.history->-1->>'action', '');
  if last_action like '↩ Route stop undone%' then return new; end if; -- a driver fixing a wrong tap: nothing new for anyone
  if new.status is distinct from old_status and new.status <> 'draft' then
    target := case when actor = 'supplier' then new.buyer_business_id else new.supplier_business_id end;
    msg := case new.status
      when 'sent' then '📦 New order ' || new.po_number || ' from ' || buyer_name
      when 'confirmed' then case when actor = 'buyer' then '🎉 ' || buyer_name || ' confirmed ' || new.po_number else '✅ ' || supplier_name || ' confirmed ' || new.po_number end
      when 'quote' then '📝 ' || supplier_name || ' sent order ' || new.po_number || ' for your OK'
      when 'countered' then '💬 ' || case when actor = 'supplier' then supplier_name else buyer_name end || ' proposed a new price on ' || new.po_number
      when 'preparing' then '📦 ' || supplier_name || ' is preparing ' || new.po_number
      when 'shipped' then '🚚 ' || new.po_number || ' is on the way'
      when 'in_customs' then '🚢 ' || new.po_number || ' is at customs'
      when 'delivered' then '📬 ' || new.po_number || ' was delivered'
      when 'partially_delivered' then '⚠ ' || new.po_number || ' was partly delivered'
      when 'invoiced' then '🧾 ' || supplier_name || ' sent the invoice for ' || new.po_number
      when 'paid' then '💰 ' || new.po_number || ' is fully paid'
      when 'cancelled' then '✕ ' || new.po_number || ' was cancelled'
      else new.po_number || ' was updated' end;
    perform public.nifti_notify(target, msg, left(last_action, 200), url, 'orders', null, null);
    if new.status = 'shipped' and last_action like '🚚 Picked up by%' then
      perform public.nifti_notify(new.supplier_business_id, msg, left(last_action, 200), url, 'orders', null, null);
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    n_pending := public.nifti_count_payments(new.invoice, new.deposit_payments, 'pending');
    o_pending := public.nifti_count_payments(old.invoice, old.deposit_payments, 'pending');
    n_conf := public.nifti_count_payments(new.invoice, new.deposit_payments, 'confirmed');
    o_conf := public.nifti_count_payments(old.invoice, old.deposit_payments, 'confirmed');
    n_rej := public.nifti_count_payments(new.invoice, new.deposit_payments, 'rejected');
    o_rej := public.nifti_count_payments(old.invoice, old.deposit_payments, 'rejected');
    if n_pending > o_pending and coalesce(new.invoice->'payments'->-1->>'submittedBy', '') = 'supplier' then
      null; -- the supplier's own staff recorded it (e.g. a cheque collected on a route)
    elsif n_pending > o_pending then
      perform public.nifti_notify(new.supplier_business_id, '💳 ' || buyer_name || ' says they paid for ' || new.po_number, 'Check your account, then confirm it in Nifti.', url, 'orders');
    elsif n_conf > o_conf then
      perform public.nifti_notify(new.buyer_business_id, '✅ ' || supplier_name || ' confirmed your payment', new.po_number, url, 'orders');
    elsif n_rej > o_rej then
      perform public.nifti_notify(new.buyer_business_id, '⚠ ' || supplier_name || ' says a payment didn''t arrive', new.po_number || ': ' || left(last_action, 160), url, 'orders');
    elsif jsonb_array_length(coalesce(new.history, '[]'::jsonb)) > old_hist then
      if last_action like '🕒 Not yet%' then
        perform public.nifti_notify(new.supplier_business_id, '🕒 ' || buyer_name || ' isn''t ready yet', left(last_action, 200), './#followups', 'orders');
      elsif last_action like '💬 Buyer note%' then
        perform public.nifti_notify(new.supplier_business_id, '💬 ' || buyer_name || ' about ' || new.po_number, left(last_action, 200), url, 'orders');
      elsif last_action like '👀%' or last_action like '💬 Note from%' then
        perform public.nifti_notify(new.buyer_business_id, case when last_action like '👀%' then supplier_name || ' opened ' || new.po_number else '💬 ' || supplier_name || ' about ' || new.po_number end, left(last_action, 200), url, 'orders');
      elsif last_action like '📦 Delivered by%' or last_action like '💬 Delivery note%' then
        perform public.nifti_notify(new.buyer_business_id, '📦 ' || new.po_number || ' delivery update', left(last_action, 200), url, 'orders');
        perform public.nifti_notify(new.supplier_business_id, '📦 ' || new.po_number || ' delivery update', left(last_action, 200), url, 'orders');
      end if;
    end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_on_team_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.nifti_notify(new.business_id, case when new.kind = 'handoff' then '📝 Note from ' else '💬 ' end || new.author_name || ' (team)', left(new.body, 200), './#team', 'team', null, new.author_id);
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_on_team_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.assigned_to is not null and new.assigned_to is distinct from new.created_by then
    perform public.nifti_notify(new.business_id, '✅ New task from ' || coalesce(new.created_by_name, 'your team'), new.title, './#team', 'team', new.assigned_to, null);
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_support_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare biz text; prio boolean;
begin
  select name into biz from businesses where id = new.business_id;
  prio := public.business_plan(new.business_id) = 'business';
  insert into notification_outbox(business_id, title, body, url, category)
    values (new.business_id, left(case when prio then '⭐ PRIORITY · ' else '' end || 'Nifti support: ' || coalesce(biz, 'a business') || coalesce(' (' || new.category || ')', ''), 120),
            left(coalesce(new.message, '') || E'\n\nFrom: ' || coalesce(new.from_name, 'unknown') || ' at ' || coalesce(biz, '?') || E'\nBusiness id: ' || new.business_id, 2000),
            './', 'support');
  perform public.nifti_kick_dispatch();
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.nudge_buyer_restock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered'
     and exists (select 1 from businesses where id = new.buyer_business_id and not is_outside)
     and not exists (select 1 from notification_outbox where business_id = new.buyer_business_id and title like '📣%' and created_at > now() - interval '20 hours') then
    perform public.nifti_notify(new.buyer_business_id, '📣 New stock in? Tell your customers',
      'Your post for ' || new.po_number || ' is ready. Open the order and tap "Tell your customers" to share it on FB or Viber.', './#orders', 'orders');
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.payroll_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r payroll_runs;
begin
  if tg_table_name = 'payroll_runs' then
    if tg_op = 'DELETE' then if old.status = 'paid' then raise exception 'A paid payroll stays in the history.'; end if; return old; end if;
    if tg_op = 'UPDATE' and old.status = 'paid' then raise exception 'This payroll is already paid.'; end if;
    if new.status = 'paid' then
      if new.paid_on is null or new.paid_from is null then raise exception 'Say when and how it was paid.'; end if;
      if public.nifti_month_locked(new.business_id, new.paid_on) then raise exception 'That month is closed. Ask the owner to reopen it first.'; end if;
      new.paid_by_name := public.nifti_member_name(new.business_id);
    end if;
    if tg_op = 'INSERT' then new.created_by_name := public.nifti_member_name(new.business_id); end if;
    return new;
  end if;
  select * into r from payroll_runs where id = coalesce(new.run_id, old.run_id);
  if r.status = 'paid' then raise exception 'This payroll is already paid.'; end if;
  if tg_op = 'DELETE' then return old; end if;
  new.business_id := r.business_id;
  new.gross := round(case when new.basis = 'month' then new.rate * case when new.days > 0 then new.days else 1 end else new.rate * new.days end + new.extra, 2);
  new.net := new.gross - new.vale_deduct - new.contrib_employee - new.other_deduct;
  if new.net < 0 then raise exception 'Deductions are more than the pay for %.', new.staff_name; end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.plan_features(p_plan text)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case
    when p_plan in ('pro','supplier_pro','buyer_pro') then array['statements','bir2307','store_insights','store_promos','auto_reminders','late_payers','full_history','credit_limits',
         'cheques','routes','price_blast','credit_memos','reorder_reminders','vat_books','reconcile','watchdog','market_price','price_alerts','spending_caps','scorecard','owner_books']
    when p_plan = 'business' then array['statements','bir2307','store_insights','store_promos','auto_reminders','late_payers','full_history','credit_limits',
         'watchdog','market_price','price_alerts','verified_badge','priority_support','featured_listing','setup_service',
         'cheques','routes','price_blast','credit_memos','reorder_reminders','vat_books','spending_caps','scorecard','reconcile','owner_books']
    else array[]::text[] end
$function$
;

CREATE OR REPLACE FUNCTION public.plan_label(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when p in ('pro','supplier_pro','buyer_pro') then 'Pro' when p = 'business' then 'Business' else 'Free' end
$function$
;

CREATE OR REPLACE FUNCTION public.plan_price(p_plan text, p_cycle text)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when p_plan = 'business' then (case when p_cycle = 'yearly' then 29900 else 2990 end)
              when p_plan in ('pro','supplier_pro','buyer_pro') then (case when p_cycle = 'yearly' then 9900 else 990 end) else 0 end
$function$
;

CREATE OR REPLACE FUNCTION public.plan_seat_limit(p_plan text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when p_plan = 'business' then 50 when p_plan in ('pro','supplier_pro','buyer_pro') then 15 else 3 end
$function$
;

CREATE OR REPLACE FUNCTION public.post_manual_journal(p_date date, p_memo text, p_lines jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); id uuid; who text;
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner side can post journal entries.'; end if;
  if p_date is null or p_date > public.nifti_today() + 31 then raise exception 'Pick a date.'; end if;
  if length(btrim(coalesce(p_memo, ''))) < 3 then raise exception 'Say what this entry is for.'; end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 or jsonb_array_length(p_lines) > 40 then raise exception 'An entry needs 2 to 40 lines.'; end if;
  if public.nifti_month_locked(me, p_date) then raise exception 'That month is closed. Reopen it first, or date the entry in an open month.'; end if;
  if exists (select 1 from jsonb_array_elements(p_lines) l where coalesce((l->>'d')::numeric, 0) < 0 or coalesce((l->>'c')::numeric, 0) < 0 or (coalesce((l->>'d')::numeric, 0) > 0 and coalesce((l->>'c')::numeric, 0) > 0)) then
    raise exception 'Each line is either a debit or a credit, not both.'; end if;
  if exists (select 1 from jsonb_array_elements(p_lines) l join ledger_accounts a on a.business_id = me and a.code = l->>'a' where not a.active) then raise exception 'One of the accounts is switched off.'; end if;
  who := public.nifti_member_name(me);
  id := public.ledger_post(me, 'manual', 'manual', null, p_date, btrim(p_memo), null,
    (select jsonb_agg(jsonb_build_object('a', l->>'a', 'd', round(coalesce((l->>'d')::numeric, 0), 2), 'c', round(coalesce((l->>'c')::numeric, 0), 2), 'p', l->>'p', 'm', l->>'m')) from jsonb_array_elements(p_lines) l), null, null, who);
  insert into audit_log(business_id, action, entity_type, entity_id, field, new_value, actor) values (me, 'journal_posted', 'journal', id::text, 'manual', to_jsonb(left(p_memo, 120)), coalesce(who, 'someone'));
  return id;
end $function$
;

CREATE OR REPLACE FUNCTION public.pro_summary_lines(p_business uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare lines text[] := array[]::text[]; today date := public.nifti_today(); c int; a numeric; names text; t text;
begin
  select type into t from businesses where id = p_business;
  if public.has_feature(p_business, 'cheques') then
    select count(*), coalesce(sum(amount),0) into c, a from public.nifti_cheques() where supplier_id = p_business and status = 'pending' and deposited_at is null and check_date <= today;
    if c > 0 then lines := lines || ('🏦 ' || c || ' cheque' || case when c > 1 then 's' else '' end || ' to deposit today (' || public.nifti_peso(a) || ')'); end if;
    select count(*), coalesce(sum(amount),0) into c, a from public.nifti_cheques() where buyer_id = p_business and status = 'pending' and check_date between today and today + 2;
    if c > 0 then lines := lines || ('💳 ' || public.nifti_peso(a) || ' in your cheques gets deposited within 2 days'); end if;
  end if;
  if t = 'supplier' and public.has_feature(p_business, 'reorder_reminders') then
    select count(*), string_agg(buyer_name, ', ') into c, names from (select buyer_name from public.reorder_due(p_business) limit 3) x;
    if c > 0 then lines := lines || ('🔁 Due to reorder: ' || names); end if;
  end if;
  if t = 'supplier' then
    select count(*) into c from route_stops s join routes r on r.id = s.route_id where r.business_id = p_business and r.route_date = today and s.status = 'pending';
    if c > 0 then lines := lines || ('🚚 ' || c || ' route stop' || case when c > 1 then 's' else '' end || ' today'); end if;
  end if;
  return lines;
end $function$
;

CREATE OR REPLACE FUNCTION public.record_customer_order(p_buyer uuid, p_name text, p_phone text, p_email text, p_address text, p_items jsonb, p_ref text, p_needed_by date, p_notes text, p_tax_rate numeric DEFAULT 0, p_tentative boolean DEFAULT false, p_hold_until date DEFAULT NULL::date, p_allow_edit boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); sup businesses; buyer businesses; who text; phone text; email text;
  it jsonb; lines jsonb := '[]'::jsonb; qty numeric; price numeric; poid uuid; ponum text; tok text; ref text; member text;
begin
  select * into sup from businesses where id = me;
  if sup.id is null or sup.is_outside then raise exception 'Sign in first.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Add at least one item.'; end if;
  if p_hold_until is not null and (p_hold_until < (now() at time zone 'Asia/Manila')::date or p_hold_until > (now() at time zone 'Asia/Manila')::date + 90) then raise exception 'Pick a price-hold date in the next 90 days.'; end if;
  if jsonb_array_length(p_items) > 200 then raise exception 'That''s a lot of items. Please split it into two orders.'; end if;
  select name into member from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  ref := nullif(left(btrim(regexp_replace(coalesce(p_ref,''), '[<>"`]', '', 'g')), 60), '');
  if p_buyer is not null then
    select * into buyer from businesses where id = p_buyer;
    if buyer.id is null or not (exists (select 1 from business_relationships where supplier_business_id = me and buyer_business_id = p_buyer)
                                or (buyer.is_outside and buyer.created_by_business = me)) then raise exception 'That customer isn''t one of yours.'; end if;
  else
    who := left(btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g')), 120);
    phone := public.nifti_ph_mobile(p_phone);
    email := nullif(lower(btrim(coalesce(p_email, ''))), '');
    if email is not null and email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email doesn''t look right.'; end if;
    if length(who) < 2 then raise exception 'Who is this order from?'; end if;
    if phone is not null then
      select * into buyer from businesses where is_outside and type = 'buyer' and created_by_business = me and outside_contact->>'phone' = phone limit 1;
    end if;
    if buyer.id is null then
      select * into buyer from businesses where is_outside and type = 'buyer' and created_by_business = me and lower(name) = lower(who) limit 1;
    end if;
    if buyer.id is null then
      insert into businesses(name, type, is_outside, outside_contact, created_by_business, claim_code)
        values (who, 'buyer', true, jsonb_strip_nulls(jsonb_build_object('name', who, 'phone', phone, 'email', email, 'address', nullif(btrim(coalesce(p_address,'')), ''))), me, public.nifti_random_token(12))
        returning * into buyer;
    else
      update businesses set outside_contact = coalesce(outside_contact, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object('phone', phone, 'email', email)) where id = buyer.id and is_outside;
    end if;
  end if;
  for it in select value from jsonb_array_elements(p_items) loop
    qty := nullif(it->>'qty','')::numeric; price := coalesce(nullif(it->>'unitPrice','')::numeric, 0);
    if qty is null or qty <= 0 or qty > 10000000 then raise exception 'Check the quantity for %.', coalesce(it->>'product', 'an item'); end if;
    if price < 0 or price > 100000000 then raise exception 'Check the price for %.', coalesce(it->>'product', 'an item'); end if;
    if length(btrim(coalesce(it->>'product',''))) < 1 then raise exception 'One of the items has no name.'; end if;
    lines := lines || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('product', left(btrim(it->>'product'), 160), 'qty', qty, 'unitPrice', price,
      'unit', nullif(left(coalesce(it->>'unit',''), 20), ''), 'customerText', nullif(left(coalesce(it->>'customerText',''), 200), ''))));
  end loop;
  insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer.id, me) on conflict do nothing;
  insert into conversations(buyer_business_id, supplier_business_id) values (buyer.id, me) on conflict do nothing;
  insert into purchase_orders(buyer_business_id, supplier_business_id, type, status, currency, tax_rate, line_items, created_date, requested_delivery_date,
      delivery_address, notes, customer_ref, quote, history)
    values (buyer.id, me, 'local', case when p_tentative then 'quote' else 'confirmed' end, 'PHP', greatest(0, least(coalesce(p_tax_rate, 0), 0.2)), lines, (now() at time zone 'Asia/Manila')::date, p_needed_by,
      nullif(left(btrim(coalesce(p_address, '')), 300), ''), nullif(left(btrim(coalesce(p_notes, '')), 1000), ''), ref,
      case when p_tentative then jsonb_strip_nulls(jsonb_build_object('sent_at', (now() at time zone 'Asia/Manila')::date, 'hold_until', p_hold_until, 'allow_edit', coalesce(p_allow_edit, true), 'by', member, 'nudges', '[]'::jsonb)) end,
      jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier',
        'action', '📄 Entered from ' || buyer.name || '''s PO' || coalesce(' #' || ref, '') || coalesce(' by ' || member, '') || case when p_tentative then ' · waiting for their OK' || coalesce(' (price held until ' || to_char(p_hold_until, 'Mon DD') || ')', '') else ' · confirmed' end)))
    returning id, po_number into poid, ponum;
  tok := public.nifti_random_token(24);
  insert into order_links(token, po_id, created_by_business, expires_at) values (tok, poid, me, now() + interval '120 days');
  if not buyer.is_outside and not p_tentative then
    perform public.nifti_notify(buyer.id, '📄 ' || sup.name || ' confirmed your order', ponum || coalesce(' (your PO #' || ref || ')', ''), './#orders', 'orders');
  end if;
  return jsonb_build_object('po_id', poid, 'po_number', ponum, 'token', tok, 'buyer_id', buyer.id, 'buyer_name', buyer.name);
end $function$
;

CREATE OR REPLACE FUNCTION public.record_opening_balances(p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); sup businesses; buyer businesses; r jsonb; who text; phone text; email text;
  amt numeric; due date; ref text; today date := (now() at time zone 'Asia/Manila')::date; poid uuid; ponum text;
  out_rows jsonb := '[]'::jsonb; total numeric := 0; member text; n int := 0;
begin
  select * into sup from businesses where id = me;
  if sup.id is null or sup.is_outside then raise exception 'Sign in first.'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then raise exception 'Add at least one customer.'; end if;
  if jsonb_array_length(p_rows) > 100 then raise exception 'Please add up to 100 customers at a time.'; end if;
  select name into member from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  for r in select value from jsonb_array_elements(p_rows) loop
    buyer := null;
    amt := round(nullif(regexp_replace(coalesce(r->>'amount',''), '[^0-9.]', '', 'g'), '')::numeric, 2);
    if amt is null or amt < 1 or amt > 100000000 then raise exception 'Check the amount for %.', coalesce(nullif(r->>'name',''), 'one of the customers'); end if;
    begin due := (r->>'due')::date; exception when others then due := null; end;
    if due is null then raise exception 'Pick when % should pay.', coalesce(nullif(r->>'name',''), 'each customer'); end if;
    if due < today - 1095 or due > today + 365 then raise exception 'Check the due date for %.', coalesce(nullif(r->>'name',''), 'one of the customers'); end if;
    ref := nullif(left(btrim(regexp_replace(coalesce(r->>'ref',''), '[<>"`]', '', 'g')), 40), '');
    if nullif(r->>'buyer_id','') is not null then
      select * into buyer from businesses where id = (r->>'buyer_id')::uuid;
      if buyer.id is null or not (exists (select 1 from business_relationships where supplier_business_id = me and buyer_business_id = buyer.id)
                                  or (buyer.is_outside and buyer.created_by_business = me)) then raise exception 'That customer isn''t one of yours.'; end if;
    else
      who := left(btrim(regexp_replace(coalesce(r->>'name',''), '[<>"`]', '', 'g')), 120);
      if length(who) < 2 then raise exception 'Type the customer''s name.'; end if;
      phone := public.nifti_ph_mobile(r->>'phone');
      email := nullif(lower(btrim(coalesce(r->>'email', ''))), '');
      if email is not null and email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'The email for % doesn''t look right.', who; end if;
      if phone is not null then
        select * into buyer from businesses where is_outside and type = 'buyer' and created_by_business = me and outside_contact->>'phone' = phone limit 1;
      end if;
      if buyer.id is null then
        select * into buyer from businesses where is_outside and type = 'buyer' and created_by_business = me and lower(name) = lower(who) limit 1;
      end if;
      if buyer.id is null then
        select b.* into buyer from businesses b join business_relationships rel on rel.buyer_business_id = b.id and rel.supplier_business_id = me
          where not b.is_outside and lower(b.name) = lower(who) limit 1;
      end if;
      if buyer.id is null then
        insert into businesses(name, type, is_outside, outside_contact, created_by_business, claim_code)
          values (who, 'buyer', true, jsonb_strip_nulls(jsonb_build_object('name', who, 'phone', phone, 'email', email)), me, public.nifti_random_token(12))
          returning * into buyer;
      elsif buyer.is_outside then
        update businesses set outside_contact = coalesce(outside_contact, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object('phone', phone, 'email', email)) where id = buyer.id;
      end if;
    end if;
    if ref is not null and exists (select 1 from purchase_orders where supplier_business_id = me and buyer_business_id = buyer.id
        and invoice->>'opening' = 'true' and invoice->>'number' = ref and status <> 'cancelled') then
      raise exception '% is already added for %.', ref, buyer.name;
    end if;
    insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer.id, me) on conflict do nothing;
    insert into conversations(buyer_business_id, supplier_business_id) values (buyer.id, me) on conflict do nothing;
    insert into purchase_orders(buyer_business_id, supplier_business_id, type, status, currency, tax_rate, line_items, created_date, notes, customer_ref, history)
      values (buyer.id, me, 'local', 'invoiced', 'PHP', 0,
        jsonb_build_array(jsonb_build_object('product', 'Balance from before Nifti' || coalesce(' (' || ref || ')', ''), 'qty', 1, 'unitPrice', amt)),
        today, 'Balance carried over from before Nifti.', ref,
        jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier',
          'action', '📒 Balance from before Nifti: ' || public.nifti_peso(amt) || ', due ' || to_char(due, 'Mon DD, YYYY') || coalesce(' · added by ' || member, ''))))
      returning id, po_number into poid, ponum;
    update purchase_orders set invoice = jsonb_build_object('number', coalesce(ref, 'BAL-' || regexp_replace(ponum, '^PO-', '')), 'status', 'unpaid',
        'dueDate', to_char(due, 'YYYY-MM-DD'), 'issuedDate', to_char(today, 'YYYY-MM-DD'), 'statedTotal', amt, 'payments', '[]'::jsonb, 'opening', true, 'attachmentName', null)
      where id = poid;
    out_rows := out_rows || jsonb_build_array(jsonb_build_object('po_id', poid, 'po_number', ponum, 'buyer_id', buyer.id, 'buyer_name', buyer.name, 'amount', amt, 'due', due));
    total := total + amt; n := n + 1;
  end loop;
  return jsonb_build_object('count', n, 'total', total, 'rows', out_rows);
end $function$
;

CREATE OR REPLACE FUNCTION public.remit_route(p_route uuid, p_cash numeric, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r routes; exp_cash numeric; chq numeric; chq_n int; who text; diff numeric; rem jsonb;
begin
  select * into r from routes where id = p_route for update;
  if r.id is null or not public.nifti_has_role(r.business_id, array['Owner','General Manager','Finance']) then raise exception 'Only an Owner, General Manager or Finance can confirm remittance.'; end if;
  select coalesce(sum(case when result->'collected'->>'method' = 'cash' then (result->'collected'->>'amount')::numeric end), 0),
         coalesce(sum(case when result->'collected'->>'method' = 'check' then (result->'collected'->>'amount')::numeric end), 0),
         count(*) filter (where result->'collected'->>'method' = 'check')
    into exp_cash, chq, chq_n from route_stops where route_id = r.id and status = 'done';
  select name into who from team_members where auth_user_id = auth.uid() and business_id = r.business_id limit 1;
  diff := round(coalesce(p_cash, 0) - exp_cash, 2);
  rem := jsonb_build_object('expected_cash', exp_cash, 'counted_cash', coalesce(p_cash,0), 'diff', diff, 'cheques', chq_n, 'cheque_amount', chq, 'by', who, 'at', now(), 'note', left(p_note, 300));
  update routes set remit = rem, updated_at = now() where id = r.id;
  if abs(diff) >= 1 then
    perform public.nifti_notify(r.business_id, case when diff < 0 then '⚠ Remittance short ' || public.nifti_peso(-diff) else 'Remittance over by ' || public.nifti_peso(diff) end,
      coalesce(r.driver_name,'Driver') || '''s route on ' || to_char(r.route_date, 'Mon DD') || ': expected ' || public.nifti_peso(exp_cash) || ', counted ' || public.nifti_peso(coalesce(p_cash,0)) || '.', './#routes', 'orders');
  end if;
  return rem;
end $function$
;

CREATE OR REPLACE FUNCTION public.remove_opening_balance(p_po uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare po purchase_orders;
begin
  select * into po from purchase_orders where id = p_po and supplier_business_id = public.nifti_my_business();
  if po.id is null or coalesce(po.invoice->>'opening','') <> 'true' then raise exception 'That isn''t one of your opening balances.'; end if;
  if jsonb_array_length(coalesce(po.invoice->'payments','[]'::jsonb)) > 0 then raise exception 'A payment is already recorded on it, so it can''t be removed.'; end if;
  delete from payment_reminder_log where po_id = po.id;
  delete from reminder_log where po_id = po.id;
  begin
    delete from purchase_orders where id = po.id;
  exception when foreign_key_violation then
    update purchase_orders set status = 'cancelled', history = coalesce(history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier', 'action', 'Removed: entered by mistake')) where id = po.id;
  end;
end $function$
;

CREATE OR REPLACE FUNCTION public.reopen_cash_count(p_day date, p_drawer text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner can reopen a day.'; end if;
  update cash_counts set reopened_at = now(), reopened_by_name = public.nifti_member_name(me)
   where business_id = me and count_day = p_day and drawer = coalesce(nullif(btrim(p_drawer), ''), 'Main');
  insert into audit_log(business_id, action, entity_type, entity_id, field, actor)
    values (me, 'cash_reopened', 'cash_count', p_day::text, coalesce(nullif(btrim(p_drawer), ''), 'Main'), coalesce(public.nifti_member_name(me), 'owner'));
end $function$
;

CREATE OR REPLACE FUNCTION public.reopen_period(p_month date, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); m date := date_trunc('month', p_month)::date; who text;
begin
  if me is null or not exists (select 1 from team_members where business_id = me and auth_user_id = auth.uid() and status = 'active' and roles && array['Owner','General Manager']) then
    raise exception 'Only the owner or general manager can reopen a closed month.'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Say why it needs reopening.'; end if;
  who := public.nifti_member_name(me);
  update accounting_periods set status = 'open', reopened_at = now(), reopened_by_name = who, reopen_reason = left(btrim(p_reason), 300) where business_id = me and period = m and status = 'locked';
  if not found then raise exception 'That month is not closed.'; end if;
  insert into audit_log(business_id, action, entity_type, entity_id, field, new_value, actor) values (me, 'period_reopened', 'period', m::text, 'reason', to_jsonb(left(p_reason, 200)), coalesce(who, 'someone'));
end $function$
;

CREATE OR REPLACE FUNCTION public.reopen_route_stop(p_stop uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s route_stops;
begin
  select * into s from route_stops where id = p_stop;
  if s.id is null or not public.nifti_route_planner(s.business_id) then raise exception 'Only an Owner or Manager can reopen a stop.'; end if;
  if s.status <> 'failed' then raise exception 'Only a stop that wasn''t done can be reopened. Payments already recorded stay on the invoice.'; end if;
  update route_stops set status = 'pending', result = null, proof = null, done_at = null, done_by = null where id = s.id;
  update routes set status = 'on_road', updated_at = now() where id = s.route_id and status = 'done';
end $function$
;

CREATE OR REPLACE FUNCTION public.reorder_due(p_business uuid)
 RETURNS TABLE(buyer_id uuid, buyer_name text, orders integer, usual_gap integer, days_since integer, last_order date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with d as (select distinct po.buyer_business_id b, po.created_date d from purchase_orders po
             where po.supplier_business_id = p_business and po.status not in ('draft','cancelled') and po.created_date > public.nifti_today() - 240),
  g as (select b, d, d - lag(d) over (partition by b order by d) gap from d),
  s as (select b, count(*)::int n, percentile_cont(0.5) within group (order by gap) filter (where gap is not null) med, max(d) last from g group by b)
  select s.b, bz.name, s.n, round(s.med)::int, (public.nifti_today() - s.last)::int, s.last
  from s join businesses bz on bz.id = s.b
  where s.n >= 3 and s.med is not null and (public.nifti_today() - s.last) >= greatest(s.med * 1.3, s.med + 3) and (public.nifti_today() - s.last) <= s.med * 4 + 14
  order by (public.nifti_today() - s.last) - s.med desc $function$
;

CREATE OR REPLACE FUNCTION public.report_payment_by_link(p_token text, p_amount numeric, p_method text, p_reference text, p_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l statement_links; left_amt numeric; po record; room numeric; part numeric; pending numeric; ref text; who text; total numeric := 0; cnt int := 0; sup businesses; b businesses;
begin
  select * into l from statement_links where token = p_token and expires_at > now();
  if l.token is null then raise exception 'This link has expired. Ask for a new statement.'; end if;
  if p_method not in ('gcash','maya','bank_transfer','bank_deposit','cash','check','grabpay','shopeepay','remittance') then raise exception 'Pick how you paid.'; end if;
  if coalesce(p_amount, 0) <= 0 then raise exception 'Enter the amount you paid.'; end if;
  ref := nullif(left(btrim(regexp_replace(coalesce(p_reference,''), '[<>"`]', '', 'g')), 64), '');
  who := nullif(left(btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g')), 60), '');
  if p_method <> 'cash' and ref is null then raise exception 'Enter the reference number so they can find it in their account.'; end if;
  if (select count(*) from purchase_orders where supplier_business_id = l.supplier_business_id and buyer_business_id = l.buyer_business_id
      and history::text like '%via statement link%' and updated_at > now() - interval '1 day') >= 6 then
    raise exception 'You''ve reported several payments today. Please message them directly.';
  end if;
  left_amt := round(p_amount, 2);
  for po in select id, invoice, po_number from purchase_orders where supplier_business_id = l.supplier_business_id and buyer_business_id = l.buyer_business_id
            and invoice is not null and coalesce(invoice->>'status','') <> 'paid' and status not in ('paid','cancelled','draft')
            order by coalesce(public.nifti_iso_date(invoice->>'dueDate'), created_date) for update loop
    exit when left_amt < 0.01;
    select coalesce(sum((p->>'amount')::numeric), 0) into pending from jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb)) p where p->>'confirmStatus' = 'pending';
    room := public.nifti_invoice_balance(po.invoice) - pending;
    if room < 0.01 then continue; end if;
    part := least(room, left_amt);
    update purchase_orders set invoice = jsonb_set(invoice, '{payments}', coalesce(invoice->'payments', '[]'::jsonb) || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'id', 'L' || public.nifti_random_token(10), 'method', p_method, 'amount', part, 'reference', ref, 'date', public.nifti_today_ph(),
        'confirmStatus', 'pending', 'checkStatus', case when p_method = 'check' then 'pending' end, 'submittedBy', 'buyer', 'via', 'link')))),
      history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'buyer',
        'action', 'Payment reported via statement link' || coalesce(' by ' || who, '') || ': ' || p_method || ' ' || public.nifti_peso(part) || coalesce(' (ref ' || ref || ')', '') || ', waiting for you to confirm')),
      updated_at = now()
    where id = po.id;
    left_amt := left_amt - part; total := total + part; cnt := cnt + 1;
  end loop;
  if cnt = 0 then raise exception 'There''s nothing left to pay on this statement. If you paid something else, message them directly.'; end if;
  select * into sup from businesses where id = l.supplier_business_id;
  select * into b from businesses where id = l.buyer_business_id;
  perform public.nifti_notify(sup.id, '💸 ' || b.name || ' says they paid ' || public.nifti_peso(total),
    p_method || coalesce(' ref ' || ref, '') || '. Check your account, then confirm it on the order.', './#collections', 'orders');
  return jsonb_build_object('applied', total, 'extra', greatest(left_amt, 0), 'invoices', cnt);
end $function$
;

CREATE OR REPLACE FUNCTION public.report_payment_by_order_link(p_token text, p_amount numeric, p_method text, p_reference text, p_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l order_links; po purchase_orders; sup businesses; room numeric; part numeric; ref text; who text; entry jsonb; amt numeric;
begin
  select * into l from order_links where token = p_token and revoked_at is null and expires_at > now() and coalesce(kind,'order') = 'order';
  if l.token is null then raise exception 'This link has expired. Ask for a new one.'; end if;
  select * into po from purchase_orders where id = l.po_id for update;
  select * into sup from businesses where id = po.supplier_business_id;
  if po.id is null or sup.is_outside then raise exception 'This order can''t take payments here.'; end if;
  if po.status not in ('confirmed','preparing','shipped','in_customs','delivered','partially_delivered','invoiced') then raise exception 'This order isn''t ready for payment yet.'; end if;
  if p_method not in ('gcash','maya','bank_transfer','bank_deposit','cash','check','grabpay','shopeepay','remittance') then raise exception 'Pick how you paid.'; end if;
  amt := round(coalesce(p_amount, 0), 2);
  if amt <= 0 then raise exception 'Enter the amount you paid.'; end if;
  ref := nullif(left(btrim(regexp_replace(coalesce(p_reference,''), '[<>"`]', '', 'g')), 64), '');
  who := nullif(left(btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g')), 60), '');
  if p_method <> 'cash' and ref is null then raise exception 'Enter the reference number so they can find it in their account.'; end if;
  if (select count(*) from jsonb_array_elements(coalesce(po.history,'[]'::jsonb)) h where h->>'action' like '%via order link%' and h->>'date' = public.nifti_today_ph()) >= 4 then
    raise exception 'You''ve reported several payments today. Please message them directly.';
  end if;
  if po.invoice is not null then
    if po.invoice->>'status' = 'paid' then raise exception 'This order is already paid.'; end if;
    room := public.nifti_open_balance(po.invoice);
  else
    room := public.nifti_po_total(po) - coalesce((select sum((p->>'amount')::numeric) from jsonb_array_elements(coalesce(po.deposit_payments,'[]'::jsonb)) p where coalesce(p->>'confirmStatus','confirmed') <> 'rejected'), 0);
  end if;
  if room < 0.01 then raise exception 'There''s nothing left to pay on this order. If you paid something else, message them.'; end if;
  part := least(room, amt);
  entry := jsonb_strip_nulls(jsonb_build_object('id', 'L' || public.nifti_random_token(10), 'method', p_method, 'amount', part, 'reference', ref, 'date', public.nifti_today_ph(),
    'confirmStatus', 'pending', 'checkStatus', case when p_method = 'check' then 'pending' end, 'submittedBy', 'buyer', 'via', 'link'));
  if po.invoice is not null then
    update purchase_orders set invoice = jsonb_set(invoice, '{payments}', coalesce(invoice->'payments', '[]'::jsonb) || jsonb_build_array(entry)) where id = po.id;
  else
    update purchase_orders set deposit_payments = coalesce(deposit_payments, '[]'::jsonb) || jsonb_build_array(entry) where id = po.id;
  end if;
  update purchase_orders set history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'buyer',
      'action', '💳 Payment reported via order link' || coalesce(' by ' || who, '') || ': ' || p_method || ' ' || public.nifti_peso(part) || coalesce(' (ref ' || ref || ')', '') || ', waiting for you to confirm')),
    updated_at = now()
  where id = po.id;
  return jsonb_build_object('applied', part, 'extra', greatest(amt - part, 0));
end $function$
;

CREATE OR REPLACE FUNCTION public.request_connection(p_to uuid, p_note text DEFAULT NULL::text, p_as text DEFAULT 'buyer'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); me_type text; to_b businesses; rid uuid;
begin
  if me is null then raise exception 'Please sign in first.'; end if;
  select type into me_type from businesses where id = me;
  select * into to_b from businesses where id = p_to;
  if to_b.id is null or not to_b.catalog_public or to_b.is_outside then raise exception 'That business isn''t accepting requests.'; end if;
  if exists(select 1 from business_relationships r where (r.buyer_business_id = me and r.supplier_business_id = p_to) or (r.buyer_business_id = p_to and r.supplier_business_id = me)) then
    raise exception 'You''re already connected.'; end if;
  insert into connection_requests(from_business, to_business, note, from_role)
    values (me, p_to, nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>]', '', 'g')), 300), ''), case when p_as = 'supplier' then 'supplier' else 'buyer' end)
    on conflict (from_business, to_business) where status = 'pending' do update set note = excluded.note, from_role = excluded.from_role
    returning id into rid;
  return rid;
end $function$
;

CREATE OR REPLACE FUNCTION public.request_service(p_kind text, p_details jsonb, p_method text, p_reference text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); amt numeric; rid uuid; who text; biz text; d jsonb; prio boolean;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can do this.'; end if;
  if p_kind not in ('setup','verify') then raise exception 'Pick a service.'; end if;
  if exists (select 1 from service_requests where business_id = me and kind = p_kind and status in ('pending','in_progress')) then
    raise exception 'You already have one open. We''ll update you soon.'; end if;
  amt := public.service_amount_due(me, p_kind);
  if amt > 0 and length(btrim(coalesce(p_reference,''))) < 4 then raise exception 'Enter the reference number from your payment.'; end if;
  -- keep only short text fields
  select coalesce(jsonb_object_agg(k, left(regexp_replace(v, '[<>]', '', 'g'), 3000)), '{}'::jsonb) into d
    from (select key k, value #>> '{}' v from jsonb_each(coalesce(p_details, '{}'::jsonb)) limit 12) t where v is not null;
  if p_kind = 'verify' and (length(coalesce(d->>'registered_name','')) < 3 or length(coalesce(d->>'reg_number','')) < 4 or length(coalesce(d->>'address','')) < 6) then
    raise exception 'Fill in your registered name, DTI/SEC number and business address.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  select name into biz from businesses where id = me;
  insert into service_requests(business_id, kind, amount, method, reference, details, created_by_name)
    values (me, p_kind, amt, left(regexp_replace(coalesce(p_method,''), '[<>]', '', 'g'), 40), nullif(left(regexp_replace(btrim(coalesce(p_reference,'')), '[<>]', '', 'g'), 80), ''), d, who)
    returning id into rid;
  prio := public.business_plan(me) = 'business';
  insert into notification_outbox(business_id, title, body, url, category)
    values (me, left(case when prio then '⭐ PRIORITY · ' else '' end || case p_kind when 'setup' then '🛠 Setup request: ' else '✔ Verification request: ' end || biz, 120),
      left(biz || case when amt > 0 then ' says they paid ₱' || to_char(amt, 'FM999,999') || ' by ' || coalesce(p_method,'?') || ', reference ' || coalesce(p_reference,'') else ' (included in their plan)' end
        || E'.\nSent by ' || coalesce(who,'?') || E'\n\n' || (select string_agg(k || ': ' || v, E'\n') from (select key k, value #>> '{}' v from jsonb_each(d)) t)
        || E'\n\nHandle it in Nifti → Settings → Customers & upgrades.', 2000), './', 'support');
  perform public.nifti_kick_dispatch();
  return rid;
end $function$
;

CREATE OR REPLACE FUNCTION public.request_upgrade(p_plan text, p_cycle text, p_method text, p_reference text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); rid uuid; who text; biz text; amt numeric;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can upgrade.'; end if;
  if p_plan not in ('pro','supplier_pro','buyer_pro','business') or p_cycle not in ('monthly','yearly') then raise exception 'Pick a plan.'; end if;
  if length(btrim(coalesce(p_reference,''))) < 4 then raise exception 'Enter the reference number from your payment.'; end if;
  if exists (select 1 from upgrade_requests where business_id = me and status = 'pending') then raise exception 'You already sent a payment. We''ll confirm it shortly.'; end if;
  amt := public.plan_price(p_plan, p_cycle);
  select name into who from team_members where auth_user_id = auth.uid() limit 1;
  select name into biz from businesses where id = me;
  insert into upgrade_requests(business_id, plan, cycle, amount, method, reference, created_by_name)
    values (me, p_plan, p_cycle, amt, left(regexp_replace(coalesce(p_method,''), '[<>]', '', 'g'), 40), left(regexp_replace(btrim(p_reference), '[<>]', '', 'g'), 80), who)
    returning id into rid;
  insert into notification_outbox(business_id, title, body, url, category)
    values (me, left('💰 Upgrade payment: ' || biz || ' → ' || public.plan_label(p_plan), 120),
            biz || ' says they paid ₱' || to_char(amt, 'FM999,999') || ' (' || p_cycle || ') by ' || coalesce(p_method,'?') || ', reference ' || btrim(p_reference) || E'.\nSent by ' || coalesce(who,'?') || E'.\n\nCheck your account, then approve it in Nifti → Settings → Customers & upgrades.', './', 'support');
  perform public.nifti_kick_dispatch();
  return rid;
end $function$
;

CREATE OR REPLACE FUNCTION public.respond_connection(p_request uuid, p_accept boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); r connection_requests; from_type text; buyer uuid; supplier uuid;
begin
  select * into r from connection_requests where id = p_request for update;
  if r.id is null or r.to_business <> me then raise exception 'Request not found.'; end if;
  if r.status <> 'pending' then return; end if;
  update connection_requests set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now() where id = r.id;
  if p_accept then
    select coalesce(r.from_role, case when type = 'supplier' then 'supplier' else 'buyer' end) into from_type from businesses where id = r.from_business;
    if from_type = 'buyer' then buyer := r.from_business; supplier := r.to_business; else buyer := r.to_business; supplier := r.from_business; end if;
    insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer, supplier) on conflict do nothing;
    insert into conversations(buyer_business_id, supplier_business_id) values (buyer, supplier) on conflict do nothing;
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.respond_shared_order(p_token text, p_action text, p_name text, p_note text DEFAULT NULL::text, p_eta date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  l order_links; po purchase_orders; sup businesses;
  who text := btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g'));
  note text := nullif(btrim(regexp_replace(coalesce(p_note,''), '[<>"`]', '', 'g')), '');
  new_status text; action_text text; new_shipping jsonb; actor text := 'supplier';
begin
  select * into l from order_links where token = p_token;
  if l.token is null or l.revoked_at is not null or l.expires_at < now() then raise exception 'This link has expired. Ask for a new one.'; end if;
  select * into po from purchase_orders where id = l.po_id for update;
  select * into sup from businesses where id = po.supplier_business_id;
  if length(who) < 2 or length(who) > 80 then raise exception 'Please enter your name.'; end if;
  if note is not null and length(note) > 500 then note := left(note, 500); end if;
  new_status := po.status; new_shipping := po.shipping;
  if l.kind = 'delivery' then
    -- delivery partner: pickup / on the way / delivered (the buyer still confirms quantities in Nifti)
    if po.status in ('cancelled','draft') then raise exception 'This order was cancelled.'; end if;
    if p_action = 'picked_up' then
      if po.status in ('confirmed','preparing') then new_status := case when po.type = 'freight' then 'in_customs' else 'shipped' end; end if;
      new_shipping := coalesce(po.shipping, '{}'::jsonb) || jsonb_build_object('carrier', coalesce(l.partner_name, 'Delivery partner'), 'tracking', coalesce(po.shipping->>'tracking', '—'), 'eta', coalesce(to_char(p_eta,'YYYY-MM-DD'), po.shipping->>'eta', po.requested_delivery_date::text));
      action_text := '🚚 Picked up by ' || who || coalesce(' (' || l.partner_name || ')', '') || coalesce(' — ETA ' || to_char(p_eta,'YYYY-MM-DD'), '') || coalesce(' — "' || note || '"', '');
    elsif p_action = 'delivered' then
      action_text := '📦 Delivered by ' || who || coalesce(' (' || l.partner_name || ')', '') || coalesce(' — received by ' || note, '') || '. Please confirm the delivery in Nifti.';
    elsif p_action = 'note' then
      if note is null then raise exception 'Type a message first.'; end if;
      action_text := '💬 Delivery note from ' || who || ': ' || note;
    else raise exception 'Unknown action.'; end if;
  else
    if not sup.is_outside and exists (select 1 from businesses where id = po.buyer_business_id and is_outside) then
      -- the buyer ordered from the supplier's online store without an account
      actor := 'buyer';
      if p_action = 'note' then
        if note is null then raise exception 'Type a message first.'; end if;
        if po.status in ('draft', 'cancelled') then raise exception 'This order is closed.'; end if;
        action_text := '💬 Buyer note from ' || who || ': ' || note;
      elsif p_action = 'cancel' then
        if po.status <> 'sent' then raise exception '% already confirmed this order. Message them to change it.', sup.name; end if;
        new_status := 'cancelled';
        action_text := 'Cancelled by ' || who || ' (buyer, via order link)' || coalesce(' — "' || note || '"', '');
      else raise exception 'Unknown action.'; end if;
    elsif not sup.is_outside then raise exception '% now uses Nifti. Please sign in to respond.', sup.name;
    elsif p_action = 'confirm' then
      if po.status <> 'sent' then raise exception 'This order can''t be confirmed right now (it is %).', po.status; end if;
      new_status := 'confirmed';
      action_text := 'Confirmed by ' || who || ' (via order link)' || coalesce(' — "' || note || '"', '');
    elsif p_action = 'decline' then
      if po.status <> 'sent' then raise exception 'This order can''t be declined right now (it is %).', po.status; end if;
      if note is null then raise exception 'Please tell the buyer why.'; end if;
      new_status := 'cancelled';
      action_text := 'Declined by ' || who || ' (via order link): ' || note;
    elsif p_action = 'shipped' then
      if po.status not in ('confirmed', 'preparing') then raise exception 'Confirm the order first.'; end if;
      new_status := case when po.type = 'freight' then 'in_customs' else 'shipped' end;
      new_shipping := jsonb_build_object('carrier', 'Supplier delivery', 'tracking', '—', 'eta', coalesce(to_char(p_eta, 'YYYY-MM-DD'), po.requested_delivery_date::text), 'proofUrl', null, 'proofName', null);
      action_text := 'Marked as shipped by ' || who || ' (via order link)' || coalesce(' — ETA ' || to_char(p_eta, 'YYYY-MM-DD'), '') || coalesce(' — "' || note || '"', '');
    elsif p_action = 'note' then
      if note is null then raise exception 'Type a message first.'; end if;
      if po.status in ('draft', 'cancelled') then raise exception 'This order is closed.'; end if;
      action_text := '💬 Note from ' || who || ': ' || note;
    else
      raise exception 'Unknown action.';
    end if;
  end if;
  update purchase_orders
    set status = new_status, shipping = new_shipping,
        history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', actor, 'action', action_text))
    where id = po.id;
  return jsonb_build_object('ok', true, 'status', new_status);
end $function$
;

CREATE OR REPLACE FUNCTION public.reverse_journal(p_id uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); e journal_entries; rid uuid; who text;
begin
  select * into e from journal_entries where id = p_id;
  if e.id is null or e.business_id <> me or not public.nifti_books_viewer(me) then raise exception 'Not found.'; end if;
  if e.kind <> 'manual' then raise exception 'Entries Nifti made from your records change when the record changes. Fix the sale, expense or order instead.'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Say why.'; end if;
  who := public.nifti_member_name(me);
  rid := public.ledger_reverse_entry(p_id, btrim(p_reason), who);
  insert into audit_log(business_id, action, entity_type, entity_id, field, new_value, actor) values (me, 'journal_reversed', 'journal', p_id::text, 'reason', to_jsonb(left(p_reason, 200)), coalesce(who, 'someone'));
  return rid;
end $function$
;

CREATE OR REPLACE FUNCTION public.review_cash_count(p_id uuid, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner can mark a count as checked.'; end if;
  update cash_counts set reviewed_at = now(), reviewed_by_name = public.nifti_member_name(me), review_note = nullif(left(btrim(coalesce(p_note,'')), 300), '')
   where id = p_id and business_id = me;
end $function$
;

CREATE OR REPLACE FUNCTION public.review_expense(p_id uuid, p_ok boolean, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e expenses;
begin
  select * into e from expenses where id = p_id;
  if e.id is null or not (e.business_id in (select my_business_ids())) or not public.nifti_books_viewer(e.business_id) then raise exception 'Only the owner can approve expenses.'; end if;
  if not p_ok and length(btrim(coalesce(p_note, ''))) < 2 then raise exception 'Say what needs fixing.'; end if;
  -- runs as the caller's identity inside the trigger (auth.uid() is unchanged)
  update expenses set status = case when p_ok then 'approved' else 'needs_correction' end, review_note = nullif(left(btrim(coalesce(p_note, '')), 300), '') where id = p_id;
  if not p_ok then
    perform public.nifti_notify(e.business_id, '✏️ Please fix an expense', coalesce(e.category, 'Expense') || ' ' || public.nifti_peso(e.amount) || ': ' || left(btrim(p_note), 160), './#expenses', 'team', e.created_by);
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.review_watchdog_alert(p_id bigint, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare who text; biz uuid;
begin
  select business_id into biz from watchdog_alerts where id = p_id;
  if biz is null or not public.is_business_admin(biz) then raise exception 'Only an Owner or General Manager can do this.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() limit 1;
  update watchdog_alerts set reviewed_at = case when reviewed_at is null then now() else null end, reviewed_by_name = who,
    review_note = nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>]', '', 'g')), 200), '') where id = p_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.revoke_business_share_link(p_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can do this.'; end if;
  update business_share_links set revoked_at = now() where token = p_token and business_id = me;
end $function$
;

CREATE OR REPLACE FUNCTION public.route_stop_proof(p_stop uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select proof from route_stops where id = p_stop and business_id in (select public.my_business_ids()) $function$
;

CREATE OR REPLACE FUNCTION public.save_cash_count(p_day date, p_drawer text, p_expected jsonb, p_counted jsonb, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); who text; mem uuid; ex numeric; ct numeric; diff numeric; row cash_counts; boss boolean; limit_amt numeric;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if p_day is null or p_day > public.nifti_today() or p_day < public.nifti_today() - 7 then raise exception 'Pick today or a day this past week.'; end if;
  if jsonb_typeof(coalesce(p_counted,'null')) <> 'object' or octet_length(p_counted::text) > 3000 or octet_length(coalesce(p_expected,'{}')::text) > 3000 then raise exception 'Enter what you counted.'; end if;
  ct := round(coalesce((p_counted->>'cash')::numeric, -1), 2);
  if ct < 0 or ct > 100000000 then raise exception 'Enter the cash you counted.'; end if;
  ex := round(coalesce((p_expected->>'cash')::numeric, 0), 2);
  diff := ct - ex;
  boss := public.nifti_books_viewer(me);
  mem := public.nifti_me_member(me); who := public.nifti_member_name(me);
  select * into row from cash_counts where business_id = me and count_day = p_day and drawer = coalesce(nullif(btrim(p_drawer), ''), 'Main');
  if row.id is not null and row.reopened_at is null and not boss then raise exception 'This day is already closed. Ask the owner to reopen it.'; end if;
  insert into cash_counts(business_id, count_day, drawer, expected, counted, difference, note, closed_by, closed_by_name, closed_at, reopened_at, reopened_by_name)
    values (me, p_day, coalesce(nullif(btrim(p_drawer), ''), 'Main'), coalesce(p_expected, '{}'), p_counted, diff, nullif(left(btrim(coalesce(p_note,'')), 300), ''), mem, who, now(), null, null)
  on conflict (business_id, count_day, drawer) do update set expected = excluded.expected, counted = excluded.counted, difference = excluded.difference,
    note = excluded.note, closed_by = excluded.closed_by, closed_by_name = excluded.closed_by_name, closed_at = now(), reopened_at = null, reopened_by_name = null,
    reviewed_at = null, reviewed_by_name = null, review_note = null;
  insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
    values (me, 'cash_counted', 'cash_count', p_day::text, coalesce(nullif(btrim(p_drawer), ''), 'Main'), to_jsonb(ex), to_jsonb(ct), coalesce(who, 'someone'));
  limit_amt := coalesce((select (books_settings->>'cash_alert')::numeric from businesses where id = me), 100);
  if abs(diff) >= greatest(limit_amt, 1) then
    perform public.nifti_notify_books(me, case when diff < 0 then '🔴 Cash short ' || public.nifti_peso(-diff) else '🟡 Cash over ' || public.nifti_peso(diff) end,
      to_char(p_day, 'Mon DD') || ' · ' || coalesce(nullif(btrim(p_drawer), ''), 'Main') || ' drawer · counted by ' || coalesce(who, 'someone') || '. Expected ' || public.nifti_peso(ex) || ', counted ' || public.nifti_peso(ct) || '.',
      './#cashcount');
  end if;
  return case when boss then jsonb_build_object('saved', true, 'difference', diff, 'expected', ex, 'counted', ct) else jsonb_build_object('saved', true) end;
end $function$
;

CREATE OR REPLACE FUNCTION public.save_route(p_route uuid, p_date date, p_driver uuid, p_vehicle text, p_stops jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); rid uuid := p_route; st jsonb; n int; seq0 int; dname text; bad int; who text; due numeric; tot numeric := 0; cnt int := 0;
begin
  if me is null or not public.nifti_route_planner(me) then raise exception 'Only an Owner, General Manager or Warehouse Manager can plan routes.'; end if;
  if not public.has_feature(me, 'routes') then raise exception 'Routes are part of Supplier Pro.'; end if;
  if p_driver is not null then
    select name into dname from team_members where id = p_driver and business_id = me and status in ('active','invited');
    if dname is null then raise exception 'Pick a driver from your team.'; end if;
  end if;
  select name into who from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  if jsonb_typeof(coalesce(p_stops,'[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_stops,'[]'::jsonb)) > 60 then raise exception 'A route can have up to 60 stops.'; end if;
  -- every order on the route must be one of ours
  select count(*) into bad from jsonb_array_elements(coalesce(p_stops,'[]'::jsonb)) s,
    lateral (select unnest(array(select jsonb_array_elements_text(coalesce(s->'deliver_po_ids','[]'::jsonb)))::uuid[] || array(select jsonb_array_elements_text(coalesce(s->'collect_po_ids','[]'::jsonb)))::uuid[]) pid) x
    where not exists (select 1 from purchase_orders po where po.id = x.pid and po.supplier_business_id = me);
  if bad > 0 then raise exception 'Some orders on this route aren''t yours.'; end if;
  if rid is null then
    insert into routes(business_id, route_date, driver_member_id, driver_name, vehicle, created_by_name)
      values (me, coalesce(p_date, public.nifti_today()), p_driver, dname, left(p_vehicle, 40), who) returning id into rid;
    seq0 := 0;
  else
    if not exists (select 1 from routes where id = rid and business_id = me) then raise exception 'Route not found.'; end if;
    update routes set route_date = coalesce(p_date, route_date), driver_member_id = p_driver, driver_name = dname, vehicle = left(p_vehicle, 40), updated_at = now(),
      status = case when status = 'done' then 'on_road' else status end where id = rid;
    delete from route_stops where route_id = rid and status = 'pending';
    select coalesce(max(seq), 0) into seq0 from route_stops where route_id = rid;
  end if;
  n := seq0;
  for st in select value from jsonb_array_elements(coalesce(p_stops,'[]'::jsonb)) loop
    n := n + 1;
    select coalesce(sum(greatest(public.nifti_open_balance(invoice), 0)), 0) into due from purchase_orders
      where id = any(array(select jsonb_array_elements_text(coalesce(st->'collect_po_ids','[]'::jsonb)))::uuid[]) and supplier_business_id = me;
    insert into route_stops(route_id, business_id, seq, buyer_business_id, buyer_name, address, phone, deliver_po_ids, collect_po_ids, amount_due, items, note)
      values (rid, me, n, nullif(st->>'buyer_business_id','')::uuid, left(coalesce(st->>'buyer_name','Stop ' || n), 120), left(st->>'address', 300), left(st->>'phone', 40),
              array(select jsonb_array_elements_text(coalesce(st->'deliver_po_ids','[]'::jsonb)))::uuid[],
              array(select jsonb_array_elements_text(coalesce(st->'collect_po_ids','[]'::jsonb)))::uuid[],
              due, coalesce(st->'items','[]'::jsonb), left(st->>'note', 300));
    tot := tot + due; cnt := cnt + 1;
  end loop;
  if p_driver is not null and cnt > 0 then
    perform public.nifti_notify(me, '🚚 Your route for ' || to_char(coalesce(p_date, public.nifti_today()), 'Dy, Mon DD'),
      cnt || ' stop' || case when cnt > 1 then 's' else '' end || case when tot >= 1 then ' · ' || public.nifti_peso(tot) || ' to collect' else '' end || '. Open Routes to start.', './#routes', 'orders', p_driver);
  end if;
  return rid;
end $function$
;

CREATE OR REPLACE FUNCTION public.seller_quote_action(p_po uuid, p_action text, p_days integer DEFAULT NULL::integer, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare po purchase_orders; member text; q jsonb; hold date; today date := (now() at time zone 'Asia/Manila')::date; b text;
  reason text := nullif(left(btrim(regexp_replace(coalesce(p_reason,''), '[<>"`]', '', 'g')), 200), '');
begin
  select * into po from purchase_orders where id = p_po for update;
  if po.id is null or not (po.supplier_business_id in (select public.my_business_ids())) then raise exception 'Order not found.'; end if;
  if po.status <> 'quote' then raise exception 'This order isn''t waiting for their OK anymore.'; end if;
  select name into member from team_members where auth_user_id = auth.uid() and business_id = po.supplier_business_id limit 1;
  select name into b from businesses where id = po.buyer_business_id;
  q := coalesce(po.quote, '{}'::jsonb);
  if p_action = 'nudged' then
    update purchase_orders set quote = q || jsonb_build_object('nudges', coalesce(q->'nudges','[]'::jsonb) || jsonb_build_array(jsonb_build_object('key', 'manual', 'at', now(), 'channel', 'manual', 'by', member))) where id = po.id;
  elsif p_action = 'extend' then
    if coalesce(p_days, 0) not between 1 and 60 then raise exception 'Pick how many days.'; end if;
    hold := greatest(coalesce((q->>'hold_until')::date, today), today) + p_days;
    update purchase_orders set quote = q || jsonb_build_object('hold_until', hold),
      history = coalesce(history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier', 'action', '⏳ Price held until ' || to_char(hold, 'Mon DD') || coalesce(' by ' || member, '')))
      where id = po.id;
  elsif p_action = 'said_yes' then
    update purchase_orders set status = 'confirmed', quote = q || jsonb_build_object('outcome', 'confirmed', 'answered_at', now(), 'via', 'seller') - 'not_now',
      history = coalesce(history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier', 'action', '✅ ' || b || ' said yes' || coalesce(' (confirmed by ' || member || ')', '')))
      where id = po.id;
  elsif p_action = 'lost' then
    update purchase_orders set status = 'cancelled', quote = q || jsonb_build_object('outcome', 'lost', 'answered_at', now(), 'via', 'seller', 'reason', reason),
      history = coalesce(history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier', 'action', '✕ Didn''t go through' || coalesce(': ' || reason, '') || coalesce(' (' || member || ')', '')))
      where id = po.id;
  else raise exception 'Unknown action.'; end if;
  return jsonb_build_object('ok', true);
end $function$
;

CREATE OR REPLACE FUNCTION public.send_books_summaries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare today date := (now() at time zone 'Asia/Manila')::date; y date := today - 1; b record; d jsonb; lines text[]; flags int; title text; sent int := 0; inserted int;
begin
  for b in select biz.id from businesses biz where not biz.is_outside and biz.paused_at is null and biz.banned_at is null
             and (exists (select 1 from downstream_sales s where s.business_id = biz.id and s.sale_date >= today - 30)
               or exists (select 1 from expenses e where e.business_id = biz.id and e.spent_on >= today - 30)
               or exists (select 1 from cash_counts c where c.business_id = biz.id and c.count_day >= today - 30)) loop
    d := public.books_day_for(b.id, y);
    lines := array[]::text[]; flags := 0;
    if (d->>'sales_count')::int > 0 then lines := lines || ('🧾 Sales ' || public.nifti_peso((d->>'sales')::numeric) || ' (' || (d->>'sales_count') || ')'
      || case when (d->>'utang')::numeric >= 1 then ' · utang ' || public.nifti_peso((d->>'utang')::numeric) else '' end); end if;
    if (d->>'expenses')::numeric >= 1 then lines := lines || ('💸 Expenses ' || public.nifti_peso((d->>'expenses')::numeric)); end if;
    if (d->>'cash_counted')::int = 0 then
      -- only a flag for shops that count their drawer
      if exists (select 1 from cash_counts c where c.business_id = b.id and c.count_day >= today - 30) then lines := lines || '🔴 Cash not counted'::text; flags := flags + 1; end if;
    elsif (d->>'cash_diff')::numeric <= -1 then lines := lines || ('🔴 Cash short ' || public.nifti_peso(-(d->>'cash_diff')::numeric)); flags := flags + 1;
    elsif (d->>'cash_diff')::numeric >= 1 then lines := lines || ('🟡 Cash over ' || public.nifti_peso((d->>'cash_diff')::numeric)); flags := flags + 1;
    else lines := lines || '✅ Cash matched'::text; end if;
    if (d->>'bad_stock')::numeric >= 1 then lines := lines || ('🗑 Bad stock ' || public.nifti_peso((d->>'bad_stock')::numeric)); flags := flags + 1; end if;
    if (d->>'missing_stock')::numeric >= 1 then lines := lines || ('🔍 Missing stock ' || public.nifti_peso((d->>'missing_stock')::numeric)); flags := flags + 1; end if;
    if (d->>'voided')::int > 0 then lines := lines || ('↩️ ' || (d->>'voided') || ' sale' || case when (d->>'voided')::int > 1 then 's' else '' end || ' removed'); flags := flags + 1; end if;
    if (d->>'expenses_removed')::int > 0 then lines := lines || ('↩️ ' || (d->>'expenses_removed') || ' expense' || case when (d->>'expenses_removed')::int > 1 then 's' else '' end || ' removed'); end if;
    if (d->>'hand_changes')::int > 0 then lines := lines || ('✏️ Stock changed by hand ' || (d->>'hand_changes') || '×'); end if;
    insert into books_summary_log(business_id, day) values (b.id, today) on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then continue; end if;
    title := '📒 Yesterday: ' || case when (d->>'sales_count')::int > 0 then public.nifti_peso((d->>'sales')::numeric) || ' sales' else 'no sales recorded' end
      || case when flags > 0 then ' · ' || flags || ' to check' else ' · all good' end;
    perform public.nifti_notify_books(b.id, title, array_to_string(lines, E'\n'), './#money');
    sent := sent + 1;
  end loop;
  return sent;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_cheque_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare today date := public.nifti_today(); r record; n int := 0; ins int;
begin
  -- suppliers: cheques to deposit today (or already past their date and not deposited)
  for r in select supplier_id b, count(*) c, sum(amount) a from public.nifti_cheques()
           where status = 'pending' and deposited_at is null and check_date <= today group by supplier_id loop
    continue when not public.has_feature(r.b, 'cheques');
    insert into cheque_reminder_log values (r.b, today, 'deposit') on conflict do nothing; get diagnostics ins = row_count; continue when ins = 0;
    perform public.nifti_notify(r.b, '🏦 Deposit today: ' || r.c || ' cheque' || case when r.c > 1 then 's' else '' end || ' · ' || public.nifti_peso(r.a),
      'Their dates have come. Deposit them, then mark them deposited in Cheques.', './#cheques', 'orders'); n := n + 1;
  end loop;
  -- suppliers: deposited 3+ days ago and still not marked cleared
  for r in select supplier_id b, count(*) c, sum(amount) a from public.nifti_cheques()
           where status = 'pending' and deposited_at is not null and deposited_at <= today - 3 group by supplier_id loop
    continue when not public.has_feature(r.b, 'cheques');
    insert into cheque_reminder_log values (r.b, today, 'clear') on conflict do nothing; get diagnostics ins = row_count; continue when ins = 0;
    perform public.nifti_notify(r.b, '🔎 Did ' || r.c || ' cheque' || case when r.c > 1 then 's' else '' end || ' clear?', public.nifti_peso(r.a) || ' deposited 3+ days ago. Check your bank and mark them cleared or bounced.', './#cheques', 'orders'); n := n + 1;
  end loop;
  -- buyers: their cheques get deposited today or tomorrow
  for r in select buyer_id b, count(*) c, sum(amount) a, min(check_date) d from public.nifti_cheques()
           where status = 'pending' and check_date between today and today + 1 group by buyer_id loop
    continue when not public.has_feature(r.b, 'cheques');
    insert into cheque_reminder_log values (r.b, today, 'fund') on conflict do nothing; get diagnostics ins = row_count; continue when ins = 0;
    perform public.nifti_notify(r.b, '💳 Fund your account: ' || public.nifti_peso(r.a) || ' in cheques',
      r.c || ' cheque' || case when r.c > 1 then 's' else '' end || ' dated ' || case when r.d = today then 'today' else 'tomorrow' end || '. Make sure the money is in the bank so nothing bounces.', './#cheques', 'orders'); n := n + 1;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_daily_summaries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  b record; s jsonb; f jsonb; parts text[]; lines text[]; sent int := 0; today date := (now() at time zone 'Asia/Manila')::date; inserted int;
begin
  for b in
    select biz.id from businesses biz
    left join notification_settings ns on ns.business_id = biz.id
    where not biz.is_outside and biz.paused_at is null and coalesce(ns.daily_summary, true)
      and exists (select 1 from team_members t where t.business_id = biz.id and t.auth_user_id is not null and t.status = 'active')
  loop
    s := public.daily_summary_for(b.id);
    parts := array[]::text[]; lines := array[]::text[];
    if (s->>'to_confirm')::int > 0 then parts := parts || ((s->>'to_confirm') || ' to confirm'); lines := lines || ('📦 ' || (s->>'to_confirm') || ' new order' || case when (s->>'to_confirm')::int > 1 then 's' else '' end || ' waiting for you to confirm'); end if;
    if (s->>'to_deliver')::int > 0 then parts := parts || ((s->>'to_deliver') || ' to deliver'); lines := lines || ('🚚 ' || (s->>'to_deliver') || ' order' || case when (s->>'to_deliver')::int > 1 then 's' else '' end || ' due out today or late'); end if;
    if (s->>'payments_to_check')::int > 0 then parts := parts || ((s->>'payments_to_check') || ' payment' || case when (s->>'payments_to_check')::int > 1 then 's' else '' end || ' to check'); lines := lines || ('💳 ' || (s->>'payments_to_check') || ' payment' || case when (s->>'payments_to_check')::int > 1 then 's' else '' end || ' to check in your account'); end if;
    if (s->>'owed_to_you')::numeric >= 1 then parts := parts || (public.nifti_peso((s->>'owed_to_you')::numeric) || ' owed to you'); lines := lines || ('💰 ' || public.nifti_peso((s->>'owed_to_you')::numeric) || ' owed to you' || case when (s->>'owed_to_you_overdue')::numeric >= 1 then ' (' || public.nifti_peso((s->>'owed_to_you_overdue')::numeric) || ' overdue)' else '' end); end if;
    if (s->>'arriving')::int > 0 then parts := parts || ((s->>'arriving') || ' arriving'); lines := lines || ('📬 ' || (s->>'arriving') || ' deliver' || case when (s->>'arriving')::int > 1 then 'ies' else 'y' end || ' on the way or due today'); end if;
    if (s->>'price_changes')::int > 0 then parts := parts || ((s->>'price_changes') || ' price change' || case when (s->>'price_changes')::int > 1 then 's' else '' end); lines := lines || ('💬 ' || (s->>'price_changes') || ' price change' || case when (s->>'price_changes')::int > 1 then 's' else '' end || ' to review'); end if;
    if (s->>'bills_due')::numeric >= 1 then parts := parts || (public.nifti_peso((s->>'bills_due')::numeric) || ' to pay'); lines := lines || ('🧾 ' || public.nifti_peso((s->>'bills_due')::numeric) || ' in bills due within 3 days or overdue'); end if;
    if (s->>'payments_rejected')::int > 0 then lines := lines || ('⚠ ' || (s->>'payments_rejected') || ' payment' || case when (s->>'payments_rejected')::int > 1 then 's' else '' end || ' a supplier says didn''t arrive'); end if;
    if (s->>'unread_messages')::int > 0 then lines := lines || ('✉️ ' || (s->>'unread_messages') || ' unread message' || case when (s->>'unread_messages')::int > 1 then 's' else '' end); end if;
    if public.has_feature(b.id, 'bir2307') then
      f := public.forms_2307_pending(b.id);
      if (f->>'to_send')::int > 0 then lines := lines || ('📄 ' || (f->>'to_send') || ' BIR 2307 certificate' || case when (f->>'to_send')::int > 1 then 's' else '' end || ' to send to suppliers'); end if;
      if (f->>'missing')::int > 0 then lines := lines || ('📄 ' || (f->>'missing') || ' BIR 2307 certificate' || case when (f->>'missing')::int > 1 then 's' else '' end || ' buyers still owe you (' || public.nifti_peso((f->>'missing_tax')::numeric) || ' in tax credits)'); end if;
    end if;
    lines := lines || public.pro_summary_lines(b.id);
    if array_length(lines, 1) is null then continue; end if;
    insert into daily_summary_log(business_id, day) values (b.id, today) on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then continue; end if;
    insert into notification_outbox(business_id, title, body, url, category)
      values (b.id, left('☀️ Today: ' || coalesce(array_to_string(parts[1:3], ' · '), 'a few things need you'), 120), left(array_to_string(lines, E'\n'), 1000), './#dashboard', 'summary');
    sent := sent + 1;
  end loop;
  if sent > 0 then perform public.nifti_kick_dispatch(); end if;
  return sent;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_growth_nudges()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b record; stage text; age int; kind text; title text; body text; url text; sent int := 0; inserted int;
begin
  for b in
    select biz.id, biz.type, biz.name, biz.created_at, biz.store_slug from businesses biz
    left join notification_settings ns on ns.business_id = biz.id
    where not biz.is_outside and biz.paused_at is null and coalesce(ns.daily_summary, true)
      and exists (select 1 from team_members t where t.business_id = biz.id and t.auth_user_id is not null and t.status = 'active')
  loop
    stage := public.setup_stage(b.id);
    age := ((now() at time zone 'Asia/Manila')::date - (b.created_at at time zone 'Asia/Manila')::date);
    kind := null;
    if stage <> 'active' and age in (1, 3, 7) then
      kind := stage || ':d' || age;
      url := './#dashboard';
      if stage = 'add_supplier' then
        title := case age when 1 then '👋 Send your first order in 2 minutes' when 3 then 'Your suppliers don''t need to sign up' else 'Still ordering on Viber?' end;
        body := 'Add a supplier you already order from. Send them an order as a link on Viber. They confirm it without an account.'; url := './#invite';
      elsif stage = 'first_order' then
        title := case age when 1 then '📦 Your supplier is ready. Send the first order' when 3 then 'Try pasting your usual Viber order' else 'One order is all it takes' end;
        body := 'Tap + Create → Paste from Viber. Nifti turns your message into an order, and your supplier gets a link to confirm.'; url := './#orders';
      elsif stage = 'add_products' then
        title := case age when 1 then '🛍 Add your products to get orders online' when 3 then 'Your online store is one step away' else 'Buyers are ordering online now' end;
        body := 'Add your product list with prices (or import it from a photo or spreadsheet). Then your store link is ready for Facebook.'; url := './#inventory';
      elsif stage = 'open_store' then
        title := case age when 1 then '🛍 Open your online store' when 3 then 'Post your price list on Facebook' else 'Get orders without answering PMs' end;
        body := 'Your products are in. Open your store and share the link on your Facebook Page and Messenger auto-reply.'; url := './#store';
      elsif stage = 'first_order_in' then
        title := case age when 1 then '📣 Share your store link' when 3 then 'Send your store to your regular buyers' else 'Make ordering easy for your buyers' end;
        body := 'Send your store link to your regular buyers on Viber, and post the price-list picture on Facebook. Orders land straight in Nifti.'; url := './#store';
      end if;
    elsif stage in ('first_order_in', 'active') and b.store_slug is not null
      and extract(isodow from (now() at time zone 'Asia/Manila')) = 1
      and not exists (select 1 from store_events e where e.business_id = b.id and e.kind = 'view' and e.created_at > now() - interval '7 days') then
      kind := 'store_quiet:' || to_char(now() at time zone 'Asia/Manila', 'IYYY-IW');
      title := '📣 Your posts for this week are ready';
      body := 'Nobody opened your store last week. Open Store → Posts: a ready-to-share post with your products, one tap to Facebook or Viber.';
      url := './#store';
    end if;
    if kind is null then continue; end if;
    insert into growth_nudge_log(business_id, kind) values (b.id, kind) on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then continue; end if;
    insert into notification_outbox(business_id, title, body, url, category) values (b.id, title, body, url, 'summary');
    sent := sent + 1;
  end loop;
  if sent > 0 then perform public.nifti_kick_dispatch(); end if;
  return sent;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_payment_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  today date := (now() at time zone 'Asia/Manila')::date;
  pr record; pairs record; inv record; sup businesses; b businesses;
  sched int[]; off int; stage text; bal numeric; days int; ins int; lines text; worst int; total numeric; n int;
  firm boolean; url text; msg text; ch text; sent int := 0; paid numeric;
begin
  -- 1) promises to pay: kept, or broken (then a polite nudge and a heads-up to the owner)
  for pr in select p.*, s.name sup_name, coalesce(b2.outside_contact->>'name', b2.name) buyer_name from payment_promises p
            join businesses s on s.id = p.business_id join businesses b2 on b2.id = p.buyer_business_id where p.status = 'open' loop
    paid := public.nifti_paid_since(pr.business_id, pr.buyer_business_id, (pr.created_at at time zone 'Asia/Manila')::date);
    if paid >= pr.amount * 0.98 then
      update payment_promises set status = 'kept', resolved_at = now() where id = pr.id;
    elsif pr.promised_date < today then
      update payment_promises set status = 'broken', resolved_at = now() where id = pr.id;
      url := public.nifti_statement_url(pr.business_id, pr.buyer_business_id);
      perform public.nifti_message_buyer(pr.business_id, pr.buyer_business_id, 'About your payment to ' || pr.sup_name,
        'Hi ' || pr.buyer_name || '! You mentioned paying ' || public.nifti_peso(pr.amount) || ' by ' || to_char(pr.promised_date, 'Mon DD')
        || ', but we haven''t received it yet. When can we expect it? Your balance and our payment details: ' || url || ' Salamat! – ' || pr.sup_name, url);
      perform public.nifti_notify(pr.business_id, '⚠ Promise not kept: ' || pr.buyer_name,
        pr.buyer_name || ' said ' || public.nifti_peso(pr.amount) || ' by ' || to_char(pr.promised_date, 'Mon DD') || '. We sent them a reminder.', './#collections', 'orders');
    end if;
  end loop;

  -- 2) reminders by your terms, one message per customer per day
  for pairs in
    select distinct po.supplier_business_id sid, po.buyer_business_id bid
    from purchase_orders po join businesses s on s.id = po.supplier_business_id
    where po.invoice is not null and coalesce(po.invoice->>'status','') <> 'paid' and po.status not in ('paid','cancelled','draft')
      and s.auto_payment_reminders and not s.is_outside and s.paused_at is null and public.has_feature(s.id, 'auto_reminders')
      and coalesce(po.invoice->>'dueDate','') ~ '^\d{4}-\d{2}-\d{2}$'
  loop
    if exists (select 1 from payment_promises where business_id = pairs.sid and buyer_business_id = pairs.bid and status = 'open' and promised_date >= today) then continue; end if;
    select * into sup from businesses where id = pairs.sid;
    select * into b from businesses where id = pairs.bid;
    -- a customer with no automatic channel is left for the owner's "Follow up today" list
    if not ((not b.is_outside and exists (select 1 from conversations where buyer_business_id = b.id and supplier_business_id = sup.id))
            or (b.is_outside and nullif(b.outside_contact->>'email','') is not null and coalesce((sup.collection_settings->>'email')::boolean, true))) then continue; end if;
    select coalesce(array_agg(x::int order by x::int), array[-2,0,3,7,14,30]) into sched
      from jsonb_array_elements_text(case when jsonb_typeof(sup.collection_settings->'schedule') = 'array' and jsonb_array_length(sup.collection_settings->'schedule') > 0
                                         then sup.collection_settings->'schedule' else null end) x;
    firm := coalesce(sup.collection_settings->>'tone', 'friendly') = 'firm';
    lines := ''; worst := -999; total := 0; n := 0;
    for inv in select po.id, po.po_number, po.invoice from purchase_orders po
               where po.supplier_business_id = sup.id and po.buyer_business_id = b.id and po.invoice is not null
                 and coalesce(po.invoice->>'status','') <> 'paid' and po.status not in ('paid','cancelled','draft')
                 and coalesce(po.invoice->>'dueDate','') ~ '^\d{4}-\d{2}-\d{2}$' order by (po.invoice->>'dueDate') loop
      bal := public.nifti_invoice_balance(inv.invoice);
      if bal < 1 then continue; end if;
      days := today - (inv.invoice->>'dueDate')::date;
      select max(o) into off from unnest(sched) o where o <= days;
      if off is null then continue; end if;
      stage := 'd' || off;
      insert into payment_reminder_log(po_id, stage, automatic, channel) values (inv.id, stage, true, 'auto') on conflict do nothing;
      get diagnostics ins = row_count;
      if ins = 0 then continue; end if;
      n := n + 1; total := total + bal; worst := greatest(worst, days);
      lines := lines || E'\n• ' || coalesce(inv.invoice->>'number', inv.po_number) || ': ' || public.nifti_peso(bal)
        || case when days < 0 then ', due ' || to_char((inv.invoice->>'dueDate')::date, 'Mon DD') when days = 0 then ', due today' else ', ' || days || ' days overdue' end;
    end loop;
    if n = 0 then continue; end if;
    url := public.nifti_statement_url(sup.id, b.id);
    msg := 'Hi ' || coalesce(b.outside_contact->>'name', b.name) || '! '
      || case when worst < 0 then 'Friendly reminder po, this is coming due soon:'
              when worst = 0 then 'Friendly reminder po, this is due today:'
              when worst < 14 and not firm then 'Just following up on this, it''s now past due:'
              when worst < 30 then 'This is now past due. Please settle it this week:'
              else 'This is now long overdue. Please settle it right away, or tell us when we can expect payment:' end
      || lines || E'\n\nSee your balance and how to pay (tap "I''ve paid" once you have): ' || url
      || case when worst > 0 then E'\nAlready paid? Just send the reference number and we''ll confirm it.' else '' end
      || E'\nSalamat! – ' || sup.name;
    ch := public.nifti_message_buyer(sup.id, b.id, case when worst <= 0 then 'Payment reminder from ' else 'Past due: your balance with ' end || sup.name, msg, url);
    if ch is not null then
      update payment_reminder_log set channel = ch where po_id in (select id from purchase_orders where supplier_business_id = sup.id and buyer_business_id = b.id) and channel = 'auto';
      sent := sent + 1;
    end if;
  end loop;
  if sent > 0 then perform public.nifti_kick_dispatch(); end if;
  return sent;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_price_change_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tmr date := public.nifti_today() + 1; sup record; br record; n int := 0; ins int;
begin
  for sup in select pc.business_id sid, b.name sname, count(*) c,
                    string_agg(pc.product || ': ' || coalesce(public.nifti_peso(pc.old_price) || ' → ', '') || public.nifti_peso(pc.new_price), E'\n' order by pc.product) lines
             from price_changes pc join businesses b on b.id = pc.business_id
             where pc.effective_date = tmr and pc.cancelled_at is null and pc.applied_at is null group by pc.business_id, b.name loop
    for br in select distinct x.buyer_business_id bid from business_relationships x join businesses y on y.id = x.buyer_business_id
              where x.supplier_business_id = sup.sid and not y.is_outside and y.paused_at is null loop
      insert into price_reminder_log values (sup.sid, br.bid, tmr) on conflict do nothing; get diagnostics ins = row_count; continue when ins = 0;
      perform public.nifti_notify(br.bid, '⏰ Tomorrow: ' || sup.sname || '''s new prices start',
        left(sup.lines, 170) || E'\nOrder today to keep today''s price.', './#prices', 'orders');
      n := n + 1;
    end loop;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_quote_nudges()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; today date := (now() at time zone 'Asia/Manila')::date; k text; url text; msg text; ch text; total text; sent int := 0; first text;
begin
  for r in select po.*, s.name sup_name, b.name buyer_name, coalesce(s.collection_settings->>'quote_nudges', 'true') <> 'false' as auto_on
           from purchase_orders po join businesses s on s.id = po.supplier_business_id join businesses b on b.id = po.buyer_business_id
           where po.status = 'quote' and po.quote is not null and s.banned_at is null loop
    -- price hold ended yesterday: tell the seller once
    if (r.quote->>'hold_until') is not null and (r.quote->>'hold_until')::date = today - 1 and not coalesce(r.quote->'nudges', '[]'::jsonb) @> jsonb_build_array(jsonb_build_object('key', 'expired:' || (r.quote->>'hold_until'))) then
      update purchase_orders set quote = quote || jsonb_build_object('nudges', coalesce(quote->'nudges','[]'::jsonb) || jsonb_build_array(jsonb_build_object('key','expired:' || (r.quote->>'hold_until'),'at',now(),'channel','seller'))),
        history = coalesce(history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'system', 'action', '⏳ Price hold ended without an answer'))
        where id = r.id;
      perform public.nifti_notify(r.supplier_business_id, '⏳ ' || r.buyer_name || ' didn''t confirm ' || r.po_number, 'The price hold ended. Call them, extend it, or let it go.', './#followups', 'orders');
      continue;
    end if;
    if not r.auto_on then continue; end if;
    k := public.nifti_quote_due(r.quote, today);
    if k is null or coalesce(r.quote->'nudges', '[]'::jsonb) @> jsonb_build_array(jsonb_build_object('key', k)) then continue; end if;
    url := public.nifti_order_url(r.id);
    total := public.nifti_peso((select public.nifti_po_total(p) from purchase_orders p where p.id = r.id));
    first := split_part(r.buyer_name, ' ', 1);
    msg := case
      when k like 'remind:%' then 'Hi ' || first || '! Balikan lang po namin ang order ' || r.po_number || ' (' || total || ') gaya ng napag-usapan. Isang tap lang po para ma-confirm: ' || url
      when k like 'hold-1%' then 'Hi ' || first || ', hanggang bukas (' || to_char((r.quote->>'hold_until')::date, 'Mon DD') || ') na lang po naka-hold ang presyo ng order ' || r.po_number || ' (' || total || '). Confirm po dito para makuha ang presyo: ' || url
      when k = 'd1' then 'Hi ' || first || '! Nandito po ang order ninyo ' || r.po_number || ' (' || total || '). Pa-check at pa-confirm po, isang tap lang: ' || url
      when k = 'd3' then 'Hi ' || first || ', follow up lang po sa order ' || r.po_number || ' (' || total || '). Pag na-confirm ninyo, i-schedule na namin ang delivery: ' || url
      else 'Hi ' || first || ', naka-ready pa rin po ang order ' || r.po_number || ' (' || total || '). Confirm, palitan ang dami, o sabihin lang kung kailan ulit: ' || url end
      || ' Salamat! – ' || r.sup_name;
    ch := public.nifti_message_buyer(r.supplier_business_id, r.buyer_business_id, 'Your order ' || r.po_number || ' from ' || r.sup_name, msg, url);
    update purchase_orders set quote = quote || jsonb_build_object('nudges', coalesce(quote->'nudges','[]'::jsonb) || jsonb_build_array(jsonb_build_object('key', k, 'at', now(), 'channel', coalesce(ch, 'none'))))
      where id = r.id;
    if ch is not null then sent := sent + 1; end if;
  end loop;
  return sent;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_reorder_nudges()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s record; r record; b businesses; conv uuid; link text; msg text; sent int := 0; ch text;
begin
  for s in select * from businesses where not is_outside and paused_at is null and banned_at is null
             and coalesce((collection_settings->>'auto_reorder')::boolean, false) and public.has_feature(id, 'reorder_reminders') loop
    for r in select * from public.reorder_due(s.id) loop
      if exists (select 1 from customer_nudges where business_id = s.id and buyer_business_id = r.buyer_id
                 and (created_at > now() - interval '14 days' or (kind = 'snooze' and snooze_until >= current_date))) then continue; end if;
      select * into b from businesses where id = r.buyer_id;
      link := public.nifti_make_reorder_link(s.id, r.buyer_id);
      msg := 'Hi ' || coalesce(b.outside_contact->>'name', b.name) || '! Kumusta po? It''s been ' || r.days_since || ' days since your last order, so you might be running low. '
        || case when link is not null then 'Your usual order is ready here, just check it and tap Order: ' || link else 'Reply here and we''ll prepare your usual order today.' end
        || ' Salamat! – ' || s.name;
      ch := null;
      select id into conv from conversations where buyer_business_id = r.buyer_id and supplier_business_id = s.id;
      if not b.is_outside and conv is not null then
        insert into conversation_messages(conversation_id, sender_business_id, text) values (conv, s.id, msg);
        update conversations set buyer_unread_count = buyer_unread_count + 1 where id = conv;
        ch := 'chat';
      elsif nullif(b.outside_contact->>'email', '') is not null then
        insert into notification_outbox(business_id, category, title, body, url, to_email)
          values (s.id, 'customer_email', 'Time to restock? Your usual order from ' || s.name, msg, coalesce(link, './'), b.outside_contact->>'email');
        ch := 'email';
      end if;
      if ch is null then continue; end if; -- no automatic channel: it stays on the owner's Sell again list
      insert into customer_nudges(business_id, buyer_business_id, kind, channel, created_by) values (s.id, r.buyer_id, 'auto', ch, 'Automatic');
      sent := sent + 1;
    end loop;
  end loop;
  if sent > 0 then perform public.nifti_kick_dispatch(); end if;
  return sent;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_test_email()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); nid bigint;
begin
  if not public.is_platform_admin() or me is null then raise exception 'Only the Nifti owner can do this.'; end if;
  insert into notification_outbox(business_id, title, body, url, category)
    values (me, 'Nifti email test ✓', 'If you can read this, Nifti can send emails: password resets, alerts, morning summaries and Help messages.', './', 'support')
    returning id into nid;
  perform public.nifti_kick_dispatch();
  return nid;
end $function$
;

CREATE OR REPLACE FUNCTION public.send_test_notification()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare m team_members;
begin
  select * into m from team_members where auth_user_id = auth.uid() and status = 'active' limit 1;
  if m.id is null then raise exception 'Please sign in first.'; end if;
  perform public.nifti_notify(m.business_id, '🔔 Notifications are working', 'This is how Nifti will reach you when something needs you.', './', 'team', m.id, null);
end $function$
;

CREATE OR REPLACE FUNCTION public.send_weekly_recaps()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare today date := (now() at time zone 'Asia/Manila')::date; f date; t date; b record; r jsonb; s jsonb; bu jsonb; bk jsonb;
        title text; body text; sent int := 0; bits text[]; sales numeric; v record;
begin
  f := date_trunc('week', today)::date - 7; t := f + 6;
  for b in select id from businesses where not is_outside and paused_at is null and banned_at is null loop
    r := public.weekly_recap_for(b.id, f, t);
    s := r->'sell'; bu := r->'buy'; bk := r->'books';
    bits := array[]::text[];
    sales := coalesce((s->>'orders_value')::numeric, 0) + coalesce((bk->>'counter_sales')::numeric, 0);
    if sales >= 1 then bits := bits || ('Sales ' || public.nifti_peso(sales)); end if;
    if (s->>'collected')::numeric >= 1 then bits := bits || (public.nifti_peso((s->>'collected')::numeric) || ' collected'
      || case when (s->>'collected_after_reminder')::numeric >= 1 then ' (' || public.nifti_peso((s->>'collected_after_reminder')::numeric) || ' after reminders)' else '' end); end if;
    if (s->>'reminders')::int > 0 then bits := bits || ((s->>'reminders') || ' reminder' || case when (s->>'reminders')::int > 1 then 's' else '' end || ' sent for you'); end if;
    if (bu->>'orders')::int > 0 then bits := bits || ((bu->>'orders') || ' order' || case when (bu->>'orders')::int > 1 then 's' else '' end || ' to suppliers (' || public.nifti_peso((bu->>'orders_value')::numeric) || ')'); end if;
    if (bk->>'expenses')::numeric >= 1 then bits := bits || ('Expenses ' || public.nifti_peso((bk->>'expenses')::numeric)); end if;
    if (bk->>'cash_short')::numeric >= 1 then bits := bits || ('Cash short ' || public.nifti_peso((bk->>'cash_short')::numeric)); end if;
    if (bk->>'missing_stock')::numeric >= 1 then bits := bits || ('Missing stock ' || public.nifti_peso((bk->>'missing_stock')::numeric)); end if;
    if (bu->>'overpay_alerts')::int > 0 then bits := bits || ((bu->>'overpay_alerts') || ' overpayment alert' || case when (bu->>'overpay_alerts')::int > 1 then 's' else '' end); end if;
    continue when coalesce(array_length(bits, 1), 0) = 0;
    if (s->>'owed_now')::numeric >= 1 then bits := bits || ('Still owed to you: ' || public.nifti_peso((s->>'owed_now')::numeric)); end if;
    title := 'Your week with Nifti: ' || case when sales >= 1 then public.nifti_peso(sales) || ' in sales'
                                              when (s->>'collected')::numeric >= 1 then public.nifti_peso((s->>'collected')::numeric) || ' collected'
                                              else bits[1] end;
    body := left(array_to_string(bits, ' · '), 236);
    -- money totals are for the owner, general manager and finance only
    for v in select id from team_members where business_id = b.id and status = 'active' and auth_user_id is not null and roles && array['Owner','General Manager','Finance'] loop
      perform public.nifti_notify(b.id, title, body, './#dashboard', 'weekly', v.id);
    end loop;
    sent := sent + 1;
  end loop;
  return sent;
end $function$
;

CREATE OR REPLACE FUNCTION public.service_amount_due(p_business uuid, p_kind text)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when p_kind = 'verify' and public.business_plan(p_business) = 'business' then 0
    when p_kind = 'setup' and public.business_plan(p_business) = 'business'
         and exists (select 1 from upgrade_requests u where u.business_id = p_business and u.plan = 'business' and u.cycle = 'yearly' and u.status = 'approved')
         and not exists (select 1 from service_requests s where s.business_id = p_business and s.kind = 'setup' and s.amount = 0 and s.status <> 'rejected') then 0
    else public.service_price(p_kind) end $function$
;

CREATE OR REPLACE FUNCTION public.service_price(p_kind text)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(((select value from app_secrets where name = 'service_prices')::jsonb ->> p_kind)::numeric, case p_kind when 'setup' then 3500 else 1490 end) $function$
;

CREATE OR REPLACE FUNCTION public.set_2307_status(p_counterparty uuid, p_quarter text, p_status text, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); who text; buyer uuid; supplier uuid; mename text; clean text := nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>]', '', 'g')), 200), '');
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if p_quarter !~ '^\d{4}-Q[1-4]$' then raise exception 'Unknown quarter.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() limit 1;
  select name into mename from businesses where id = me;
  if p_status = 'sent' then
    buyer := me; supplier := p_counterparty;
    if not exists (select 1 from public.ewt_lines(me) l where l.buyer_business_id = me and l.supplier_business_id = p_counterparty and l.quarter = p_quarter) then raise exception 'No withheld tax recorded with them for %.', p_quarter; end if;
    insert into form2307_status(buyer_business_id, supplier_business_id, quarter, status, sent_at, sent_by_name, note)
      values (buyer, supplier, p_quarter, 'sent', now(), who, clean)
      on conflict (buyer_business_id, supplier_business_id, quarter) do update set status = case when form2307_status.status = 'received' then 'received' else 'sent' end, sent_at = now(), sent_by_name = who, note = coalesce(clean, form2307_status.note), updated_at = now();
    perform public.nifti_notify(supplier, '📄 ' || mename || ' sent your BIR 2307 for ' || p_quarter, coalesce(clean, 'Check that you received it, then mark it received in Nifti.'), './#taxforms', 'orders');
  elsif p_status = 'received' then
    buyer := p_counterparty; supplier := me;
    insert into form2307_status(buyer_business_id, supplier_business_id, quarter, status, received_at, received_by_name)
      values (buyer, supplier, p_quarter, 'received', now(), who)
      on conflict (buyer_business_id, supplier_business_id, quarter) do update set status = 'received', received_at = now(), received_by_name = who, updated_at = now();
    perform public.nifti_notify(buyer, '✅ ' || mename || ' received your BIR 2307 for ' || p_quarter, null, './#taxforms', 'orders');
  elsif p_status = 'owed' then
    update form2307_status set status = 'owed', updated_at = now()
      where quarter = p_quarter and ((buyer_business_id = me and supplier_business_id = p_counterparty and status = 'sent') or (supplier_business_id = me and buyer_business_id = p_counterparty));
  else raise exception 'Unknown status.'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.set_business_paused(p_paused boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can do this.'; end if;
  update businesses set paused_at = case when p_paused then now() else null end, catalog_public = case when p_paused then false else catalog_public end where id = me;
end $function$
;

CREATE OR REPLACE FUNCTION public.set_credit_terms(p_buyer uuid, p_limit numeric, p_hold_days integer, p_mode text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can set credit limits.'; end if;
  if not public.has_feature(me, 'credit_limits') then raise exception 'Credit limits are part of Supplier Pro.'; end if;
  if p_limit is not null and p_limit <= 0 then raise exception 'Enter a limit above zero, or leave it blank.'; end if;
  if p_hold_days is not null and (p_hold_days < 1 or p_hold_days > 365) then raise exception 'Days late must be between 1 and 365.'; end if;
  update business_relationships set credit_limit = p_limit, credit_hold_days = p_hold_days, credit_mode = case when p_mode = 'warn' then 'warn' else 'block' end
    where buyer_business_id = p_buyer and supplier_business_id = me;
  if not found then raise exception 'This buyer isn''t connected to you.'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.set_email_sender(p_user text, p_pass text, p_support_inbox text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u text := lower(btrim(coalesce(p_user, ''))); pw text := regexp_replace(coalesce(p_pass, ''), '\s', '', 'g'); inbox text := lower(btrim(coalesce(p_support_inbox, '')));
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can change this.'; end if;
  if u !~ '^[^@\s]+@(gmail\.com|googlemail\.com)$' then raise exception 'Use a Gmail address (ends in @gmail.com).'; end if;
  if pw !~ '^[a-zA-Z]{16}$' then raise exception 'The app password is the 16-letter code Google shows you (spaces are fine).'; end if;
  if inbox <> '' and inbox !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That support email doesn''t look right.'; end if;
  insert into app_secrets(name, value) values ('smtp_user', u), ('smtp_pass', pw)
    on conflict (name) do update set value = excluded.value;
  if inbox <> '' then
    insert into app_secrets(name, value) values ('support_inbox', inbox) on conflict (name) do update set value = excluded.value;
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.set_spending_caps(p_caps jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); clean jsonb;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can set spending caps.'; end if;
  clean := jsonb_build_object(
    'business', case when coalesce((p_caps->'business'->>'amount')::numeric, 0) > 0 then jsonb_build_object('amount', (p_caps->'business'->>'amount')::numeric, 'mode', case when p_caps->'business'->>'mode' = 'block' then 'block' else 'warn' end) end,
    'members', (select coalesce(jsonb_object_agg(k, jsonb_build_object('amount', (v->>'amount')::numeric, 'mode', case when v->>'mode' = 'block' then 'block' else 'warn' end)), '{}'::jsonb)
                from jsonb_each(coalesce(p_caps->'members','{}'::jsonb)) e(k, v) where coalesce((v->>'amount')::numeric, 0) > 0 and exists (select 1 from team_members t where t.id::text = k and t.business_id = me)),
    'suppliers', (select coalesce(jsonb_object_agg(k, jsonb_build_object('amount', (v->>'amount')::numeric, 'mode', case when v->>'mode' = 'block' then 'block' else 'warn' end)), '{}'::jsonb)
                from jsonb_each(coalesce(p_caps->'suppliers','{}'::jsonb)) e(k, v) where coalesce((v->>'amount')::numeric, 0) > 0));
  insert into business_settings(business_id, spending_caps) values (me, clean) on conflict (business_id) do update set spending_caps = excluded.spending_caps;
end $function$
;

CREATE OR REPLACE FUNCTION public.set_store(p_store jsonb, p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); slug text := lower(btrim(coalesce(p_slug,''))); clean jsonb; promos jsonb := '{}'::jsonb; k text; v jsonb; mode text;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can change your store.'; end if;
  if slug !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' then raise exception 'Your link name can use small letters, numbers and dashes (3–40 characters).'; end if;
  if slug in ('admin','nifti','app','api','store','shop','login','join','www','help','support','pricing','about','s','o','g','st') then raise exception 'That link name is taken. Try another.'; end if;
  if exists (select 1 from businesses where store_slug = slug and id <> me) then raise exception 'That link name is taken. Try another.'; end if;
  mode := coalesce(p_store->>'price_mode', 'public');
  if mode not in ('public','signup','hidden') then mode := 'public'; end if;
  if public.has_feature(me, 'store_promos') and jsonb_typeof(p_store->'promos') = 'object' then
    for k, v in select * from jsonb_each(p_store->'promos') loop
      if (v->>'price')::numeric > 0 and public.nifti_iso_date(v->>'until') >= (now() at time zone 'Asia/Manila')::date then
        promos := promos || jsonb_build_object(left(k, 120), jsonb_build_object('price', round((v->>'price')::numeric, 2), 'until', public.nifti_iso_date(v->>'until')));
      end if;
    end loop;
  end if;
  clean := jsonb_strip_nulls(jsonb_build_object(
    'enabled', coalesce((p_store->>'enabled')::boolean, false),
    'headline', nullif(left(btrim(regexp_replace(coalesce(p_store->>'headline',''), '[<>]', '', 'g')), 90), ''),
    'about', nullif(left(btrim(regexp_replace(coalesce(p_store->>'about',''), '[<>]', '', 'g')), 500), ''),
    'delivery_areas', nullif(left(btrim(regexp_replace(coalesce(p_store->>'delivery_areas',''), '[<>]', '', 'g')), 200), ''),
    'delivery_days', nullif(left(btrim(regexp_replace(coalesce(p_store->>'delivery_days',''), '[<>]', '', 'g')), 100), ''),
    'lead_time', nullif(left(btrim(regexp_replace(coalesce(p_store->>'lead_time',''), '[<>]', '', 'g')), 60), ''),
    'min_order', case when (p_store->>'min_order')::numeric > 0 then round((p_store->>'min_order')::numeric) end,
    'price_mode', mode,
    'cod', coalesce((p_store->>'cod')::boolean, false),
    'show_phone', coalesce((p_store->>'show_phone')::boolean, true),
    'featured', (select jsonb_agg(x) from (select left(value, 120) x from jsonb_array_elements_text(case when jsonb_typeof(p_store->'featured') = 'array' then p_store->'featured' else '[]'::jsonb end) limit 6) f),
    'promos', case when promos = '{}'::jsonb then null else promos end));
  update businesses set store = clean, store_slug = slug where id = me;
  return clean;
end $function$
;

CREATE OR REPLACE FUNCTION public.set_watchdog_settings(p_settings jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); clean jsonb;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can change this.'; end if;
  clean := jsonb_build_object(
    'enabled', coalesce((p_settings->>'enabled')::boolean, true),
    'tolerance_pct', least(greatest(coalesce((p_settings->>'tolerance_pct')::numeric, 3), 0), 50),
    'checks', jsonb_build_object(
      'above_agreed', coalesce((p_settings->'checks'->>'above_agreed')::boolean, true),
      'price_jump', coalesce((p_settings->'checks'->>'price_jump')::boolean, true),
      'cheaper_elsewhere', coalesce((p_settings->'checks'->>'cheaper_elsewhere')::boolean, true),
      'new_supplier', coalesce((p_settings->'checks'->>'new_supplier')::boolean, true),
      'big_qty', coalesce((p_settings->'checks'->>'big_qty')::boolean, true)));
  insert into business_settings(business_id, watchdog) values (me, clean)
    on conflict (business_id) do update set watchdog = excluded.watchdog;
end $function$
;

CREATE OR REPLACE FUNCTION public.setup_stage(p_business uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when exists (select 1 from purchase_orders po where (po.supplier_business_id = b.id or po.buyer_business_id = b.id) and po.status <> 'draft')
      or exists (select 1 from downstream_sales s where s.business_id = b.id)
      or exists (select 1 from expenses e where e.business_id = b.id) then 'active'
    when exists (select 1 from business_relationships r where r.buyer_business_id = b.id or r.supplier_business_id = b.id) then 'first_order'
    when jsonb_array_length(coalesce(b.catalog, '[]'::jsonb)) > 0 or exists (select 1 from inventory_items i where i.business_id = b.id) then 'add_partner'
    else 'add_products'
  end
  from businesses b where b.id = p_business
$function$
;

CREATE OR REPLACE FUNCTION public.spending_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() id)
  select jsonb_build_object(
    'caps', coalesce((select spending_caps from business_settings where business_id = me.id), '{}'::jsonb),
    'month_total', public.nifti_month_spend(me.id, null, null, null),
    'by_member', (select coalesce(jsonb_object_agg(placed_by_member::text, s), '{}'::jsonb) from (select placed_by_member, sum(public.nifti_po_total(po)) s from purchase_orders po
                   where po.buyer_business_id = me.id and po.status not in ('draft','cancelled') and date_trunc('month', po.created_date) = date_trunc('month', public.nifti_today()) and placed_by_member is not null group by 1) x),
    'by_supplier', (select coalesce(jsonb_object_agg(supplier_business_id::text, s), '{}'::jsonb) from (select supplier_business_id, sum(public.nifti_po_total(po)) s from purchase_orders po
                   where po.buyer_business_id = me.id and po.status not in ('draft','cancelled') and date_trunc('month', po.created_date) = date_trunc('month', public.nifti_today()) group by 1) x)
  ) from me where me.id is not null $function$
;

CREATE OR REPLACE FUNCTION public.statement_data(p_supplier uuid, p_buyer uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with t as (select (now() at time zone 'Asia/Manila')::date d),
  inv as (
    select po.id, po.po_number, po.invoice->>'number' inv_no,
           coalesce(public.nifti_iso_date(po.invoice->>'issuedDate'), po.created_date) inv_date,
           public.nifti_iso_date(po.invoice->>'dueDate') due,
           coalesce((po.invoice->>'statedTotal')::numeric, 0) amount,
           greatest(public.nifti_invoice_balance(po.invoice), 0) balance,
           (select coalesce(sum((p->>'amount')::numeric), 0) from jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb)) p where p->>'confirmStatus' = 'pending') pending,
           coalesce(po.invoice->'payments', '[]'::jsonb) payments
    from purchase_orders po
    where po.supplier_business_id = p_supplier and po.buyer_business_id = p_buyer
      and po.invoice is not null and po.status not in ('draft','cancelled')
  ),
  shown as (select inv.* from inv, t where inv.balance >= 1 or inv.inv_date >= t.d - 60),
  pays as (
    select i.inv_no, i.po_number, public.nifti_iso_date(p->>'date') pdate, p->>'method' method, p->>'reference' ref, (p->>'amount')::numeric amount,
           coalesce(p->>'confirmStatus', 'confirmed') status
    from inv i, jsonb_array_elements(i.payments) p, t
    where coalesce(public.nifti_iso_date(p->>'date'), t.d) >= t.d - 60 and coalesce(p->>'confirmStatus','confirmed') <> 'rejected'
  )
  select jsonb_build_object(
    'as_of', (select d from t),
    'supplier', (select jsonb_build_object('name', b.name, 'tin', tp.tin, 'address', tp.registered_address, 'contact', b.shared_contact,
                   'pay_to', (select coalesce(jsonb_agg(a - 'id'), '[]'::jsonb) from jsonb_array_elements(coalesce(b.payment_methods,'[]'::jsonb)) a))
                 from businesses b left join tax_profiles tp on tp.business_id = b.id where b.id = p_supplier),
    'buyer', (select jsonb_build_object('name', b.name) from businesses b where b.id = p_buyer),
    'invoices', (select coalesce(jsonb_agg(jsonb_build_object('po_number', po_number, 'invoice_number', inv_no, 'date', inv_date, 'due', due,
                   'amount', amount, 'balance', balance, 'pending', pending, 'days_overdue', case when due is not null and balance >= 1 then greatest((select d from t) - due, 0) else 0 end)
                   order by due nulls last, inv_date), '[]'::jsonb) from shown),
    'payments', (select coalesce(jsonb_agg(jsonb_build_object('date', pdate, 'invoice_number', inv_no, 'po_number', po_number, 'method', method, 'reference', ref, 'amount', amount, 'status', status) order by pdate desc nulls last), '[]'::jsonb) from pays),
    'aging', (select jsonb_build_object(
        'current', coalesce(sum(balance) filter (where due is null or due >= t.d), 0),
        'd1_30', coalesce(sum(balance) filter (where t.d - due between 1 and 30), 0),
        'd31_60', coalesce(sum(balance) filter (where t.d - due between 31 and 60), 0),
        'd61_90', coalesce(sum(balance) filter (where t.d - due between 61 and 90), 0),
        'd90p', coalesce(sum(balance) filter (where t.d - due > 90), 0)) from inv, t),
    'totals', (select jsonb_build_object('balance', coalesce(sum(balance), 0), 'pending', coalesce(sum(pending), 0), 'open_count', count(*) filter (where balance >= 1)) from inv)
  )
$function$
;

CREATE OR REPLACE FUNCTION public.store_stats(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); d int := least(greatest(coalesce(p_days, 30), 1), 365);
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not public.has_feature(me, 'store_insights') then raise exception 'Store insights are part of Supplier Pro.'; end if;
  return (select jsonb_build_object(
    'views', (select count(*) from store_events where business_id = me and kind = 'view' and created_at > now() - make_interval(days => d)),
    'orders', (select count(*) from store_events where business_id = me and kind = 'order' and created_at > now() - make_interval(days => d)),
    'sales', (select coalesce(sum((select sum(nullif(li->>'qty','')::numeric * nullif(li->>'unitPrice','')::numeric) from jsonb_array_elements(po.line_items) li)), 0)
              from store_events e join purchase_orders po on po.id = e.po_id where e.business_id = me and e.kind = 'order' and e.created_at > now() - make_interval(days => d) and po.status <> 'cancelled'),
    'new_buyers', (select count(distinct po.buyer_business_id) from store_events e join purchase_orders po on po.id = e.po_id where e.business_id = me and e.kind = 'order' and e.created_at > now() - make_interval(days => d)
                   and not exists (select 1 from purchase_orders p2 where p2.buyer_business_id = po.buyer_business_id and p2.supplier_business_id = me and p2.created_at < e.created_at - interval '1 minute')),
    'by_source', (select coalesce(jsonb_object_agg(s, n), '{}'::jsonb) from (select coalesce(nullif(src,''),'direct') s, count(*) n from store_events where business_id = me and kind = 'view' and created_at > now() - make_interval(days => d) group by 1) x),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'views', v, 'orders', o) order by day), '[]'::jsonb) from (
        select (created_at at time zone 'Asia/Manila')::date as day, count(*) filter (where kind = 'view') v, count(*) filter (where kind = 'order') o
        from store_events where business_id = me and created_at > now() - make_interval(days => d) group by 1) x),
    'top_products', (select coalesce(jsonb_agg(jsonb_build_object('product', p, 'qty', q, 'orders', n) order by n desc, q desc), '[]'::jsonb) from (
        select li->>'product' p, sum(nullif(li->>'qty','')::numeric) q, count(*) n from store_events e join purchase_orders po on po.id = e.po_id, jsonb_array_elements(po.line_items) li
        where e.business_id = me and e.kind = 'order' and e.created_at > now() - make_interval(days => d) group by 1 order by 3 desc limit 8) x)
  ));
end $function$
;

CREATE OR REPLACE FUNCTION public.submit_store_inquiry(p_slug text, p_name text, p_phone text, p_message text, p_src text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare sup businesses; who text; v_phone text; msg text; lid uuid;
begin
  select * into sup from businesses where store_slug = lower(btrim(coalesce(p_slug,'')));
  if sup.id is null or coalesce((sup.store->>'enabled')::boolean, false) = false then raise exception 'This store isn''t open right now.'; end if;
  who := left(btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g')), 80);
  v_phone := public.nifti_ph_mobile(p_phone);
  msg := left(btrim(regexp_replace(coalesce(p_message,''), '[<>`]', '', 'g')), 600);
  if length(who) < 2 then raise exception 'Please enter your name.'; end if;
  if v_phone is null then raise exception 'Please enter a mobile number like 0917 123 4567.'; end if;
  if length(msg) < 3 then raise exception 'What would you like to ask?'; end if;
  if (select count(*) from store_events where business_id = sup.id and kind = 'inquiry' and created_at > now() - interval '1 day') >= 100
     or (select count(*) from sales_leads where business_id = sup.id and sales_leads.phone = v_phone and updated_at > now() - interval '1 day' and source = 'store') >= 3 then
    raise exception 'Thanks! You''ve sent a few messages already. The store will reply soon.';
  end if;
  select id into lid from sales_leads where business_id = sup.id and sales_leads.phone = v_phone and stage not in ('won','lost') limit 1;
  if lid is null then
    insert into sales_leads(business_id, name, phone, source, interest, next_follow_up, log)
      values (sup.id, who, v_phone, 'store', msg, (now() at time zone 'Asia/Manila')::date,
              jsonb_build_array(jsonb_build_object('at', now(), 'what', 'Asked on your store: ' || msg)))
      returning id into lid;
  else
    update sales_leads set interest = msg, next_follow_up = (now() at time zone 'Asia/Manila')::date, updated_at = now(),
      log = log || jsonb_build_array(jsonb_build_object('at', now(), 'what', 'Asked again on your store: ' || msg)) where id = lid;
  end if;
  insert into store_events(business_id, kind, src) values (sup.id, 'inquiry', left(regexp_replace(coalesce(p_src,''), '[^a-zA-Z0-9_-]', '', 'g'), 20));
  perform public.nifti_notify(sup.id, '💬 New inquiry from ' || who, msg, './#followups', 'leads');
  return jsonb_build_object('ok', true);
end $function$
;

CREATE OR REPLACE FUNCTION public.submit_store_order(p_slug text, p_name text, p_business text, p_phone text, p_address text, p_items jsonb, p_note text DEFAULT NULL::text, p_src text DEFAULT NULL::text, p_needed_by date DEFAULT NULL::date, p_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  sup businesses; buyer_id uuid; buyer_rec businesses; me_member team_members;
  who text := left(btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g')), 80);
  bizname text := left(btrim(regexp_replace(coalesce(p_business,''), '[<>"`]', '', 'g')), 120);
  phone text := public.nifti_ph_mobile(p_phone);
  addr text := nullif(left(btrim(regexp_replace(coalesce(p_address,''), '[<>"`]', '', 'g')), 300), '');
  note text := nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>"`]', '', 'g')), 500), '');
  src text := left(regexp_replace(coalesce(p_src,''), '[^a-zA-Z0-9_-]', '', 'g'), 20);
  it jsonb; cat jsonb; lines jsonb := '[]'::jsonb; qty numeric; price numeric; total numeric := 0; promos jsonb;
  today date := (now() at time zone 'Asia/Manila')::date; poid uuid; ponum text; tok text; claim text; prices_known boolean;
begin
  select * into sup from businesses where store_slug = lower(btrim(coalesce(p_slug,'')));
  if sup.id is null or coalesce((sup.store->>'enabled')::boolean, false) = false then raise exception 'This store isn''t taking orders right now.'; end if;
  if sup.paused_at is not null then raise exception '% has paused new orders.', sup.name; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Add at least one item.'; end if;
  if jsonb_array_length(p_items) > 60 then raise exception 'That''s a lot of items. Please split it into two orders.'; end if;
  promos := case when public.has_feature(sup.id, 'store_promos') then coalesce(sup.store->'promos', '{}'::jsonb) else '{}'::jsonb end;
  for it in select value from jsonb_array_elements(p_items) loop
    qty := nullif(it->>'qty','')::numeric;
    if qty is null or qty <= 0 or qty > 1000000 then raise exception 'Check the quantity for %.', coalesce(it->>'product','an item'); end if;
    select c into cat from jsonb_array_elements(coalesce(sup.catalog,'[]'::jsonb)) c where c->>'product' = it->>'product' limit 1;
    if cat is null then raise exception '% is no longer in this store. Please refresh.', coalesce(it->>'product','An item'); end if;
    price := coalesce(case when (promos->(cat->>'product')->>'until')::date >= today then (promos->(cat->>'product')->>'price')::numeric end, (cat->>'price')::numeric, 0);
    lines := lines || jsonb_build_array(jsonb_build_object('product', cat->>'product', 'qty', qty, 'unitPrice', price, 'unit', cat->>'unit'));
    total := total + qty * price;
  end loop;

  if auth.uid() is not null then
    select tm.* into me_member from team_members tm join businesses b on b.id = tm.business_id
      where tm.auth_user_id = auth.uid() and tm.status = 'active' and not b.is_outside limit 1;
  end if;
  prices_known := coalesce(sup.store->>'price_mode','public') = 'public' or me_member.id is not null;
  if prices_known and (sup.store->>'min_order')::numeric > 0 and total < (sup.store->>'min_order')::numeric then
    raise exception 'The minimum order is ₱%. Your order is ₱%.', to_char((sup.store->>'min_order')::numeric, 'FM999,999,999'), to_char(total, 'FM999,999,999');
  end if;

  if me_member.id is not null then
    buyer_id := me_member.business_id;
    who := coalesce(nullif(who, ''), me_member.name);
  else
    if length(who) < 2 then raise exception 'Please enter your name.'; end if;
    if phone is null then raise exception 'Please enter a mobile number like 0917 123 4567, so they can reach you.'; end if;
    if (select count(*) from store_events e join purchase_orders po on po.id = e.po_id join businesses bb on bb.id = po.buyer_business_id
        where e.business_id = sup.id and e.kind = 'order' and e.created_at > now() - interval '1 day' and bb.outside_contact->>'phone' = phone) >= 5
       or (select count(*) from store_events where business_id = sup.id and kind = 'order' and created_at > now() - interval '1 day') >= 80 then
      raise exception 'Too many orders from this number today. Please message the store directly.';
    end if;
    select * into buyer_rec from businesses where is_outside and type = 'buyer' and created_by_business = sup.id and outside_contact->>'phone' = phone limit 1;
    if buyer_rec.id is null then
      insert into businesses(name, type, is_outside, outside_contact, created_by_business, claim_code)
        values (coalesce(nullif(bizname, ''), who), 'buyer', true, jsonb_strip_nulls(jsonb_build_object('name', who, 'phone', phone, 'address', addr)), sup.id, public.nifti_random_token(12))
        returning * into buyer_rec;
    else
      update businesses set outside_contact = outside_contact || jsonb_strip_nulls(jsonb_build_object('name', who, 'address', addr)),
        name = case when bizname <> '' then bizname else name end where id = buyer_rec.id returning * into buyer_rec;
    end if;
    buyer_id := buyer_rec.id; claim := buyer_rec.claim_code;
  end if;
  if buyer_id = sup.id then raise exception 'You can''t order from your own store.'; end if;
  insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer_id, sup.id) on conflict do nothing;
  insert into conversations(buyer_business_id, supplier_business_id) values (buyer_id, sup.id) on conflict do nothing;

  insert into purchase_orders(buyer_business_id, supplier_business_id, type, status, currency, tax_rate, line_items, created_date, requested_delivery_date, delivery_address, notes, customer_ref, history)
    values (buyer_id, sup.id, 'local', 'sent', 'PHP', 0, lines, today, p_needed_by, addr, note, nullif(left(btrim(regexp_replace(coalesce(p_ref,''), '[<>"`]', '', 'g')), 60), ''),
      jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'buyer',
        'action', '🛒 Ordered from your online store by ' || who || coalesce(' (' || phone || ')', '') || case when src <> '' then ' · via ' || src else '' end)))
    returning id, po_number into poid, ponum;
  tok := public.nifti_random_token(24);
  insert into order_links(token, po_id, created_by_business, expires_at) values (tok, poid, sup.id, now() + interval '120 days');
  insert into store_events(business_id, kind, src, po_id) values (sup.id, 'order', src, poid);
  return jsonb_build_object('po_number', ponum, 'token', tok, 'claim_code', claim, 'total', total, 'prices_known', prices_known);
end $function$
;

CREATE OR REPLACE FUNCTION public.sync_my_leads()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); n int := 0; k int;
begin
  if me is null then return 0; end if;
  insert into sales_leads(business_id, name, email, source, source_ref, next_follow_up, log)
    select me, i.invited_email, i.invited_email, 'invite', i.id::text, (now() at time zone 'Asia/Manila')::date,
           jsonb_build_array(jsonb_build_object('at', i.created_at, 'what', 'You invited them to Nifti'))
    from business_invites i where i.inviting_business_id = me and coalesce(i.status, 'pending') not in ('accepted')
      and i.invited_email is not null
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;
  insert into sales_leads(business_id, name, company, source, source_ref, interest, next_follow_up, log)
    select me, b.name, b.name, 'discover', r.id::text, r.note, (now() at time zone 'Asia/Manila')::date,
           jsonb_build_array(jsonb_build_object('at', r.created_at, 'what', 'Asked to connect on Discover' || coalesce(': ' || r.note, '')))
    from connection_requests r join businesses b on b.id = r.from_business
    where r.to_business = me and coalesce(r.status, 'pending') = 'pending'
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.undo_route_stop(p_stop uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s route_stops; r routes; mid uuid; who text; po purchase_orders; pv jsonb; newinv jsonb; blocked int; today date := public.nifti_today();
begin
  select * into s from route_stops where id = p_stop for update;
  if s.id is null or s.business_id not in (select public.my_business_ids()) then raise exception 'Stop not found.'; end if;
  select * into r from routes where id = s.route_id for update;
  mid := public.nifti_me_member(s.business_id);
  if not (r.driver_member_id = mid or public.nifti_route_planner(s.business_id)) then raise exception 'Only the driver or an Owner/Manager can undo this.'; end if;
  if s.status = 'pending' then return; end if;
  if r.remit is not null then raise exception 'The cash for this route was already handed over and confirmed. Ask the office to fix it on the order.'; end if;
  select name into who from team_members where id = mid;
  if s.status = 'done' then
    -- a cheque from this stop that was already deposited, cleared or bounced can't be taken back here
    select count(*) into blocked from purchase_orders p,
      lateral (select x from jsonb_array_elements(coalesce(p.invoice->'payments','[]'::jsonb)) x union all select p.cod_payment where p.cod_payment is not null) t(pay)
      where p.id = any(s.deliver_po_ids || s.collect_po_ids) and pay->>'routeStopId' = s.id::text
        and pay->>'method' = 'check' and (pay->>'depositedAt' is not null or coalesce(pay->>'checkStatus','pending') <> 'pending');
    if blocked > 0 then raise exception 'A cheque from this stop was already deposited or cleared. Fix it in Cheques instead.'; end if;
    for po in select * from purchase_orders where id = any(s.deliver_po_ids || s.collect_po_ids) and supplier_business_id = s.business_id loop
      pv := s.result->'prev'->(po.id::text);
      newinv := po.invoice;
      if newinv is not null then
        newinv := jsonb_set(newinv, '{payments}', coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(newinv->'payments','[]'::jsonb)) x where coalesce(x->>'routeStopId','') <> s.id::text), '[]'::jsonb));
        if pv is not null then newinv := case when pv->>'inv' is null then newinv - 'status' else newinv || jsonb_build_object('status', pv->>'inv') end; end if;
      end if;
      update purchase_orders set invoice = newinv,
        cod_payment = case when cod_payment->>'routeStopId' = s.id::text then null else cod_payment end,
        status = case when pv is not null and pv->>'status' is not null then pv->>'status' else status end,
        history = coalesce(history,'[]'::jsonb) || jsonb_build_object('date', today, 'time', to_char(now() at time zone 'Asia/Manila', 'HH12:MI AM'), 'actor', 'supplier',
                  'action', '↩ Route stop undone by ' || coalesce(who, 'staff') || ' (wrong tap)')
      where id = po.id;
    end loop;
  end if;
  update route_stops set status = 'pending', result = null, proof = null, done_at = null, done_by = null where id = s.id;
  update routes set status = case when exists (select 1 from route_stops where route_id = r.id and status <> 'pending') then 'on_road' else 'planned' end, updated_at = now() where id = r.id;
end $function$
;

CREATE OR REPLACE FUNCTION public.use_credit_memo(p_memo uuid, p_amount numeric, p_po uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare m credit_memos; me uuid := public.nifti_my_business();
begin
  select * into m from credit_memos where id = p_memo for update;
  if m.id is null or m.supplier_business_id <> me or not public.nifti_has_role(me, array['Owner','General Manager','Finance']) then raise exception 'Credit not found.'; end if;
  if m.status <> 'open' or p_amount <= 0 or p_amount > m.remaining + 0.005 then raise exception 'Only % of this credit is left.', public.nifti_peso(m.remaining); end if;
  if not exists (select 1 from purchase_orders where id = p_po and supplier_business_id = me and buyer_business_id = m.buyer_business_id and invoice is not null) then raise exception 'Pick an invoice for the same buyer.'; end if;
  update credit_memos set remaining = round(remaining - p_amount, 2), status = case when remaining - p_amount <= 0.005 then 'used' else 'open' end,
    uses = uses || jsonb_build_object('po_id', p_po, 'amount', p_amount, 'at', now()) where id = m.id returning * into m;
  return to_jsonb(m);
end $function$
;

CREATE OR REPLACE FUNCTION public.void_credit_memo(p_memo uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update credit_memos set status = 'void' where id = p_memo and supplier_business_id = public.nifti_my_business() and remaining = amount and status = 'open'
    and public.nifti_has_role(supplier_business_id, array['Owner','General Manager','Finance']);
  if not found then raise exception 'Only an unused credit can be cancelled.'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.watchdog_check_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  actor team_members; cfg jsonb; tol numeric; checks jsonb; thr numeric; total numeric;
  li jsonb; pkey text; pname text; qty numeric; price numeric; agreed numeric; last_same numeric; best record; usual record; med_qty numeric; hist_n int;
  sup_name text; n_alerts int := 0; owner record; first_title text;
begin
  if new.status <> 'sent' or (tg_op = 'UPDATE' and old.status = 'sent') then return new; end if;
  if auth.uid() is null then return new; end if;
  select * into actor from team_members where auth_user_id = auth.uid() and business_id = new.buyer_business_id and status = 'active' limit 1;
  if actor.id is null then return new; end if; -- written by the supplier side or someone else

  -- Hard rule: only an Owner/General Manager can send an order over the approval limit.
  select approval_threshold into thr from businesses where id = new.buyer_business_id;
  total := (select coalesce(sum(nullif(x->>'qty','')::numeric * nullif(x->>'unitPrice','')::numeric), 0) from jsonb_array_elements(coalesce(new.line_items,'[]'::jsonb)) x) * (1 + coalesce(new.tax_rate, 0));
  if thr is not null and total > thr and not (actor.roles && array['Owner','General Manager']) then
    raise exception 'This order is over your approval limit (₱%). Ask an Owner or General Manager to approve it.', to_char(thr, 'FM999,999,999');
  end if;

  if not public.has_feature(new.buyer_business_id, 'watchdog') then return new; end if;
  if actor.roles && array['Owner'] then return new; end if; -- the owner's own orders aren't watched
  select watchdog into cfg from business_settings where business_id = new.buyer_business_id;
  cfg := coalesce(cfg, '{}'::jsonb);
  if coalesce((cfg->>'enabled')::boolean, true) = false then return new; end if;
  tol := coalesce((cfg->>'tolerance_pct')::numeric, 3) / 100.0;
  checks := coalesce(cfg->'checks', '{}'::jsonb);
  select name into sup_name from businesses where id = new.supplier_business_id;

  for li in select value from jsonb_array_elements(coalesce(new.line_items,'[]'::jsonb)) loop
    pname := li->>'product'; pkey := public.nifti_norm(pname);
    qty := nullif(li->>'qty','')::numeric; price := nullif(li->>'unitPrice','')::numeric;
    if pkey = '' or qty is null or price is null or qty <= 0 then continue; end if;

    -- 1. Above the price you agreed on with this supplier
    if coalesce((checks->>'above_agreed')::boolean, true) then
      select pa.price into agreed from price_agreements pa
        where pa.buyer_business_id = new.buyer_business_id and pa.supplier_business_id = new.supplier_business_id
          and public.nifti_norm(pa.product) = pkey and pa.status = 'confirmed' and pa.deleted_at is null
          and (pa.effective_date is null or pa.effective_date <= new.created_date) and (pa.end_date is null or pa.end_date >= new.created_date)
        order by pa.created_at desc limit 1;
      if agreed is not null and price > agreed * 1.0005 then
        insert into watchdog_alerts(business_id, po_id, po_number, kind, title, detail, product, amount_at_risk, actor_name)
          values (new.buyer_business_id, new.id, new.po_number, 'above_agreed', pname || ' ordered above your agreed price',
                  '₱' || to_char(price, 'FM999,999,990.00') || ' vs agreed ₱' || to_char(agreed, 'FM999,999,990.00') || ' with ' || sup_name || ' (' || qty || ' units)',
                  pname, round((price - agreed) * qty, 2), actor.name);
        n_alerts := n_alerts + 1; first_title := coalesce(first_title, pname || ' above agreed price'); continue;
      end if;
    end if;

    -- 2. Price jumped since the last order from the same supplier
    if coalesce((checks->>'price_jump')::boolean, true) then
      select h.unit_price into last_same from public.buyer_item_history(new.buyer_business_id, new.id, 180) h
        where h.supplier_business_id = new.supplier_business_id and h.product_key = pkey order by h.created_date desc limit 1;
      if last_same is not null and price > last_same * (1 + tol) then
        insert into watchdog_alerts(business_id, po_id, po_number, kind, title, detail, product, amount_at_risk, actor_name)
          values (new.buyer_business_id, new.id, new.po_number, 'price_jump', pname || ' is ' || round((price / last_same - 1) * 100) || '% more than last time',
                  '₱' || to_char(price, 'FM999,999,990.00') || ' now vs ₱' || to_char(last_same, 'FM999,999,990.00') || ' on your last order from ' || sup_name,
                  pname, round((price - last_same) * qty, 2), actor.name);
        n_alerts := n_alerts + 1; first_title := coalesce(first_title, pname || ' price jump'); continue;
      end if;
    end if;

    -- 3. Another supplier sold it to you cheaper recently
    if coalesce((checks->>'cheaper_elsewhere')::boolean, true) then
      select h.supplier_name, h.unit_price into best from public.buyer_item_history(new.buyer_business_id, new.id, 90) h
        where h.product_key = pkey and h.supplier_business_id <> new.supplier_business_id order by h.unit_price asc limit 1;
      if best.unit_price is not null and price > best.unit_price * (1 + tol) then
        insert into watchdog_alerts(business_id, po_id, po_number, kind, title, detail, product, amount_at_risk, actor_name)
          values (new.buyer_business_id, new.id, new.po_number, 'cheaper_elsewhere', pname || ' was cheaper from ' || best.supplier_name,
                  '₱' || to_char(price, 'FM999,999,990.00') || ' from ' || sup_name || ' vs ₱' || to_char(best.unit_price, 'FM999,999,990.00') || ' from ' || best.supplier_name || ' in the last 90 days',
                  pname, round((price - best.unit_price) * qty, 2), actor.name);
        n_alerts := n_alerts + 1; first_title := coalesce(first_title, pname || ' cheaper elsewhere');
      end if;
    end if;

    -- 4. Switched away from the usual supplier for this item
    if coalesce((checks->>'new_supplier')::boolean, true) then
      if not exists (select 1 from public.buyer_item_history(new.buyer_business_id, new.id, 365) h where h.product_key = pkey and h.supplier_business_id = new.supplier_business_id) then
        select h.supplier_name, count(*) n, min(h.unit_price) p into usual from public.buyer_item_history(new.buyer_business_id, new.id, 180) h
          where h.product_key = pkey group by h.supplier_name order by count(*) desc limit 1;
        if usual.n >= 2 then
          insert into watchdog_alerts(business_id, po_id, po_number, kind, title, detail, product, amount_at_risk, actor_name)
            values (new.buyer_business_id, new.id, new.po_number, 'new_supplier', pname || ' ordered from a new supplier',
                    'Usually from ' || usual.supplier_name || ' (' || usual.n || ' orders, from ₱' || to_char(usual.p, 'FM999,999,990.00') || '). This time from ' || sup_name || ' at ₱' || to_char(price, 'FM999,999,990.00'),
                    pname, greatest(round((price - usual.p) * qty, 2), 0), actor.name);
          n_alerts := n_alerts + 1; first_title := coalesce(first_title, pname || ' new supplier');
        end if;
      end if;
    end if;

    -- 5. Unusually large quantity
    if coalesce((checks->>'big_qty')::boolean, true) then
      select percentile_cont(0.5) within group (order by h.qty), count(*) into med_qty, hist_n
        from (select h.qty from public.buyer_item_history(new.buyer_business_id, new.id, 180) h where h.product_key = pkey order by h.created_date desc limit 6) h;
      if hist_n >= 3 and med_qty > 0 and qty > med_qty * 2.5 then
        insert into watchdog_alerts(business_id, po_id, po_number, kind, title, detail, product, amount_at_risk, actor_name)
          values (new.buyer_business_id, new.id, new.po_number, 'big_qty', pname || ': ' || qty || ' units, usually about ' || round(med_qty),
                  'That''s ' || round(qty / med_qty, 1) || '× your usual order size', pname, 0, actor.name);
        n_alerts := n_alerts + 1; first_title := coalesce(first_title, pname || ' big quantity');
      end if;
    end if;
  end loop;

  if n_alerts > 0 then
    for owner in select id from team_members where business_id = new.buyer_business_id and status = 'active' and roles && array['Owner'] and auth_user_id is not null loop
      perform public.nifti_notify(new.buyer_business_id, '🛡 Watchdog: ' || new.po_number || ' by ' || actor.name,
        first_title || case when n_alerts > 1 then ' (+' || (n_alerts - 1) || ' more)' else '' end, './#watchdog', 'orders', owner.id, null);
    end loop;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.weekly_recap_for(p_business uuid, p_from date, p_to date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b businesses; sell jsonb; buy jsonb; books jsonb; tz text := 'Asia/Manila';
begin
  select * into b from businesses where id = p_business;
  if b.id is null then return null; end if;
  with mine as (select * from purchase_orders where supplier_business_id = p_business and status <> 'draft'),
  pays as (
    select po.id po_id, (p->>'amount')::numeric amt, public.nifti_iso_date(p->>'date') d
    from mine po, jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb)) p
    where coalesce(p->>'confirmStatus','confirmed') = 'confirmed' and not (p->>'method' = 'check' and coalesce(p->>'checkStatus','') <> 'cleared')
    union all
    select po.id, (p->>'amount')::numeric, public.nifti_iso_date(p->>'date')
    from mine po, jsonb_array_elements(coalesce(po.deposit_payments,'[]'::jsonb)) p
    where coalesce(p->>'confirmStatus','confirmed') = 'confirmed'
      and not exists (select 1 from jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb)) q where q->>'id' = p->>'id')
  ),
  wk as (select * from pays where d between p_from and p_to)
  select jsonb_build_object(
    'orders', (select count(*) from mine where created_date between p_from and p_to and status not in ('cancelled','quote') and coalesce(invoice->>'opening','') <> 'true'),
    'orders_value', (select coalesce(sum(public.nifti_po_total(m)), 0) from mine m where created_date between p_from and p_to and status not in ('cancelled','quote') and coalesce(invoice->>'opening','') <> 'true'),
    'collected', (select coalesce(sum(amt), 0) from wk),
    'payments', (select count(*) from wk),
    'collected_after_reminder', (select coalesce(sum(amt), 0) from wk where exists (select 1 from payment_reminder_log l where l.po_id = wk.po_id and (l.sent_at at time zone tz)::date <= wk.d)),
    'reminders', (select count(*) from payment_reminder_log l join mine m on m.id = l.po_id where (l.sent_at at time zone tz)::date between p_from and p_to),
    'statements_opened', (select count(distinct buyer_business_id) from statement_links where supplier_business_id = p_business and (first_viewed_at at time zone tz)::date between p_from and p_to),
    'deliveries_confirmed', (select count(*) from mine where public.nifti_iso_date(delivery_confirmation->>'confirmedDate') between p_from and p_to),
    'owed_now', (select coalesce(sum(greatest(public.nifti_invoice_balance(invoice), 0)), 0) from mine where invoice is not null and status not in ('cancelled','paid') and coalesce(invoice->>'status','') <> 'paid'))
  into sell;
  with mine as (select * from purchase_orders where buyer_business_id = p_business and status <> 'draft'),
  pays as (
    select (p->>'amount')::numeric amt, public.nifti_iso_date(p->>'date') d
    from mine po, jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb) || coalesce(po.deposit_payments,'[]'::jsonb)) p
    where coalesce(p->>'confirmStatus','confirmed') = 'confirmed'
  )
  select jsonb_build_object(
    'orders', (select count(*) from mine where created_date between p_from and p_to and status not in ('cancelled')),
    'orders_value', (select coalesce(sum(public.nifti_po_total(m)), 0) from mine m where created_date between p_from and p_to and status not in ('cancelled')),
    'paid', (select coalesce(sum(amt), 0) from pays where d between p_from and p_to),
    'deliveries', (select count(*) from mine where public.nifti_iso_date(delivery_confirmation->>'confirmedDate') between p_from and p_to),
    'late', (select count(*) from mine where requested_delivery_date between p_from and p_to and status not in ('cancelled')
               and (public.nifti_iso_date(delivery_confirmation->>'confirmedDate') is null or public.nifti_iso_date(delivery_confirmation->>'confirmedDate') > requested_delivery_date)),
    'overpay_alerts', (select count(*) from watchdog_alerts where business_id = p_business and (created_at at time zone tz)::date between p_from and p_to),
    'overpay_amount', (select coalesce(sum(amount_at_risk), 0) from watchdog_alerts where business_id = p_business and (created_at at time zone tz)::date between p_from and p_to))
  into buy;
  select jsonb_build_object(
    'counter_sales', (select coalesce(sum(total), 0) from downstream_sales where business_id = p_business and voided_at is null and sale_date between p_from and p_to),
    'counter_count', (select count(*) from downstream_sales where business_id = p_business and voided_at is null and sale_date between p_from and p_to),
    'expenses', (select coalesce(sum(amount), 0) from expenses where business_id = p_business and deleted_at is null and spent_on between p_from and p_to and category not in ('Owner took money', 'Cash to bank', 'Owner put in cash')),
    'cash_short', (select coalesce(sum(-difference), 0) from cash_counts where business_id = p_business and count_day between p_from and p_to and difference < 0),
    'cash_days', (select count(*) from cash_counts where business_id = p_business and count_day between p_from and p_to),
    'bad_stock', (select coalesce(sum(-qty * coalesce(unit_cost, 0)), 0) from stock_moves where business_id = p_business and kind = 'bad' and moved_on between p_from and p_to),
    'missing_stock', (select coalesce(sum(-qty * coalesce(unit_cost, 0)), 0) from stock_moves where business_id = p_business and kind = 'count' and qty < 0 and moved_on between p_from and p_to))
  into books;
  -- keep the old flat keys (selling side) so older screens still read them
  return sell || jsonb_build_object('role', 'both', 'from', p_from, 'to', p_to, 'sell', sell, 'buy', buy, 'books', books,
    'paid', buy->'paid', 'deliveries', buy->'deliveries', 'late', buy->'late', 'overpay_alerts', buy->'overpay_alerts', 'overpay_amount', buy->'overpay_amount');
end $function$
;
