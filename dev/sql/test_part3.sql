do $$
declare own_uid uuid := gen_random_uuid(); staff_uid uuid := gen_random_uuid();
  biz uuid; own_mem uuid; staff_mem uuid; log text := ''; r jsonb; n int; t text; m_id uuid;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (own_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz3-own@example.com', '{"business_name":"ZZ3 Carinderia","business_kind":"restaurant","full_name":"Nena"}', now(), now());
  select business_id, id into biz, own_mem from team_members where auth_user_id = own_uid;
  insert into team_members(business_id, name, email, roles, status) values (biz, 'Cashier Joy', 'zz3-joy@example.com', array['Cashier'], 'invited');
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (staff_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz3-joy@example.com', '{}', now(), now());
  select id into staff_mem from team_members where auth_user_id = staff_uid;
  log := log || 'staff joined=' || (staff_mem is not null)::text || E'\n';

  -- staff counts ₱300 short
  perform set_config('request.jwt.claims', json_build_object('sub', staff_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  r := public.save_cash_count(public.nifti_today(), 'Main', '{"cash": 5000}', '{"cash": 4700}', null);
  log := log || 'staff result=' || r::text || E'\n';
  select count(*) into n from notification_outbox where business_id = biz; log := log || 'staff sees outbox rows=' || n || E'\n';
  begin insert into menu_items(business_id, name, price) values (biz, 'Sisig', 120); log := log || 'STAFF ADDED MENU ITEM' || E'\n';
  exception when others then log := log || 'staff menu insert blocked: ' || left(sqlerrm, 60) || E'\n'; end;
  r := public.my_weekly_recap(0); log := log || 'staff recap has books=' || (r ? 'books')::text || E'\n';
  insert into expenses(business_id, category, amount, paid_from, spent_on) values (biz, 'Cash to bank', 3000, 'cash', public.nifti_today() - 1);
  insert into expenses(business_id, category, amount, paid_from, spent_on) values (biz, 'Gas (LPG)', 950, 'cash', public.nifti_today() - 1);
  insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with, customer_name)
    values (biz, public.nifti_today() - 1, '[{"product":"Sisig","qty":3,"unitPrice":120}]', '[{"method":"cash","amount":360}]', 360, 'cash', 'Walk-in');

  -- owner
  perform set_config('request.jwt.claims', json_build_object('sub', own_uid, 'role', 'authenticated')::text, true);
  select string_agg(category || '→' || coalesce(only_member::text = own_mem::text, false)::text, ', ') into t from notification_outbox where business_id = biz;
  log := log || 'owner sees outbox=' || coalesce(t, '-') || E'\n';
  insert into menu_items(business_id, name, price, recipe) values (biz, 'Sisig', 120, '[{"item":"Pork","qty":0.15}]') returning id into m_id;
  log := log || 'owner menu item=' || (m_id is not null)::text || E'\n';
  begin delete from menu_items where id = m_id; get diagnostics n = row_count; log := log || 'owner delete rows=' || n || E'\n';
  exception when others then log := log || 'delete blocked' || E'\n'; end;
  r := public.my_weekly_recap(0); log := log || 'owner recap has books=' || (r ? 'books')::text || E'\n';

  perform set_config('role', 'postgres', true);
  r := public.books_day_for(biz, public.nifti_today() - 1);
  log := log || 'yesterday=' || r::text || E'\n';
  n := public.send_books_summaries();
  select string_agg(title || ' | ' || replace(body, E'\n', ' / ') || ' → owner=' || (only_member = own_mem)::text, E'\n') into t from notification_outbox where business_id = biz and category = 'money' and title like '📒%';
  log := log || 'books summary=' || coalesce(t, 'none') || E'\n';
  raise exception 'ROLLBACK%', E'\n' || log;
end $$;
