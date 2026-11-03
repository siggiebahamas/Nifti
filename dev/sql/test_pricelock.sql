-- Rollback-only test for the price lock, approvals and discounts. Nothing is kept.
do $$
declare own_uid uuid := gen_random_uuid(); staff_uid uuid := gen_random_uuid();
  biz uuid; staff_mem uuid; log text := ''; req uuid; s_id uuid; t text; j jsonb;
  as_staff text; as_owner text;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (own_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz-plown@example.com', '{"business_name":"ZZ Lock Hardware","business_kind":"store","full_name":"Nena"}', now(), now());
  select business_id into biz from team_members where auth_user_id = own_uid;
  insert into team_members(business_id, name, email, roles, status) values (biz, 'Liza', 'zz-plliza@example.com', array['Cashier'], 'invited');
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (staff_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz-plliza@example.com', '{}', now(), now());
  select id into staff_mem from team_members where auth_user_id = staff_uid;
  insert into inventory_items(business_id, sku_code, name, on_hand, unit_cost, sell_price) values (biz, 'AB', 'Angle Bars', 100, 60, 80);
  insert into inventory_items(business_id, sku_code, name, on_hand, unit_cost) values (biz, 'NL', 'Nails 1kg', 100, 50);
  as_staff := json_build_object('sub', staff_uid, 'role', 'authenticated')::text;
  as_owner := json_build_object('sub', own_uid, 'role', 'authenticated')::text;
  perform set_config('role', 'authenticated', true);

  -- STAFF
  perform set_config('request.jwt.claims', as_staff, true);
  insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with)
    values (biz, public.nifti_today(), '[{"product":"Angle Bars","qty":2,"unitPrice":77}]', '[]', 154, 'cash') returning id into s_id;
  select line_items->0->>'listPrice' into t from downstream_sales where id = s_id;
  log := log || '1 staff 4% off saved, listPrice stamped=' || coalesce(t, 'NULL') || E'\n';
  begin insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with)
      values (biz, public.nifti_today(), '[{"product":"Angle Bars","qty":2,"unitPrice":70}]', '[]', 140, 'cash');
    log := log || '2 FAIL: 12% off was allowed' || E'\n';
  exception when others then log := log || '2 staff 12% off blocked: ' || sqlerrm || E'\n'; end;
  begin insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with)
      values (biz, public.nifti_today(), '[{"product":"Nails 1kg","qty":1,"unitPrice":40}]', '[]', 40, 'cash');
    log := log || '3 FAIL: under cost allowed' || E'\n';
  exception when others then log := log || '3 staff under cost (no list price) blocked' || E'\n'; end;
  begin insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with)
      values (biz, public.nifti_today(), '[{"product":"Sale (total only)","qty":1,"unitPrice":100,"totalOnly":true}]', '[]', 100, 'cash');
    log := log || '4 FAIL: total-only allowed' || E'\n';
  exception when others then log := log || '4 staff total-only blocked' || E'\n'; end;
  begin update businesses set books_settings = coalesce(books_settings, '{}'::jsonb) || '{"price_lock": false}' where id = biz;
    log := log || '5 FAIL: staff turned lock off' || E'\n';
  exception when others then log := log || '5 staff cannot turn lock off' || E'\n'; end;
  begin update inventory_items set sell_price = 50 where business_id = biz and name = 'Angle Bars';
    log := log || '6 FAIL: staff lowered price' || E'\n';
  exception when others then log := log || '6 staff cannot lower a price' || E'\n'; end;
  req := public.request_price_ok(biz, '[{"product":"Angle Bars","qty":2,"unitPrice":70}]', 'Walk-in', 'suki');
  perform set_config('role', 'postgres', true);
  select count(*)::text into t from notification_outbox where business_id = biz and title like '%needs your OK%';
  perform set_config('role', 'authenticated', true);
  log := log || '7 request sent, owner notifications=' || t || E'\n';
  begin perform public.decide_price_ok(req, true, null); log := log || '8 FAIL: staff approved own request' || E'\n';
  exception when others then log := log || '8 staff cannot approve: ' || sqlerrm || E'\n'; end;

  -- OWNER approves
  perform set_config('request.jwt.claims', as_owner, true);
  select count(*)::text into t from price_approvals where business_id = biz and status = 'pending';
  log := log || '9 owner sees pending=' || t || E'\n';
  perform public.decide_price_ok(req, true, null);
  perform set_config('role', 'postgres', true);
  select count(*)::text into t from notification_outbox where business_id = biz and only_member = staff_mem and title like '%OK''d%';
  perform set_config('role', 'authenticated', true);
  log := log || '10 approved, staff told=' || t || E'\n';

  -- STAFF uses the OK
  perform set_config('request.jwt.claims', as_staff, true);
  begin insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with, price_approval_id)
      values (biz, public.nifti_today(), '[{"product":"Angle Bars","qty":2,"unitPrice":65}]', '[]', 130, 'cash', req);
    log := log || '11 FAIL: lower than OK''d allowed' || E'\n';
  exception when others then log := log || '11 lower than OK''d blocked' || E'\n'; end;
  insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with, price_approval_id)
    values (biz, public.nifti_today(), '[{"product":"Angle Bars","qty":2,"unitPrice":70}]', '[]', 140, 'cash', req);
  select status into t from price_approvals where id = req;
  log := log || '12 sale with OK saved, request=' || t || E'\n';
  begin insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with, price_approval_id)
      values (biz, public.nifti_today(), '[{"product":"Angle Bars","qty":2,"unitPrice":70}]', '[]', 140, 'cash', req);
    log := log || '13 FAIL: OK reused' || E'\n';
  exception when others then log := log || '13 OK cannot be reused' || E'\n'; end;

  -- OWNER is not locked; discounts per cashier
  perform set_config('request.jwt.claims', as_owner, true);
  insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with)
    values (biz, public.nifti_today(), '[{"product":"Angle Bars","qty":1,"unitPrice":60}]', '[]', 60, 'cash');
  log := log || '14 owner sold 25% off fine' || E'\n';
  j := public.books_discounts_for(biz, public.nifti_today());
  log := log || '15 discounts=' || j::text || E'\n';
  update businesses set books_settings = coalesce(books_settings, '{}'::jsonb) || '{"max_discount": 15}' where id = biz;
  perform set_config('request.jwt.claims', as_staff, true);
  insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with)
    values (biz, public.nifti_today(), '[{"product":"Angle Bars","qty":1,"unitPrice":70}]', '[]', 70, 'cash');
  log := log || '16 owner set 15%, staff 12% off now saves' || E'\n';
  raise exception E'ROLLBACK (test only)\n%', log;
end $$;
