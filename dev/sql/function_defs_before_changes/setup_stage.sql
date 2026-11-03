CREATE OR REPLACE FUNCTION public.setup_stage(p_business uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when b.type = 'buyer' then case
      when not exists (select 1 from business_relationships r where r.buyer_business_id = b.id) then 'add_supplier'
      when not exists (select 1 from purchase_orders po where po.buyer_business_id = b.id and po.status <> 'draft') then 'first_order'
      else 'active' end
    else case
      when jsonb_array_length(coalesce(b.catalog, '[]'::jsonb)) = 0 then 'add_products'
      when b.store_slug is null or coalesce((b.store->>'enabled')::boolean, false) = false then 'open_store'
      when not exists (select 1 from purchase_orders po where po.supplier_business_id = b.id and po.status <> 'draft') then 'first_order_in'
      else 'active' end
  end
  from businesses b where b.id = p_business
$function$


