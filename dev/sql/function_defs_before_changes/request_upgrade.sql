CREATE OR REPLACE FUNCTION public.request_upgrade(p_plan text, p_cycle text, p_method text, p_reference text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); rid uuid; who text; biz text; amt numeric;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can upgrade.'; end if;
  if p_plan not in ('supplier_pro','buyer_pro','business') or p_cycle not in ('monthly','yearly') then raise exception 'Pick a plan.'; end if;
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


CREATE OR REPLACE FUNCTION public.request_upgrade(p_plan text, p_cycle text, p_method text, p_reference text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); rid uuid; who text; biz text; amt numeric;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can upgrade.'; end if;
  if p_plan not in ('supplier_pro','buyer_pro','business') or p_cycle not in ('monthly','yearly') then raise exception 'Pick a plan.'; end if;
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


