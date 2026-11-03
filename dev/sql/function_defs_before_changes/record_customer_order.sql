CREATE OR REPLACE FUNCTION public.record_customer_order(p_buyer uuid, p_name text, p_phone text, p_email text, p_address text, p_items jsonb, p_ref text, p_needed_by date, p_notes text, p_tax_rate numeric DEFAULT 0, p_tentative boolean DEFAULT false, p_hold_until date DEFAULT NULL::date, p_allow_edit boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); sup businesses; buyer businesses; who text; phone text; email text;
  it jsonb; lines jsonb := '[]'::jsonb; qty numeric; price numeric; poid uuid; ponum text; tok text; ref text; member text;
begin
  select * into sup from businesses where id = me;
  if sup.id is null or sup.type <> 'supplier' then raise exception 'Only a supplier account can record a customer''s order.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Add at least one item.'; end if;
  if p_hold_until is not null and (p_hold_until < (now() at time zone 'Asia/Manila')::date or p_hold_until > (now() at time zone 'Asia/Manila')::date + 90) then raise exception 'Pick a price-hold date in the next 90 days.'; end if;
  if jsonb_array_length(p_items) > 200 then raise exception 'That''s a lot of items. Please split it into two orders.'; end if;
  select name into member from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  ref := nullif(left(btrim(regexp_replace(coalesce(p_ref,''), '[<>"`]', '', 'g')), 60), '');
  if p_buyer is not null then
    select * into buyer from businesses where id = p_buyer;
    if buyer.id is null or not (exists (select 1 from business_relationships where supplier_business_id = me and buyer_business_id = p_buyer)
                                or (buyer.is_outside and buyer.created_by_business = me)) then raise exception 'That customer isn''t one of yours.'; end if;
  else
    who := left(btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g')), 120);
    phone := public.nifti_ph_mobile(p_phone);
    email := nullif(lower(btrim(coalesce(p_email, ''))), '');
    if email is not null and email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email doesn''t look right.'; end if;
    if length(who) < 2 then raise exception 'Who is this order from?'; end if;
    if phone is not null then
      select * into buyer from businesses where is_outside and type = 'buyer' and created_by_business = me and outside_contact->>'phone' = phone limit 1;
    end if;
    if buyer.id is null then
      select * into buyer from businesses where is_outside and type = 'buyer' and created_by_business = me and lower(name) = lower(who) limit 1;
    end if;
    if buyer.id is null then
      insert into businesses(name, type, is_outside, outside_contact, created_by_business, claim_code)
        values (who, 'buyer', true, jsonb_strip_nulls(jsonb_build_object('name', who, 'phone', phone, 'email', email, 'address', nullif(btrim(coalesce(p_address,'')), ''))), me, public.nifti_random_token(12))
        returning * into buyer;
    else
      update businesses set outside_contact = coalesce(outside_contact, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object('phone', phone, 'email', email)) where id = buyer.id and is_outside;
    end if;
  end if;
  for it in select value from jsonb_array_elements(p_items) loop
    qty := nullif(it->>'qty','')::numeric; price := coalesce(nullif(it->>'unitPrice','')::numeric, 0);
    if qty is null or qty <= 0 or qty > 10000000 then raise exception 'Check the quantity for %.', coalesce(it->>'product', 'an item'); end if;
    if price < 0 or price > 100000000 then raise exception 'Check the price for %.', coalesce(it->>'product', 'an item'); end if;
    if length(btrim(coalesce(it->>'product',''))) < 1 then raise exception 'One of the items has no name.'; end if;
    lines := lines || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('product', left(btrim(it->>'product'), 160), 'qty', qty, 'unitPrice', price,
      'unit', nullif(left(coalesce(it->>'unit',''), 20), ''), 'customerText', nullif(left(coalesce(it->>'customerText',''), 200), ''))));
  end loop;
  insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer.id, me) on conflict do nothing;
  insert into conversations(buyer_business_id, supplier_business_id) values (buyer.id, me) on conflict do nothing;
  insert into purchase_orders(buyer_business_id, supplier_business_id, type, status, currency, tax_rate, line_items, created_date, requested_delivery_date,
      delivery_address, notes, customer_ref, quote, history)
    values (buyer.id, me, 'local', case when p_tentative then 'quote' else 'confirmed' end, 'PHP', greatest(0, least(coalesce(p_tax_rate, 0), 0.2)), lines, (now() at time zone 'Asia/Manila')::date, p_needed_by,
      nullif(left(btrim(coalesce(p_address, '')), 300), ''), nullif(left(btrim(coalesce(p_notes, '')), 1000), ''), ref,
      case when p_tentative then jsonb_strip_nulls(jsonb_build_object('sent_at', (now() at time zone 'Asia/Manila')::date, 'hold_until', p_hold_until, 'allow_edit', coalesce(p_allow_edit, true), 'by', member, 'nudges', '[]'::jsonb)) end,
      jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'supplier',
        'action', '📄 Entered from ' || buyer.name || '''s PO' || coalesce(' #' || ref, '') || coalesce(' by ' || member, '') || case when p_tentative then ' · waiting for their OK' || coalesce(' (price held until ' || to_char(p_hold_until, 'Mon DD') || ')', '') else ' · confirmed' end)))
    returning id, po_number into poid, ponum;
  tok := public.nifti_random_token(24);
  insert into order_links(token, po_id, created_by_business, expires_at) values (tok, poid, me, now() + interval '120 days');
  if not buyer.is_outside and not p_tentative then
    perform public.nifti_notify(buyer.id, '📄 ' || sup.name || ' confirmed your order', ponum || coalesce(' (your PO #' || ref || ')', ''), './#orders', 'orders');
  end if;
  return jsonb_build_object('po_id', poid, 'po_number', ponum, 'token', tok, 'buyer_id', buyer.id, 'buyer_name', buyer.name);
end $function$


