CREATE OR REPLACE FUNCTION public.admin_set_plan(p_business uuid, p_plan text, p_paid_until date, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_plan not in ('free','supplier_pro','buyer_pro','business') then raise exception 'Unknown plan.'; end if;
  insert into subscriptions(business_id, plan_id, status, paid_until, plan_note, started_at)
    values (p_business, p_plan, 'active', p_paid_until, p_note, (now() at time zone 'Asia/Manila')::date)
    on conflict (business_id) do update set plan_id = excluded.plan_id, status = 'active', paid_until = excluded.paid_until, plan_note = excluded.plan_note;
end $function$


CREATE OR REPLACE FUNCTION public.admin_set_plan(p_business uuid, p_plan text, p_paid_until date, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_plan not in ('free','supplier_pro','buyer_pro','business') then raise exception 'Unknown plan.'; end if;
  insert into subscriptions(business_id, plan_id, status, paid_until, plan_note, started_at)
    values (p_business, p_plan, 'active', p_paid_until, p_note, (now() at time zone 'Asia/Manila')::date)
    on conflict (business_id) do update set plan_id = excluded.plan_id, status = 'active', paid_until = excluded.paid_until, plan_note = excluded.plan_note;
end $function$


