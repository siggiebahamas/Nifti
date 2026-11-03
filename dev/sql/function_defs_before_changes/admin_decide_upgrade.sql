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


