-- ===== Part 4: the ledger (double entry, posted from existing records), approvals, month-end close, branches, payroll, issue decisions =====

-- ---------- chart of accounts
create table if not exists ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  code text not null check (code ~ '^[0-9]{3,6}$'),
  name text not null check (length(btrim(name)) between 1 and 80),
  type text not null check (type in ('asset','liability','equity','income','expense')),
  is_system boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, code)
);
alter table ledger_accounts enable row level security;

create or replace function public.ledger_template() returns table(code text, name text, type text) language sql immutable as $$
  values ('1000','Cash in drawer','asset'), ('1010','GCash & Maya','asset'), ('1020','Bank','asset'),
    ('1100','Customers owe you (receivables)','asset'), ('1150','Staff advances (vale)','asset'), ('1200','Stock (inventory)','asset'),
    ('1400','Input VAT','asset'), ('1410','Tax withheld by customers','asset'),
    ('2000','You owe suppliers (payables)','liability'), ('2050','Unpaid bills','liability'), ('2060','Credit card','liability'),
    ('2100','Output VAT','liability'), ('2300','SSS, PhilHealth, Pag-IBIG to remit','liability'), ('2310','Other payroll deductions','liability'),
    ('3000','Owner''s money put in (capital)','equity'), ('3100','Owner took money (drawings)','equity'), ('3200','Retained earnings','equity'), ('3900','Opening balances','equity'),
    ('4000','Counter sales','income'), ('4010','Sales to customers (orders)','income'), ('4020','Credits and returns given','income'), ('4900','Other income (cash over)','income'),
    ('5000','Cost of goods sold','expense'), ('5100','Bad and missing stock','expense'), ('5110','Stock changed by hand','expense'),
    ('6010','Electricity','expense'), ('6020','Water','expense'), ('6030','Internet & phone','expense'), ('6040','Gas (LPG)','expense'), ('6100','Rent','expense'),
    ('6200','Salaries','expense'), ('6210','Employer contributions','expense'), ('6300','Fuel & transport','expense'), ('6310','Delivery & shipping','expense'),
    ('6400','Supplies','expense'), ('6500','Repairs','expense'), ('6600','Food & meals','expense'), ('6700','Taxes & permits','expense'),
    ('6800','Bank & GCash fees','expense'), ('6900','Marketing','expense'), ('6960','Cash short','expense'), ('6990','Other expenses','expense')
$$;
create or replace function public.ledger_seed(p_business uuid) returns void language sql security definer set search_path to 'public' as $$
  insert into ledger_accounts(business_id, code, name, type, is_system)
  select p_business, t.code, t.name, t.type, true from public.ledger_template() t
  on conflict (business_id, code) do nothing;
$$;
revoke all on function public.ledger_seed(uuid) from public, anon, authenticated;

-- system accounts keep their code and type and can't be switched off
create or replace function public.ledger_accounts_guard() returns trigger language plpgsql set search_path to 'public' as $$
begin
  if tg_op = 'UPDATE' and old.is_system and (new.code <> old.code or new.type <> old.type or not new.active or not new.is_system) then
    raise exception 'Built-in accounts can be renamed, but not changed or switched off.';
  end if;
  if tg_op = 'INSERT' then new.is_system := false; end if;
  new.business_id := coalesce(old.business_id, new.business_id);
  return new;
end $$;
drop trigger if exists ledger_accounts_guard on ledger_accounts;
create trigger ledger_accounts_guard before insert or update on ledger_accounts for each row execute function public.ledger_accounts_guard();
drop policy if exists la_select on ledger_accounts;
create policy la_select on ledger_accounts for select using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
drop policy if exists la_insert on ledger_accounts;
create policy la_insert on ledger_accounts for insert with check (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id) and code ~ '^[0-9]{4}$');
drop policy if exists la_update on ledger_accounts;
create policy la_update on ledger_accounts for update using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id))
  with check (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
grant select, insert, update on ledger_accounts to authenticated;

-- ---------- journal
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  entry_date date not null,
  memo text,
  kind text not null check (kind in ('auto','manual','reversal')),
  source_type text, source_id text, source_hash text,
  status text not null default 'posted' check (status in ('posted','reversed')),
  reversal_of uuid references journal_entries(id), reversed_by uuid references journal_entries(id),
  branch text,
  created_by_name text,
  created_at timestamptz not null default now()
);
create index if not exists je_biz_date on journal_entries(business_id, entry_date);
create unique index if not exists je_live_source on journal_entries(business_id, source_type, source_id) where kind = 'auto' and status = 'posted';
create table if not exists journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references journal_entries(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  account_code text not null,
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  party text, memo text,
  check (not (debit > 0 and credit > 0))
);
create index if not exists jl_entry on journal_lines(entry_id);
create index if not exists jl_biz_acct on journal_lines(business_id, account_code);
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;
drop policy if exists je_select on journal_entries;
create policy je_select on journal_entries for select using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
drop policy if exists jl_select on journal_lines;
create policy jl_select on journal_lines for select using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
grant select on journal_entries, journal_lines to authenticated;
-- nothing writes here except the posting functions below; posted lines are never edited
create or replace function public.journal_immutable() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'Posted entries are never deleted. Reverse them instead.'; end if;
  if tg_table_name = 'journal_lines' then raise exception 'Posted lines are never changed. Reverse the entry instead.'; end if;
  if new.entry_date <> old.entry_date or new.business_id <> old.business_id or new.kind <> old.kind or coalesce(new.source_hash,'') <> coalesce(old.source_hash,'') then
    raise exception 'Posted entries are never changed. Reverse them instead.';
  end if;
  return new;
end $$;
drop trigger if exists je_immutable on journal_entries;
create trigger je_immutable before update or delete on journal_entries for each row execute function public.journal_immutable();
drop trigger if exists jl_immutable on journal_lines;
create trigger jl_immutable before update or delete on journal_lines for each row execute function public.journal_immutable();

-- ---------- month-end close
create table if not exists accounting_periods (
  business_id uuid not null references businesses(id) on delete cascade,
  period date not null check (extract(day from period) = 1),
  status text not null default 'locked' check (status in ('locked','open')),
  locked_at timestamptz, locked_by_name text, note text,
  reopened_at timestamptz, reopened_by_name text, reopen_reason text,
  checklist jsonb,
  primary key (business_id, period)
);
alter table accounting_periods enable row level security;
drop policy if exists ap_select on accounting_periods;
create policy ap_select on accounting_periods for select using (business_id in (select my_business_ids()));
grant select on accounting_periods to authenticated;
create or replace function public.nifti_month_locked(p_business uuid, p_day date) returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from accounting_periods where business_id = p_business and period = date_trunc('month', p_day)::date and status = 'locked')
$$;
-- first open day on or after p_day (late changes to a closed month land in the next open month)
create or replace function public.ledger_open_date(p_business uuid, p_day date) returns date language plpgsql stable security definer set search_path to 'public' as $$
declare d date := p_day;
begin
  for i in 1..60 loop
    if not public.nifti_month_locked(p_business, d) then return d; end if;
    d := (date_trunc('month', d) + interval '1 month')::date;
  end loop;
  return d;
end $$;
create or replace function public.nifti_guard_open_month() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare dnew date; dold date; b uuid;
begin
  b := coalesce(new.business_id, old.business_id);
  dnew := case tg_table_name when 'expenses' then new.spent_on when 'downstream_sales' then new.sale_date when 'cash_counts' then new.count_day end;
  if tg_op = 'UPDATE' then dold := case tg_table_name when 'expenses' then old.spent_on when 'downstream_sales' then old.sale_date when 'cash_counts' then old.count_day end; end if;
  if public.nifti_month_locked(b, dnew) or (dold is not null and public.nifti_month_locked(b, dold)) then
    raise exception 'That month is closed. Ask the owner to reopen it first.';
  end if;
  return new;
end $$;
drop trigger if exists guard_open_month on expenses;
create trigger guard_open_month before insert or update on expenses for each row execute function public.nifti_guard_open_month();
drop trigger if exists guard_open_month on downstream_sales;
create trigger guard_open_month before insert or update on downstream_sales for each row execute function public.nifti_guard_open_month();
drop trigger if exists guard_open_month on cash_counts;
create trigger guard_open_month before insert or update on cash_counts for each row execute function public.nifti_guard_open_month();

-- ---------- branches, approvals
alter table downstream_sales add column if not exists branch text check (branch is null or length(branch) <= 60);
alter table expenses add column if not exists branch text check (branch is null or length(branch) <= 60);
alter table expenses add column if not exists status text not null default 'approved' check (status in ('submitted','approved','needs_correction'));
alter table expenses add column if not exists approved_by_name text;
alter table expenses add column if not exists approved_at timestamptz;
alter table expenses add column if not exists review_note text check (review_note is null or length(review_note) <= 300);
alter table cash_deposits add column if not exists branch text check (branch is null or length(branch) <= 60);

create or replace function public.expenses_stamp() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare boss boolean; limit_amt numeric; dual boolean; roles text[]; me uuid;
begin
  boss := public.nifti_books_viewer(new.business_id);
  me := public.nifti_me_member(new.business_id);
  select t.roles into roles from team_members t where t.id = me;
  select coalesce((books_settings->>'approve_over')::numeric, 2000), coalesce((books_settings->>'dual_approval')::boolean, false)
    into limit_amt, dual from businesses where id = new.business_id;
  if tg_op = 'INSERT' then
    new.created_by := me;
    new.created_by_name := coalesce(public.nifti_member_name(new.business_id), new.created_by_name);
    new.created_at := now();
    -- big expenses from staff (or from anyone but the owner, when two-person approval is on) wait for an OK
    if new.amount >= limit_amt and (not boss or (dual and not ('Owner' = any(coalesce(roles, '{}'))))) then new.status := 'submitted';
    else new.status := 'approved'; new.approved_by_name := new.created_by_name; new.approved_at := now(); end if;
    return new;
  end if;
  new.created_by := old.created_by; new.created_by_name := old.created_by_name; new.created_at := old.created_at; new.business_id := old.business_id;
  if not boss then
    -- the person who entered it fixes what the owner sent back, and it goes back for review
    if old.status <> 'needs_correction' or old.created_by is distinct from me then raise exception 'Only the owner can change this.'; end if;
    new.status := 'submitted'; new.approved_by_name := null; new.approved_at := null; new.deleted_at := old.deleted_at;
  elsif new.status = 'approved' and old.status <> 'approved' then
    if dual and old.created_by = me and not ('Owner' = any(coalesce(roles, '{}'))) then raise exception 'Someone else has to approve your own expense.'; end if;
    new.approved_by_name := public.nifti_member_name(new.business_id); new.approved_at := now();
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (new.business_id, 'expense_approved', 'expense', new.id::text, 'status', to_jsonb(old.status), to_jsonb(new.status), coalesce(new.approved_by_name, 'someone'));
  elsif new.status = 'needs_correction' and old.status <> 'needs_correction' then
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (new.business_id, 'expense_sent_back', 'expense', new.id::text, 'status', to_jsonb(old.status), to_jsonb(coalesce(new.review_note, '')), coalesce(public.nifti_member_name(new.business_id), 'someone'));
  end if;
  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_at := now(); new.deleted_by_name := public.nifti_member_name(new.business_id);
  elsif (new.amount, new.category, new.spent_on, new.paid_from, coalesce(new.vendor,''), coalesce(new.note,''), coalesce(new.staff_name,''))
        is distinct from (old.amount, old.category, old.spent_on, old.paid_from, coalesce(old.vendor,''), coalesce(old.note,''), coalesce(old.staff_name,'')) then
    new.edited_at := now(); new.edited_by_name := public.nifti_member_name(new.business_id);
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (new.business_id, 'expense_edited', 'expense', new.id::text, 'expense',
        jsonb_build_object('amount', old.amount, 'category', old.category, 'spent_on', old.spent_on, 'paid_from', old.paid_from),
        jsonb_build_object('amount', new.amount, 'category', new.category, 'spent_on', new.spent_on, 'paid_from', new.paid_from),
        coalesce(new.edited_by_name, 'someone'));
  end if;
  return new;
end $$;
drop policy if exists expenses_update_own on expenses;
create policy expenses_update_own on expenses for update using (
  business_id in (select my_business_ids()) and created_by = public.nifti_me_member(business_id) and status = 'needs_correction')
  with check (business_id in (select my_business_ids()) and created_by = public.nifti_me_member(business_id));

create or replace function public.review_expense(p_id uuid, p_ok boolean, p_note text) returns void language plpgsql security definer set search_path to 'public' as $$
declare e expenses;
begin
  select * into e from expenses where id = p_id;
  if e.id is null or not (e.business_id in (select my_business_ids())) or not public.nifti_books_viewer(e.business_id) then raise exception 'Only the owner can approve expenses.'; end if;
  if not p_ok and length(btrim(coalesce(p_note, ''))) < 2 then raise exception 'Say what needs fixing.'; end if;
  -- runs as the caller's identity inside the trigger (auth.uid() is unchanged)
  update expenses set status = case when p_ok then 'approved' else 'needs_correction' end, review_note = nullif(left(btrim(coalesce(p_note, '')), 300), '') where id = p_id;
  if not p_ok then
    perform public.nifti_notify(e.business_id, '✏️ Please fix an expense', coalesce(e.category, 'Expense') || ' ' || public.nifti_peso(e.amount) || ': ' || left(btrim(p_note), 160), './#expenses', 'team', e.created_by);
  end if;
end $$;
revoke all on function public.review_expense(uuid, boolean, text) from public, anon;
grant execute on function public.review_expense(uuid, boolean, text) to authenticated;

-- ---------- what the owner decided about each flagged issue (the checks themselves are explainable rules in the app)
create table if not exists issue_decisions (
  business_id uuid not null references businesses(id) on delete cascade,
  fingerprint text not null check (length(fingerprint) <= 200),
  status text not null check (status in ('new','assigned','waiting','resolved','accepted')),
  assigned_to text check (assigned_to is null or length(assigned_to) <= 80),
  note text check (note is null or length(note) <= 500),
  due date,
  decided_by_name text,
  updated_at timestamptz not null default now(),
  history jsonb not null default '[]' check (jsonb_typeof(history) = 'array' and octet_length(history::text) <= 20000),
  primary key (business_id, fingerprint)
);
alter table issue_decisions enable row level security;
drop policy if exists id_all on issue_decisions;
create policy id_all on issue_decisions for all using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id))
  with check (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
grant select, insert, update on issue_decisions to authenticated;
create or replace function public.issue_decisions_stamp() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  new.decided_by_name := public.nifti_member_name(new.business_id); new.updated_at := now();
  new.history := (coalesce(case when tg_op = 'UPDATE' then old.history end, '[]'::jsonb)
    || jsonb_build_array(jsonb_build_object('status', new.status, 'by', new.decided_by_name, 'at', now(), 'note', new.note, 'to', new.assigned_to)));
  if jsonb_array_length(new.history) > 40 then new.history := new.history - 0; end if;
  return new;
end $$;
drop trigger if exists issue_decisions_stamp on issue_decisions;
create trigger issue_decisions_stamp before insert or update on issue_decisions for each row execute function public.issue_decisions_stamp();

-- ---------- payroll (salaries beyond vale; contributions are typed in, not computed)
create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  period_from date not null, period_to date not null check (period_to >= period_from),
  status text not null default 'draft' check (status in ('draft','paid')),
  paid_on date, paid_from text check (paid_from is null or paid_from in ('cash','gcash','bank')),
  branch text, note text check (note is null or length(note) <= 300),
  created_by_name text, paid_by_name text,
  created_at timestamptz not null default now()
);
create table if not exists payroll_lines (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  member_id uuid references team_members(id) on delete set null,
  staff_name text not null check (length(btrim(staff_name)) between 1 and 80),
  basis text not null default 'day' check (basis in ('day','month')),
  rate numeric(12,2) not null default 0 check (rate >= 0),
  days numeric(6,2) not null default 0 check (days >= 0),
  extra numeric(12,2) not null default 0 check (extra >= 0),
  gross numeric(12,2) not null default 0 check (gross >= 0),
  vale_deduct numeric(12,2) not null default 0 check (vale_deduct >= 0),
  contrib_employee numeric(12,2) not null default 0 check (contrib_employee >= 0),
  contrib_employer numeric(12,2) not null default 0 check (contrib_employer >= 0),
  other_deduct numeric(12,2) not null default 0 check (other_deduct >= 0),
  net numeric(12,2) not null default 0,
  note text check (note is null or length(note) <= 200)
);
create index if not exists pl_run on payroll_lines(run_id);
alter table payroll_runs enable row level security;
alter table payroll_lines enable row level security;
drop policy if exists pr_all on payroll_runs;
create policy pr_all on payroll_runs for all using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id))
  with check (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
drop policy if exists pll_all on payroll_lines;
create policy pll_all on payroll_lines for all using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id))
  with check (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
grant select, insert, update, delete on payroll_runs, payroll_lines to authenticated;
-- a paid run is history: no more edits or deletes, and its month must be open to pay it
create or replace function public.payroll_guard() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare r payroll_runs;
begin
  if tg_table_name = 'payroll_runs' then
    if tg_op = 'DELETE' then if old.status = 'paid' then raise exception 'A paid payroll stays in the history.'; end if; return old; end if;
    if tg_op = 'UPDATE' and old.status = 'paid' then raise exception 'This payroll is already paid.'; end if;
    if new.status = 'paid' then
      if new.paid_on is null or new.paid_from is null then raise exception 'Say when and how it was paid.'; end if;
      if public.nifti_month_locked(new.business_id, new.paid_on) then raise exception 'That month is closed. Ask the owner to reopen it first.'; end if;
      new.paid_by_name := public.nifti_member_name(new.business_id);
    end if;
    if tg_op = 'INSERT' then new.created_by_name := public.nifti_member_name(new.business_id); end if;
    return new;
  end if;
  select * into r from payroll_runs where id = coalesce(new.run_id, old.run_id);
  if r.status = 'paid' then raise exception 'This payroll is already paid.'; end if;
  if tg_op = 'DELETE' then return old; end if;
  new.business_id := r.business_id;
  new.gross := round(case when new.basis = 'month' then new.rate * case when new.days > 0 then new.days else 1 end else new.rate * new.days end + new.extra, 2);
  new.net := new.gross - new.vale_deduct - new.contrib_employee - new.other_deduct;
  if new.net < 0 then raise exception 'Deductions are more than the pay for %.', new.staff_name; end if;
  return new;
end $$;
drop trigger if exists payroll_guard on payroll_runs;
create trigger payroll_guard before insert or update or delete on payroll_runs for each row execute function public.payroll_guard();
drop trigger if exists payroll_guard on payroll_lines;
create trigger payroll_guard before insert or update or delete on payroll_lines for each row execute function public.payroll_guard();
-- ===== Part 4b: posting rules. Every number in the reports comes from these entries, and every entry points back to its source record.
create or replace function public.ledger_acct_method(m text) returns text language sql immutable as $$
  select case lower(coalesce(m, ''))
    when 'cash' then '1000' when 'gcash' then '1010' when 'maya' then '1010' when 'grabpay' then '1010' when 'shopeepay' then '1010'
    when 'credit_note' then '4020' when 'ewt' then '1410'
    else '1020' end
$$;
create or replace function public.ledger_acct_paid_from(m text) returns text language sql immutable as $$
  select case lower(coalesce(m, ''))
    when 'cash' then '1000' when 'gcash' then '1010' when 'maya' then '1010' when 'bank' then '1020'
    when 'card' then '2060' when 'owner' then '3000' when 'credit' then '2050' else '1000' end
$$;
create or replace function public.ledger_acct_category(c text) returns text language sql immutable as $$
  select case c
    when 'Electricity' then '6010' when 'Water' then '6020' when 'Internet & phone' then '6030' when 'Gas (LPG)' then '6040'
    when 'Rent' then '6100' when 'Salaries' then '6200' when 'Staff advance (vale)' then '1150' when 'Stock bought in cash' then '5000'
    when 'Fuel & transport' then '6300' when 'Delivery & shipping' then '6310' when 'Supplies' then '6400' when 'Repairs' then '6500'
    when 'Food & meals' then '6600' when 'Taxes & permits' then '6700' when 'Bank & GCash fees' then '6800' when 'Marketing' then '6900'
    when 'Owner took money' then '3100' when 'Cash to bank' then '1020' when 'Owner put in cash' then '1000'
    else '6990' end
$$;
-- one journal line; null when the amount rounds to zero (callers drop nulls)
create or replace function public.jl(a text, amt numeric, side text, party text default null) returns jsonb language sql immutable as $$
  select case when round(coalesce(amt, 0), 2) = 0 then null
    when (side = 'd') = (amt > 0) then jsonb_build_object('a', a, 'd', round(abs(amt), 2), 'c', 0, 'p', party)
    else jsonb_build_object('a', a, 'd', 0, 'c', round(abs(amt), 2), 'p', party) end
$$;
create or replace function public.jls(variadic x jsonb[]) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(v), '[]'::jsonb) from unnest(x) v where v is not null
$$;

-- Everything that should be in the books right now, one row per source record.
create or replace function public.ledger_expected(p_business uuid)
returns table(source_type text, source_id text, entry_date date, memo text, branch text, sticky boolean, lines jsonb)
language sql stable security definer set search_path to 'public' as $$
  with
  -- counter sales: money received that day (or utang), and the cost of what left the shelf
  s as (select * from downstream_sales where business_id = p_business and voided_at is null),
  s_pay as (select s.id, s.sale_date, p.value p, p.ordinality i from s, jsonb_array_elements(coalesce(s.payments, '[]'::jsonb)) with ordinality p),
  sale as (
    select 'sale'::text st, s.id::text sid, s.sale_date d, 'Counter sale' || case when coalesce(s.customer_name, 'Walk-in') <> 'Walk-in' then ' · ' || s.customer_name else '' end m, s.branch b, false sticky,
      public.jls(variadic array(
        select public.jl(public.ledger_acct_method(x.p->>'method'), sum((x.p->>'amount')::numeric), 'd') from s_pay x
          where x.id = s.id and coalesce(nullif(left(x.p->>'date', 10), ''), s.sale_date::text) = s.sale_date::text group by public.ledger_acct_method(x.p->>'method')
        union all select public.jl('1100', s.total - coalesce((select sum((x.p->>'amount')::numeric) from s_pay x where x.id = s.id and coalesce(nullif(left(x.p->>'date', 10), ''), s.sale_date::text) = s.sale_date::text), 0), 'd', coalesce(s.customer_name, 'Walk-in'))
        union all select public.jl('4000', s.total, 'c')
        union all select public.jl('5000', c.cost, 'd') from (select coalesce(sum((li->>'qty')::numeric * (li->>'unitCost')::numeric) filter (where coalesce((li->>'totalOnly')::boolean, false) = false and coalesce((li->>'unitCost')::numeric, 0) > 0), 0) cost from jsonb_array_elements(s.line_items) li) c
        union all select public.jl('1200', c.cost, 'c') from (select coalesce(sum((li->>'qty')::numeric * (li->>'unitCost')::numeric) filter (where coalesce((li->>'totalOnly')::boolean, false) = false and coalesce((li->>'unitCost')::numeric, 0) > 0), 0) cost from jsonb_array_elements(s.line_items) li) c
      )) l
    from s),
  sale_later as (
    select 'sale_pay', x.id::text || ':' || x.i, nullif(left(x.p->>'date', 10), '')::date, 'Utang paid', s.branch, false,
      public.jls(public.jl(public.ledger_acct_method(x.p->>'method'), (x.p->>'amount')::numeric, 'd'), public.jl('1100', (x.p->>'amount')::numeric, 'c', coalesce(s.customer_name, 'Walk-in')))
    from s_pay x join s on s.id = x.id where coalesce(nullif(left(x.p->>'date', 10), ''), s.sale_date::text) <> s.sale_date::text),
  -- expenses (approved ones only; removed ones get reversed)
  ex as (
    select 'expense', e.id::text, e.spent_on, e.category || coalesce(' · ' || coalesce(e.staff_name, e.vendor), ''), e.branch, false,
      case when e.category = 'Owner put in cash' then public.jls(public.jl('1000', e.amount, 'd'), public.jl('3000', e.amount, 'c'))
           else public.jls(public.jl(public.ledger_acct_category(e.category), e.amount, 'd', coalesce(e.staff_name, e.vendor)), public.jl(public.ledger_acct_paid_from(e.paid_from), e.amount, 'c')) end
    from expenses e where e.business_id = p_business and e.deleted_at is null and e.status = 'approved'),
  -- orders: sales to customers and bills from suppliers
  po as (select o.*, case when o.supplier_business_id = p_business then 'sell' else 'buy' end side,
           coalesce((o.invoice->>'statedTotal')::numeric, public.nifti_po_total(o)) tot,
           coalesce(public.nifti_iso_date(o.invoice->>'issuedDate'), o.created_date) inv_date,
           coalesce((o.invoice->>'opening')::boolean, false) opening,
           (select name from businesses where id = case when o.supplier_business_id = p_business then o.buyer_business_id else o.supplier_business_id end) party
         from purchase_orders o where p_business in (o.supplier_business_id, o.buyer_business_id) and o.status not in ('draft','cancelled')),
  inv as (
    select case when side = 'sell' then 'po_sale' else 'po_bill' end, po.id::text, po.inv_date,
      case when side = 'sell' then 'Invoice ' else 'Supplier bill ' end || coalesce(po.invoice->>'number', po.po_number) || ' · ' || coalesce(po.party, ''), null::text, false,
      case when po.opening and side = 'sell' then public.jls(public.jl('1100', po.tot, 'd', po.party), public.jl('3900', po.tot, 'c'))
           when po.opening then public.jls(public.jl('3900', po.tot, 'd'), public.jl('2000', po.tot, 'c', po.party))
           when side = 'sell' then public.jls(public.jl('1100', po.tot, 'd', po.party),
                public.jl('4010', po.tot - round(po.tot * coalesce(po.tax_rate, 0) / (1 + coalesce(po.tax_rate, 0)), 2), 'c'),
                public.jl('2100', round(po.tot * coalesce(po.tax_rate, 0) / (1 + coalesce(po.tax_rate, 0)), 2), 'c'))
           else public.jls(public.jl('1200', po.tot - round(po.tot * coalesce(po.tax_rate, 0) / (1 + coalesce(po.tax_rate, 0)), 2), 'd'),
                public.jl('1400', round(po.tot * coalesce(po.tax_rate, 0) / (1 + coalesce(po.tax_rate, 0)), 2), 'd'),
                public.jl('2000', po.tot, 'c', po.party)) end
    from po where po.invoice is not null),
  cogs as (
    select 'po_cogs', po.id::text, po.inv_date, 'Cost of order ' || po.po_number, null::text, true,
      public.jls(public.jl('5000', c.cost, 'd'), public.jl('1200', c.cost, 'c'))
    from po, lateral (select coalesce(sum((li->>'qty')::numeric * coalesce(nullif((li->>'unitCost')::numeric, 0),
          (select i.unit_cost from inventory_items i where i.business_id = p_business and lower(i.name) = lower(li->>'product') and i.unit_cost > 0 limit 1), 0)), 0) cost
        from jsonb_array_elements(coalesce(po.line_items, '[]'::jsonb)) li) c
    where po.side = 'sell' and po.invoice is not null and not po.opening),
  pays as (
    select po.*, p.value p, 'inv:' || coalesce(p.value->>'id', p.ordinality::text) k from po, jsonb_array_elements(coalesce(po.invoice->'payments', '[]'::jsonb)) with ordinality p
    union all
    select po.*, p.value, 'dep:' || coalesce(p.value->>'id', p.ordinality::text) from po, jsonb_array_elements(coalesce(po.deposit_payments, '[]'::jsonb)) with ordinality p
      where not exists (select 1 from jsonb_array_elements(coalesce(po.invoice->'payments', '[]'::jsonb)) q where q->>'id' is not null and q->>'id' = p.value->>'id')
    union all
    select po.*, po.cod_payment, 'cod' from po where jsonb_typeof(po.cod_payment) = 'object'),
  pay as (
    select case when side = 'sell' then 'po_pay' else 'po_bill_pay' end, pays.id::text || ':' || pays.k,
      coalesce(public.nifti_iso_date(pays.p->>'date'), pays.created_date), 'Payment · ' || coalesce(pays.party, '') || ' · ' || pays.po_number, null::text, false,
      case when side = 'sell' then public.jls(public.jl(public.ledger_acct_method(pays.p->>'method'), (pays.p->>'amount')::numeric, 'd'), public.jl('1100', (pays.p->>'amount')::numeric, 'c', pays.party))
           else public.jls(public.jl('2000', (pays.p->>'amount')::numeric, 'd', pays.party),
                  public.jl(case when lower(pays.p->>'method') = 'credit_note' then '1200' when lower(pays.p->>'method') = 'ewt' then '2100' else public.ledger_acct_method(pays.p->>'method') end, (pays.p->>'amount')::numeric, 'c')) end
    from pays
    where coalesce((pays.p->>'amount')::numeric, 0) > 0
      and case when side = 'sell'
        then coalesce(pays.p->>'confirmStatus', 'confirmed') = 'confirmed' and not (pays.p->>'method' = 'check' and coalesce(pays.p->>'checkStatus', '') <> 'cleared')
        else coalesce(pays.p->>'confirmStatus', '') <> 'rejected' end),
  -- stock that left without a sale: bad, missing, used, changed by hand; and the starting stock
  stk as (
    select 'stock', m.id::text, m.moved_on, case m.kind when 'opening' then 'Starting stock' when 'bad' then 'Bad stock' when 'count' then 'Count difference' when 'used' then 'Used in the store' else 'Stock changed by hand' end || ' · ' || m.item_name, null::text, false,
      case m.kind
        when 'opening' then public.jls(public.jl('1200', m.qty * m.unit_cost, 'd'), public.jl('3900', m.qty * m.unit_cost, 'c'))
        when 'used' then public.jls(public.jl('6400', -m.qty * m.unit_cost, 'd'), public.jl('1200', -m.qty * m.unit_cost, 'c'))
        else public.jls(public.jl(case when m.kind = 'adjust' then '5110' else '5100' end, -m.qty * m.unit_cost, 'd'), public.jl('1200', -m.qty * m.unit_cost, 'c')) end
    from stock_moves m where m.business_id = p_business and m.kind in ('opening','bad','count','adjust','used') and coalesce(m.unit_cost, 0) > 0 and m.qty <> 0),
  cc as (
    select 'cash_count', c.id::text, c.count_day, 'Cash count · ' || c.drawer || ' drawer', c.drawer, false,
      case when c.difference < 0 then public.jls(public.jl('6960', -c.difference, 'd'), public.jl('1000', -c.difference, 'c'))
           else public.jls(public.jl('1000', c.difference, 'd'), public.jl('4900', c.difference, 'c')) end
    from cash_counts c where c.business_id = p_business and c.reopened_at is null and abs(c.difference) >= 0.01),
  dep as (
    select 'deposit', d.id::text, d.deposited_on, 'Cash to bank' || coalesce(' · ' || d.bank, ''), d.branch, false,
      public.jls(public.jl('1020', d.amount, 'd'), public.jl('1000', d.amount, 'c'))
    from cash_deposits d where d.business_id = p_business),
  pr as (
    select 'payroll', r.id::text, r.paid_on, 'Payroll ' || to_char(r.period_from, 'Mon DD') || '–' || to_char(r.period_to, 'Mon DD'), r.branch, false,
      public.jls(public.jl('6200', sum(l.gross), 'd'), public.jl('6210', sum(l.contrib_employer), 'd'),
        public.jl('1150', sum(l.vale_deduct), 'c'), public.jl('2300', sum(l.contrib_employee) + sum(l.contrib_employer), 'c'),
        public.jl('2310', sum(l.other_deduct), 'c'), public.jl(public.ledger_acct_paid_from(r.paid_from), sum(l.net), 'c'))
    from payroll_runs r join payroll_lines l on l.run_id = r.id where r.business_id = p_business and r.status = 'paid'
    group by r.id)
  select * from sale union all select * from sale_later union all select * from ex union all select * from inv union all select * from cogs
  union all select * from pay union all select * from stk union all select * from cc union all select * from dep union all select * from pr
$$;
revoke all on function public.ledger_expected(uuid) from public, anon, authenticated;

create or replace function public.ledger_post(p_business uuid, p_kind text, p_type text, p_id text, p_date date, p_memo text, p_branch text, p_lines jsonb, p_hash text, p_reversal_of uuid, p_by text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare eid uuid; dsum numeric; csum numeric; bad text; d date := public.ledger_open_date(p_business, p_date); memo text := p_memo;
begin
  select round(coalesce(sum((l->>'d')::numeric), 0), 2), round(coalesce(sum((l->>'c')::numeric), 0), 2) into dsum, csum from jsonb_array_elements(p_lines) l;
  if dsum <> csum then raise exception 'Unbalanced entry for % %: debits % vs credits %', p_type, p_id, dsum, csum; end if;
  if dsum = 0 then return null; end if;
  select l->>'a' into bad from jsonb_array_elements(p_lines) l where not exists (select 1 from ledger_accounts a where a.business_id = p_business and a.code = l->>'a') limit 1;
  if bad is not null then raise exception 'Unknown account %', bad; end if;
  if d <> p_date then memo := memo || ' (dated ' || to_char(p_date, 'Mon DD, YYYY') || '; that month is closed)'; end if;
  insert into journal_entries(business_id, entry_date, memo, kind, source_type, source_id, source_hash, reversal_of, branch, created_by_name)
    values (p_business, d, left(memo, 300), p_kind, p_type, p_id, p_hash, p_reversal_of, p_branch, p_by) returning id into eid;
  insert into journal_lines(entry_id, business_id, account_code, debit, credit, party, memo)
    select eid, p_business, l->>'a', (l->>'d')::numeric, (l->>'c')::numeric, left(l->>'p', 120), left(l->>'m', 200) from jsonb_array_elements(p_lines) l;
  return eid;
end $$;
revoke all on function public.ledger_post(uuid, text, text, text, date, text, text, jsonb, text, uuid, text) from public, anon, authenticated;

create or replace function public.ledger_reverse_entry(p_entry uuid, p_reason text, p_by text) returns uuid language plpgsql security definer set search_path to 'public' as $$
declare e journal_entries; rid uuid; ls jsonb;
begin
  select * into e from journal_entries where id = p_entry for update;
  if e.id is null or e.status <> 'posted' then return null; end if;
  select jsonb_agg(jsonb_build_object('a', account_code, 'd', credit, 'c', debit, 'p', party)) into ls from journal_lines where entry_id = e.id;
  rid := public.ledger_post(e.business_id, 'reversal', e.source_type, e.source_id, greatest(e.entry_date, public.nifti_today() - 400), 'Reversed: ' || coalesce(e.memo, '') || ' — ' || p_reason, e.branch, ls, null, e.id, p_by);
  update journal_entries set status = 'reversed', reversed_by = rid where id = e.id;
  return rid;
end $$;
revoke all on function public.ledger_reverse_entry(uuid, text, text) from public, anon, authenticated;

-- Bring the books up to date: post what's new, reverse and re-post what changed, reverse what was removed. Safe to run any number of times.
create or replace function public.ledger_sync_business(p_business uuid) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r record; e journal_entries; h text; seen text[] := '{}'; n_new int := 0; n_changed int := 0; n_gone int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('ledger:' || p_business::text));
  perform public.ledger_seed(p_business);
  for r in select * from public.ledger_expected(p_business) x where x.entry_date is not null loop
    seen := seen || (r.source_type || '|' || r.source_id);
    h := md5(r.entry_date::text || '|' || r.lines::text);
    select * into e from journal_entries j where j.business_id = p_business and j.kind = 'auto' and j.status = 'posted' and j.source_type = r.source_type and j.source_id = r.source_id;
    if e.id is null then
      if jsonb_array_length(r.lines) > 0 then perform public.ledger_post(p_business, 'auto', r.source_type, r.source_id, r.entry_date, r.memo, r.branch, r.lines, h, null, 'Nifti'); n_new := n_new + 1; end if;
    elsif e.source_hash <> h and not r.sticky then
      perform public.ledger_reverse_entry(e.id, 'the record was changed', 'Nifti');
      if jsonb_array_length(r.lines) > 0 then perform public.ledger_post(p_business, 'auto', r.source_type, r.source_id, r.entry_date, r.memo, r.branch, r.lines, h, null, 'Nifti'); end if;
      n_changed := n_changed + 1;
    end if;
  end loop;
  for e in select * from journal_entries j where j.business_id = p_business and j.kind = 'auto' and j.status = 'posted' and not ((j.source_type || '|' || j.source_id) = any(seen)) loop
    perform public.ledger_reverse_entry(e.id, 'the record was removed or voided', 'Nifti'); n_gone := n_gone + 1;
  end loop;
  update businesses set books_settings = coalesce(books_settings, '{}'::jsonb) || jsonb_build_object('ledger_synced_at', now()) where id = p_business;
  return jsonb_build_object('posted', n_new, 'changed', n_changed, 'reversed', n_gone, 'at', now());
end $$;
revoke all on function public.ledger_sync_business(uuid) from public, anon, authenticated;
create or replace function public.ledger_sync() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner side can open the books.'; end if;
  return public.ledger_sync_business(me);
end $$;
revoke all on function public.ledger_sync() from public, anon;
grant execute on function public.ledger_sync() to authenticated;
create or replace function public.ledger_sync_all() returns integer language plpgsql security definer set search_path to 'public' as $$
declare b record; n int := 0;
begin
  for b in select id from businesses where not is_outside and banned_at is null loop
    begin perform public.ledger_sync_business(b.id); n := n + 1;
    exception when others then raise warning 'ledger sync failed for %: %', b.id, sqlerrm; end;
  end loop;
  return n;
end $$;
revoke all on function public.ledger_sync_all() from public, anon, authenticated;
select cron.unschedule('nifti-ledger-sync') where exists (select 1 from cron.job where jobname = 'nifti-ledger-sync');
select cron.schedule('nifti-ledger-sync', '40 22 * * *', 'select public.ledger_sync_all()');

-- ---------- manual entries, reversal, month close
create or replace function public.post_manual_journal(p_date date, p_memo text, p_lines jsonb) returns uuid language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); id uuid; who text;
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner side can post journal entries.'; end if;
  if p_date is null or p_date > public.nifti_today() + 31 then raise exception 'Pick a date.'; end if;
  if length(btrim(coalesce(p_memo, ''))) < 3 then raise exception 'Say what this entry is for.'; end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 or jsonb_array_length(p_lines) > 40 then raise exception 'An entry needs 2 to 40 lines.'; end if;
  if public.nifti_month_locked(me, p_date) then raise exception 'That month is closed. Reopen it first, or date the entry in an open month.'; end if;
  if exists (select 1 from jsonb_array_elements(p_lines) l where coalesce((l->>'d')::numeric, 0) < 0 or coalesce((l->>'c')::numeric, 0) < 0 or (coalesce((l->>'d')::numeric, 0) > 0 and coalesce((l->>'c')::numeric, 0) > 0)) then
    raise exception 'Each line is either a debit or a credit, not both.'; end if;
  if exists (select 1 from jsonb_array_elements(p_lines) l join ledger_accounts a on a.business_id = me and a.code = l->>'a' where not a.active) then raise exception 'One of the accounts is switched off.'; end if;
  who := public.nifti_member_name(me);
  id := public.ledger_post(me, 'manual', 'manual', null, p_date, btrim(p_memo), null,
    (select jsonb_agg(jsonb_build_object('a', l->>'a', 'd', round(coalesce((l->>'d')::numeric, 0), 2), 'c', round(coalesce((l->>'c')::numeric, 0), 2), 'p', l->>'p', 'm', l->>'m')) from jsonb_array_elements(p_lines) l), null, null, who);
  insert into audit_log(business_id, action, entity_type, entity_id, field, new_value, actor) values (me, 'journal_posted', 'journal', id::text, 'manual', to_jsonb(left(p_memo, 120)), coalesce(who, 'someone'));
  return id;
end $$;
create or replace function public.reverse_journal(p_id uuid, p_reason text) returns uuid language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); e journal_entries; rid uuid; who text;
begin
  select * into e from journal_entries where id = p_id;
  if e.id is null or e.business_id <> me or not public.nifti_books_viewer(me) then raise exception 'Not found.'; end if;
  if e.kind <> 'manual' then raise exception 'Entries Nifti made from your records change when the record changes. Fix the sale, expense or order instead.'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Say why.'; end if;
  who := public.nifti_member_name(me);
  rid := public.ledger_reverse_entry(p_id, btrim(p_reason), who);
  insert into audit_log(business_id, action, entity_type, entity_id, field, new_value, actor) values (me, 'journal_reversed', 'journal', p_id::text, 'reason', to_jsonb(left(p_reason, 200)), coalesce(who, 'someone'));
  return rid;
end $$;
create or replace function public.lock_period(p_month date, p_note text, p_checklist jsonb) returns void language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); m date := date_trunc('month', p_month)::date; who text;
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner side can close a month.'; end if;
  if m >= date_trunc('month', public.nifti_today())::date then raise exception 'You can only close a month that has ended.'; end if;
  if octet_length(coalesce(p_checklist, '{}')::text) > 8000 then raise exception 'Checklist too long.'; end if;
  perform public.ledger_sync_business(me);
  who := public.nifti_member_name(me);
  insert into accounting_periods(business_id, period, status, locked_at, locked_by_name, note, checklist)
    values (me, m, 'locked', now(), who, nullif(left(btrim(coalesce(p_note, '')), 300), ''), p_checklist)
  on conflict (business_id, period) do update set status = 'locked', locked_at = now(), locked_by_name = who, note = excluded.note, checklist = excluded.checklist;
  insert into audit_log(business_id, action, entity_type, entity_id, field, new_value, actor) values (me, 'period_locked', 'period', m::text, 'status', to_jsonb(coalesce(p_note, '')), coalesce(who, 'someone'));
end $$;
create or replace function public.reopen_period(p_month date, p_reason text) returns void language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); m date := date_trunc('month', p_month)::date; who text;
begin
  if me is null or not exists (select 1 from team_members where business_id = me and auth_user_id = auth.uid() and status = 'active' and roles && array['Owner','General Manager']) then
    raise exception 'Only the owner or general manager can reopen a closed month.'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Say why it needs reopening.'; end if;
  who := public.nifti_member_name(me);
  update accounting_periods set status = 'open', reopened_at = now(), reopened_by_name = who, reopen_reason = left(btrim(p_reason), 300) where business_id = me and period = m and status = 'locked';
  if not found then raise exception 'That month is not closed.'; end if;
  insert into audit_log(business_id, action, entity_type, entity_id, field, new_value, actor) values (me, 'period_reopened', 'period', m::text, 'reason', to_jsonb(left(p_reason, 200)), coalesce(who, 'someone'));
end $$;
revoke all on function public.post_manual_journal(date, text, jsonb), public.reverse_journal(uuid, text), public.lock_period(date, text, jsonb), public.reopen_period(date, text) from public, anon;
grant execute on function public.post_manual_journal(date, text, jsonb), public.reverse_journal(uuid, text), public.lock_period(date, text, jsonb), public.reopen_period(date, text) to authenticated;
create or replace function public.nifti_guard_open_month() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare col text := case tg_table_name when 'expenses' then 'spent_on' when 'downstream_sales' then 'sale_date' else 'count_day' end;
  dnew date; dold date; b uuid;
begin
  b := coalesce(new.business_id, old.business_id);
  dnew := (to_jsonb(new)->>col)::date;
  if tg_op = 'UPDATE' then dold := (to_jsonb(old)->>col)::date; end if;
  if public.nifti_month_locked(b, dnew) or (dold is not null and public.nifti_month_locked(b, dold)) then
    raise exception 'That month is closed. Ask the owner to reopen it first.';
  end if;
  return new;
end $$;
alter function public.ledger_template() set search_path = public;
alter function public.ledger_acct_method(text) set search_path = public;
alter function public.ledger_acct_paid_from(text) set search_path = public;
alter function public.ledger_acct_category(text) set search_path = public;
alter function public.jl(text, numeric, text, text) set search_path = public;
alter function public.jls(jsonb[]) set search_path = public;
alter function public.journal_immutable() set search_path = public;
revoke all on function public.nifti_month_locked(uuid, date), public.ledger_open_date(uuid, date) from public, anon;
grant execute on function public.nifti_month_locked(uuid, date) to authenticated;
select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('ledger_template','jl','jls','journal_immutable') and p.proconfig is not null;
