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
    select type into from_type from businesses where id = r.from_business;
    if from_type = 'buyer' then buyer := r.from_business; supplier := r.to_business; else buyer := r.to_business; supplier := r.from_business; end if;
    insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer, supplier) on conflict do nothing;
    insert into conversations(buyer_business_id, supplier_business_id) values (buyer, supplier) on conflict do nothing;
  end if;
end $function$


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
    select type into from_type from businesses where id = r.from_business;
    if from_type = 'buyer' then buyer := r.from_business; supplier := r.to_business; else buyer := r.to_business; supplier := r.from_business; end if;
    insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer, supplier) on conflict do nothing;
    insert into conversations(buyer_business_id, supplier_business_id) values (buyer, supplier) on conflict do nothing;
  end if;
end $function$


