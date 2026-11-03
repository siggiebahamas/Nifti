
-- 1) A real business both buys and sells. Outside contacts keep 'buyer'/'supplier' (what they are to us).
alter table businesses drop constraint if exists businesses_type_check;
alter table businesses add constraint businesses_type_check check (type in ('buyer','supplier','both'));
update businesses set type = 'both' where not is_outside;
alter table connection_requests add column if not exists from_role text check (from_role in ('buyer','supplier'));
alter table business_invites add column if not exists invited_as text check (invited_as in ('buyer','supplier'));

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
  if my_type is null then raise exception 'Sign in first.'; end if;
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
end $function$;

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
  if sup.id is null or sup.is_outside then raise exception 'Sign in first.'; end if;
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
end $function$;

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
  if sup.id is null or sup.is_outside then raise exception 'Sign in first.'; end if;
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
end $function$;

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
      where tm.auth_user_id = auth.uid() and tm.status = 'active' and not b.is_outside limit 1;
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
end $function$;

CREATE OR REPLACE FUNCTION public.notify_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  buyer_name text; supplier_name text; actor text; target uuid;
  last_action text; msg text; url text := './#orders';
  old_status text := case when tg_op = 'UPDATE' then old.status else null end;
  old_hist int := case when tg_op = 'UPDATE' then jsonb_array_length(coalesce(old.history, '[]'::jsonb)) else 0 end;
  n_pending int; o_pending int; n_conf int; o_conf int; n_rej int; o_rej int;
begin
  select name into buyer_name from businesses where id = new.buyer_business_id;
  select name into supplier_name from businesses where id = new.supplier_business_id;
  actor := coalesce(new.history->-1->>'actor', 'buyer');
  last_action := coalesce(new.history->-1->>'action', '');
  if last_action like '↩ Route stop undone%' then return new; end if; -- a driver fixing a wrong tap: nothing new for anyone
  if new.status is distinct from old_status and new.status <> 'draft' then
    target := case when actor = 'supplier' then new.buyer_business_id else new.supplier_business_id end;
    msg := case new.status
      when 'sent' then '📦 New order ' || new.po_number || ' from ' || buyer_name
      when 'confirmed' then case when actor = 'buyer' then '🎉 ' || buyer_name || ' confirmed ' || new.po_number else '✅ ' || supplier_name || ' confirmed ' || new.po_number end
      when 'quote' then '📝 ' || supplier_name || ' sent order ' || new.po_number || ' for your OK'
      when 'countered' then '💬 ' || case when actor = 'supplier' then supplier_name else buyer_name end || ' proposed a new price on ' || new.po_number
      when 'preparing' then '📦 ' || supplier_name || ' is preparing ' || new.po_number
      when 'shipped' then '🚚 ' || new.po_number || ' is on the way'
      when 'in_customs' then '🚢 ' || new.po_number || ' is at customs'
      when 'delivered' then '📬 ' || new.po_number || ' was delivered'
      when 'partially_delivered' then '⚠ ' || new.po_number || ' was partly delivered'
      when 'invoiced' then '🧾 ' || supplier_name || ' sent the invoice for ' || new.po_number
      when 'paid' then '💰 ' || new.po_number || ' is fully paid'
      when 'cancelled' then '✕ ' || new.po_number || ' was cancelled'
      else new.po_number || ' was updated' end;
    perform public.nifti_notify(target, msg, left(last_action, 200), url, 'orders', null, null);
    if new.status = 'shipped' and last_action like '🚚 Picked up by%' then
      perform public.nifti_notify(new.supplier_business_id, msg, left(last_action, 200), url, 'orders', null, null);
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    n_pending := public.nifti_count_payments(new.invoice, new.deposit_payments, 'pending');
    o_pending := public.nifti_count_payments(old.invoice, old.deposit_payments, 'pending');
    n_conf := public.nifti_count_payments(new.invoice, new.deposit_payments, 'confirmed');
    o_conf := public.nifti_count_payments(old.invoice, old.deposit_payments, 'confirmed');
    n_rej := public.nifti_count_payments(new.invoice, new.deposit_payments, 'rejected');
    o_rej := public.nifti_count_payments(old.invoice, old.deposit_payments, 'rejected');
    if n_pending > o_pending and coalesce(new.invoice->'payments'->-1->>'submittedBy', '') = 'supplier' then
      null; -- the supplier's own staff recorded it (e.g. a cheque collected on a route)
    elsif n_pending > o_pending then
      perform public.nifti_notify(new.supplier_business_id, '💳 ' || buyer_name || ' says they paid for ' || new.po_number, 'Check your account, then confirm it in Nifti.', url, 'orders');
    elsif n_conf > o_conf then
      perform public.nifti_notify(new.buyer_business_id, '✅ ' || supplier_name || ' confirmed your payment', new.po_number, url, 'orders');
    elsif n_rej > o_rej then
      perform public.nifti_notify(new.buyer_business_id, '⚠ ' || supplier_name || ' says a payment didn''t arrive', new.po_number || ': ' || left(last_action, 160), url, 'orders');
    elsif jsonb_array_length(coalesce(new.history, '[]'::jsonb)) > old_hist then
      if last_action like '🕒 Not yet%' then
        perform public.nifti_notify(new.supplier_business_id, '🕒 ' || buyer_name || ' isn''t ready yet', left(last_action, 200), './#followups', 'orders');
      elsif last_action like '💬 Buyer note%' then
        perform public.nifti_notify(new.supplier_business_id, '💬 ' || buyer_name || ' about ' || new.po_number, left(last_action, 200), url, 'orders');
      elsif last_action like '👀%' or last_action like '💬 Note from%' then
        perform public.nifti_notify(new.buyer_business_id, case when last_action like '👀%' then supplier_name || ' opened ' || new.po_number else '💬 ' || supplier_name || ' about ' || new.po_number end, left(last_action, 200), url, 'orders');
      elsif last_action like '📦 Delivered by%' or last_action like '💬 Delivery note%' then
        perform public.nifti_notify(new.buyer_business_id, '📦 ' || new.po_number || ' delivery update', left(last_action, 200), url, 'orders');
        perform public.nifti_notify(new.supplier_business_id, '📦 ' || new.po_number || ' delivery update', left(last_action, 200), url, 'orders');
      end if;
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.nudge_buyer_restock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered'
     and exists (select 1 from businesses where id = new.buyer_business_id and not is_outside)
     and not exists (select 1 from notification_outbox where business_id = new.buyer_business_id and title like '📣%' and created_at > now() - interval '20 hours') then
    perform public.nifti_notify(new.buyer_business_id, '📣 New stock in? Tell your customers',
      'Your post for ' || new.po_number || ' is ready. Open the order and tap "Tell your customers" to share it on FB or Viber.', './#orders', 'orders');
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.send_reorder_nudges()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s record; r record; b businesses; conv uuid; link text; msg text; sent int := 0; ch text;
begin
  for s in select * from businesses where not is_outside and paused_at is null and banned_at is null
             and coalesce((collection_settings->>'auto_reorder')::boolean, false) and public.has_feature(id, 'reorder_reminders') loop
    for r in select * from public.reorder_due(s.id) loop
      if exists (select 1 from customer_nudges where business_id = s.id and buyer_business_id = r.buyer_id
                 and (created_at > now() - interval '14 days' or (kind = 'snooze' and snooze_until >= current_date))) then continue; end if;
      select * into b from businesses where id = r.buyer_id;
      link := public.nifti_make_reorder_link(s.id, r.buyer_id);
      msg := 'Hi ' || coalesce(b.outside_contact->>'name', b.name) || '! Kumusta po? It''s been ' || r.days_since || ' days since your last order, so you might be running low. '
        || case when link is not null then 'Your usual order is ready here, just check it and tap Order: ' || link else 'Reply here and we''ll prepare your usual order today.' end
        || ' Salamat! – ' || s.name;
      ch := null;
      select id into conv from conversations where buyer_business_id = r.buyer_id and supplier_business_id = s.id;
      if not b.is_outside and conv is not null then
        insert into conversation_messages(conversation_id, sender_business_id, text) values (conv, s.id, msg);
        update conversations set buyer_unread_count = buyer_unread_count + 1 where id = conv;
        ch := 'chat';
      elsif nullif(b.outside_contact->>'email', '') is not null then
        insert into notification_outbox(business_id, category, title, body, url, to_email)
          values (s.id, 'customer_email', 'Time to restock? Your usual order from ' || s.name, msg, coalesce(link, './'), b.outside_contact->>'email');
        ch := 'email';
      end if;
      if ch is null then continue; end if; -- no automatic channel: it stays on the owner's Sell again list
      insert into customer_nudges(business_id, buyer_business_id, kind, channel, created_by) values (s.id, r.buyer_id, 'auto', ch, 'Automatic');
      sent := sent + 1;
    end loop;
  end loop;
  if sent > 0 then perform public.nifti_kick_dispatch(); end if;
  return sent;
end $function$;

CREATE OR REPLACE FUNCTION public.discover_businesses(p_type text)
 RETURNS TABLE(id uuid, name text, type text, profile jsonb, catalog jsonb, connected boolean, request_status text, verified boolean, featured boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() as id)
  select b.id, b.name, b.type, b.public_profile,
         case when p_type = 'supplier' then (select coalesce(jsonb_agg(jsonb_build_object('product', c->>'product', 'price', c->'price', 'unit', c->>'unit', 'moq', c->'moq')), '[]'::jsonb) from jsonb_array_elements(b.catalog) c) else '[]'::jsonb end,
         exists(select 1 from business_relationships r where (r.buyer_business_id = b.id and r.supplier_business_id = me.id) or (r.supplier_business_id = b.id and r.buyer_business_id = me.id)),
         (select cr.status from connection_requests cr where cr.from_business = me.id and cr.to_business = b.id order by cr.created_at desc limit 1),
         public.business_is_verified(b.id),
         public.business_plan(b.id) = 'business'
  from businesses b, me
  where b.catalog_public and not b.is_outside and public.nifti_listable(b.id) and b.paused_at is null and (b.type = p_type or b.type = 'both') and (p_type = 'buyer' or jsonb_array_length(coalesce(b.catalog, '[]'::jsonb)) > 0) and b.id <> me.id and me.id is not null
  order by (public.business_plan(b.id) = 'business') desc, public.business_is_verified(b.id) desc, b.name
  limit 200 $function$;

CREATE OR REPLACE FUNCTION public.setup_stage(p_business uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when exists (select 1 from purchase_orders po where (po.supplier_business_id = b.id or po.buyer_business_id = b.id) and po.status <> 'draft')
      or exists (select 1 from downstream_sales s where s.business_id = b.id)
      or exists (select 1 from expenses e where e.business_id = b.id) then 'active'
    when exists (select 1 from business_relationships r where r.buyer_business_id = b.id or r.supplier_business_id = b.id) then 'first_order'
    when jsonb_array_length(coalesce(b.catalog, '[]'::jsonb)) > 0 or exists (select 1 from inventory_items i where i.business_id = b.id) then 'add_partner'
    else 'add_products'
  end
  from businesses b where b.id = p_business
$function$;

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
  update businesses set is_outside = false, claim_code = null, type = 'both' where id = claim_biz.id;
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
end $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  new_business_id uuid;
  meta jsonb := new.raw_user_meta_data;
  invite_id uuid;
  biz_invite record;
  new_biz_type text;
  claim_biz businesses;
  inviter_type text;
begin
  select id into invite_id from team_members
    where lower(email) = lower(new.email) and status = 'invited' and auth_user_id is null
    order by created_at asc limit 1;
  if invite_id is not null then
    update team_members set auth_user_id = new.id, status = 'active' where id = invite_id;
    return new;
  end if;

  if coalesce(meta->>'claim_code', '') <> '' then
    select * into claim_biz from businesses where claim_code = meta->>'claim_code' and is_outside limit 1;
    if claim_biz.id is not null then
      update businesses set is_outside = false, claim_code = null, type = 'both',
        name = coalesce(nullif(btrim(meta->>'business_name'), ''), name)
        where id = claim_biz.id;
      insert into team_members (business_id, name, email, roles, auth_user_id, status)
        values (claim_biz.id, coalesce(meta->>'full_name', split_part(new.email,'@',1)), new.email, array['Owner'], new.id, 'active');
      insert into business_settings (business_id) select claim_biz.id where not exists (select 1 from business_settings where business_id = claim_biz.id);
      insert into notification_settings (business_id) select claim_biz.id where not exists (select 1 from notification_settings where business_id = claim_biz.id);
      insert into tax_profiles (business_id, business_name) select claim_biz.id, coalesce(nullif(btrim(meta->>'business_name'), ''), claim_biz.name) where not exists (select 1 from tax_profiles where business_id = claim_biz.id);
      insert into subscriptions (business_id) select claim_biz.id where not exists (select 1 from subscriptions where business_id = claim_biz.id);
      insert into referrals (business_id) select claim_biz.id where not exists (select 1 from referrals where business_id = claim_biz.id);
      if claim_biz.created_by_business is not null then
        if claim_biz.type = 'buyer' then
          insert into conversations (buyer_business_id, supplier_business_id) values (claim_biz.id, claim_biz.created_by_business) on conflict do nothing;
        else
          insert into conversations (buyer_business_id, supplier_business_id) values (claim_biz.created_by_business, claim_biz.id) on conflict do nothing;
        end if;
      end if;
      return new;
    end if;
  end if;

  new_biz_type := 'both';
  insert into businesses (name, type, public_profile) values (coalesce(meta->>'business_name', 'New Business'), new_biz_type,
    case when coalesce(meta->>'business_kind', '') ~ '^(store|restaurant|distributor|maker|services|other)$' then jsonb_build_object('kind', meta->>'business_kind') else '{}'::jsonb end) returning id into new_business_id;
  insert into team_members (business_id, name, email, roles, auth_user_id, status)
  values (new_business_id, coalesce(meta->>'full_name', split_part(new.email,'@',1)), new.email, array['Owner'], new.id, 'active');
  insert into business_settings (business_id) values (new_business_id);
  insert into notification_settings (business_id) values (new_business_id);
  insert into tax_profiles (business_id, business_name) values (new_business_id, meta->>'business_name');
  insert into subscriptions (business_id) values (new_business_id);
  insert into referrals (business_id) values (new_business_id);

  select * into biz_invite from business_invites
    where lower(invited_email) = lower(new.email) and status = 'pending'
    order by created_at asc limit 1;
  if biz_invite.id is not null then
    update business_invites set status = 'accepted', accepted_at = now() where id = biz_invite.id;
    select type into inviter_type from businesses where id = biz_invite.inviting_business_id;
    -- invited_as: what the new business is to the inviter. Old invites fall back to the inviter's old type.
    if coalesce(biz_invite.invited_as, case when inviter_type = 'supplier' then 'buyer' else 'supplier' end) = 'supplier' then
      insert into business_relationships (buyer_business_id, supplier_business_id) values (biz_invite.inviting_business_id, new_business_id) on conflict do nothing;
      insert into conversations (buyer_business_id, supplier_business_id) values (biz_invite.inviting_business_id, new_business_id) on conflict do nothing;
    else
      insert into business_relationships (buyer_business_id, supplier_business_id) values (new_business_id, biz_invite.inviting_business_id) on conflict do nothing;
      insert into conversations (buyer_business_id, supplier_business_id) values (new_business_id, biz_invite.inviting_business_id) on conflict do nothing;
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.request_connection(p_to uuid, p_note text DEFAULT NULL::text, p_as text DEFAULT 'buyer'::text)
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
  if exists(select 1 from business_relationships r where (r.buyer_business_id = me and r.supplier_business_id = p_to) or (r.buyer_business_id = p_to and r.supplier_business_id = me)) then
    raise exception 'You''re already connected.'; end if;
  insert into connection_requests(from_business, to_business, note, from_role)
    values (me, p_to, nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>]', '', 'g')), 300), ''), case when p_as = 'supplier' then 'supplier' else 'buyer' end)
    on conflict (from_business, to_business) where status = 'pending' do update set note = excluded.note, from_role = excluded.from_role
    returning id into rid;
  return rid;
end $function$;

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
    select coalesce(r.from_role, case when type = 'supplier' then 'supplier' else 'buyer' end) into from_type from businesses where id = r.from_business;
    if from_type = 'buyer' then buyer := r.from_business; supplier := r.to_business; else buyer := r.to_business; supplier := r.from_business; end if;
    insert into business_relationships(buyer_business_id, supplier_business_id) values (buyer, supplier) on conflict do nothing;
    insert into conversations(buyer_business_id, supplier_business_id) values (buyer, supplier) on conflict do nothing;
  end if;
end $function$;

drop function if exists public.request_connection(uuid, text);

CREATE OR REPLACE FUNCTION public.request_upgrade(p_plan text, p_cycle text, p_method text, p_reference text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); rid uuid; who text; biz text; amt numeric;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can upgrade.'; end if;
  if p_plan not in ('pro','supplier_pro','buyer_pro','business') or p_cycle not in ('monthly','yearly') then raise exception 'Pick a plan.'; end if;
  if length(btrim(coalesce(p_reference,''))) < 4 then raise exception 'Enter the reference number from your payment.'; end if;
  if exists (select 1 from upgrade_requests where business_id = me and status = 'pending') then raise exception 'You already sent a payment. We''ll confirm it shortly.'; end if;
  amt := public.plan_price(p_plan, p_cycle);
  select name into who from team_members where auth_user_id = auth.uid() limit 1;
  select name into biz from businesses where id = me;
  insert into upgrade_requests(business_id, plan, cycle, amount, method, reference, created_by_name)
    values (me, p_plan, p_cycle, amt, left(regexp_replace(coalesce(p_method,''), '[<>]', '', 'g'), 40), left(regexp_replace(btrim(p_reference), '[<>]', '', 'g'), 80), who)
    returning id into rid;
  insert into notification_outbox(business_id, title, body, url, category)
    values (me, left('💰 Upgrade payment: ' || biz || ' → ' || public.plan_label(p_plan), 120),
            biz || ' says they paid ₱' || to_char(amt, 'FM999,999') || ' (' || p_cycle || ') by ' || coalesce(p_method,'?') || ', reference ' || btrim(p_reference) || E'.\nSent by ' || coalesce(who,'?') || E'.\n\nCheck your account, then approve it in Nifti → Settings → Customers & upgrades.', './', 'support');
  perform public.nifti_kick_dispatch();
  return rid;
end $function$;

CREATE OR REPLACE FUNCTION public.admin_set_plan(p_business uuid, p_plan text, p_paid_until date, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  if p_plan not in ('free','pro','supplier_pro','buyer_pro','business') then raise exception 'Unknown plan.'; end if;
  insert into subscriptions(business_id, plan_id, status, paid_until, plan_note, started_at)
    values (p_business, p_plan, 'active', p_paid_until, p_note, (now() at time zone 'Asia/Manila')::date)
    on conflict (business_id) do update set plan_id = excluded.plan_id, status = 'active', paid_until = excluded.paid_until, plan_note = excluded.plan_note;
end $function$;

CREATE OR REPLACE FUNCTION public.admin_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return jsonb_build_object(
    'businesses', (select count(*) from businesses where not is_outside),
    'suppliers', (select count(*) from businesses where not is_outside and type in ('supplier','both')),
    'buyers', (select count(*) from businesses where not is_outside and type in ('buyer','both')),
    'outside', (select count(*) from businesses where is_outside),
    'people', (select count(*) from auth.users),
    'new_7d', (select count(*) from businesses where not is_outside and created_at > now() - interval '7 days'),
    'new_30d', (select count(*) from businesses where not is_outside and created_at > now() - interval '30 days'),
    'active_7d', (select count(distinct b) from (select buyer_business_id b from purchase_orders where updated_at > now() - interval '7 days' union select supplier_business_id from purchase_orders where updated_at > now() - interval '7 days'
                  union select sender_business_id from conversation_messages where sent_at > now() - interval '7 days') x join businesses z on z.id = x.b and not z.is_outside),
    'orders_7d', (select count(*) from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft'),
    'gmv_30d', (select coalesce(sum(public.nifti_po_total(po)), 0) from purchase_orders po where created_at > now() - interval '30 days' and status not in ('draft','cancelled')),
    'paying', (select count(*) from subscriptions where plan_id in ('pro','supplier_pro','buyer_pro','business') and status = 'active' and (paid_until is null or paid_until >= public.nifti_today())),
    'mrr', (select coalesce(sum(case plan_id when 'business' then 2990 else 990 end), 0) from subscriptions where plan_id in ('pro','supplier_pro','buyer_pro','business') and status = 'active' and paid_until >= public.nifti_today()),
    'banned', (select count(*) from businesses where banned_at is not null),
    'unreviewed', (select count(*) from businesses where not is_outside and reviewed_at is null and banned_at is null),
    'pending_payments', (select count(*) from upgrade_requests where status = 'pending'),
    'open_services', (select count(*) from service_requests where status in ('pending','in_progress')),
    'support_7d', (select count(*) from support_messages where created_at > now() - interval '7 days'),
    'errors_24h', (select count(*) from client_error_log where created_at > now() - interval '1 day'),
    'push_errors_24h', (select count(*) from notification_outbox where error is not null and created_at > now() - interval '1 day'),
    'require_review', public.nifti_require_review(),
    'pilot', public.nifti_pilot_free());
end $function$;

CREATE OR REPLACE FUNCTION public.admin_funnel_data()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with b as (select * from businesses where not is_outside),
  t as (select (now() at time zone 'Asia/Manila')::date d)
  select jsonb_build_object(
    'businesses', (select count(*) from b),
    'buyers', (select count(*) from b where type in ('buyer','both')), 'suppliers', (select count(*) from b where type in ('supplier','both')),
    'new_7d', (select count(*) from b where created_at > now() - interval '7 days'),
    'active_7d', (select count(distinct x) from (select buyer_business_id x from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft' union select supplier_business_id from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft') q where x in (select id from b)),
    'orders_7d', (select count(*) from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft'),
    'outside_partners', (select count(*) from businesses where is_outside),
    'claimed_from_links', (select count(*) from b where created_by_business is not null),
    'stores_open', (select count(*) from b where store_slug is not null and coalesce((store->>'enabled')::boolean, false)),
    'store_views_7d', (select count(*) from store_events where kind = 'view' and created_at > now() - interval '7 days'),
    'store_orders_7d', (select count(*) from store_events where kind = 'order' and created_at > now() - interval '7 days'),
    'pro_paying', (select count(*) from subscriptions where plan_id in ('pro','supplier_pro','buyer_pro','business') and (paid_until is null or paid_until >= (select d from t))),
    'upgrade_pending', (select count(*) from upgrade_requests where status = 'pending'),
    'stuck', (select coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) from (
       select jsonb_build_object('business', b.name, 'type', b.type, 'stage', public.setup_stage(b.id),
         'days', (select d from t) - (b.created_at at time zone 'Asia/Manila')::date, 'created_at', b.created_at,
         'owner', (select name from team_members m where m.business_id = b.id and m.roles && array['Owner'] limit 1),
         'email', (select email from team_members m where m.business_id = b.id and m.roles && array['Owner'] limit 1),
         'phone', b.shared_contact->>'phone') x
       from b where public.setup_stage(b.id) <> 'active' order by b.created_at desc limit 40) s),
    'leads', (select jsonb_build_object('new', count(*) filter (where status = 'new'), 'contacted', count(*) filter (where status = 'contacted'), 'interested', count(*) filter (where status = 'interested'), 'onboarded', count(*) filter (where status = 'onboarded')) from growth_leads)
  )
$function$;

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
            when 'suppliers' then b.type in ('supplier','both')
            when 'buyers' then b.type in ('buyer','both')
            when 'inactive' then coalesce(public.nifti_last_active(b.id), b.created_at) < now() - interval '30 days'
            else true end
    order by b.created_at desc limit least(coalesce(p_limit, 50), 200) offset coalesce(p_offset, 0)) x);
end $function$;

grant execute on function public.request_connection(uuid, text, text) to authenticated;
revoke execute on function public.request_connection(uuid, text, text) from anon;
