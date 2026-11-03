CREATE OR REPLACE FUNCTION public.request_connection(p_to uuid, p_note text DEFAULT NULL::text)
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
  if to_b.type = me_type then raise exception 'You can only connect buyers with suppliers.'; end if;
  if exists(select 1 from business_relationships r where (r.buyer_business_id = me and r.supplier_business_id = p_to) or (r.buyer_business_id = p_to and r.supplier_business_id = me)) then
    raise exception 'You''re already connected.'; end if;
  insert into connection_requests(from_business, to_business, note)
    values (me, p_to, nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>]', '', 'g')), 300), ''))
    on conflict (from_business, to_business) where status = 'pending' do update set note = excluded.note
    returning id into rid;
  return rid;
end $function$


