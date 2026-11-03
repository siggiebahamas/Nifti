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
