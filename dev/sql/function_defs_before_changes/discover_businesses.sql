CREATE OR REPLACE FUNCTION public.discover_businesses(p_type text)
 RETURNS TABLE(id uuid, name text, type text, profile jsonb, catalog jsonb, connected boolean, request_status text, verified boolean, featured boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() as id)
  select b.id, b.name, b.type, b.public_profile,
         case when b.type = 'supplier' then (select coalesce(jsonb_agg(jsonb_build_object('product', c->>'product', 'price', c->'price', 'unit', c->>'unit', 'moq', c->'moq')), '[]'::jsonb) from jsonb_array_elements(b.catalog) c) else '[]'::jsonb end,
         exists(select 1 from business_relationships r where (r.buyer_business_id = b.id and r.supplier_business_id = me.id) or (r.supplier_business_id = b.id and r.buyer_business_id = me.id)),
         (select cr.status from connection_requests cr where cr.from_business = me.id and cr.to_business = b.id order by cr.created_at desc limit 1),
         public.business_is_verified(b.id),
         public.business_plan(b.id) = 'business'
  from businesses b, me
  where b.catalog_public and not b.is_outside and public.nifti_listable(b.id) and b.paused_at is null and b.type = p_type and b.id <> me.id and me.id is not null
  order by (public.business_plan(b.id) = 'business') desc, public.business_is_verified(b.id) desc, b.name
  limit 200 $function$


