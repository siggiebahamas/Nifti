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


