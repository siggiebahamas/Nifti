CREATE OR REPLACE FUNCTION public.record_opening_balances(p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); sup businesses; buyer businesses; r jsonb; who text; phone text; email text;
  amt numeric; due date; ref text; today date := (now() at time zone 'Asia/Manila')::date; poid uuid; ponum text;
  out_rows jsonb := '[]'::jsonb; total numeric := 0; member text; n int := 0;
begin
  select * into sup from businesses where id = me;
  if sup.id is null or sup.type <> 'supplier' then raise exception 'Only a supplier account can add what customers owe.'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then raise exception 'Add at least one customer.'; end if;
  if jsonb_array_length(p_rows) > 100 then raise exception 'Please add up to 100 customers at a time.'; end if;
  select name into member from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  for r in select value from jsonb_array_elements(p_rows) loop
    buyer := null;
    amt := round(nullif(regexp_replace(coalesce(r->>'amount',''), '[^0-9.]', '', 'g'), '')::numeric, 2);
    if amt is null or amt < 1 or amt > 100000000 then raise exception 'Check the amount for %.', coalesce(nullif(r->>'name',''), 'one of the customers'); end if;
    begin due := (r->>'due')::date; exception when others then due := null; end;
    if due is null then raise exception 'Pick when % should pay.', coalesce(nullif(r->>'name',''), 'each customer'); end if;
    if due < today - 1095 or due > today + 365 then raise exception 'Check the due date for %.', coalesce(nullif(r->>'name',''), 'one of the customers'); end if;
    ref := nullif(left(btrim(regexp_replace(coalesce(r->>'ref',''), '[<>"`]', '', 'g')), 40), '');
    if nullif(r->>'buyer_id','') is not null then
      select * into buyer from businesses where id = (r->>'buyer_id')::uuid;
      if buyer.id is null or not (exists (select 1 from business_relationships where supplier_business_id = me and buyer_business_id = buyer.id)
                                  or (buyer.is_outside and buyer.created_by_business = me)) then raise exception 'That customer isn''t one of yours.'; end if;
    else
      who := left(btrim(regexp_replace(coalesce(r->>'name',''), '[<>"`]', '', 'g')), 120);
      if length(who) < 2 then raise exception 'Type the customer''s name.'; end if;
      phone := public.nifti_ph_mobile(r->>'phone');
      email := nullif(lower(btrim(coalesce(r->>'email', ''))), '');
      if email is not null and email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'The email for % doesn''t look right.', who; end if;
      if phone is not null then
        select * into buyer from businesses where is_outside and type = 'buyer' and created_by_business = me and outside_contact->>'phone' = phone limit 1;
      end if;
      if buyer.id is null then
        select * into buyer from businesses where is_outside and type = 'buyer' and created_by_business = me and lower(name) = lower(who) limit 1;
      end if;
      if buyer.id is null then
        select b.* into buyer from businesses b join business_relationships rel on rel.buyer_business_id = b.id and rel.supplier_business_id = me
          where not b.is_outside and lower(b.name) = lower(who) limit 1;
      end if;
      if buyer.id is null then
        insert into businesses(name, type, is_outside, outside_contact, created_by_business, claim_code)
          values (who, 'buyer', true, jsonb_strip_nulls(jsonb_build_object('name', who, 'phone', phone, 'email', email)), me, public.nifti_random_token(12))
          returning * into buyer;
      elsif buyer.is_outside then
        update businesses set outside_contact = coalesce(outside_contact, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object('phone', phone, 'email', email)) where id = buyer.id;
      end if;
    end if;
    if ref is not null and exists (select 1 from purchase_orders where supplier_business_id = me and buyer_business_id = buyer.id
        and invoice->>'opening' = 'true' and invoice->>'number' = ref and status <> 'cancelled') then
      raise exception '% is already added for %.', ref, buyer.name;
    end if;
    insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer.id, me) on conflict do nothing;
    insert into conversations(buyer_business_id, supplier_business_id) values (buyer.id, me) on conflict do nothing;
    insert into purchase_orders(buyer_business_id, supplier_business_id, type, status, currency, tax_rate, line_items, created_date, notes, customer_ref, history)
      values (buyer.id, me, 'local', 'invoiced', 'PHP', 0,
        jsonb_build_array(jsonb_build_object('product', 'Balance from before Nifti' || coalesce(' (' || ref || ')', ''), 'qty', 1, 'unitPrice', amt)),
        today, 'Balance carried over from before Nifti.', ref,
        jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier',
          'action', '📒 Balance from before Nifti: ' || public.nifti_peso(amt) || ', due ' || to_char(due, 'Mon DD, YYYY') || coalesce(' · added by ' || member, ''))))
      returning id, po_number into poid, ponum;
    update purchase_orders set invoice = jsonb_build_object('number', coalesce(ref, 'BAL-' || regexp_replace(ponum, '^PO-', '')), 'status', 'unpaid',
        'dueDate', to_char(due, 'YYYY-MM-DD'), 'issuedDate', to_char(today, 'YYYY-MM-DD'), 'statedTotal', amt, 'payments', '[]'::jsonb, 'opening', true, 'attachmentName', null)
      where id = poid;
    out_rows := out_rows || jsonb_build_array(jsonb_build_object('po_id', poid, 'po_number', ponum, 'buyer_id', buyer.id, 'buyer_name', buyer.name, 'amount', amt, 'due', due));
    total := total + amt; n := n + 1;
  end loop;
  return jsonb_build_object('count', n, 'total', total, 'rows', out_rows);
end $function$


