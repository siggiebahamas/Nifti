CREATE OR REPLACE FUNCTION public.submit_store_order(p_slug text, p_name text, p_business text, p_phone text, p_address text, p_items jsonb, p_note text DEFAULT NULL::text, p_src text DEFAULT NULL::text, p_needed_by date DEFAULT NULL::date, p_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  sup businesses; buyer_id uuid; buyer_rec businesses; me_member team_members;
  who text := left(btrim(regexp_replace(coalesce(p_name,''), '[<>"`]', '', 'g')), 80);
  bizname text := left(btrim(regexp_replace(coalesce(p_business,''), '[<>"`]', '', 'g')), 120);
  phone text := public.nifti_ph_mobile(p_phone);
  addr text := nullif(left(btrim(regexp_replace(coalesce(p_address,''), '[<>"`]', '', 'g')), 300), '');
  note text := nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>"`]', '', 'g')), 500), '');
  src text := left(regexp_replace(coalesce(p_src,''), '[^a-zA-Z0-9_-]', '', 'g'), 20);
  it jsonb; cat jsonb; lines jsonb := '[]'::jsonb; qty numeric; price numeric; total numeric := 0; promos jsonb;
  today date := (now() at time zone 'Asia/Manila')::date; poid uuid; ponum text; tok text; claim text; prices_known boolean;
begin
  select * into sup from businesses where store_slug = lower(btrim(coalesce(p_slug,'')));
  if sup.id is null or coalesce((sup.store->>'enabled')::boolean, false) = false then raise exception 'This store isn''t taking orders right now.'; end if;
  if sup.paused_at is not null then raise exception '% has paused new orders.', sup.name; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Add at least one item.'; end if;
  if jsonb_array_length(p_items) > 60 then raise exception 'That''s a lot of items. Please split it into two orders.'; end if;
  promos := case when public.has_feature(sup.id, 'store_promos') then coalesce(sup.store->'promos', '{}'::jsonb) else '{}'::jsonb end;
  for it in select value from jsonb_array_elements(p_items) loop
    qty := nullif(it->>'qty','')::numeric;
    if qty is null or qty <= 0 or qty > 1000000 then raise exception 'Check the quantity for %.', coalesce(it->>'product','an item'); end if;
    select c into cat from jsonb_array_elements(coalesce(sup.catalog,'[]'::jsonb)) c where c->>'product' = it->>'product' limit 1;
    if cat is null then raise exception '% is no longer in this store. Please refresh.', coalesce(it->>'product','An item'); end if;
    price := coalesce(case when (promos->(cat->>'product')->>'until')::date >= today then (promos->(cat->>'product')->>'price')::numeric end, (cat->>'price')::numeric, 0);
    lines := lines || jsonb_build_array(jsonb_build_object('product', cat->>'product', 'qty', qty, 'unitPrice', price, 'unit', cat->>'unit'));
    total := total + qty * price;
  end loop;

  if auth.uid() is not null then
    select tm.* into me_member from team_members tm join businesses b on b.id = tm.business_id
      where tm.auth_user_id = auth.uid() and tm.status = 'active' and b.type = 'buyer' limit 1;
  end if;
  prices_known := coalesce(sup.store->>'price_mode','public') = 'public' or me_member.id is not null;
  if prices_known and (sup.store->>'min_order')::numeric > 0 and total < (sup.store->>'min_order')::numeric then
    raise exception 'The minimum order is ₱%. Your order is ₱%.', to_char((sup.store->>'min_order')::numeric, 'FM999,999,999'), to_char(total, 'FM999,999,999');
  end if;

  if me_member.id is not null then
    buyer_id := me_member.business_id;
    who := coalesce(nullif(who, ''), me_member.name);
  else
    if length(who) < 2 then raise exception 'Please enter your name.'; end if;
    if phone is null then raise exception 'Please enter a mobile number like 0917 123 4567, so they can reach you.'; end if;
    if (select count(*) from store_events e join purchase_orders po on po.id = e.po_id join businesses bb on bb.id = po.buyer_business_id
        where e.business_id = sup.id and e.kind = 'order' and e.created_at > now() - interval '1 day' and bb.outside_contact->>'phone' = phone) >= 5
       or (select count(*) from store_events where business_id = sup.id and kind = 'order' and created_at > now() - interval '1 day') >= 80 then
      raise exception 'Too many orders from this number today. Please message the store directly.';
    end if;
    select * into buyer_rec from businesses where is_outside and type = 'buyer' and created_by_business = sup.id and outside_contact->>'phone' = phone limit 1;
    if buyer_rec.id is null then
      insert into businesses(name, type, is_outside, outside_contact, created_by_business, claim_code)
        values (coalesce(nullif(bizname, ''), who), 'buyer', true, jsonb_strip_nulls(jsonb_build_object('name', who, 'phone', phone, 'address', addr)), sup.id, public.nifti_random_token(12))
        returning * into buyer_rec;
    else
      update businesses set outside_contact = outside_contact || jsonb_strip_nulls(jsonb_build_object('name', who, 'address', addr)),
        name = case when bizname <> '' then bizname else name end where id = buyer_rec.id returning * into buyer_rec;
    end if;
    buyer_id := buyer_rec.id; claim := buyer_rec.claim_code;
  end if;
  if buyer_id = sup.id then raise exception 'You can''t order from your own store.'; end if;
  insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer_id, sup.id) on conflict do nothing;
  insert into conversations(buyer_business_id, supplier_business_id) values (buyer_id, sup.id) on conflict do nothing;

  insert into purchase_orders(buyer_business_id, supplier_business_id, type, status, currency, tax_rate, line_items, created_date, requested_delivery_date, delivery_address, notes, customer_ref, history)
    values (buyer_id, sup.id, 'local', 'sent', 'PHP', 0, lines, today, p_needed_by, addr, note, nullif(left(btrim(regexp_replace(coalesce(p_ref,''), '[<>"`]', '', 'g')), 60), ''),
      jsonb_build_array(jsonb_build_object('date', public.nifti_today_ph(), 'time', 'Just now', 'actor', 'buyer',
        'action', '🛒 Ordered from your online store by ' || who || coalesce(' (' || phone || ')', '') || case when src <> '' then ' · via ' || src else '' end)))
    returning id, po_number into poid, ponum;
  tok := public.nifti_random_token(24);
  insert into order_links(token, po_id, created_by_business, expires_at) values (tok, poid, sup.id, now() + interval '120 days');
  insert into store_events(business_id, kind, src, po_id) values (sup.id, 'order', src, poid);
  return jsonb_build_object('po_number', ponum, 'token', tok, 'claim_code', claim, 'total', total, 'prices_known', prices_known);
end $function$


