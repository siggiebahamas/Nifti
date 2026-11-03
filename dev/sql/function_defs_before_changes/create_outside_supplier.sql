CREATE OR REPLACE FUNCTION public.create_outside_supplier(p_name text, p_phone text DEFAULT NULL::text, p_email text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  my_biz uuid; my_type text; new_id uuid;
  clean_name text := btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g'));
  clean_phone text := nullif(btrim(regexp_replace(coalesce(p_phone,''), '[^0-9+ ]', '', 'g')), '');
  clean_email text := nullif(lower(btrim(coalesce(p_email,''))), '');
begin
  select tm.business_id, b.type into my_biz, my_type
    from team_members tm join businesses b on b.id = tm.business_id
    where tm.auth_user_id = auth.uid() and tm.status = 'active' limit 1;
  if my_biz is null then raise exception 'Please sign in first.'; end if;
  if my_type <> 'buyer' then raise exception 'Only a buyer can add an outside supplier.'; end if;
  if length(clean_name) < 2 or length(clean_name) > 120 then raise exception 'Enter the supplier''s business name.'; end if;
  if clean_email is not null and clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email doesn''t look right.'; end if;
  select b.id into new_id from businesses b
    join business_relationships r on r.supplier_business_id = b.id and r.buyer_business_id = my_biz
    where b.is_outside and lower(b.name) = lower(clean_name) limit 1;
  if new_id is not null then return new_id; end if;
  insert into businesses(name, type, is_outside, outside_contact, created_by_business, claim_code)
    values (clean_name, 'supplier', true,
            jsonb_strip_nulls(jsonb_build_object('phone', clean_phone, 'email', clean_email)),
            my_biz, public.nifti_random_token(12))
    returning id into new_id;
  insert into business_relationships(buyer_business_id, supplier_business_id) values (my_biz, new_id) on conflict do nothing;
  return new_id;
end $function$


