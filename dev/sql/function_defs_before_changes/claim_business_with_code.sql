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
  update businesses set is_outside = false, claim_code = null where id = claim_biz.id;
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


