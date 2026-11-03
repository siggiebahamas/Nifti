do $$
declare own_uid uuid := gen_random_uuid(); staff_uid uuid := gen_random_uuid(); oth_uid uuid := gen_random_uuid();
  biz uuid; oth uuid; staff_mem uuid; log text := ''; r jsonb; n int; e_id uuid; inv_id uuid; s_id uuid; req uuid; x record; t text;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (own_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz-own@example.com', '{"business_name":"ZZ Sari-sari","business_type":"supplier","business_kind":"store","full_name":"Nena"}', now(), now());
  select business_id into biz from team_members where auth_user_id = own_uid;
  select type || ' kind=' || coalesce(public_profile->>'kind','-') into t from businesses where id = biz;
  log := log || 'new biz type=' || t || E'\n';
  insert into team_members(business_id, name, email, roles, status) values (biz, 'Cashier Joy', 'zz-joy@example.com', array['Warehouse Manager'], 'invited');
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (staff_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz-joy@example.com', '{}', now(), now());
  select id into staff_mem from team_members where auth_user_id = staff_uid;
  log := log || 'staff joined=' || (staff_mem is not null)::text || E'\n';
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (oth_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz-oth@example.com', '{"business_name":"ZZ Supplier"}', now(), now());
  select business_id into oth from team_members where auth_user_id = oth_uid;
  update businesses set catalog_public = true, catalog = '[{"product":"Rice 25kg","price":1200}]' where id = oth;

  -- STAFF records an expense, a sale, a stock change, and a blind cash count
  perform set_config('request.jwt.claims', json_build_object('sub', staff_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  insert into expenses(business_id, category, amount, paid_from, vendor) values (biz, 'Electricity', 1800, 'cash', 'Meralco') returning id into e_id;
  select created_by_name into t from expenses where id = e_id;
  log := log || 'staff expense saved by=' || coalesce(t,'?') || E'\n';
  begin update expenses set amount = 1 where id = e_id; get diagnostics n = row_count; log := log || 'staff edit rows=' || n || E'\n';
  exception when others then log := log || 'staff edit blocked: ' || sqlerrm || E'\n'; end;
  begin delete from expenses where id = e_id; get diagnostics n = row_count; log := log || 'staff delete rows=' || n || E'\n';
  exception when others then log := log || 'staff delete blocked: ' || sqlerrm || E'\n'; end;
  insert into inventory_items(business_id, sku_code, name, on_hand, unit_cost, sell_price) values (biz, 'RICE-25', 'Rice 25kg', 10, 1200, 1350) returning id into inv_id;
  update inventory_items set on_hand = 8, meta = jsonb_build_object('last_move', jsonb_build_object('kind','sold','reason','Counter sale','ref','S-1','at', now())) where id = inv_id;
  update inventory_items set on_hand = 7 where id = inv_id; -- no label: shows as changed by hand
  select string_agg(kind || ':' || qty || ':' || coalesce(created_by_name,'?'), ', ' order by created_at, kind) into t from stock_moves where item_id = inv_id;
  log := log || 'moves=' || t || E'\n';
  begin insert into stock_moves(business_id, item_name, qty, kind) values (biz, 'fake', -5, 'bad'); log := log || 'HAND MOVE NOT BLOCKED' || E'\n';
  exception when others then log := log || 'hand move blocked: ' || left(sqlerrm, 60) || E'\n'; end;
  insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with, customer_name)
    values (biz, public.nifti_today(), '[{"product":"Rice 25kg","qty":2,"unitPrice":1350,"unitCost":1200}]', '[{"method":"cash","amount":2700}]', 2700, 'cash', 'Walk-in') returning id into s_id;
  begin update downstream_sales set total = 1 where id = s_id; log := log || 'STAFF CHANGED SALE' || E'\n';
  exception when others then log := log || 'staff sale edit: ' || sqlerrm || E'\n'; end;
  begin update downstream_sales set voided_at = now() where id = s_id; log := log || 'STAFF VOIDED' || E'\n';
  exception when others then log := log || 'staff void: ' || sqlerrm || E'\n'; end;
  r := public.save_cash_count(public.nifti_today(), 'Main', '{"cash": 5200}', '{"cash": 4950}', 'busy day');
  log := log || 'staff count result=' || r::text || E'\n';
  select count(*) into n from cash_counts; log := log || 'staff can read counts=' || n || E'\n';
  begin r := public.save_cash_count(public.nifti_today(), 'Main', '{"cash": 5200}', '{"cash": 5200}', 'fix'); log := log || 'STAFF RECOUNT ALLOWED' || E'\n';
  exception when others then log := log || 'staff recount: ' || sqlerrm || E'\n'; end;
  select count(*) into n from expenses; log := log || 'staff sees expenses=' || n || E'\n';

  -- OWNER sees everything and can fix things (with a trail)
  perform set_config('request.jwt.claims', json_build_object('sub', own_uid, 'role', 'authenticated')::text, true);
  insert into expenses(business_id, category, amount, paid_from) values (biz, 'Rent', 15000, 'bank');
  select count(*) into n from expenses; log := log || 'owner sees expenses=' || n || E'\n';
  update expenses set amount = 1850 where id = e_id;
  select edited_by_name || ' amt=' || amount into t from expenses where id = e_id; log := log || 'owner edit by=' || t || E'\n';
  update expenses set deleted_at = now(), delete_reason = 'duplicate' where id = e_id;
  select deleted_by_name into t from expenses where id = e_id; log := log || 'owner removed by=' || t || E'\n';
  select difference || ' by ' || closed_by_name into t from cash_counts where business_id = biz; log := log || 'owner sees count diff=' || t || E'\n';
  select count(*) into n from notification_outbox where business_id = biz and category = 'money'; log := log || 'cash alert notes=' || n || E'\n';
  perform public.reopen_cash_count(public.nifti_today(), 'Main');
  perform set_config('request.jwt.claims', json_build_object('sub', staff_uid, 'role', 'authenticated')::text, true);
  r := public.save_cash_count(public.nifti_today(), 'Main', '{"cash": 5200}', '{"cash": 5180}', 'recount');
  log := log || 'staff recount after reopen=' || r::text || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', own_uid, 'role', 'authenticated')::text, true);
  update downstream_sales set voided_at = now(), void_reason = 'wrong item' where id = s_id;
  select voided_by_name into t from downstream_sales where id = s_id; log := log || 'owner void by=' || t || E'\n';
  select count(*) into n from audit_log where business_id = biz; log := log || 'audit rows=' || n || E'\n';
  select string_agg(r2.count_day::text || ':' || r2.closed_by_name, ',') into t from public.my_cash_count_days(7) r2; log := log || 'days=' || t || E'\n';
  -- weekly recap, plan, setup stage
  perform set_config('role', 'postgres', true);
  r := public.weekly_recap_for(biz, public.nifti_today() - 6, public.nifti_today());
  log := log || 'recap books=' || (r->'books')::text || E'\n';
  log := log || 'stage=' || public.setup_stage(biz) || ' plan feats pro=' || array_length(public.plan_features('pro'),1) || ' label=' || public.plan_label('buyer_pro') || E'\n';
  -- connect as a buyer to a business with a public catalog (both are type both)
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.discover_businesses('supplier'); log := log || 'discover sellers=' || n || E'\n';
  req := public.request_connection(oth, 'hi po', 'buyer');
  perform set_config('request.jwt.claims', json_build_object('sub', oth_uid, 'role', 'authenticated')::text, true);
  perform public.respond_connection(req, true);
  select 'buyer=' || (buyer_business_id = biz)::text || ' supplier=' || (supplier_business_id = oth)::text into t from business_relationships where buyer_business_id in (biz, oth) and supplier_business_id in (biz, oth);
  log := log || 'relationship ' || t || E'\n';
  -- other business cannot see our books
  select count(*) into n from expenses where business_id = biz; log := log || 'outsider sees expenses=' || n || E'\n';
  select count(*) into n from stock_moves where business_id = biz; log := log || 'outsider sees moves=' || n || E'\n';
  raise exception 'ROLLBACK%', E'\n' || log;
end $$;
