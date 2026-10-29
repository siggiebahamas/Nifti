# Nifti bookkeeping: handover report (29 Oct 2026)

Built on the existing app (`Nifti_Sept17.html`, Supabase project `ctryvcloavfpecbrbzxy`), branch `claude/supabase-mcp-connection-j8plcc`. Nothing existing was removed. No bank, GCash, BIR or payment integration is claimed: bank data comes only from statements you upload, and tax figures are preparation aids, not filings.

## What changed (screens)

| Screen (menu) | What it does |
|---|---|
| Bookkeeping › To check | Rule-based checks, each with: what happened, why it matters, evidence links, next step. Assign / Waiting / Fixed / It's fine, with history. |
| Bookkeeping › Books & reports | Summary (health tiles, "what changed", data confidence), Profit & loss, Balance sheet, Cash flow + 7/30/60/90-day cash outlook, Trial balance, Ledger (drill to source record), Journal (typed-in entries, reversals), Accounts (rename, add). CSV export with filters, row count and totals. |
| Bookkeeping › Bank & deposits | Existing statement matching, now also matches money out (expenses, supplier payments, payroll). Unknown withdrawals: "Record as expense" or "Not ours". |
| Bookkeeping › Payroll | Per-day or per-month pay, overtime, vale taken back, SSS/PhilHealth/Pag-IBIG typed in (not computed), payslips. Paid payroll can't be edited. |
| Bookkeeping › Month-end close | Checklist (cash counted, expenses approved, deliveries billed, statement matched, stock counted, payroll, issues, P&L reviewed), then lock. Reopen needs owner/GM + reason. |
| Expenses | Staff expenses at or above ₱2,000 (setting) wait for the owner's OK; Approve / Send back with a note; optional two-person approval. |
| Cash count | Per-branch drawer; branch setup; counts save offline and upload later. |
| Money overview | Profit now comes from the ledger (same numbers as Books & reports), plus the cash outlook. |
| Website home | One story (selling, books, buying), no "which one are you?" picker. |

## Phase status

**Phase 1 (foundation)**

| Item | Status |
|---|---|
| Ledger, chart of accounts, posting from operational records | **Implemented** |
| Audit trail for posting, reversals, approvals, close and reopen | **Implemented** |
| Reports with drill-through | **Implemented** |
| Exports | **Implemented** (CSV) |
| Explicit expense states | **Partial**: Submitted / Approved / Needs correction. No separate Draft state. |
| Splitting one transaction across accounts | **Partial**: only through typed-in journal entries |
| PDF reports | **Partial**: browser print only |

**Phase 2 (reconciliation and controls)**

| Item | Status |
|---|---|
| Statement import and matching, both directions | **Implemented** |
| Approvals and discrepancy queue | **Implemented** |
| Month-end close and lock | **Implemented** |
| AR/AP aging | **Existing** ("Who owes you" / "Bills you owe") |
| Cash forecast with stated assumptions | **Implemented** |
| Accountant access | **Partial**: invite them with the Finance role. The old view-only link is unchanged. |

**Phase 3 (distributor accounting)**

| Item | Status |
|---|---|
| Inventory value and COGS through the ledger | **Implemented**: COGS at the recorded unit cost; stock losses posted |
| Profit by item and by branch | **Implemented** |
| Supplier price increases | **Implemented** |
| Three-way PO / receipt / bill matching | **Partial**: "delivered, no bill" and "delivered, not billed" checks only |
| FIFO / weighted-average valuation, landed cost | **Deferred** |
| Budgets vs actual | **Deferred** |
| Customer profitability after delivery costs | **Deferred** |

**Phase 4:** not started, as the document instructs. That covers AI investigation, automatic filing, live bank feeds, and autonomous postings.

## Database (already applied to the live project)

Migration files in `supabase_migrations/`:

- `2026-10-29-owner-alerts-books-summary-menu.sql`
- `2026-10-29-ledger-close-payroll.sql`

New tables:

| Table | Purpose |
|---|---|
| `ledger_accounts` | Chart of accounts |
| `journal_entries` | Entry headers; posted entries are never edited or deleted |
| `journal_lines` | Debit/credit lines; never edited or deleted |
| `accounting_periods` | Closed months |
| `issue_decisions` | What the owner decided on each flagged item |
| `payroll_runs` | Payroll periods |
| `payroll_lines` | One line per person per payroll |
| `menu_items` | Menu items and their recipes |
| `books_summary_log` | One morning books message per day |

New columns:

| Column(s) | Purpose |
|---|---|
| `expenses.status`, `approved_by_name`, `approved_at`, `review_note` | Approval workflow |
| `expenses.branch`, `downstream_sales.branch`, `cash_deposits.branch` | Branches |

Posting rules live in `ledger_expected()`. `ledger_sync()` makes the ledger match the source records:

- It is idempotent: running it twice posts nothing new.
- When a record changes, it posts a reversal and then the new entry.
- A change to a closed month is posted on the first open day after it.

When it runs:

- every night at 6:40am Manila time;
- whenever an owner, general manager or finance person opens the books.

Closed months are enforced by database triggers on sales, expenses, cash counts and payroll.

No manual steps are needed.

## Tests run

- **Database, rollback-only:**
  - every balance matched a hand calculation;
  - debits equal credits;
  - running the sync again posts nothing;
  - edits and voids are reversed;
  - unbalanced entries and deletes are refused;
  - staff can't read the ledger or run the sync;
  - big staff expenses wait for approval, and staff can't approve their own;
  - closed months are blocked, and late changes move to the next open month;
  - paid payroll is locked;
  - money alerts reach only the owner side.
- **Browser (demo, desktop and phone, Manila time zone):**
  - every report tab;
  - trial balance and balance sheet balanced;
  - typed-in entries (an unbalanced one is refused);
  - issue decisions, approvals, payroll, month close and lock, branch drawers;
  - bank money-out matching;
  - offline sale with later upload;
  - smoke test of every page;
  - 102 day-one checks;
  - a crawl clicking every button on the new pages.
- **Results:** no JavaScript errors, no failures.

## Known limits and risks

- The real-account screens read from the live database. That path was tested at the database level, not end to end in a browser, because this test environment can't reach Supabase.
- Money and costs:
  - Profit is only as good as item costs. Sales of items with no cost count ₱0 cost, and the app says so.
  - Stock received without a supplier bill makes the books' stock value differ from the shelf; "To check" flags it.
  - Tax is computed only from the VAT rate on orders.
- The demo uses sample data, labelled "Sample data", with sample opening balances.
- Filipino covers the new screens except some text built from lists (names and dates).

## Nothing you need to set up

No new keys or accounts. Push notifications need each person to allow notifications on their phone.

## 10-minute test (no accounting needed)

1. Open the app and tap **Try a Demo**.
2. **Expenses:** under "Waiting for your OK", approve Rico's repair.
3. **Books & reports:**
   - Check the profit tiles.
   - Open **Profit & loss** and tap **Rent**. You see the rent entries. Tap one, then **Open the expense**.
   - Open **Balance sheet**. It should say "✓ Balanced".
4. **To check:** open a card, tap **It's fine**, and enter a reason. It moves to Closed, with history.
5. **Payroll:**
   - Tap **New payroll** and enter a rate and days for one person.
   - Tap **Pay now**, then type `cash`.
   - Open it again and tap **Payslip**.
6. **Month-end close:**
   - Tap **Mark done** on each item, then **Close July**.
   - Try adding an expense dated in July. It is refused.
7. **Cash count › Branches:**
   - Add "Taytay", then pick it at the top. The drawer amount changes to that branch's own.
