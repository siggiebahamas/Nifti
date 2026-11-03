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
            when 'suppliers' then b.type = 'supplier'
            when 'buyers' then b.type = 'buyer'
            when 'inactive' then coalesce(public.nifti_last_active(b.id), b.created_at) < now() - interval '30 days'
            else true end
    order by b.created_at desc limit least(coalesce(p_limit, 50), 200) offset coalesce(p_offset, 0)) x);
end $function$


