# NIFTI — FULL HANDOVER FOR A NEW CLAUDE CHAT
_Last updated 3 Nov 2026. Paste this whole document into the new chat. Everything built so far lives in the GitHub repo and the live Supabase project listed below; this document tells you where each piece is and how it fits together._

---

## 0. Instructions to the new Claude (read first)

1. **You are continuing an existing, working product.** Don't rebuild or redesign anything. Read the repo before changing code.
2. **The code is too big to paste here** (main app file ≈ 3.3 MB). It is all in GitHub:
   - Repo: `siggiebahamas/Nifti` (the git remote still works as `https://github.com/siggiebahamas/SadieCutie`; pushing via the new "Nifti" URL returned 403, so keep the old remote URL).
   - **Working branch: `claude/supabase-mcp-connection-j8plcc`. Never create another branch.** GitHub Pages deploys this branch automatically to **https://siggiebahamas.github.io/Nifti/**.
3. **Backend:** Supabase project id **`ctryvcloavfpecbrbzxy`**. All migrations below are already applied to the live database.
4. If you are in Claude Code with the repo: read `dev/README.md`, then `dev/src/*`. If you are in claude.ai chat: ask the founder to connect GitHub, or to upload the specific files you need.
5. **Commit trailer** used on every commit (no model names anywhere else):
   ```
   Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
   ```
6. The founder has authorized: all Supabase deployments and migrations, and "allow all" permission prompts. Still never drop tables or wipe real data.

---

## 1. Who the founder is and how to talk to them

- **Sigmund Ty** (ty.sigmund@gmail.com), solo founder in the Philippines.
- Background: 5 years strategy at Foodpanda PH (CEO's office, B2B consumer goods end to end), and Shopee Xpress strategy/special projects.
- **Not a developer.**
- Communication rules:
  - Direct, no fluff.
  - Conversational, no jargon.
  - Push back when an idea is wrong.
  - No "Great question!".
  - Under ~300 words unless asked.
  - Don't hedge with "it depends".
  - Bullets over paragraphs.
  - Don't suggest hiring.
  - Don't recommend tools they didn't ask about.
- Product rules the founder set:
  - **No lawyer/legal mentions** in the product.
  - **No Sentry.**
  - **No SMS credits.**
  - **No referral money rewards.**
  - Keep costs minimal.
  - Users are simple Filipino shop and business owners who get intimidated easily, so keep the UI very simple.
  - **Plain-words sections stay in English** even in Filipino mode.

---

## 2. What Nifti is

A Philippine B2B "run your business" app for stores, hardware shops, restaurants, distributors and wholesalers.

**Main features:**
- **Ordering:**
  - orders between businesses, with no-account order links over Viber
  - chat
  - customer POs turned into orders
- **Getting paid:**
  - who owes you, with reminders
  - scan-to-pay (GCash/Maya QR)
  - cheques
- **Stock and delivery:**
  - stock with a full history trail
  - delivery routes
  - returns and credits
- **Selling:**
  - online store
  - price list
  - leads and follow-ups
- **Control and tax:**
  - BIR 2307 tracker and VAT books
  - owner's watchdog
  - team roles
- **Bookkeeping:** sales, expenses, cash count, ledger, reports, payroll, month-end close.

**One-business model.** There is no buyer vs supplier split. Every business can buy and sell.

- `businesses.type = 'both'` for every business.
- In code, `ME_BUYER = ME_SUPPLIER = myBusiness.id`.
- `currentAppRole` is only a "lens" for pages that have two sides (customers vs suppliers). Lens tabs appear on Orders, Customers & suppliers, Who owes you, Price list, Returns and Tax books.

**Language:** an English/Filipino switch for the whole dashboard (EN | FIL, top bar; phone: More sheet).

---

## 3. Architecture

| Piece | Where |
|---|---|
| Whole app (marketing site + app) | `Nifti_Sept17.html`: single-file vanilla JS/CSS, about 3.3 MB |
| Public store page | `store.js` |
| Service worker | `sw.js` |
| PWA icons | `manifest.json` |
| Deploy workflow | `.github/workflows/deploy-pages.yml` (cancel-in-progress true) |
| Keep-alive ping for the free Supabase tier | `.github/workflows/keep-alive.yml` |
| Supabase project | `ctryvcloavfpecbrbzxy`, accessed with supabase-js v2 from the client |
| Demo mode | no login; all data is client-side sample data for "Dela Cruz Hardware" |
| Real accounts | Supabase auth (email/password and Google sign-in, Google switchable) |

**How `Nifti_Sept17.html` is built.** It is generated from a patch system. Sources are saved in **`dev/src/`**:

1. **Start from the old version.** `apply.py` begins with `base.html`. That file is not in `dev/` because of its size. Recreate it with:
   ```
   git show 3bb6f02:Nifti_Sept17.html > dev/src/base.html
   ```
2. **Apply the patches in order:**
   ```
   python3 apply.py u1_data u2_shell u3_demo_stock u4_books u5_polish u6_i18n u7_more u8_plans u9_books2 u10_site u11_pricelock u12_stockrun u13_mhome u14_polish u15_round6 u16_round7 u17_round8 u18_round9 u19_round10 u99_dates
   ```
   `apply.py` writes its output to `/home/user/SadieCutie/Nifti_Sept17.html`. Change that path if the repo lives somewhere else.
3. **How patches work.** `patchlib.P(old, new, count=1)` does exact string replacement and asserts the expected count. JS modules are inserted before `function renderSidebarForViewAsRole(){`. CSS is inserted before the last `  .settings-card:empty{display:none;}`.
4. **Simpler option for small fixes:** edit `Nifti_Sept17.html` directly. The patch system only matters if you want to rebuild from base.
5. **Check after every build:**
   - `python3 dev/tools/check.py big.js` (counts script/div tags and finds duplicate functions)
   - `node --check big.js`

**Patch modules and what they do:**

| File | What it does |
|---|---|
| u1_data.py | Loads both sides of real data (connections, conversations, team, tax profile) for one business |
| u2_shell.py | New sidebar and nav groups, phone bottom bar and More sheet, top-bar EN/FIL switch, "+ Create" menu, one Home, role permissions |
| u3_demo_stock.py | Demo is one business (Dela Cruz Hardware); stock labels on deliveries |
| u4_books.py | Money pages (Money overview, Expenses, Cash count, Profit & prices); includes one.js, books_core.js, books_pages.js, books_more.js |
| u5_polish.py | Wording; sales tracking always on; supplier-delay insight for own deliveries; unified labels; "See who owes you" link |
| u6_i18n.py | Includes i18n.js and the i18n_fil.js dictionary |
| u7_more.py | Audit log labels |
| u8_plans.py | One Pro plan (pricing page and in-app), sign-up asks business kind |
| u9_books2.py | Bookkeeping nav group and pages (To check, Books & reports, Bank & deposits, Payroll, Month-end close); includes books_ledger.js, books_ops.js, ledger.css |
| u10_site.py | Website home tells one story (no "which one are you?" picker) |
| u11_pricelock.py | Price lock, discounts per cashier, receipt after every sale; includes pricelock.js, pricelock.css |
| u12_stockrun.py | "What runs out": real sales rate, reorder line = delivery time + critical days (default 5), inline reorder panel that drafts the PO, peso view; stockrun.js, stockrun.css |
| u13_mhome.py | The approved Mist Home on real data: tiles, What to do, order board, What runs out, cash drawer by person (calendar, tally, who counts, optional protections); mhome.js, mhome.css, mhome_port.css |
| u14_polish.py | Readability pass, one line-icon set replacing emoji icons, Month-end close and Follow-ups layout (polish.js, polish.css).  Embeds the typography engine (themes/type/ink.css, base.css) and the Current theme (t00-current.css): the Home type style on every page, one size up, with `<html data-ty="current">` |
| u15_round6.py | One standard red / yellow / green palette (status.css, generated by dev/tools/gen_status.py; run it after a build, then build again). Summary tiles on every page coloured good / bad / iffy / plain (r6.js), numbers shrink to fit, no black fills (selected = green tint), Orders and Messages redesign (r6_orders.css, r6_messages.css), friendly promised dates, −₱ for negatives, phone fixes |
| u16_round7.py | Curated demo (r7_demo.js): 7 customer orders, 7 supplier orders, 7 chats, 6 suppliers, 7 stock items, one sample per situation; nothing empty (payroll, who has the cash, deposits, team tasks/chat/activity, a route, credits, a bad order, price changes, checks in every state); seeds can no longer pile up on refresh (new demo storage keys). More tools in plain words (r7_tools.js): Check payments and Reports rebuilt (health check removed), 3 numbered steps on every tool, tabs under titles. Pictures (r7_avatar.js): upload a photo or pick an icon (kept on the device), team faces, customers blue / suppliers purple. r7.css |
| u17_round8.py | Both sides on one page (r8.js): Orders, Customers & suppliers, Money owed, Check payments, Returns, Tax books, BIR 2307s and Price list show selling and buying together (tapping a half sets the app's side). One-screen order sheet: stage tracker, the next step with its form already open, everything else under More options; short dropdowns become tap buttons. Take a photo on the spot with an 'Upload this photo?' step on every photo upload. Sample photos (r8_photos.js) + initials bubbles. Statuses name the party, no symbols. Tables centered. Removed: Month-end close from the menu, bank statement matcher, Red flags and 'How sure' cards, Price check/Rules/Reminder rules/Scan, the profile pop-up; accountant tabs behind a switch. Online store rebuilt as one page (r8b.js). r8.css |
| u18_round9.py | Order proof photos in Supabase (r9_photos.js): private bucket order-photos + table order_photos (both parties of the order and their teams can read; insert only; no update/delete), via can_see_po(); profile pictures in public bucket avatars + table profile_photos (business/member photos visible to signed-in users; contact photos private to the owner). Demo keeps photos on the device. Phone-first layer (r9_mobile.js/.css, active under 760px via html.nf-phone): grouped scrollable More sheet with every feature, full-screen chat that follows the keyboard, Home board as stage tabs + cards, What to do as three tabs, tables as cards, full-screen order sheet above the bottom bar with a one-line progress, no zoom (16px fields), 44px tap targets |
| u19_round10.py | Remove a proof photo (r10.js): RPC remove_order_photo marks order_photos.deleted_at/deleted_by_name (only the uploader's business), file deleted from storage, both sides see 'photo removed by …'. Phone: smaller type scale under 760px; cash drawer rebuilt for phones (nfDrawerPhone: who counts, per-person net, 7-column calendar with amounts, two buttons); every Home sheet (day tally, who counts, protections) scrolls as one, sticky header, swipeable day strip, 2-up tiles; What runs out compact key and rows; Stock item cards; 3-value rows; swipeable tabs; one camera + one upload button (r10b.js); r10.css, r10b.css |
| u99_dates.py | Replaces every `.toISOString().slice(0,10)` with `.niftiDay()` (local-time day). Fixes off-by-one dates in UTC+8. |

**JS modules:**

| File | Prefix | What it does |
|---|---|---|
| `one.js` | — | One-business lens infrastructure, merged messages, one Home (`renderOneHome`) |
| `books_core.js` | — | Categories, state `BK`, demo seed, loaders, stock helpers (`stockLabel`, `stockOut`, `stockIn`), cash-count expected math, P&L, flags |
| `books_pages.js` | `qs*` / `ex*` / `cc*` | Sales (quick sale), Expenses, Cash count, Profit & prices, Money overview, stock check sheets |
| `books_more.js` | — | Offline queue (`bkQueue*`, `bkFlushQueue`), receipts, menu items with recipes, cash in/out, vale summary |
| `books_ledger.js` | `lg*` | Ledger engine and Books & reports page: demo posting rules mirror the server's; reports, drill-through, manual journal, exports, cash forecast |
| `books_ops.js` | — | Branches, expense approvals, To check (`issueRules`), Month-end close (`cls*`), Payroll (`pr*`), ledger-backed `bkPnl` override, bank money-out matching |
| `i18n.js` | — | DOM translator plus MutationObserver. The dictionary `I18N_FIL` is in `i18n_fil.js` (≈2,600 entries). Translation batches are in `dev/i18n/b01..b16.json`. |

**Tests** (Playwright scripts, in `dev/tests/`; they need `npm install` for `@supabase/supabase-js` and `qrcode-generator`, and use the system Chromium):

| Script | Covers |
|---|---|
| smoke.js | Every page, no errors |
| day1test.js | 102 checks |
| more.js | Books extras |
| ledger.js | Reports, issues, payroll, close, branches, bank |
| filcheck.js | Filipino coverage |
| crawl.js | Clicks every button |
| pricing.js | Pricing page and sign-up |

---

## 4. Database (Supabase) — everything that exists

Full live dumps are committed in **`dev/sql/live/`**:
- `functions.sql`: all 257 functions, full source
- `tables.txt`: every table and column
- `policies.txt`: row-level security
- `triggers.txt`
- `cron.txt`

Migration files are in **`supabase_migrations/`**:
- `2026-10-29-one-business-and-books.sql`
- `2026-10-29-owner-alerts-books-summary-menu.sql`
- `2026-10-29-ledger-close-payroll.sql`
- `2026-11-03-price-lock-discounts-receipts.sql` (price lock, approvals, discounts on the morning message; applied live 3 Nov 2026, test: `dev/sql/test_pricelock.sql`)

The original schema is in `supabase_schema.sql` and `supabase_schema_part2.sql`.

**Key tables:**

- **Core:**
  - `businesses`: `type='both'`; `books_settings` jsonb holds cash_alert, change_fund, approve_over, dual_approval, branches[], receipt_over, ledger_synced_at
  - `team_members`: roles text[] including Owner, General Manager, Finance, Purchasing Agent, Warehouse Manager, Cashier, Driver
  - `purchase_orders`: one row per order, shared by buyer and seller; invoice jsonb with payments[]; deposit_payments; cod_payment
  - `conversations`, `inventory_items` (unit_cost, sell_price, meta.last_move), `notification_outbox`, `push_subscriptions`, `audit_log`, `bank_matches`, `cash_deposits`
- **Books:**
  - `downstream_sales`: counter sales; branch; voided_at
  - `expenses`: status submitted/approved/needs_correction; branch; receipts in the storage bucket `receipts/{business_id}/...`
  - `cash_counts`: blind for staff
  - `stock_moves`: written only by the inventory trigger
  - `menu_items`: recipes
- **Ledger:**
  - `ledger_accounts`: chart of accounts; template from `ledger_template()`
  - `journal_entries`, `journal_lines`: immutable; changes are reversals
  - `accounting_periods`: closed months
  - `issue_decisions`, `payroll_runs`, `payroll_lines`, `books_summary_log`

**Who can see what.** "Books viewers" are Owner, General Manager and Finance (`nifti_books_viewer(biz)`).
- Only viewers see the ledger, payroll, cash-count differences, issue decisions and money notifications.
- Staff record sales, expenses and counts but never see totals.

**Key server functions:**

| Function | What it does |
|---|---|
| `ledger_expected(biz)` | All posting rules: sales, utang payments, expenses, invoices, COGS, payments, supplier bills, stock losses, cash counts, deposits, payroll |
| `ledger_sync_business(biz)` | Idempotent sync: posts new entries, reverses and reposts changed ones, reverses removed ones. Changes to a closed month post to the next open month. |
| `ledger_sync()` | Version callable by viewers |
| `ledger_sync_all()` | Nightly cron |
| `post_manual_journal`, `reverse_journal` | Typed-in entries and their reversal |
| `lock_period`, `reopen_period` | Month close; reopening is Owner/GM only, with a reason |
| `nifti_guard_open_month` trigger | Blocks changes in closed months |
| `review_expense(id, ok, note)` | Approve or send back |
| `expenses_stamp` trigger | Approval threshold and audit |
| `save_cash_count`, `reopen_cash_count`, `review_cash_count`, `my_cash_count_days` | Cash count |
| `nifti_notify(...)` | Writes `notification_outbox`; push-dispatch edge function delivers it. Supports only_member and exclude_member. |
| `nifti_notify_books` | Sends to Owner/GM/Finance only |
| `send_books_summaries()` | 7:05am owner message about yesterday |
| `send_daily_summaries`, `send_weekly_recaps` | Weekly recap goes to viewers only |
| `my_weekly_recap` | Strips books data for staff |
| Plans: `plan_features`, `my_plan`, `request_upgrade`, `admin_set_plan` | Plan ids: free, pro (legacy supplier_pro/buyer_pro map to pro), business |

**Edge functions** (source in `dev/edge_functions/*.index.ts`):

| Function | Notes |
|---|---|
| `push-dispatch` | verify_jwt off; secured by a dispatch secret. Sends web push and email (Resend or Gmail SMTP from app_secrets). Strict only_member. One email per alert. |
| `push-subscribe` | — |
| `auth-email` | — |
| `backup-export` | — |
| `growth-api` | — |
| `po-read` | Old; source could not be extracted; not used |

**Cron (UTC):**

| Job | When |
|---|---|
| nifti-ledger-sync | 22:40 |
| nifti-books-summary | 23:05 |
| nifti-daily-summary | 23:00 |
| cheque reminders | 22:40 |
| payment reminders | 01:00 |
| quote nudges | 01:05 |
| reorder nudges | 01:30 |
| growth nudges | 02:00 |
| price changes | 16:05 |
| price reminders | 23:10 |
| push retry | every 2 minutes |
| weekly backup | Saturday 18:00 |
| weekly recap | Monday 00:12 |

**Secrets** live in the `app_secrets` table (vapid keys, dispatch_secret, resend/smtp, app_url, billing_instructions). Never print them.

**Live data:** as of 29 Oct there were no real customer orders in the database (pre-launch).

---

## 5. What was built in this thread (chronological, all deployed)

1. **Earlier work:**
   - marketing site rebuild; Free/Pro/Business pricing with extras
   - admin console and growth desk
   - cheques, routes, price changes
   - customer PO import, leads and follow-ups, collections
   - online store, BIR 2307
   - data download and account delete
   - deploy fix (a stuck deploy was blocking all others)
2. **Day one:**
   - opening balances (what customers already owe)
   - guided first order
   - scan to pay (GCash/Maya QR)
   - weekly "what Nifti did for you" recap
   - Google sign-in
3. **One dashboard:** buyer/supplier merged into one business. Unified sidebar, one Home, one message list, one Pro plan; sign-up asks business kind.
4. **Bookkeeping v1:**
   - owner home with 5 red flags (cash, stock, prices below cost, unusual expenses, overdue money)
   - counter sales (cash/GCash/utang, change/sukli) that take stock out
   - expenses with receipt photo and OCR amount reading
   - blind daily cash count with owner-only alerts
   - stock trail (who and why)
   - profit and prices
   - receipts (print / send by Viber)
   - menu items with recipes (ingredients come out of stock)
   - cash in/out (Owner put in cash, Owner took money, Cash to bank)
   - staff vale totals
   - offline saving of sales and expenses
5. **English/Filipino switch** for the whole dashboard.
6. **Security:** money alerts, weekly recap and the morning books message go only to Owner/GM/Finance. Staff can't read money notifications.
7. **Handover document** (the founder's .docx "Bookkeeping, Financial Controls & Business Intelligence") implemented as Phases 1–3. The detailed status is in `BOOKKEEPING_HANDOVER.md` in the repo.
   - **Real double-entry ledger** posted from existing records. Reports: Summary ("what changed" insight cards plus a data-confidence panel), P&L, Balance sheet, Cash flow, Trial balance, Ledger with drill-through, Journal, Accounts. CSV exports. 7/30/60/90-day cash outlook.
   - **To check:** explainable issue cards (what / why / evidence / next step) with Assign, Waiting, Fixed and "It's fine", plus history.
   - **Controls:** expense approvals (default ₱2,000, optional two-person approval); month-end close checklist and server-enforced lock.
   - **Payroll:** per day or month, vale and contributions deducted, payslips.
   - **Branches:** own drawer and stock location each; "This phone is at…" picker.
   - **Offline cash count.**
   - **Bank statements:** matching now covers money out too.
   - **Website home:** one story.
   - **Date bug:** dates were a day early in Philippine time; fixed app-wide.

**Deferred on purpose:**
- live bank/GCash connections
- BIR filing
- AI automation
- FIFO/weighted-average costing and landed cost
- budgets vs actual
- full three-way matching
- PDF exports (print only)

---

## 6. Open questions and next steps

1. **Pricing.** The founder's document says Free / ₱999 / ₱1,999 / ₱2,999. The app shows Free / Pro ₱990 / Business ₱2,990.
   - Claude recommended Starter ₱299 / Pro ₱999 / Plus ₱1,999 / Advanced ₱2,999.
   - **Not changed yet. Ask the founder.**
2. **Other revenue ideas given** (founder hasn't decided):
   - per-branch add-on (~₱490/month)
   - payroll add-on (~₱50/employee/month)
   - accountant partner plan (pay per client)
   - done-for-you setup and catch-up (setup at ₱3,500 already exists)
   - later: lender referral fees and payment-gateway fees
3. **Anti-theft (last question asked).** Current protection is detection after the fact, not prevention:
   - discounts and below-cost sales are flagged by cashier name
   - blind cash count with owner-only alerts
   - stock counts expose sales that were never recorded
   - only the owner can void a sale
   - expense approvals
   - stock changes record who and why

   **Built 3 Nov 2026** (`u11_pricelock.py`, `pricelock.js`, migration `2026-11-03-price-lock-discounts-receipts.sql`):
   1. Price lock (default on, staff may give up to 5% off; owner changes it on Sales → Price lock & receipts). Below that, staff tap "Ask the owner"; the owner gets a push and a popup (polls `price_approvals` every 20s while the app is open) to OK or say no. Enforced on the server in `downstream_sales_stamp`; one OK covers one sale, 12 hours. No list price → can't go under cost. "Just the total" is hidden for staff while the lock is on. Staff can't change the lock settings or lower prices (`guard_price_lock_settings`, `guard_price_lock_items`).
   2. Discounts per cashier on the 7:05am message (`books_discounts_for`, top 3) and on the Sales page for owners. Each sale line now stores `listPrice`.
   3. Receipt opens after every sale (setting `receipt_auto`), showing the regular price and the discount given.
4. **Untested:** the real-account (logged-in) browser path for the new books pages. It is tested at the database level only, because the test environment couldn't reach Supabase. Do one real sale, expense, cash count and payroll on a real account.

---

## 7. How to verify things quickly

- **Live site:** https://siggiebahamas.github.io/Nifti/ → "Try a Demo" for sample data.
- **Click test:** see the "10-minute test" at the bottom of `BOOKKEEPING_HANDOVER.md`.
- **Database tests (rollback-only):** `dev/sql/test_part4.sql`, `test_part3.sql`, `test_books.sql`. Run them with the Supabase SQL editor or the MCP `execute_sql`. Each ends by raising `ROLLBACK` with a log, so nothing is kept.
