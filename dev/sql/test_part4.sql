do $$
declare own_uid uuid := gen_random_uuid(); staff_uid uuid := gen_random_uuid(); sup_uid uuid := gen_random_uuid();
  biz uuid; sup uuid; staff_mem uuid; log text := ''; r jsonb; n int; t text; e_id uuid; s_id uuid; po1 uuid; po2 uuid; inv_id uuid; run uuid; d numeric; c numeric; lm date;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
    (own_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz4-own@example.com', '{"business_name":"ZZ4 Hardware","full_name":"Nena"}', now(), now()),
    (sup_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz4-sup@example.com', '{"business_name":"ZZ4 Steel"}', now(), now());
  select business_id into biz from team_members where auth_user_id = own_uid;
  select business_id into sup from team_members where auth_user_id = sup_uid;
  insert into team_members(business_id, name, email, roles, status) values (biz, 'Joy', 'zz4-joy@example.com', array['Cashier'], 'invited');
  insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values (staff_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zz4-joy@example.com', '{}', now(), now());
  select id into staff_mem from team_members where auth_user_id = staff_uid;

  perform set_config('request.jwt.claims', json_build_object('sub', own_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  insert into inventory_items(business_id, sku_code, name, on_hand, unit_cost, sell_price) values (biz, 'CEM', 'Cement', 100, 200, 250) returning id into inv_id;
  insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with, customer_name)
    values (biz, public.nifti_today(), '[{"product":"Cement","qty":4,"unitPrice":250,"unitCost":200}]', '[{"method":"cash","amount":1000}]', 1000, 'cash', 'Walk-in');
  insert into downstream_sales(business_id, sale_date, line_items, payments, total, paid_with, customer_name)
    values (biz, public.nifti_today() - 2, '[{"product":"Cement","qty":2,"unitPrice":250,"unitCost":200}]', jsonb_build_array(jsonb_build_object('method','gcash','amount',300,'date',(public.nifti_today())::text)), 500, 'credit', 'Mang Lito') returning id into s_id;
  insert into expenses(business_id, category, amount, paid_from) values (biz, 'Electricity', 1800, 'bank') returning id into e_id;
  insert into expenses(business_id, category, amount, paid_from, staff_name) values (biz, 'Staff advance (vale)', 500, 'cash', 'Joy');
  insert into cash_deposits(business_id, amount, deposited_on) values (biz, 700, public.nifti_today());
  -- an order to a customer (we sell, 12% VAT) with a confirmed payment, and a bill from a supplier
  insert into purchase_orders(po_number, buyer_business_id, supplier_business_id, status, tax_rate, line_items, created_date, invoice)
    values ('ZZ4-1', sup, biz, 'invoiced', 0.12, '[{"product":"Cement","qty":10,"unitPrice":250}]', public.nifti_today(),
      jsonb_build_object('number','INV-1','statedTotal',2800,'issuedDate',public.nifti_today()::text,'payments',jsonb_build_array(jsonb_build_object('id','p1','method','bank_transfer','amount',1000,'date',public.nifti_today()::text,'confirmStatus','confirmed')))) returning id into po1;
  insert into purchase_orders(po_number, buyer_business_id, supplier_business_id, status, tax_rate, line_items, created_date, invoice)
    values ('ZZ4-2', biz, sup, 'invoiced', 0, '[{"product":"Cement","qty":50,"unitPrice":190}]', public.nifti_today(),
      jsonb_build_object('number','S-9','statedTotal',9500,'payments','[]'::jsonb)) returning id into po2;
  insert into payroll_runs(business_id, period_from, period_to) values (biz, public.nifti_today() - 14, public.nifti_today()) returning id into run;
  insert into payroll_lines(run_id, staff_name, basis, rate, days, vale_deduct, contrib_employee, contrib_employer) values (run, 'Joy', 'day', 600, 12, 500, 300, 400);
  update payroll_runs set status = 'paid', paid_on = public.nifti_today(), paid_from = 'cash' where id = run;
  select net into d from payroll_lines where run_id = run; log := log || 'payroll net=' || d || E'\n';
  begin update payroll_lines set days = 13 where run_id = run; log := log || 'PAID PAYROLL EDITED' || E'\n'; exception when others then log := log || 'paid payroll locked: ' || sqlerrm || E'\n'; end;

  r := public.ledger_sync(); log := log || 'sync1=' || r::text || E'\n';
  r := public.ledger_sync(); log := log || 'sync2 (idempotent)=' || r::text || E'\n';
  select sum(debit), sum(credit) into d, c from journal_lines where business_id = biz; log := log || 'TB debits=' || d || ' credits=' || c || E'\n';
  select string_agg(account_code || ':' || bal, ' ' order by account_code) into t from (select account_code, sum(debit - credit) bal from journal_lines where business_id = biz group by 1 having sum(debit - credit) <> 0) x;
  log := log || 'balances ' || t || E'\n';
  -- change and remove
  update expenses set amount = 1900 where id = e_id;
  update downstream_sales set voided_at = now(), void_reason = 'test' where id = s_id;
  r := public.ledger_sync(); log := log || 'sync3 after edit+void=' || r::text || E'\n';
  select string_agg(account_code || ':' || bal, ' ' order by account_code) into t from (select account_code, sum(debit - credit) bal from journal_lines where business_id = biz group by 1 having sum(debit - credit) <> 0) x;
  log := log || 'balances ' || t || E'\n';
  begin perform public.post_manual_journal(public.nifti_today(), 'bad one', '[{"a":"1000","d":100},{"a":"3000","c":90}]'); log := log || 'UNBALANCED ACCEPTED' || E'\n';
  exception when others then log := log || 'unbalanced rejected: ' || sqlerrm || E'\n'; end;
  perform public.post_manual_journal(public.nifti_today(), 'Owner capital in', '[{"a":"1020","d":5000},{"a":"3000","c":5000}]');
  begin delete from journal_lines where business_id = biz; get diagnostics n = row_count; log := log || 'delete rows=' || n || E'\n';
  exception when others then log := log || 'delete blocked: ' || sqlerrm || E'\n'; end;
  -- staff: no ledger, big expense waits
  perform set_config('request.jwt.claims', json_build_object('sub', staff_uid, 'role', 'authenticated')::text, true);
  select count(*) into n from journal_lines; log := log || 'staff sees lines=' || n || E'\n';
  begin r := public.ledger_sync(); log := log || 'STAFF SYNCED' || E'\n'; exception when others then log := log || 'staff sync: ' || sqlerrm || E'\n'; end;
  insert into expenses(business_id, category, amount, paid_from) values (biz, 'Repairs', 3500, 'cash') returning id into e_id;
  select status into t from expenses where id = e_id; log := log || 'staff 3500 expense status=' || t || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', own_uid, 'role', 'authenticated')::text, true);
  perform public.review_expense(e_id, false, 'Attach the receipt');
  perform set_config('request.jwt.claims', json_build_object('sub', staff_uid, 'role', 'authenticated')::text, true);
  update expenses set receipt_path = 'x.jpg', amount = 3400 where id = e_id;
  select status || ' ' || amount into t from expenses where id = e_id; log := log || 'staff fixed -> ' || t || E'\n';
  begin update expenses set status = 'approved' where id = e_id; get diagnostics n = row_count; log := log || 'staff self-approve rows=' || n || E'\n';
  exception when others then log := log || 'staff self-approve blocked: ' || left(sqlerrm, 60) || E'\n'; end;
  perform set_config('request.jwt.claims', json_build_object('sub', own_uid, 'role', 'authenticated')::text, true);
  perform public.review_expense(e_id, true, null);
  r := public.ledger_sync(); log := log || 'sync4 after approval=' || r::text || E'\n';
  -- close last month, then try to add into it
  lm := (date_trunc('month', public.nifti_today()) - interval '1 month')::date;
  perform public.lock_period(lm, 'done', '{}');
  begin insert into expenses(business_id, category, amount, paid_from, spent_on) values (biz, 'Water', 300, 'cash', lm + 3); log := log || 'LOCKED MONTH ACCEPTED' || E'\n';
  exception when others then log := log || 'locked month: ' || sqlerrm || E'\n'; end;
  perform set_config('role', 'postgres', true);
  -- a late change to a locked month's order lands in the open month
  update purchase_orders set created_date = lm + 5, invoice = invoice || jsonb_build_object('issuedDate', (lm + 5)::text) where id = po2;
  perform public.ledger_sync_business(biz);
  select string_agg(kind || ' ' || entry_date || ' ' || left(memo, 70), E'\n   ' order by created_at) into t from journal_entries where business_id = biz and source_type = 'po_bill';
  log := log || 'bill entries:' || E'\n   ' || t || E'\n';
  select sum(debit) - sum(credit) into d from journal_lines where business_id = biz; log := log || 'still balanced diff=' || d || E'\n';
  raise exception 'ROLLBACK%', E'\n' || log;
end $$;
