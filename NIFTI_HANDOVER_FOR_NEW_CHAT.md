# NIFTI — FULL HANDOVER FOR A NEW CLAUDE CHAT
_Last updated 24 Nov 2026 (read section 10 first, then 9 and 8, for the latest state). Paste this whole document into the new chat. Everything built so far lives in the GitHub repo and the live Supabase project listed below; this document tells you where each piece is and how it fits together._

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

**Standing rule (founder, Round 43):** any page that shows both selling to customers and buying from suppliers keeps them in two separate columns (customers left, suppliers right; stacked on phones). Never merge them into one list.

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
   python3 apply.py u1_data u2_shell u3_demo_stock u4_books u5_polish u6_i18n u7_more u8_plans u9_books2 u10_site u11_pricelock u12_stockrun u13_mhome u14_polish u15_round6 u16_round7 u17_round8 u18_round9 u19_round10 u20_round11 u21_round12 u22_round13 u23_round14 u24_round15 u25_round16 u26_round17 u27_round18 u28_round19 u29_round20 u30_round21 u31_round22 u32_round23 u33_round24 u34_round25 u35_round26 u36_round27 u37_round29 u38_round31 u39_round32 u40_round33 u42_round35 u43_round36 u44_round37 u45_round38 u46_round39 u47_round40 u48_round41 u49_round42 u50_round43 u51_round44 u52_round45 u53_round46 u54_round47 u55_round48 u56_round49 u57_round50 u58_round51 u59_round52 u60_round53 u61_round54 u62_cro u97_black_text u98_demo_dates u99_dates u99z_scale
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
| u20_round11.py | Round 11 (r11.js, r11.css): every table header and cell centered (desktop and phone cards). Cash count takes one typed total (no bill-by-bill), change fund and short alert are one line on the page; branches and drawers moved to Settings > Your business. To check colours by kind (red money at risk, yellow paperwork missing, blue double-check, gray not done yet) with a legend. Check payments grouped by what happens next, one button per check. Returns & credits: tiles, give-credit form, credits table, bad orders table (no chart), credits split by side. Delivery routes: one status circle per stop, collection chips, no Stops dropdown, planner in 3 steps, My run with every stop open plus earlier runs, past runs in full. Tax books tile type scale. BIR 2307: summary, progress, 3-step explainer, one table with one action per row. Reports folded into Home ('How the business is doing': sales columns, average line, profit/loss bars, demo loss month from a ₱42,000 truck repair; BK_DEMO_KEY v4, LG_DEMO_KEY v3); Reports menu item removed, go('analytics') opens Home. Find customers (filters by type and area, matched items, send price list, save as lead, real buyers via request_connection) + suppliers view with price lists open. Sidebar: Find customers & suppliers under Sell more; More tools never folds. Home lists and order board show every item. |
| u21_round12.py | Round 12 (r12.js, r12.css): Order # and Promised columns visually centred (sort arrows no longer offset headers; late clock hangs left of the number); initials avatars always round (chat list and thread head); stock: '+N inbound' removed from the bar cell, a low item with an order on the way shows a blue 'N on the way' pill with the arrival date in Status and 'See the order' as its action (nfInboundInfo); Money overview profit card in accounting format (red cost and expenses, grouped expense lines with a guide line, single rule for gross profit, double rule and green profit); cash outlook lists the next 5 money in/out only. Design lab: design-lab/order-flow/ shows 5 order popup concepts (Focus, Journey, Chat, Checklist, Deck) for all 6 stages, selling and buying, desktop and phone, side-by-side compare. |
| u22_round13.py | Round 13 (r13.js, r13.css): the order popup is now the Focus sheet (nffRender/nffSpec): one next step per order for both sides, 6 steps, tiles/chips, a locked button that names what is missing (nffMissing/nffNeedText), take OR attach a photo, a calm "their turn" hand-off card instead of a spinner. Every action fills and submits the app's own legacy forms (nffEngine: shipForm_, supplierDcForm_, deliveryConfirmForm_, markPaidForm_), so saving is unchanged; sub-forms open inline (nffInline); More shows photos + the legacy detail. Calmer pictures: no rings, no coloured chat bars, no purple (nfIniColor palette). Price lock & receipts box removed from Sales and no receipt pops up after each sale (staff still can't go under the owner's price list). Design lab: design-lab/r13/ (waiting x5, chats x5, new-order x3, partners x3, money x3 looks x22 pages). |
| u23_round14.py | Round 14 (r14_read.js, r14.js, r14.css): a careful order reader (nfwParse/nfwMatch: Taglish, commas, x100, number words, printed PO lines; sizes must match exactly; unsure lines are asked, never guessed; tests in scratchpad r14/readtest.js). The new-order popup is a 4-step wizard (nfwOpen; replaces openCustomerPoImport and openPasteOrderModal): Who, How, Their/Your order, Check. Methods kept: paste, type it in (with their photo for reference), Excel/CSV/text-PDF file, your order form (sell), the usual. Photo OCR and voice removed from the flow. Selling saves via record_customer_order (live) like before; buying via createDraftPOObject. Waiting on a supplier: To confirm = read receipts (Seen is logged in history when the supplier opens a sent order), Preparing = usual time with day strip. Messages list: Customers / Suppliers groups, unread first, order chip per chat (nfwConvOrder). Design lab: design-lab/r14/ (orders x3, horizon x5 palettes). |
| u24_round15.py | Round 15 (r15.js, r15.css): Customers & suppliers header as a grid so the invite button sits on the title line (phone shows "+ Invite"); Home chart (nfTrendSvg) gets "Sales" and "Profit / Loss" labels on the left (above each chart on phone). Design lab r15/: Orders theme 2 with date timeline, Money overview in 5 quiet backgrounds. |
| u25_round16.py | Round 16 (r16.js, r16.css): Orders page rebuilt as "by customer & supplier with dates" (#nfOrd, nfoRow/nfoRender; bands Needs you now / Coming up / Waiting on them (light blue) / All good; date tile per order in the picture column; plain white initials; people with no open orders + invites at the bottom; old tables behind "See every order in a table"); Customers & suppliers page removed (nav hidden, navigate('suppliers') and jumpToParty open Orders); Home board legend words removed and step counts as "To confirm – 6"; What runs out key trimmed to 4 names and "Days left" blue labels on the scale; Claude-like colours (sidebar #FAFAFA, white pages, #E5E5E5 lines). |
| u26_round17.py | Round 17 (r17.js, r17.css): shorter lists everywhere. Home Act Today shows 3, This Week 5, Fine 3 (mhLane cap; lanes no longer forced open), duplicate "Overdue money" flag skipped when a late-payment item exists; What runs out shows 4; Money "Next money in and out" 4 rows. Generic DOM cap (NF_CAPS + MutationObserver, nfCapRun) on Stock table, Profit & prices, Cash count history, Expenses (keeps day headers), To check cards (4 each) and Find customers (3), with a "Show all N …" / "Show fewer" button. Orders bands show 4 partners each (nfoCapGroups, "Show N more"; all shown when a band is picked or searching); stat boxes put count and peso total on one line (.ln; phone = one row per colour). Blue date tiles darker (#0B2A6B). Home board: no step numbers (desktop .sn removed, phone em hidden), bigger counts. Money overview profit statement restyled to match Money in and out (white, 22px title). Design lab r17: messages.html (3 ways to message with the order in view), review.html (15 parts × 3 options with copy-back). |
| u27_round18.py | Round 18 (r18.js, r18.css): smaller demo at the source (NF_DEMO_KEEP: 8 orders, 3 suppliers, 6 chats, 5 products; nf18DemoTrim/Books/Money/Tools wrap the Round 7 demo steps; demo-only caps off). Five main pages (NF18_HUBS: Home, Orders, Messages, Stock, Money) with a tab row on each page (nf18PaintHub) and sub rows for Getting paid and Books (NF18_SUB); old pages redirect (NF18_REDIRECT). Merges by moving DOM: Counter = Sales + #bkCashBody + cash drawer calendar (#mhDrawer inside .nf18-mh), Prices = Profit & prices + #pricesContent, To check + #watchdogContent, Money + #nfHomeReport; every #mhHome CSS rule also matches .nf18-mh (u27 widens style blocks). Home: 4 tiles (nf18Tiles), demo lanes 3/4/2 (nf18Lanes), no drawer/report. Board counts baseline + #2563EB; solid Customer/Supplier tags with arrows. Stock 4 tiles + warehouse select, Settings search, helper steps fold after first visit, PRO badges only in Settings, Team chat inside Messages (nf18OpenTeam). Messages: nf18MsgFor(poId) opens the chat with "why you're here", 3 ready messages EN/FIL per order situation (nf18Tpl) with Send, the order panel on the right (#nf18Op; phone card #nf18Card), done state with Back to Orders + next. Lab r18/both.html: 3 one-page customers+suppliers designs. |
| u28_round19.py | Round 19 (r19.js, r19.css + fixes in r18.js/r18.css): tab rows no longer redraw forever (nf18PaintHub compares a stored key, not innerHTML; same for the message panels and Stock tiles) so every tab click lands. Left menu = 10 lines (NF19_SIDE: Home, Orders, Messages, Stock, then a Money heading with Money overview, Counter, Expenses, Getting paid, Prices, Books); other pages light up their parent line (NF19_PARENT). Landing page on a fresh visit: the Round 7 boot hook only opens the app when sessionStorage "nifti-in-app" is set (set by any app navigate, cleared by marketing pages and logOut); nf19AfterBoot runs after bootNifti; #page links still open that page. Customers | suppliers side by side at 1100px+ on pages whose content holds two .nf-half blocks (tables inside become row cards). Restored: Follow-ups as an Orders tab, Books "What changed" tab, all Team spending tabs, Team Activity, every check state, a Stock info line; demo keeps 5 products (bkSeedDemo re-trim). Lab r19: tabs.html (3 top-tab styles), orders2.html (Orders in two columns), tools.html (own tab vs inside each order). |
| u29_round20.py | Round 20 (r20.js, r20.css): sign-in error in plain words (nf20SignInError); owner's left menu shows all 21 pages in foldable groups (nf20Menu replaces nf19Menu, Money has all 8); Who sees what panel (nf20OpenWho: per-role page switches saved to localStorage key nifti-role-pages-<biz>, custom roles in custom_roles, preview banner nf20Banner); phone Menu button in the bottom bar; tab rows drawn as a coloured band (nf20HubHtml replaces nf18HubHtml, role-filtered, colour vars --nf20-band-*); Orders in two columns (nf20OrdersRender/nf20OrdersPaint replace nfoRender/nfoPaint; keeps R17 .ln stat tiles and nfoCapGroups); both-sides pages get tinted sides and clean label/value cards (#view-app#view-app#view-app beats the id-heavy centering rules); Orders badge = Needs you now; landing page rebuilt at runtime (nf20Landing: How it works + one 'See it in action' showcase, no Free/Pro badges, #mkPick and #mkFree removed). |
| u30_round21.py | Round 21 (r21.js, r21.css): tab band is slate (--nf20-band-* vars); Orders bands list only their own orders (nf21Col replaces nf20Col) and the table view is hidden; Returns & credits rewritten (nf21ReturnsPage): credits come off the next bill automatically (issueInvoice wrapper -> nf21AutoTake), one-tap 'Take X off INV' on open bills (nf21Use/nf21Take post a credit_note payment so bills, statements and both ledgers update), 'Add a credit a supplier gave you' with photo of the slip (_manual memos; real accounts keep them in localStorage nifti-supplier-credits-<biz>, prototype); big centered 'Try the demo shop' button on login; Alerts on your phone panel (nf21OpenAlerts: Telegram 4-step guide, team folders, 10 alert switches saved in nifti-alerts-on, practice chats, Viber tab; prototype until the bot exists); build-time American spelling pass (canceled, color, center, check in visible text only). |
| u31_round22.py | Round 22 (r22.js, r22_store.js, r22_nb.js, r22.css): selling side lighter blue and buying side emerald (--nf20-c*/--nf20-s* vars, --side-ink/--side-soft); menu foot #nf22Foot pins Alerts + Who sees what; Alerts card on Home, bell row, Settings card, setup step; books and ledger load at boot so every page shows one profit (demo fix: duplicate Aug salaries removed, rent 12,000, months before Aug from NF22_PAST via nf22Month); "What's this page?" (NF22_HELP); welcome back after 4+ days; calm pass (no strikethrough, gray zeros, 6d to 6 days, long notes folded, calendar blanks, slate Today key); Online store rebuilt into 6 tabs (Post today, Make a post, My week, Get more buyers, Reply fast, My store) with canvas post pictures; notebook reader (nf22NbOpen) in Books, Stock, Team and the account menu; demo button text shorter. |
| u32_round23.py | Round 23 (r23.js, r23_store.js, r23.css): Returns & credits as two money boxes per side (big total, waiting credits, add button centered at the bottom, forms hidden until tapped, Used credits / Problems reported folds below; keeps cmBuyer/cmAmt/cmReason and sc21* ids); Telegram-only alerts (Viber alerts tab and mentions removed in r21.js/r22.js, menu label 'Telegram alerts on your phone'); Books: Profit & loss and Cash flow tabs only for accountant mode (Money overview owns monthly profit and money in/out), tabs What changed / What you own and owe / Every peso (ledger), repeat tiles removed, statements styled like Money overview (nf23-st, nf23-neg/pos), new ledger table nf23-gl (left What, right money, green in, red out, phone rows); Books mini sub-tabs hidden (Tax books, BIR 2307s have menu lines); tax book totals labeled; 'What's this page?' wrapped with its title in .nf23-th (centered); AI tools menu group (data-g=ai) under the main pages with Notebook reader, and first on the phone menu; store: 5 tabs (Post today merges Make a post via kind chips + color dots, My week = next 7 days + good days that open in place with the picture, Get more buyers = 6 accordion steps with done state, Reply fast = item + question + answer), My store link slug and Viber/Messenger buttons fixed. Note: r11 already uses nf23-big/nf23-how/nf23-hero class names, avoid them. |
| u33_round24.py | Round 24 (r24.js, r24.css): 'All good' = deep forest band (#166534, white text, check) on Orders bands, tile dot and key (key text 'All good'), Done tag outlined; 'What's this page?' soft green chip; tax books rebuilt from the bk-table into table.nf24-tb (data-nf-card=1): Date | Invoice and party | Before VAT | VAT 12% | Amount | Withheld (+ VAT-exempt when any, TIN on tap), labeled totals, phone rows; notebook reader: photo step takes many photos (camera one by one or gallery multiple, up to 12), 'Check page 1 now' or 'Save all, check later' into localStorage nifti-nb-inbox (prototype, per phone), start screen shows waiting pages, menu badge count, after Add offers the next page and opens the right page (NB24_GO). Wraps nf22NbOpen/nf22NbPaint/nf22NbDo. |
| u34_round25.py | Round 25 (r25.js, r25_nb.js, r25_ui.js, r25_fil.js, r25.css, r25_fix.css, r25_ui.css, r25_privacy.html, r25_terms.html): REAL features: Telegram alerts sheet (telegram_status/link_code/set_alerts/test/unlink RPCs; link by t.me code or QR; switches orders/money/stock/messages/team/summary + quiet at night; team list) — bot = edge function telegram-bot (webhook secret header, /start code, /stop, /today, admin setup), sending = push-dispatch v9 (Telegram with Open in Nifti button); low stock alert trigger notify_low_stock; admin Site tab card to paste the BotFather token and the Anthropic key (admin_set_secret, admin_service_status); notebook reading for signed-in businesses = edge function nb-read (Claude, json_schema output, server-side fallbacks) + nb_pages/nb_words/nb_reads, monthly quota nb_quota (free 10, pro 300, business 1500, pilot 300), lines go to downstream_sales / record_opening_balances / expenses / inventory_items; Excel export of my_data_export (now with expenses, cash counts, payroll, journal, stock moves, price list, team notes, notebook pages). UI: every bk-row list (sales day, utang, discounts, expenses waiting/vale/all, payroll, bills, cheques, cash outlook list) converted to table.nf25-t (labels per column; container query turns rows into labeled cards when narrow); Getting paid = one row per customer with status chips, tiles hidden for a single customer; Orders party balance not repeated; cash outlook per stretch; ledger gl gets a Who or where column; min 14px text pass. Words: Counter -> Sales, Counter sales -> Shop sales, 'for the BIR' -> summaries for your bookkeeper; new privacy notice and terms; All good lighter #2F855A with green check on white, PO bubbles #EFF9F3, Done pill #DCF5E5. Tagalog: NF25_FIL (~480 entries). Database: dev/sql/r25.sql (security lock-down + all of the above). Lab: design-lab/r25/ (nightday, buying, plan). |
| u35_round26.py (+ u35_site.py) | Round 26 (r26.js, r26_menu.js, r26_price.js, r26_start.js, r26_back.js, r26_pages.js + css, r26_site.css, r26_nightday.html): plain-words pass on screen text (nf26Words: Order 0855, Bill, Count all stock, Storage places, VAT you collected, Profit before expenses…), status cells in two lines (nf26Status), first table column left, buying side cool gray, Filipino switch hidden (NF26_FIL_OFF), landing night-to-day section (white time pills, rose before) and Free/Pro/Business cards on landing + Pricing; menu = labeled groups that open with counts, flat for roles with 7 pages or fewer, Bank & deposits line, Find a page search with shop words (NF26_FIND), Plans & pricing and Need help? buttons; weekly tip on Home (nf26Tip); empty-page guides (NF26_EMPTY); Plans sheet + subscribe flow (nf26OpenPlans, request_upgrade with receipt photo), locked-page cards (NF26_PRO_PAGES); Bring your shop in (nf26OpenStart: snap notebook, starter items for 4 shop kinds, send a file / done-for-you, invites) + Home card; help chat (help_send/help_thread, admin Help inbox, optional Viber number); role pages, supplier credit slips and post plan saved in the database; phone: Selling/Buying switch, 3 rows then See all, Edit/Remove after tapping a line; opening screen. SQL: dev/sql/r26.sql. Edge: telegram-bot v2 (/help in Taglish, /utang, /benta, /stock). |
| u36_round27.py | Round 27 (r27.js, r27.css): Telegram switched off (UI hidden, telegram-bot edge function is a stub; old source kept in dev/edge_functions), Settings shows 7 everyday cards then More settings, order cards = status strip with dot + order + wide button, cash drawer month + Short/Over/Matched boxes, pay step shows pay-qr.png (UnionBank InstaPay), install card on phones, Pro 15 people / Business 75, payment reminders in Free. |
| u37_round29.py | Round 29 (r29.js, r29.css): chat files are real. Photos are resized to at most 1920 px and stored with the file in private bucket chat-files ({conversation id}/{message id}/{name}); PDFs and other files keep their names; tap to open or save. The standalone founder page is founder.html (own sign-in, no demo; ?preview=1&layout=tabs|side|one for layout previews); the in-app #admin route sends the founder there. SQL: r29_chat_files migration (bucket, can_see_conversation, admin_growth). Round 30 (r30.js/css in the same module): Count the cash = 4 two-line pills (days not counted gray, days matched added), month calendar, tapped day under it (over yellow, short red, matched green with check, cash paid out itemized), today's count form inside the day. Setup service: setup_jobs table, setup_request (Pro/Business or launch period), founder.html Setups tab (download file, load items via admin_setup_items, customers via admin_setup_customers, admin_setup_done tells the shop); founder page defaults to the left menu, Shops renamed Subscriptions with plan tallies. |
| u38_round31.py | Round 31 (r31.js/css, r31_ai.js/css): summary boxes all colored (green good, yellow waiting, red problem, gray nothing yet, blue plain totals, teal money moved like owner took); Money overview "Coming up" list replaces the 90-day outlook, every line opens a popup (order lines, files, last bill photos, payroll); Owed to you green, You owe red; Messages: red unread counts, Team/Customers/Suppliers colored headers; menu: AI tools under Money (no New tag), Bank & deposits plain row, Plans & pricing + Help as plain rows with red Help count. Chat smarts: text rules spot quotation / invoice / order confirmed / price up-down / delivered / on the way / delay, link the message to the order, compare prices with the last order; files are read by edge function chat-read (same AI page allowance as the notebook reader) and kept in table chat_insights (RLS per business). SQL: dev/sql/r31.sql. Design lab: design-lab/r31 (messages list x3, team command center x3, help x3). |
| u39_round32.py | Round 32 (r32.js/css): Help is its own page (#help, page-help built at load; nf32Show switches to it directly because an older #help handler reopens the popup): chat with the Nifti team + searchable short guides. Menu group names bold/black with dividers; AI tools moved to the very bottom. Tones changed in r31.js: plain totals gray, nothing yet white, utang and spent red. founder.html has an "AI & settings" tab to paste the Anthropic key (admin_set_secret). |
| u40_round33.py | Round 33: r33_msg (Messages: Team/Customers/Suppliers tabs fixed on top, WhatsApp-style rows with photo + last message, search by name or message text, chat fills the screen on a computer and phone; replaces renderConversationList), r33_team (Team mission board To do/Doing/Done with drag, uses team_tasks.started_at; replaces renderTaskList/renderTeamPeopleStrip at runtime), r33_help (Help page = common questions with answers + Messenger-style live chat, polls help_thread every 15s), r33_remind (reminders on each customer's app: Viber/WhatsApp/Messenger/SMS/email/Nifti chat, prefs in contact_prefs, one-by-one "Send them now" queue). Edge functions: nb-read now Sonnet 5.5, chat-read Haiku 5.5, both retry with Opus 5.5 on a 400. SQL: dev/sql/r33.sql. |
| u42_round35.py + u97_black_text.py | Round 35 (r35.js/css): Sale form = best-seller chips, +/- qty, "they gave" cash chips, recent customers, Save & new sale; Expense form = "same as before" chips, most-used kinds first + More, Save & add another; Bank & deposits nav no longer marks Getting paid (data-page bank-deposits) and Checks/Selling groups start folded (one-time v35 reset); left-menu counts are soft red pills; Promised box = the promises on the customer rows (nf35Promised); AI reading off for launch (notebook reader hidden, NF31_FILES_ON=false, "notebook pages" lines removed from plans); phone Getting paid rows wrap. u97_black_text runs last and turns every gray text color (hex list + gray CSS vars) into #0B0F14, keeping placeholder hints. Messages: tabs keep their colors (Team orange, Customers blue, Suppliers green), red count = chats with unread. Lab: design-lab/r35 (menu counts x5, find customers x3). |
| u43_round36.py | Round 36 (r36.js/css, r36_viber.js/css). Menu: all sections open (one-time v36 reset); section heading counts = to-dos inside (nf36GroupTodo), shown only while folded; soft red pills everywhere incl. page tabs. Messages: no rewording of the chat list after paint (nf33 classes in NF26_SKIP/NF_NO/I18N_SKIP) + diff paint, so rows never jump. Follow-ups tiles 'Waiting for Customer's OK' / 'Said Yes', wide tiles put details on the right (nf36Wide). Find customers = clean lead cards (nf36FindHtml) with Message (Nifti/Viber/WhatsApp/copy) and Google Maps search. Team: soft delete with Undo + Job history (team_tasks.deleted_at/deleted_by_name, team_task_events written by trigger team_task_log). VIBER (r36_viber.js): Viber threads from viber_threads/viber_messages merge into the matching customer/supplier chat (party_id = conversation id) or show as Viber-only chats (virtual convs id 'vb_<thread>'); new chats stay private to the phone owner until linked (nf36vPick/nf36vLink) or hidden (edge fn viber-media op=ignore deletes rows+files); composer has Nifti/Viber switch; Viber replies queue for the phone (viber_send) or, with no live phone (iPhone), copy + open viber://chat (option A); '+ Add a Viber message' pastes one in by hand (viber_web_add); red warnings for missing photos/files and unsent replies (bubble + list banner + toast); Connect Viber sheet (nf36vSetup) by platform: Android app steps with brand battery block (Xiaomi/OPPO/vivo/Infinix/Huawei/Samsung), Android browser = APK download, iPhone/computer = option A + phones list. Demo has sample Viber chats. Daily-routine sweep fixes: menu folds really start open (saved under nifti-menu-fold-26; nf20Folded default all open), calendar refreshes right after a cash count (ccSave wrapper), default count schedule = the two people who count most often (mhSched), toasts sit above the Sale saved/Receipt bar, phone tap targets 40px (order card links, More options, + Add item), expense Note field labelled. |
| u44_round37.py | Round 37 (r37.js/css, r37_viber.js/css). Counts: small solid red (theme 2); nf37Sweep (every 700 ms) hides any count that is empty, 0, display:none, or already seen; "seen" = the count when you last opened that page (localStorage nifti-seen-37:<biz>, pages in NF37_SEEN_PAGES; Messages/Help keep unread semantics); each page shows "N things need you · Show me" (nf37Why/nf37ShowMe); Stock count = items at or under 1.5× reorder point (nf37LowNames), same on page and menu. Menu headings: title case, bigger, line above (theme 4). Order lists: band headings, counts, calendar dates black; no tick on All good. Lighter yellow on summary boxes (Stock, Sales, Getting paid, To check, Follow-ups, Cash count, Checks). To check: no "New" tag, bigger corner tag. Expenses "higher than usual" notes yellow. Getting paid rows rebuilt by nf37Owed: Late / They say they paid (capped at owed) / Promised (capped at what's left) / Not promised yet, and the Owes cell shows "= says paid + promised". Money overview: lgForecastHtml = nf37NextHtml (time span select, in/out/left-over totals, real columns with headers, Show N more). VIBER: SQL viber_auto_match (same normalized name or phone, unique) links new threads in viber_dev_ingest; outbox waits 40 min before failing; web nf37vSort sorts new chats (match → auto-link, personal → hidden with a link, business/unknown → a "New on Viber" row with guess + one tap, openable to reply); photos never shown as errors (calm "coming in from the phone… or add it here"); demo has no error examples; iPhone/no-phone bar: Paste what they sent (clipboard), Add their photo; replies open viber://chat?number=&draft=. Android app 1.1: contacts lookup sends the saved number, MediaStore watcher fills photos the moment Viber saves them (keeps looking 6 h photos / 24 h files, silent), "Save to gallery" hint once, replies retry for 30 min whenever that chat shows a notification or opens, daily "keep Nifti running" reminder on Xiaomi/OPPO/vivo/etc (Xiaomi autostart read via AppOps 10008), one-tap permissions (perms), setup sheet is a 5-step stepper that moves on by itself. Play bundle: android/release/nifti-1.1-play.aab. Phone browsers: Android gets "Get the Nifti app" on Home (NF37_PLAY_URL once listed, APK until then); iPhone's existing home-screen card gets "Show me how". Lab: design-lab/r37. |
| u45_round38.py | Round 38 (r38.js/css, r38_app.js). Counts no longer clear on visit (nf37MarkSeen is a no-op; only 0 hides) — they drop only when the thing is dealt with. Money overview: "N things to look at" 17px, select chevron moved in (padding-right 44px), coming-up table roomier and centered (WHO widest), IN/OUT 16px, and the entry popup (nf31Open) gets nf38AttachBlock: order photos (nfOpList/nfOpAdd) or "Add the new bill" for monthly expenses. New contact on phone: Customer / Supplier / Personal in one equal 3-column row. Team: tabs 48px/17px (3-col grid on phone), people row nf38People (width-based max 1/3/4/5 + "+N more" searchable sheet nf38AllPeople, late/busiest first). Phone app setup: nf37vSteps wrapper makes the open-chat reader required and step 2; nf38Disclose shows Google's prominent disclosure (what, why, what not, where) before notif/screen/perms, agreed keys in localStorage nifti-disclosed. Privacy notice has an Android section (#android); privacy.html is a static copy published by the deploy. Lab: design-lab/r38 (chat folders x5, team board x5). |
| u46_round39.py | Round 39 (r39.js/css). Messages: the three tabs are replaced by folders All chats / New on Viber / Customers / Suppliers / Team, and Personal last (gray count, no red). Computer ≥1200px: email-style folder column (232px, sidebar 620px); 901–1199px and phones: icon rail (84px / 82px) with All on top; phone list uses full width. nf33Paint is now nf39Paint + nf36vPaintExtras; nf33Tab/nf33SetTab accept the 6 folders (localStorage nifti-msg-folder, default all); opening a chat keeps you in All (or New for a new contact). Personal folder = auto-personal "new" threads + ignored threads of this user (nf36vLoad no longer filters out ignored, messages of ignored threads still never load); rows offer "It's a customer / It's a supplier" and, for auto ones, "Keep personal". The old "N personal chats kept out" link is gone (nf36vNewHtml returns ""). Photo button in the composer is icon-only at 901–1599px. Team board: soft lanes (blue #EAF1FF to do, yellow #FFF5C2 doing, green #E3F5EA done), bold black headings and subheadings, 48px white count circle with black number; job cards (nf33TCard → nf39-card) are three lines: job + delete, when (late red / due today / due date / done by), who + one button. |
| u47_round40.py | Round 40 (r40.js/css). Team people row: nf38People rewritten to update the highlight in place (no rebuild), and renderTeamPeopleStrip now only draws the small chips (the old path drew big chips then swapped them, causing the shrink-and-grow); chip transitions limited to colors. Deleting a job asks first (nf40AskDelete sheet: Keep it / Move to Trash) and calls nf36DeleteTask; the bar above the board shows "Trash · N" (nf40Trash: deleted jobs with who/when, Bring back) and "Job history". nf37Why is a no-op: no red "N things need you" banner on any page. Summary pills (bk-tile, cq-tile, sl-tile with 3 parts): on computers number and words flow as one line ("2 items running out"); last line 16.5px (15px phone), black. Orders strip unit 16px. Exception Log renamed "Problems with orders" with 16px rows. Lab design-lab/r40: all 10 pill pages minimal strip vs colored tiles with the current one marked, the recommended bigger strip with action wording, team people x3 for 25+, problem log x3. |
| u48_round41.py | Round 41 (r41.js/css). Team: task titles carry class nf26-raw so the plain-words pass never rewrites them (demo task now says "bill"); every team-card text is 14px+ so the min-font pass never resizes it; renderTaskList draws into a hidden twin and swaps only when the HTML changed (repeat clicks = no redraw). Trash rows show "Was in To do/Doing/Done" with the lane color. People: computer = .nf41-col list beside the board (search, Everyone + people sorted late first, open/late counts, done-today bar; #teamPeopleStrip hidden); phone = "Showing: X · N people" button + late-job chips, sheet nf41Sheet (also replaces nf38AllPeople). Problems with orders = nf41RenderProblems table (both sides, filters Still open/Sorted out + Returns/Damaged/Short or wrong, Open order -> openOrderDetailModal; phone = cards). Excel items: nf41ImportOpen replaces openImportInventoryModal everywhere (no plan gate): template .xlsx, any column names (Item/Product/SKU name + Price/SRP/Presyo, optional Unit/Cost/Stock/Code), preview new/update/skipped, saves via syncInventoryToSupabase; buttons "Add many items from Excel" on Stock and Prices. Chat: typed price lists (2+ lines with ₱/P or /unit) get a "New prices/Quotation" card comparing each line with the last price paid (nf41PriceLines wraps nf31Ins). Lab design-lab/r41. Notebook/photo reading needs the anthropic_api_key row in app_secrets (not set as of Nov 17). |
| u49_round42.py | Round 42 (r42.js/css). Excel import rebuilt as a wide popup (steps pick/guide/check/done, nf41ImpPaint override, nf42Sheet visual, drag-drop) reading the locked template at templates/nifti-items-template.xlsx (sheet "Items"; headers locked, number validation; deploy copies templates/). Team activity = grouped by day with black day headings, Who/Kind filter chips (NF42A, nf42ActSet), kind icon + word labels. What runs out (days mode): 'Days of stock left' once under the scale + On hand column (.sr-oh). Notebook reader step 3 replaced by 'Check every line' (nf22NbPaint wrapper): photo left (zoom), editable rows (customer/item/qty/price with datalists), amount vs written check, tones sure/chk/bad/ok/skip, Next disabled until every line is ticked or skipped (NB.lines[i].checked). Laptop widths 901-1199px: sidebar 228px, Home pipeline columns flexible, Stock table scrolls inside its box, team cards min-width 0. Review lab: design-lab/r42 (header pills title+number+colored icon, Add expense redesign, 16 recommendations awaiting approval, handwriting 100). |
| u50_round43.py (+ r43_paint.js early script, u99z_scale.py last) | Round 43. PAINT ONCE: r43_paint.js is injected as the first <script>; short timers (<=800ms) started by a click/change/redraw/observer/animation frame are run in microtasks before paint (NF43P), so pages never show half-finished text. Writes that change nothing are skipped (classList add/remove/toggle, setAttribute, className, textContent) - this ended endless pass loops (~10/s) that caused the word/size jitter. After navigate the page is nudged twice inside the same paint so passes that needed a second run get it. Fixed loops: r11 To check legend, r27/r30 Sales drawer tug-of-war and duplicate cash form. Header pills (nf43Pills, NF43_PAGES): title + number + colored icon, equal widths per tab, columns measured so no pill is alone on a row, phone = one-column rows, ₱0 hidden unless good news, Tax books empty line; old boxes hidden inline. Popup frame (slModal wrapper nf43Frame): title+X, scrolling body, pinned footer (Cancel left, main right), long chip rows become 3 + Other (nf43Seg). New Add expense (nf43ExRender). u99z_scale snaps every font size to 14/16/18/24/28/36 at build time (badges/charts skipped). Names: Prices & profit, Monthly summary, Bank & deposits title; subtitles <= 8 words. Home: pills, What to do, What runs out, Where every order is. Orders ⋯ menu, Expenses order + approval card, Getting paid 'Payments to confirm' (confirmPaymentReceived) + one-line reminders, Checks compact rows, Online store trimmed, Find customers star, phone + button. Notebook reader back on with disclaimer + 'I checked these lines' before Add. Lab: design-lab/r43 (To check x3). |
| u51_round44.py | Round 44 (r44.js/css). Menu: the active page's group opens and the item is highlighted (green + inset bar). Stock status reads "Q arriving DATE" on one line. Team: Trash/Job history bar moved under the lanes so lanes line up with the people column. What runs out: one short line per item. Messages page never scrolls (only inner lists). Gray placeholder icons hidden (people keep photos/initials). Row actions (Edit/Remove) always visible, Remove asks first. To check = table you can open (renderIssuesPage override, NF44I state, issue_decisions upsert); status is read-only and works itself out (New / Someone is on it / Fixed / OK'd as fine). New sale = one screen (qsRender override: item search + Sold most often + lines, or just a total; Cash received + Change (sukli)/Still short readout). Bank & deposits: every payment row opens a popup with confirm / bounced / deposit / match / open order. Payroll: summary strip + Your people table, Edit/Delete on drafts, Payslips/Correct it on paid runs, money-comes-from choice. Notebook reader keeps the left menu; Columns + Check merged into one Check and fix step with full-width name boxes. Follow-ups: money-first boxes (Possible sales from leads, Said yes last 30 days) and each lead shows its possible value. Clock times are shown in Asia/Manila time. Lab: design-lab/r44 (Follow-ups x3, Deliveries one screen x3, other tabbed pages). |
| u52_round45.py | Round 45 (r45.js/css). Notebook reader never traps you: leaving through the menu saves a draft and asks Save / Don't save (nf45NbLeft wraps navigate); drafts list at the top of the reader (localStorage nifti-nb-drafts); Take a photo opens an in-app camera with a page frame (nf45Cam). Every header box (nf43 pills, payroll strip, bank/sales tiles, follow-up tiles) opens 'What this is / How Nifti works it out / Where the number comes from' with the real records (NF45_INFO builders, nf45InfoOpen); section headings get an ⓘ (NF45_HELP). Bank & deposits: Match my bank statement popup (upload CSV/Excel or paste, sample, I see it in my bank app = manual match). To check rows open on click. New sale: Browse all items by group with forgiving search (Tagalog words, sizes), customer finder with owes/last bought, recent customers first. Follow-ups = one money list (nf45FuRender) with chips, optional undoable outcomes in the lead popup. Deliveries = four color lanes (nf45RouteLanes) + stop popup; tabs replaced by Plan a run / Past runs. Team header: Who sees what + Add or manage people, Trash + Job history under them (nf36TeamBar override). Monthly summary: month buttons + month at a glance. Bring in old records hub (nf45Old): animated guide, Excel/CSV with column matching, typing grid; all go to Check and fix; Home hint + AI tools menu entry. Demo fixes: future payment date, hardware bad stock, one Bayview name, stock value counts items without a supplier bill. DB: nb_quota Pro 100 / Business 400 / Free 10 + 300 in first 30 days. |
| u53_round46.py | Round 46 (r46.js/css). Notebook: delete saved photos (list under the waiting box, Delete on the check screen, Remove on unsaved photos; real accounts delete from nb_pages or mark skipped). Every input[list] uses a Nifti-styled suggestion list (#nf46Sug) instead of the browser's; all selects themed. Follow-ups rows: fixed grid, equal main buttons, Edit/Open/Later as their own button, no ⋯ menu; bigger box text. Deliveries = day view (today, tomorrow, past folded; nf46RouteDay) with stop popups. Team: + Add a task under each lane (nf46TaskAdd). Bring in or save your list opens a popup (nf46ListPop); hidden pages get a Back button (nf46BackBar). Ledger balance rows left-aligned. Orders New order buttons solid. Prices & profit food card hidden. Lab: design-lab/r46. |
| u54_round47.py | Round 47 (r47.js/css). Names: Orders is "Delivery orders", Sales is "Walk-in sales" (NF43_NAV/TITLE/SUB, PAGE_DISPLAY_NAMES, NF26_FIND, r20 Orders header). Orders boxes: split count | money (nf47Split in r43.js, renderer supports q.m/q.ml). Prices & profit: columns found by heading and marked (nf47-cost/sell/mgc/sold/pl), Profit each column, colored Margin chip, Qty sold, green/red Profit / loss, green Edit prices, no input boxes until Edit. Monthly summary: month table + 'what you kept' line (nf47MonthViews, called from r45 nf45LedgerMonths); What changed is now 'Worth a look' (sales line dropped, short rows), tab 'At a glance'. Stock: one + Add items popup (photo reader first, type one, Excel, ready list, save list CSV); old buttons get .nf47-gone. Store: one-screen hero (link + share buttons + week stats + week strip) via nf22Top override, tabs hidden, Plan my week / Store settings swap the body in place with a back button. Deliveries: Edit stops / Plan a run edit in place (nf47RunEditor replaces the run card; editRoute = nf47EditRun). Way back: any page reached from inside another page (or a hidden page) shows a sticky 'Back to X' bar that restores scroll (NF47J, nested navigations keep the first page). Notebook reader opens as a panel over the current page with 'Back to X'. Pages you use (Settings): books_settings.menu {mode grow|all, on, off}; grow = new accounts (created_at >= 2026-11-19) start with Home, Delivery orders, Messages, Stock; steps (NF47_STEPS) unlock pages (NF47_PAGES), opening a page unlocks it, Getting started block in the menu + guide popup; demo can preview it from Settings. Hiding Walk-in sales asks how the business sells first; a usage hint shows on the page after 30 days with no walk-in sales. Team people list lines up with the lanes. Getting paid 'You paid' status on two lines. Demo chat says 'order 0852'. |
| u55_round48.py | Round 48 (r48.js/css). Store tools row (nf22Top wrapper): Say it (voice to post: SpeechRecognition fil-PH/en-PH, nf48Parse → kind/item/price/unit/extra, optional 'also change the selling price in Stock'), Monday price list picture (1080x1350 canvas, 12 rows a page, ▲/▼/NEW vs last week's snapshot 'pl-last', QR to the store, Taglish/English; Home card Mon/Tue until sent), Photo cleanup (auto-levels + white background flood fill + yellow price tag; 720px copies in localStorage 'item-photos'), Replies to 'how much?' (templates tl/en, test box, Messenger instant reply steps; auto-reply only when NIFTI_FB.appId is set), Payments & delivery fees (store.checkout: COD/GCash/Maya/bank, QR, fee per barangay, free over, other areas ask/flat). Post to Facebook: connected Page + NIFTI_FB.ready → edge function fb-page action post; else phone share sheet / desktop download + 3-step guide; 'Did it post?' counts the post. Send to Viber group (share sheet or download + viber://forward). Poster role: ROLE_PERMISSIONS.Poster = dashboard, store, messages; body.nf48-poster hides money on Home and shows 'Your job: post for…'. Orders from the store: nf48OrderBox in the order popup reads '[Pay: X · ref N] [Delivery: Area ₱fee]' from notes (v1) — add the fee line, record the GCash/Maya payment; issueInvoice adds the Delivery fee line. store.js: barangay picker + payment choice + reference + totals; uses get_store_checkout / submit_store_order_v2 when the migration is applied (supabase_migrations/2026-11-18-store-checkout-and-facebook.sql), else note prefix. Server files not deployed yet: supabase_functions/fb-page, fb-webhook (secrets FB_APP_ID, FB_APP_SECRET, FB_VERIFY_TOKEN, STORE_BASE); founder.html card lists the Meta steps. No page jumps: a page opened from inside another page shows as a side panel over it (NF48K; .nf48-under / .nf48-peek; bar 'Back to X' · Open full page · ✕; Esc and the dim close; scroll restored). Cash drawer Edit history = popup (nf48EditHistory: cash count edits + audit log in plain words) instead of a jump to Settings. copyText falls back to a 'Copy this' popup when the clipboard is blocked. Questions: window.prompt/confirm/alert are replaced by Nifti popups (NF48D): the first call opens the popup and stops the action (prompt throws a marked error that is swallowed, confirm returns false), the answer is stored and the same button is clicked again so the caller gets it synchronously; chained questions work; 'Type one: a, b, c' prompts show choice chips; '(₱)' prompts get a number keyboard; destructive confirms get a red 'Yes, do it'. Falls back to the browser box with no button behind the question, for typing in a field, and under automation (navigator.webdriver) unless window.NF48D_FORCE = true (tests: ask48.js). Side panel keeps itself when its page re-navigates to itself (chat opening). Messages with the order pane or in a side panel: folders become the icon rail, reply cards swipe, order chips and the Nifti/Viber bar no longer squeezed; opening a chat lands on the newest message. Phone: Follow-ups main button gets its own row. Layers: side panel z 1140 (dim 1130) so every popup (share-modal-backdrop 1200, nfw 1150, notebook 4100, nf20/nf22 overlays) opens above it; old id-styled modals (*Modal, order popup incl. html.nf-phone rule, #mhSheet) lift to 1160 while body.nf48-peeking; toasts (#appToastStack) at 1250. Tests: pz48.js (popups over panels), ask48.js (question popups). |
| u56_round49.py | Round 49 (r49.js/css). Online store = one home (NF49S.view 'home'): hero (status, link, Copy, share, QR, stats) + 'What do you want to do?' cards (Post something today with 'Or just say it', This week's price list, Product photos, Answer buyers automatically) + 'Get your store ready' checklist + This week strip. nf49Open(v): post/week/buyers/details/make switch NF22S.tab and show a bar '‹ Your store' + title; list/photo/fb/pay open the tool INSIDE the page (nf45Pop redirect while NF49S.next, slClose of an inline tool goes home). Post view has numbered steps (nf49PostSteps). Facebook without a Meta app: nf48PostFacebook → nf49FbPost (phone: share sheet, first-time tip; computer: picture on clipboard via ClipboardItem or download, popup nf49FbDesk with Page/profile choice and Copy the words); nf49FbSetup = guided Business Suite automations (Shop now button, comment keywords + message, Instant reply + 4 FAQs) with Done ticks in localStorage 'fb-setup'. Store photos: nf48PhotoUse also uploads the clean photo to Storage 'store-photos/<biz id>/<slug>.jpg' + rpc set_store_photo (Owner/GM/Poster); nf48LoadPhotos pulls the team's photos; buyer store.js shows them (get_store.photos). nf48SaveStoreKey reports false if the server drops the key. Header pills: 18/31px (Delivery orders split 19/31), titles wrap to 2 lines; nf43Fit rewritten to count two-line titles. Payroll/Follow-ups/Monthly/Deliveries/Credits/2307 tiles enlarged; phone Payroll tiles one per row; Deliveries stop status under the name on phones; Checks tables fit their column. Did-it-post bar is #nf48Posted. DB (applied 2026-11-19, files in supabase_migrations/2026-11-19-*): set_store keeps checkout/replies/hours (cleaned by nifti_clean_checkout/nifti_clean_replies), get_store returns checkout (nifti_public_checkout), hours, photos; get_store_checkout; submit_store_order_v2 (server fee, free-over, only enabled pay methods, fee line on the order); store-photos bucket + policies + set_store_photo + keep_store_photos trigger; FK indexes, duplicate team_tasks policies and conversations unique removed, initplan policies, viber_* search_path. Meta app path removed (supabase_functions/fb-* deleted). Tests: st49.js, fb49.js, r48t updated. |
| u57_round50.py | Round 50 (r50.js/css, r50_site.html/css/js). No (i) icon on any header pill or tile (r45 ::after icons set to none; tapping a pill still explains it). Store back fix: nf22Paint re-renders the store home when the body no longer holds .nf49-hm (dataset.k49 cache was skipping it after an inline tool). Notebook reader, Excel or typing and Plans & pricing are real app pages: #page-notebook / #page-oldrecords / #page-plans (NF50P). nf50Show switches pages without the base navigate (like nf32Show for Help), nf50Dock moves the old overlay (#nf22Nb, #nf26Plans) into the page with class nf50-docked; nf45Pop('nf45Old') draws into #page-oldrecords as .nf50-tool. Closing (Save and close, Close, Done) calls nf50Leave → back to NF50.from[page]. navigate('notebook'|'oldrecords'|'plans') → nf50Go; menu buttons rewired by nf50Wire (NF45_AFTER). Sticky bottom buttons; on phones .main uses overflow-x:clip while these pages are open. Landing (#view-index) and pricing (#view-pricing) replaced by r50_site.html (.nf50lp): dark hero with animated phone, works-with marquee, before/after, 9-tab feature tour (auto-rotates, stops on tap), AI section, no-app-for-customers, numbers band, a day with Nifti, trust, prices rendered from NF26_PLANS (monthly/yearly), FAQ, final CTA. nf50Start(plan) → signup tab + localStorage nifti-want-plan. No testimonials or user counts on purpose. Headline periods use <i class=lp-pd> to pull the font's wide period in. Tests: pg50.js, lp50.js, backall50.js, crawl50.js, sweep50.js. |
| u58_round51.py | Round 51. The founder chose the ORIGINAL landing and pricing pages (as of Round 49): keep their fonts, colours, sizes, spacing, layout and the dark-navy before/after day section. Rounds 50-51 tried a dark redesign and three light versions (archived at design-lab/r51); all rejected. This module only edits the product pictures and the lines beside them so they match the demo shop: Dela Cruz Hardware is the visitor's own shop; customers Riverside Builders, Bayview Construction, Corazon Welding, Cavite Steel Works, JV Hardware; suppliers Metro Steel, Cebu Aggregates; team Ana Reyes, Mark Santos; demo items and prices (cement ₱228, rebar 12mm ₱65, wire 12ga ₱850). Deliveries phone = today's run (Mark Santos, L300, Done / Can't); store phone = Dela Cruz Hardware store with GCash/Maya/COD and fee by barangay; reminders by Viber, SMS, Messenger, WhatsApp or email. Routes, staff overpay and supplier report card badges say BUSINESS. Pricing page compare table now matches the plan cards (routes, staff spending, report card, price checks, credit limits = Business; payment reminders in Free). Every replace is checked (build stops if a string is missing). |
| u59_round52.py | Round 52. Landing WOW pieces added to the ORIGINAL landing, in its own look (all selectors .mk- or #view-index): (1) "Try it right now" (#mkTry, r52_try.html): visitor types an order in Taglish/English, mk52Parse matches the demo items (MK52_ITEMS, same prices as the demo) and shows an order card with a counting total and "Sent to Bayview for their OK"; beside it the real app plays on a phone (loop52_*.jpg, five demo screens, embedded base64, crossfade every 2.8s). (2) Notebook before/after slider (#mkNotebook, r52_nb.html): each layer has two halves (paper: notebook rows + messy notes; app: summary + checked rows), range input drives clip-path, moves itself once on first view. (3) Time-back calculator (#mkCalc, r52_calc.html), assumptions printed under it. (4) Phone Start free / Try the demo bar (#mkSticky) shown after the hero until the last CTA. (5) Hero and final CTAs get class mk-big (18.5px, 56px tall); Start free opens Create account (mk52Start). Hero notifications pop in and float. FONT FIX: u99z_scale's six-size snap had shrunk the marketing pages (hero headline 50→36px); u99z now skips marketing selectors (MKT regex) and restores the Round 42 type variables for .marketing-view and #view-login. Checked with diff51.js: 0 differences vs the Nov 17 landing, pricing, login, privacy and terms at 1440 and 390. Tests: wow52.js, nb390.js, diff51.js. |
| u60_round53.py | Round 53 (r53_guide.js/css). 1-min tour button beside "What's this page?" (.nf22-help) on 12 pages; where that chip is hidden it sits in the Viber line (Messages) or a right-aligned row. Fresh = solid green with a 3x ring; after viewing = white "Replay tour". Tour modal: fixed card/stage/text heights so Back/Next never move; manual steps only; "Hide guide buttons" (localStorage nifti-guides-off), Settings has "Show guides". Messages: one-line Android-only Viber notice. Order reader (r14_read.js): Taglish filler words ignored (NFW_FILL), tsaka/pati split, food synonyms (bigas=rice). Review screen (r14.js): "Change item" on matched lines (why=chg, nearby choices + search). Landing #mkTry is now a still picture (no typing box). |
| u61_round54.py | Round 54 (r55_coach.js, r55.css). Header buttons: .page-head buttons grouped right (first child margin-right:auto); on computers nf55Heads moves them (incl. .bk-head-act) onto the toolbar row below (.nf55-bar/.nf55-acts) when that row has room, re-pinned to the top if the page reorders panels. Tour button falls back to the visible page heading (Delivery orders). Setup coach: 10 steps (items, customer, supplier, first order, who owes you, walk-in sale, expense, staff, store, alerts) with minutes, why, "Show me how" (goes to the page, opens the tool, spotlights the exact button found by its text, one-line tip), "I did it", "Later", auto-detect from inventoryData/buyersData/suppliersData, celebration per step, dock beside the sidebar (phone: above the bottom bar), minimize, hide (Settings "Show coach"), hides itself while any popup is open. Old #getStartedCard hidden while the coach is on. State in localStorage nifti-coach:<business>. |
| u98_demo_dates.py | The demo's hand-typed dates go through nfDD()/nfDS() so the demo's today is the real today; demo storage resets each new day. |
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

## Viber bridge (Round 36)
- **Android app**: `android/` (Java, no libraries, minSdk 26, target 36). ViberListener reads Viber notifications; ScreenReader (accessibility, Viber only) catches messages in the chat that's open; Relay keeps a file queue (no signal = nothing lost), finds photos in Viber's folder (MediaFinder, never camera photos), uploads via edge fn `viber-media` (op=upload), polls the outbox every 20 s and replies through Viber's own notification reply button (or types into the open chat), and raises phone warnings (Notify) for anything missing or unsent. ShareActivity: Viber > Share > Nifti fills a missing photo/file. SendNowActivity: "Send now" on a failed-reply warning.
- **Auth**: the phone never holds the login. The web page (inside the app, `window.NiftiAndroid`) calls `viber_device_register` and hands the app a random device key; only its sha256 is stored (viber_devices.secret_hash, not selectable). The app calls only `viber_dev_*` RPCs with the publishable key + device key. Disconnect = `viber_device_revoke`.
- **DB**: dev/sql/r36_viber.sql (migration r36_viber_bridge): viber_devices, viber_threads, viber_messages (RLS: business only; 'new' threads only for their owner), bucket viber-media (viber-media/<business>/<thread>/...), functions viber_* (web) and viber_dev_* (phone). No direct writes from clients.
- **Build the APK**: `cd android && ANDROID_HOME=/opt/android-sdk NIFTI_KEYSTORE=<path to nifti-release.jks> NIFTI_KEYSTORE_PASS=<password> gradle assembleRelease`, then copy `app/build/outputs/apk/release/app-release.apk` to `app/nifti.apk` and bump `app/version.json` + versionCode in android/app/build.gradle. The signing key is NOT in the repo in plain form: `android/signing/nifti-release.jks.enc` (AES-256, openssl pbkdf2 200k iterations) and the founder keeps the unlock phrase and keystore password. Same key every time or phones can't update. Cert SHA-256: 55842c236e545a80bc29a5dffe0746b23d4bbb8163e87ac32d9e94ada2455e88.
- **Play Store later**: the accessibility part (open chats) may be refused by Play review; ship it in the direct download, and remove ScreenReader from the Play build if asked.



## Android app 1.2 and Play Store (Round 38)
- versionCode 3 / 1.2. Open chats: ScreenReader catches up the last 40 visible rows whenever a chat opens or is scrolled (catchup=true, stable keys from Viber's own date line + bubble time via Parse.when); server viber_dev_ingest dedupes catch-up rows (same dir + same text within 12 h, media within 15 min) and doesn't raise unread for them.
- Native alerts without Firebase: Relay.alerts() polls app_dev_alerts (notification_outbox for that device's business/member, respects only_member/exclude_member) every 20 s while the listener runs; first run starts from now. Channel "Orders, payments and messages"; tap opens that Nifti page.
- WebView: offline page (assets/offline.html, retries when back online), window.print → PrintManager, navigator.share → Android share, blob/data downloads → Bridge.saveFile into Downloads, http downloads via DownloadManager, camera offered in file pickers (MediaStore insert, no CAMERA permission), intent:/viber: links, Supabase storage files open outside. Splash on Android 12+. isAccessibilityTool=false.
- Files: app/nifti.apk (direct download), app/index.html (install page with QR, Android/iPhone/computer), android/release/nifti-1.2-play.aab, android/store/ (listing.md, data-safety.md, permissions-declarations.md, release-notes.md, PLAY_LAUNCH_GUIDE.md, icon, feature graphic, 6 screenshots).
- When Play approves: set NF37_PLAY_URL in dev/src/r37_viber.js to the Play link and rebuild.


---

## 8. LATEST STATE (Rounds 51–55, 17–24 Nov 2026) — read this first

### 8.1 Founder rules added in these rounds
- Marketing pages stay LIGHT (no dark hero). The original landing (as of Round 49) is the approved one: keep its fonts, colors, sizes, spacing, and the dark-navy before/after day section. Rounds 50–51 redesigns were rejected (archived in design-lab/r51).
- No fake testimonials, user counts or customer logos. A real "Trusted by" strip only once pilot shops agree.
- Don't put the founder's real name on public pages (demo uses "Rico").
- Never ask for or accept an API key in chat. Never print app_secrets values.
- Never touch the other Supabase project "Permit Pal" (zeaiwvgktakbwnqpchbo).
- Viber: talk about the ANDROID app only. Do not mention iPhone/computer Viber sync (not built; don't overpromise).
- Order reader = a careful helper, not magic AI. User always checks; editing must be easy.
- Buttons must never sit alone in an "island" or leave white gaps; group them.

### 8.2 What changed (all deployed to https://siggiebahamas.github.io/Nifti/)
- u58_round51: original landing + pricing restored; product pictures match the demo shop.
- u99z_scale fix: the six-size font snap no longer touches marketing pages (MKT skip + restored type variables). Verified 0 style diffs vs the Nov 17 landing at 1440 and 390.
- u59_round52: landing extras — bigger CTAs (18.5px, 56px tall), hero alerts pop in, notebook before/after slider (#mkNotebook), time-back calculator (#mkCalc), phone sticky Start free/Try the demo bar, real-app phone loop (loop52_*.jpg). The "Try it" section (#mkTry) is now a STILL picture (Viber message → order → "You check it, then tap Send"), no typing box.
- See it in action panels zoomed 1.24x on computer; store picture chips cleaned ("Barangay fee", "GCash · Maya · COD").
- How it works step tags: dark green on light green (no more brown on yellow).
- u60_round53 (r53_guide.js/css): "1-min tour" button beside "What's this page?" on 12 pages (falls back to the page title, or the Viber line on Messages). Fresh = solid green + 3 pulses; after viewing = white "Replay tour". Tour modal: fixed size so Back/Next never move, manual steps only, "Hide guide buttons" (Settings → "Show guides" brings back). Messages: one-line Android-only Viber notice.
- Order reader (r14_read.js / r14.js): ignores Taglish filler (NFW_FILL: gusto, ko, niyo, yung, variant…), splits on tsaka/pati/at+number, food synonyms (bigas=rice etc.). Review screen: "Change item" on matched lines → 4 nearby choices + search; −/+ quantity 48px wide; type qty/price; remove line.
- u61_round54 (r55_coach.js, r55.css):
  - Header buttons grouped right; on computers they move onto the toolbar row below (month picker/date chips) when it has room (.nf55-bar/.nf55-acts), re-pinned to top if a page reorders panels. Fixed Stock, Prices & profit, Walk-in sales, Expenses.
  - SETUP COACH: 10 steps (items, first customer, first supplier, first order, who owes you, walk-in sale, expense, staff*, online store*, phone alerts*; *optional). Each: minutes, one-line why, "Show me how" (opens page/tool, dims screen, pulsing ring on the exact button found by its text, one-line tip), "I did it", "Later". Auto-done from inventoryData/buyersData/suppliersData. Celebration per step. Hides while any popup is open. Minimize / hide (Settings → "Show coach"). Old "Get set up" card hidden while coach is on. State: localStorage nifti-coach:<business>.
  - Round 55: coach is a SOLID GREEN card at the BOTTOM RIGHT (phone: above the bottom bar, bottom 140px), yellow progress ring, glow pulses 3x.
- Build: `cd dev/src && python3 apply.py <module list>` (list in section 3, now ending: … u58_round51 u59_round52 u60_round53 u61_round54 u62_cro u63_growth u65_ops u67_workflow u68_product_ui u69_dashboard_ux u70_product u71_product u72_site u73_app u97_black_text u98_demo_dates u99_dates u99z_scale — the exact list is in .github/workflows/deploy-pages.yml). Output = Nifti_Sept17.html, which GitHub Pages serves.
- Tests used (Playwright, in the old session scratchpad, not in repo): t26, err, smoke, flow, r48t, pg50, r47t, flick, diff51. Known expected results: flow ends "STUCK at paid on Print the receipt" (normal); smoke logs one 404 console line (pre-existing); flick 390 sometimes flags one page (timing).

### 8.3 Answers the founder asked for at the end (not yet acted on)
**Beta plan tier (founder wants: everyone free on the max Business plan):**
- Already effectively true: app_secrets flag `pilot_all_free` is ON (`select public.nifti_pilot_free()` returns true). While on, `has_feature()` gives every business every feature, whatever its plan. Only 1 business exists so far (plan 'free').
- Optional next step: also set new and existing businesses to plan 'business' with a note 'Beta' (change subscriptions.plan_id default to 'business', update existing rows) so the plan label matches.

**How the founder gives someone a tier themselves:**
- In the app, signed in as the platform admin (app_secrets `platform_admin_email`): the Admin page (`#page-admin`, function `admin_overview`) lists businesses, plans and usage, and can set a plan.
- Backend way: Supabase dashboard → SQL editor: `select admin_set_plan('<business uuid>', 'business', '2027-03-31', 'Beta');` (plans: free, pro, supplier_pro, buyer_pro, business). Must be run as the admin user, or directly: `update subscriptions set plan_id='business', paid_until='2027-03-31', plan_note='Beta' where business_id='<uuid>';`
- Pilot switch: `admin_set_pilot(true/false)`.

**Admin monitoring:** Admin page in the app (businesses, plans, paid-until, usage such as notebook reads, upgrade_requests). Also Supabase dashboard → Table editor: businesses, subscriptions, upgrade_requests, plus Authentication → Users for sign-ups.

**"Database timed out":** the Claude ↔ Supabase connector failed to connect for one session (a connection hiccup on the tool side). The database itself was fine; it reconnected next session. Nothing to fix.

**AI notebook reader:** edge function `nb-read` (dev/edge_functions/nb-read.index.ts) reads the AI key from table app_secrets, row name `anthropic_api_key`. That row does NOT exist yet, so the reader can't run for real accounts. The FOUNDER must add it (never paste the key into chat): Supabase dashboard → SQL editor:
`insert into app_secrets(name, value) values ('anthropic_api_key', 'PASTE-KEY-HERE');`
Key from console.anthropic.com → API keys. Then test with one notebook photo in a real (non-demo) account.

**Beta readiness (honest):** OK for a small closed beta (5–10 people) on https://siggiebahamas.github.io/Nifti/ (share the website, NOT the GitHub link). Before inviting:
1. Founder signs up with a second email and runs one full order (items → customer → order → open link on another phone → Confirm).
2. Sign-up emails: Supabase's default email sender allows only a few emails per hour. Set custom SMTP (Gmail/Resend) in Supabase → Authentication → Emails, or turn off email confirmation for the beta. (An `auth-email` edge function exists; check whether it is wired as the Send Email hook.)
3. Nifti does not auto-send Viber/SMS; links and reminders open the user's own apps.
4. Payments/subscribe flow is demo only — keep everyone on pilot free.
5. Viber Android app untested on a real phone — leave out of beta.
6. Supabase free plan pauses after ~7 idle days and has no backups — upgrade (~$25/mo) before real business data.

### 8.4 Open ideas the founder liked / may ask for
- AI fallback for the order reader: send only unsure lines + the shop's item list to an AI model.
- Viber on computer (Viber Desktop keeps messages in a local file; a signed Windows/Mac helper could read it). Needs a session with the founder's computer attached + a code-signing certificate. Founder said: Android only for now.
- Buyer "Got it" confirmation exists server-side (confirm_receipt_by_link).
- Separate e-invoicing product for Shopee/Lazada/TikTok sellers: recommended as a separate brand on Nifti's engine, validate manually with 5 sellers first.

---

## 9. ROUND 72 (24 Nov 2026): the "Nifti Revisions" brief — read this first

### 9.1 What happened before this round
Between the handover above and Round 72, ten rounds were made outside Claude (u62_cro … u71_product, r62–r71 files, beta-pauses.js changes). Most of them rewrote the landing page and Home **at runtime** with stacked DOM overrides that fought each other. Problems found and fixed in Round 72:
- The 3 Home status cards (r67 `decorateHome`) never appeared: the function ran once before Home existed, and r70 called it by a name it couldn't see.
- u65 cut Home apart (moved "What to do" above the summary boxes and renamed it).
- "See it in action": tabs were removed at runtime, so tab N opened panel N+1 (e.g. "Who owes you" showed "Orders from chat").
- r71 "SKU-first" edited the ORIGINAL quick-sale code, but Round 44 replaces `qsRender` at runtime, so the live popup still allowed a typed total with no items.
- r69 forced staff to see only their own sales whatever the owner chose; r69/r70 compared the login id (`currentUserId`) with `created_by`, which is a **team_members.id** → in real accounts staff would see zero sales/expenses.
- A full-document MutationObserver in r64 re-ran the landing rewrite on every DOM change.

### 9.2 What Round 72 changed (modules `u72_site`, `u73_app`; files r72_site.js/css, r72_journey.html, r72.js/css)
- **Removed from the build:** u64_conversion, u66_design (+ r64/r66 js/css). Marketing parts deleted from r62/r63/r67/r70 (their app parts kept). u65 now only adds the shared-link progress bar. beta-pauses.js no longer rewrites public pricing.
- **Landing (u72_site, build time):** hero = "Run your business. Not the daily chaos." + "Orders. Stock. Cash. Under control." in the same heading font (31px deck); 3 benefits in one grouped card; the real app on a phone (4 demo screens; Viber screen left out) with the alerts around it. How it works kept (voice-note claims removed). "See it in action" = 6 tabs in a 3×2 grid set in `NF20_SHOW` (Who owes you, Driver routes, Buying, What runs out, Your own store, Books), no auto-advance. New **"Follow one order"** section (#mkJourney): 6 clickable steps with a live ledger (status, stock, owed, cash, profit), plays once on view. "What changes for you" = 4 static cards, title beside icon, 17px black text, bigger green footers. Removed: One Connected Business, See the Difference, Picture your next Monday, the calculator (#mkCalc), #mkTry and #mkNotebook. Prices: regular price crossed out + Beta tag, then ₱0; beta box instead of "How paying works". FAQ: icon per question, 17px dark answers. Final CTA centered: "Know where your business stands. Every day." Reminder copy corrected (automatic reminders go by email/Nifti chat, not Viber — see `send_payment_reminders`).
- **Home (r72.js `nf72Home`, hooked on `booksAfterHome`):** 3 status cards on top (Needs attention red / Coming up amber / On track green, counts and first items read from the What-to-do lanes; tap scrolls to the lane). Original section order restored. Each summary box shown once. **Owner view** (Owner/GM/Finance only): costs & expenses, operating profit, margin vs last month, "Worth reviewing" = top expense categories, items sold with no cost, margin change. Sales is not repeated.
- **AI tools hidden** (CSS in r72.css + tip/copy patches in u73): menu group, phone menu row, notebook buttons, photo options in Add items / Bring in old records. Code untouched.
- **Deliveries:** `nf46StopRow` override: fixed columns (status 190px | action 120px), larger status pills, "Delivered · not collected" amber.
- **Find customers:** title follows the tab, one helper line, the misplaced r63/r67 guide box removed, separate loading / nobody-listed / no-match states, demo messages signed "Dela Cruz Hardware". **Leads:** `nf18Leads` override with a roomy status + follow-up column.
- **Sales visibility:** Settings card "Who can see sales" (Owner only, beside Who sees what, kept out of "More settings"), saved in `books_settings.sales_visibility` ('business' default | 'own'). Search entries "Who can see sales" and "Team permissions" (`@salesvis`, `@who`). Owner/GM/Finance always see everything. Staff identity = `myTeamMember.id`.
- **New sale (SKU first):** final `qsRender` in r72.js: scan box (USB/Bluetooth scanners: code + Enter), search by name/SKU, repeat scan adds 1, prices from the item list (read-only; Owner/GM/Finance can "Change" a line → saved as a discount vs list price), no total-only path (also blocked in `qsSave` via u73), an item with no price blocks the sale, unknown items must be added in Stock first. Sales list rows have **Details** (`nf72SaleDetail`): items, price, list price, discount, cost (Owner/GM/Finance), customer, payment, balance, who entered it.
- **Cash reconciliation** (r70 `lineDetails`, rewritten): summary (sales, payment split, cost, discounts) → every item sold → stock that left because of sales vs other stock changes (damage, count differences, returns, received) → "Worth a second look" in neutral words.

### 9.3 Tests run (scratchpad scripts, Playwright, demo mode)
Landing: 6 tabs open their own panels; journey; no leftover old sections; footer inside the page. Find customers: search, filters, no-match + clear, Message, ☆ save lead, Google Maps, add lead, suppliers tab, connection request, category chips. Checkout: scan, rescan, search, unknown item refused, change, save (lines with list price + cost), stock down, details, total-only blocked, no-price blocked, cashier can't change prices. Visibility: card owner-only, own mode, search finds it. All 28 pages at 1440 and 390: 0 errors, no sideways scroll. 7 roles previewed (Owner, GM, Finance, Cashier, Purchasing Agent, Warehouse Manager, Driver). Navigation ≈90–95 ms average (live ChatGPT build ≈115–150 ms). **Not done:** signed-in tests with real accounts (needs test logins; no auth/RLS changes made).

### 9.4 Security findings for the founder (NOT changed — need approval)
- `downstream_sales` RLS (`ds_select`, `ds_update`) lets ANY team member read and update every sale of the business through the API. "Each person sees only their own sales" is therefore a screen setting, not a lock. Recommended: select policy `nifti_books_viewer(business_id) OR created_by = nifti_me_member(business_id) OR books_settings.sales_visibility <> 'own'`, and limit `ds_update` to books viewers (staff only insert).
- Expenses are already locked correctly (staff see only their own).

---

## 10. ROUND 73 (24 Nov 2026): second revision pass — read this first

### 10.1 Page lag (root cause, fixed)
Three endless repaint loops kept the browser busy all the time (2–6 s of blocked work per page click):
- r62 rewrote the Home start card's HTML on every repaint pass, which triggered the next pass (~150 rewrites/s, on every page once Home had drawn). The override was removed (r62_cro.js).
- nf43Expenses (r43) and nf55Heads (r55) swapped the Expenses toolbar back and forth (pre-existing). nf43Expenses now treats `.nf55-bar` as the toolbar (u73 patch).
- nf41ImportButtons re-added the Excel button to the Prices/Stock header whenever nf55Heads moved it (pre-existing). It now looks page-wide (u73 patch).
Result: 0 idle DOM mutations on all 22 checked pages; background busy ≈3 ms per click (was ≈2,800 ms; pre-ChatGPT ≈146 ms); click→paint ≈76 ms. Test scripts: prof.js (timing + CPU profile), muts.js (idle mutation counter).

### 10.2 Landing
Hero alerts stay inside the right column and the phone is straight. "How it works" and "Follow one order" are one section right after the hero (#mkJourney, r72_journey.html): 3 phases × 2 steps, a light app window (mini sidebar that highlights the page in use, the scene, live tiles colored by meaning). The old 3-step block is no longer drawn (nf20Landing patch in u72). "What changes for you" moved to r72_changes.html. Final CTA: "Know where your business stands." / "Every day." on its own line, 4 quick tiles (What came in / Who owes you / What's running low / What you really made), larger checkmarks.

### 10.3 Dashboard
- Home: the 3 status cards are off (founder: redundant with What to do). Owner view rebuilt: colored KPI cards (profit green/red, margin gauge green ≥10% / amber 0–10% / red <0, change vs last month), "Where the money went" stacked bar, "Worth a look" rows. No profit delta (month-to-date vs a full month would mislead).
- Staff Home (non-owner): "Your jobs today" big tiles built from their allowed actions; Get set up, start card, notebook hint and the duplicate count reminder are hidden for staff.
- Bring in old records (no AI): hub rebuilt (Upload Excel/CSV · Paste from Google Sheets (new, tab/CSV parsing) · Type them in), left-menu row "Bring in old records" next to Plans & pricing, search entry (@records), phone menu row renamed "Your records". It was broken before: beta-pauses.js had replaced the reader opener, so Excel/typing hit the "AI paused" popup; beta-pauses now keeps `nf22NbOpenForImport` for imports. `NIFTI_AI_ON = false` blocks the only two AI calls (nb-read, chat-read) right where they're made. Imported sales need an item name and save cost + list price.
- Weekly price list: ▲/▼ compare with the last list sent, else prices before the last 5 weeks of price changes (price_changes), demo gets a sample last week; the side panel lists what went up/down/new.
- Where every order is: clear yellow pending (r68/r69/r70 brown-beige palette replaced everywhere).
- Delivery orders boxes: Stock-style layout (icon centered, peso big, "2 orders · to handle").
- Sales visibility: per-role override in the Settings card (books_settings.sales_visibility_roles), owner only.
- One profit everywhere: pages drawn before the ledger loaded now redraw once it has (lgLoad wrapper). Home "Owed to you" now includes shop utang (matches Money overview).
- Both-sides pages: side subtitles per page; Getting paid sides show their totals. Payroll "Value to collect" → "Cash advances to collect". Walk-in sales reconciliation folds (summary stays visible). AI notebook button on Monthly summary hidden. Demo: one price per item (catalog = stock price), today's stock moves match today's sales.

### 10.4 Tests this round
landtest (6 tabs, journey incl. click-before-autoplay), saletest (19 checks), rectest (menu link, hub, paste → match → check, AI blocked), findtest/sw.js, full.js (28 pages × 2 widths, 0 errors; 7 roles), muts.js (0 loops), prof.js (speed). Still not done: signed-in tests with real accounts.


## 11. ROUND 74 (24 Nov 2026): third revision pass — read this first
New module: `u74_app` (build patches) + `r74.js` / `r74.css` (runtime), placed after u73_app in the workflow and mods list.

### 11.1 Decisions from the founder
- "Value to collect" → **"Cash advances to collect"** (Payroll).
- Keep the month comparison, but make it fair: **this month so far vs the same days last month** (Nov 1–24 vs Oct 1–24). One helper (`nf74SameRange`, `nf74PnlRange`) feeds Money overview (`nf74ProfitChip`), the Monthly summary tiles/table (lgPrevRange override + r45/r47 patches) and the Home owner view. A finished month still compares with the whole month before.
- **Sales visibility is enforced in the database** (migration `supabase_migrations/2026-11-24-sales-visibility-enforced.sql`, applied live as `r73_sales_visibility_enforced`): `nifti_sales_see_all(business)`, `ds_select`/`ds_update` policies, `guard_sales_visibility_settings` trigger. Tested rollback-only: business mode cashier 2/2, own mode 1/2, cashier can't flip the setting or edit others' sales, per-role override works, owner unaffected.

### 11.2 Home
- Order: 4 pills → What to do → the price-list and notebook cards (moved under What to do by `nf74HomeOrder`; r43's order keeper patched to allow them, otherwise the two fought in a loop). Closing a card shows where it lives: price list button on Prices & profit and Online store, "Bring in old utang/records" on Getting paid and Stock, plus the menu row.
- Board stage counts: calm count chip (same 22–24px size, no blue display numeral, no dash).
- Owner view rebuilt (`nf74OwnerHtml` replaces nf72OwnerHtml): 3 clickable tiles (Profit so far + vs same days, You keep ₱X of every ₱100 + pts change, Biggest costs top-3 ranked list) and at most one "worth a look" row. Stacked bar removed.
- One profit everywhere (demo): the sample ledger is rebuilt once the demo stock moves are synced (Home showed ₱10,874 while Money overview showed ₱12,674). Demo history now has a sale after the 24th each month so the same-days comparison means something.

### 11.3 Pages
- Walk-in sales: two tabs (Sales | Count the cash, `NF74T`, CSS on `#page-sales[data-nf74t]`); pills stay on both; go('cashcount') and "Count the cash ›" links open the cash tab. Row buttons (Details/Receipt/Remove/Paid/Edit) one height, centered. Sale details rebuilt (`nf74SaleDetail`): aligned table + receipt-style totals. Cash day summary rebuilt in owner-view style (How they paid list, Kept before expenses, Discounts by person); no repeats of the pills.
- Cash drawer: owner/GM/Finance can **Fix the count** (existing edit flow) or **Settle the difference** with a note (`review_cash_count` RPC; demo sets reviewedAt). A settled day shows green "✓ Settled −₱800"; the shortage stays in the books.
- Number popups: big figure alone, its note on its own line; totals same size as the lines; payment names capitalised.
- Money overview: coming-up WHAT second line normal weight; supplier popup column "Paid, awaiting OK".
- Monthly summary: losing months red; "Balance at the start/end" starts at the left; table note explains the same-days comparison.
- Expenses: All expenses has a Date column first, centred headers, 16px text; "Where the money went" is a ring + ranked list (tap to filter, +% vs usual tags).
- Team: every card has Edit (title, person, due date, lane, delete inside); header buttons in one row; full first names in card footers; no "+ Add a task" in Done.
- Plans & pricing: demo/beta shows the regular price crossed out, ₱0, "You save …", an offer banner and "Get Pro/Business free"; the stray "}" under the table was a template bug (fixed). Real non-beta accounts still see normal prices and the pay flow.
- Prices & profit: Edit prices no longer on the table border. Checks: "Get a new check". Delivery orders: card buttons padded off the border.
- Every table: headers follow their column's alignment (`nf74AlignHeads`, runs on repaint and 0.7/1.6 s after navigation).

### 11.4 Proposals (not built)
Artifact "Nifti Page Proposals": honest take on side-by-side pages + 10 alternatives, 5 Deliveries revamps, 3 options each for Prices & profit (incl. announce to top/picked buyers + backend outline), To check, Monthly summary, Follow-ups, BIR 2307 (download + filled form). Founder picks numbers; build next round.

### 11.5 Tests this round
landtest, saletest, rectest, full.js (28 pages × 2 widths, 7 roles, 0 errors), muts.js on 14 pages (0 idle loops after the Home fix), prof.js (avg click→paint 82 ms), audit.js (alignment / tiny text / truncation / buttons on borders on every page, 1440 and 390), popsweep.js (dialogs), test74.js (19 checks for this round). Still not done: signed-in tests with real accounts; checks/sales stay non-editable by design (audit trail).

## 12. ROUND 75 (25 Nov 2026): fourth revision pass — read this first
New module: `u75_app` (build patches) + `r75.js` / `r75.css` (runtime), after u74_app in the workflow and mods list. Two additive migrations were applied live (files in `supabase_migrations/`).

### 12.1 Database (applied, additive only)
- `r75_price_announce_audience`: `price_changes.audience`, `price_changes.sent_buyer_ids`, and a 4-argument `announce_price_changes(p_changes, p_effective, p_note, p_buyers uuid[])`. `p_buyers` null = all buyers; otherwise only those buyers (still limited to business_relationships) get the message. The 3-argument version is unchanged.
- `r75_form2307_proof_files`: private bucket `tax-forms` (PDF/JPG/PNG/WebP, 10 MB, per-business folder policies) and table `form2307_files` (business_id, counterparty_id text, quarter, side collect|give, file_path, file_name, mime, uploaded_by_name) with RLS by my_business_ids().

### 12.2 Bug fixed (was live in Round 74)
Approving an expense (or any save that calls bkRefreshViews) and then opening Monthly summary froze the page: the Round 73 lgLoad "redraw once loaded" wrapper and bkRefreshViews (which invalidates the ledger) called each other forever. The wrapper now redraws only once per session (`window._nf73LgOnce`).

### 12.3 Landing
How it works: 3 big steps (64px icons, one short line each, no times), and one clean benefit scene per step (chat → confirmed order; delivery photo → stock 120→100; GCash paid → ₱880 profit) with a big "1 tap / 0 typing / Books done" line. No app window.

### 12.4 Dashboard
- Home: board count chip sits right of the stage name (small, dark on light grey). Owner view: Profit so far with two same-days bars (this month vs last month); You keep = "4.9% profit margin" + ring, no points; Biggest costs list.
- Walk-in sales: one page again (tabs removed). Order: pills → Today → day summary (How they paid / Kept / Discounts) → Utang + Discounts side by side (Customer/Owes/Paid; Staff member/What happened/Amount) → Count the cash (calendar with Short/Over/Not counted/Matched chips in its header, "Tonight: X counts" box saying anyone with Walk-in access can count, saved under their name) → change-fund line.
- Expenses: Expense type header, N/A for no payee, Approve/Send back right on a "needs your OK" row, approval rule (one amount) in the All expenses header with Change, the second-approval option removed, Where the money went as tiles.
- Team: titles 18px, done not struck, roomier card footer, no add in Done. Demo owner is "Ramon Dela Cruz" (short name Ramon). Demo keys are cleared once (`nifti-demo-clean = r75`) and leftover pending invites / non-seed tasks dropped once.
- Plans: an icon per feature, short lines, "Worth ₱33 a day · yours free in beta" hooks.
- Getting paid: customers with a balance show just TOTAL.
- Deliveries: standing rider (`books_settings.route_rider`: member, period week|month|always, until); "N orders ready to go out → Send all to <rider> today"; "+ Add a delivery" (from an order, or anything else: name, address, items, cash to collect in the note); board To go (yellow) / Done (green) / Couldn't do (red) with times; tap a card for the existing stop sheet. Demo has one confirmed order (po_r75) ready to deliver; demo rider list merges both rosters.
- Prices & profit: composer rebuilt (`nf75Composer`): short copy, Starts presets + date picker with one selected state (bug fixed), Who hears it (Top 3 / All / Pick, each buyer with this year's purchases), message preview, Send to N buyers. Supplier changes: big rows, Was → New, ▲/▼ %. 
- To check: cards with one fix button per kind, "It's fine, close it" with quick reasons, Give to someone; Recount opens a one-item popup (expected vs counted, last 5 changes of that item only).
- Monthly summary: three large tabs with icons and a line each; What you own and owe has ‹ › day steps and Today / Yesterday / 2 days / 1 week / 2 weeks / End of last month.
- Follow-ups: concern shown as its own speech line; Reply / Send a price / Remind / Say hello open one composer (prefilled message, a price worked out from "200 bags cement", follow-up in 2 days) and "Send on Viber" opens that person's Viber chat with the message typed (viber://chat?number=…&draft=…, copy as fallback). Viber still needs the user's final tap on Send; no free API sends for them.
- BIR 2307: From customers / To suppliers switch (one side at a time, full width), big quarter tabs + All quarters, Proof column (attach PDF/photo, open, remove), Download this list (CSV), link to bir.gov.ph for the blank form. Filled official PDF was NOT built (liability); the existing worksheet is the "Fill-in helper" and now flags missing TIN and address in red with a check-before-signing note. Every action pins currentAppRole to its side.

### 12.5 Proposals
"Nifti Page Proposals" artifact now starts with 10 colour options for Buying from suppliers (pick: Violet #6D3FC4). Not applied yet.

### 12.6 Tests this round
landtest, saletest, rectest, full.js (28 pages × 2 widths, 7 roles, 0 errors), muts.js (12 pages, 0 idle loops), prof.js (avg click→paint 83 ms), audit.js 1440 + 390 (clean), test75.js (12 checks), rt75.js (rider, send ready, free-form delivery, stop sheet), hang.js (the freeze above). Not done: signed-in tests with real accounts (proof upload and buyer-picked announcements were tested in the demo path only; the server functions were applied and compile).

## 13. ROUND 76 (25 Nov 2026): fifth revision pass — read this first
New module `dev/src/u76_app.py` with `r76.css` / `r76.js` (runs after u75, before u97–u99z). Landing changes live in `r72_journey.html`, `r72_site.js`, `r72_site.css`.

### 13.1 Bugs fixed
- Printing: every printable sheet (customer statements, 2307 helper) printed BLANK. An old base print rule (`body > *:not(#docPreviewModal){display:none}`) hid `#statementView`. Fixed in r76.css for `body.statement-open`.
- Monthly summary "Pick a date" did nothing on most clicks: a capture click handler now calls `input.showPicker()` on any `.nf75-dpick` (also fixes the Prices composer date).
- Monthly tabs flickered: the books_ledger tab line is patched to draw the big styled tabs (`nf76LgTabsHtml`) at render time, so no late restyle.

### 13.2 No brown anywhere
u76 rewrites the built HTML at build time: a fixed list of brown hexes plus any dark orange-brown hex (hue 10–48°, lightness < 42%) becomes black (#0B0F14) for text, yellow (#EAB308) for borders/fills. Kept on purpose: #CA8A04 (dark yellow). Avatars and the warn toast icon are yellow with black text. A scan of every page in both roles finds no brown.

### 13.3 Landing
How it works: active step pill has a thick border + "You are here", done steps get a check, a 3-part track under the visual fills per step (5.6 s each), all text black, step 2 is a route map with a moving truck + delivery photo stamp, stock 100 → 120. See it in action: bigger, shorter copy with 3 ticks per tab.

### 13.4 Dashboard
- Home: more space under the date; blue count chip (#E3EDFF / #2459C9); owner view margin is green (good) or red (bad) with "₱X costs / ₱Y kept out of every ₱100", no ring; bigger Biggest costs text.
- Walk-in sales: discounts purple; day summary = two sum boxes (How they paid / Discounts) with totals under a line, no %; breakdown table columns Item, Qty, Original price, Price now, Cost per unit, Total cost, Total, Customer · paid by (colour chip); Other stock changes on purple; Worth a second look in plain words.
- Expenses: tinted chip under each Expense type; Where the money went = one breakdown card (total once, vs last month, donut + legend, bars).
- Getting paid: subtotal boxes under each section instead of header totals.
- Deliveries: no rider banner; light-blue "ready to go" box with the rider dropdown inline; the free-form parcel option is gone (orders only); bigger board text, yellow lane with black text.
- Prices: Who hears it = tidy 3 options + buyer checklist; "New" placeholder; supplier rows Was/New on the right with a light date chip last.
- To check: What to do as check bullets, bigger headers, "Assign task" button with a clear assigned state; recount shows before → after; tapping a day opens a short popup (sales that day, counts).
- Follow-ups: customer messages are green chat bubbles, order details stay grey. Send on Viber copies the message, opens Viber by a link tap (chat with number, message typed on phones), then the popup says what to do and shows the number + Copy again if Viber didn't open.
- BIR 2307: Proof column centred; spaced action buttons (Undo is a pill). Fill-in helper rebuilt (`nf76Worksheet`): one-line header + quarter chip, "not the BIR form" note, every field editable (empty ones dashed yellow), your own TIN/address saves to your business details (tax_profiles upsert for real accounts), "Ask them for it" sends a chat message (or copies it), Part III table, signature boxes (payor + Conforme payee with title and date), how-to-finish steps. Print hides buttons and placeholders.

### 13.5 Tests this round
landtest, saletest, rectest, test76.js (12 checks, replaces test75 expectations), rt76.js (rider, send ready, parcel option gone), full.js (28 pages × 2 widths, 7 roles, 0 errors), muts.js (0 idle loops), prof.js (avg click→paint ~100 ms), audit.js 1440 + 390 (clean), hang.js, brown scan (none), worksheet printed to PDF (renders). Not done: signed-in tests with real accounts (tax_profiles save and chat ask were tested in demo only).

## 14. ROUND 77 (25 Nov 2026): sixth revision pass — read this first
New module `dev/src/u77_app.py` with `r77.css` / `r77.js` (runs after u76, before u97–u99z). Landing changes in `r72_site.js/.css` and `u72_site.py` (tab order).

### 14.1 Build-time sweeps
- No gray text: u77 turns every neutral gray text colour (hex or rgba, lightness 14–62%) and the text-only gray variables (--body, --faint, --muted, --nf68-muted, --r72-text, --lowstock, --ty-ink2, --st-ink) into #0B0F14. Placeholder hints keep their gray. A scan of every page in both roles finds 0 gray text.
- The Round 76 brown sweep still applies.

### 14.2 Landing
See it in action: What runs out is the first tab; the stat line under each tab is a big green number with a 20px black caption on one line (NF77_STAT); the pictures use app words (Getting paid, Monthly summary, Confirm, To check) and bigger text.

### 14.3 Dashboard
- Home owner view: the three tile titles are 16px black; greens = #14532D (the "What's this page?" green).
- Getting paid, selling side, rebuilt (`nf77CollHtml`, painted after the dual render; older passes nf43Collections / nf33RStrip skip it): blue "Payments to confirm" box with the total in its header; customer cards with the amount + "owes you" (no TOTAL label); status rows (says paid / late / promised / not due) and buttons that match (says paid → Check and confirm; late → Remind + They promised; not due → Friendly reminder); one reminders line; the four tiles are gone. Remind remembers each customer's app (contact_prefs) and opens straight to "Send on <app>" with "Use another app". Totals under each side (`nf76PaidTotals` replaced): big header total, rows with icons, each row opens to its lines (also on Bank & deposits). Supplier bills status shortened to "You paid ₱X, unconfirmed".
- Delivery orders: bigger side titles/icons; selling total says "to collect, incl. not billed" (it includes delivered orders not billed yet).
- Pay this bill: big calendar + amount, due date pill on the right, dark text on the "waiting for them to confirm" note.
- Money overview: Money in and out card and the Owed/Owe tiles removed; "Cash left over" is a line in the profit table; labels "Walk-in sales (shop)" / "Delivery order sales" (they are sales, paid or not); right column = "Out of every ₱100 you sold" bar + "Compared with Oct 1–25" (same-days, nf74SameRange). Coming up rebuilt (`nf77NextHtml`): Coming in and Going out lists, each with its own total that matches the top boxes; shop utang counts as coming in; popups show title left / amount + date right, and an order's lines add up (Items + VAT 12% or other charges = Order total). Shop utang rows open their own popup.
- Online store: no "example numbers" note. Bank & deposits: duplicate bank notice hidden.
- BIR 2307 helper: Print is locked until "I checked every detail. I am responsible for what goes on the official form." is ticked; the note says Nifti fills from records and is not responsible for mistakes; Copy button per field; what you type for the other business is remembered per counterparty (localStorage `nifti-2307-parties:<biz>`). Terms §6 has a sentence on forms Nifti fills in.
- Tax books: the buying side no longer says "No supplier bills" when it has one (all boxes are checked now); "Sales (gross)" shows as "Sales, VAT included"; purchase boxes get pills.
- Printing fix (statements and 2307 printed blank) from Round 76 stays; the Close/Print bar is never under the top banner.
- Phone: Messages Viber note wraps, Follow-up cards use the full width, Monthly tabs stack, BIR 2307 no longer pushes the page sideways (.nf-half min-width:0), the side switch hides 0 counts.

### 14.4 Tests this round
landtest, saletest, rectest, test77.js (15 checks incl. Getting paid, Money overview sums, store note), rt76.js, full.js (28 pages × 2 widths, 7 roles, 0 errors), muts.js (0 idle loops), hang.js, prof.js (avg click→paint ~110 ms; Walk-in sales ~290 ms), audit.js 1440 + 390, gray scan 0, brown scan 0, phone overflow scan 0. Not done: signed-in tests with real accounts (contact_prefs, tax_profiles were exercised in the demo path only).

## 15. ROUND 78 (25 Nov 2026): seventh revision pass — read this first
New module `dev/src/u78_app.py` with `r78.css` / `r78.js` (after u77, before u97–u99z). Landing in `r72_site.js/.css`; demo payments in `r7_demo.js`.

### 15.1 Easy confirmations ("finish later")
- Paying a bill (buyer) or recording a payment (seller) needs only the method (and amount if partial). Reference number and photo are optional; if left out the payment gets `missing: ['ref'|'proof']` and a toast says it's marked "add proof later". Base `submitRecordPayment` no longer blocks on reference or the ₱20,000 proof rule.
- "It arrived" (seller delivery confirm): receiver name and signature/photo optional; without proof `po.deliveryConfirmation.missing = ['proof']`. Freight "delivered" milestone no longer requires a photo (same tag).
- `nf78Incomplete()` lists all of these. They show: on Home "What to do" (This Week lane, "Finish later: …", Add now), on Getting paid (yellow "Finish later" box on each side), and inside the order sheet. `nf78Fix()` adds the number/photo later and clears the tag.

### 15.2 Dashboard
- Home owner view: margin % at 28px (same as profit), "Oct 1–25: 9.7%" pill (same days last month), no gray bar; Biggest costs header shows "TOTAL ₱…" on the right above the amounts.
- Getting paid: `nf77CollHtml` replaced — compact payment rows (method badge Check/Bank/GCash, ref, date, amount, two small buttons; one line when wide); customer cards "Name … Owes ₱X"; "They promised to pay" button removed. Totals (`nf76PaidTotals` replaced): no dropdowns; each total lists its lines right under it with amounts in one column and a red "N days late" or "Due …" chip; a single item is one tidy line with "Open ›". Demo payments: one check ₱6,000, one bank ₱1,000, one GCash ₱504 (adds up to the ₱7,504 owed).
- Money overview (`nf77MoneyAfter` replaced): side panel, cash line and the vs-last-month chip removed; profit table is full width in two columns (sales/cost left, expenses right); under Profit: "− Owner took out" (red) and "Left in the business"; "I took money out" button. The same button (`nf78TookMoney`, opens the expense form on "Owner took money") is in +Create, Expenses (next to + Add expense) and Walk-in sales (Count the cash header).
- BIR 2307 (`nf78TaxForms`, re-wrapped with nfRewrap): header box icons differ from the switch; columns "The form" (upload), "Ask for it" (Remind them) and "Got the form?" (customers) / "Gave the form?" (suppliers); Undo is a light-red pill; the fill-in helper and its signature section are gone (open2307Worksheet shows a hint). Remind them opens the Getting paid reminder sheet with a 2307 message and remembers the app.

### 15.3 Landing
See it in action: the stat under each feature is a green-tinted result card with an icon, "WHAT YOU GET", big number and one line.

### 15.4 Tests this round
test78.js (Owner view, Getting paid rows/lines, Money overview, BIR, store), landtest, saletest, rectest, rt76, full.js (0 errors), muts.js, hang.js, audit.js 1440 + 390, phone overflow 0, gray 0, brown 0, pay-without-proof + finish-later flow, owner draw entry points.

## 16. ROUND 79 (26 Nov 2026): eighth revision pass — read this first
New module `dev/src/u79_app.py` with `r79.css` / `r79.js` (after u78). Migration `r79_sale_photo` (downstream_sales.photo_path, nullable) applied; SQL in `supabase_migrations/2026-11-26-sale-photo.sql`. Options page for the owner: https://claude.ai/artifact/QkL69MVDG2R49AdHSkXgio (Money overview side panel ×5, You keep filler ×5, Biggest costs total ×3) — nothing from it is built yet except Biggest costs option 1.

### 16.1 Settle everything in place (no popups, no redirects)
- Getting paid → Payments to confirm: white box, plain gray method icon (check / bank / phone / cash), "Check #… · bank" on one line and date · order under it, amounts in a fixed right column, buttons under. "Bounced" / "Not in yet" opens reason chips in the row (`nf79Reject`, same effect as base submitRejectPayment).
- Customer cards: "+ Record a payment" opens an inline form (amount, Cash/GCash/Bank/Check, optional reference) → `nf79RpSave` applies it oldest bill first as a supplier-recorded payment (check = pending until it clears; no reference on non-cash → finish-later tag).
- Owed to you lines: each line has a quiet chevron; tapping opens the same form under it (invoice: `po:<id>`; shop utang: `ut:<saleId>` → `nf79UtSave`, same as bkPaySaleSave). "Open the order/sale" link stays inside.
- Walk-in sales: any utang "Paid" button opens the form under its row instead of the bkPay popup (bkPaySale wrapped; falls back to the popup if no row is found).
- Walk-in sale with Utang: optional photo (person, ID, signed note) → `sale.photo`; real accounts upload to receipts bucket `sale-<id>.jpg` and set photo_path; utang lines show a small "Photo" link.

### 16.2 Other changes
- Landing result cards: white icon tile with green icon and green number.
- Home: same-days margin is a plain dashed-line row; Biggest costs total is a TOTAL row under the list (the header pill is gone).
- Money overview: profit statement back to one column, centred (max 760px); Left in the business is a gray highlighted row with a black amount.
- BIR 2307: marking "I gave it" no longer asks how it was sent (the note went nowhere); amounts show centavos (₱772.80) with "1% of ₱77,280.00" under each; header total exact; a "A guide only. You don't have to use this page." box; recording withheld tax refuses an "amount before VAT" above the bill's pre-VAT total. Demo Riverside tax corrected to ₱772.80. Tax rules checked: 1% goods (WC158/WI158), 2% services (WC160/WI160), on the amount before VAT.

### 16.3 Tests
test79.js, landtest, saletest, rectest, rt76, full.js (0 errors), muts, hang, audit 1440/390, phone overflow 0, gray 0, brown 0, settle flows (utang inline, ₱2,000 phone payment, bounce reasons), Walk-in inline utang.

## 17. ROUND 80 (26 Nov 2026): ninth revision pass — read this first
New modules: `dev/src/u80_app.py` (+ `r80.css` / `r80.js`) and `dev/src/u96_no_gray.py` (the no-gray pass, now run after every round's styles: any new gray text colour becomes black automatically). Migration `r80_sale_payment_log`: downstream_sales.payment_log jsonb default '[]' + trigger `downstream_sales_payment_guard` (removing a payment = owner only, written to audit_log as sale_payment_undone). SQL in `supabase_migrations/2026-11-26-sale-payment-log.sql`.

### 17.1 Utang
- Ways in: + Create → "Record utang (pay later)"; Walk-in sales "+ Utang (pay later)" beside "+ New sale"; Getting paid shop-utang group "+ New utang"; all open New sale with Utang preselected (`nf80NewUtang`).
- Walk-in sales "Utang (pay later)" tracker (replaces the small utang table; `nf80UtPaint`): Still owed / Paid off (60 days) tabs; each utang shows customer, sale date, items, who, photo, Owes, a progress bar "Paid ₱x of ₱total", Record payment (inline form, `nf79UtSave`) and History (started, each payment with method and who, taken-back payments struck through). Undo on a payment (owner only) removes it from `payments` and appends {a:'undone', at, m, amt, by} to `payLog` / payment_log, so all totals keep working.
- Getting paid shop-utang group: "Paid off lately" with Undo, and "See all utang and history".

### 17.2 Other changes
- Money overview: "Costs vs Oct 1–26" panel beside the statement (`nf80CostJumps`: bkPnl byCat vs lgPnlFor same days); went up / went down, was → now bars, each row opens its expense lines; totals match the statement. Statement now shows "Less: extra cash found in counts −₱20" so the expense lines add up to the total (older ₱20 mismatch).
- Home: tile label "Profit margin", bigger same-days row, "Pulled it down: Electricity +₱3,040 −1.2 pts" strip; Biggest costs has an "Others" row above TOTAL.
- Getting paid: inputs inside boxes no longer draw a second box or square focus ring (also Walk-in scan box, date pills, peso fields, Messages box); payment rows: name + method on top, amount right, buttons with date · order beside them; card buttons: main action full width, Remind (app icon only) + Record payment side by side; "Settle" bigger. Buttons renamed "+ Someone owes me" and "Bring in old records".
- + Create menu: Money / Orders / People are real section headers (green, uppercase, tinted band).
- Bug fixed: header buttons moved onto the toolbar (r55) vanished after a page redrew (e.g. "+ New sale" missing on a second visit to Walk-in sales).
- Landing: result cards back to the Round 78 look; only the icon tile is white with a dark green border and icon.

### 17.3 Tests
test80.js, landtest, saletest, rectest, rt76, full.js (0 errors), muts, hang, audit 1440/390, phone overflow 0, gray (strict, incl. dark slates) 0 on pages and popups, brown 0, utang pay/undo/new flows, header buttons on repeat visits.

## 18. ROUND 81 (26 Nov 2026): tenth revision pass — read this first
New module: `dev/src/u81_app.py` (+ `r81.css` / `r81.js`), runs before `u96_no_gray`. No database changes.

### 18.1 Changes
- New sale popup: search results now sit right under the scan box as one bordered list (the old `.nf44-res` `top:calc(100%+4px)` pushed them down over the item lines); hint text hides while results show; popup 700px wide; Qty / Price each / Amount headers and values centred, 18px column gap.
- Paid with: when Utang is picked, the "Other" chip reads "Utang ▾" with "(pay later)" under it (`nf81TwoLine`, run after every `slModal`), never "Utang (pay l…".
- Money overview: the cost panel beside the statement is now one plain table (`nf80JumpsHtml` replaced): a one-line summary ("Costs are up ₱5,973 (18%)… Biggest jump: Electricity"), columns Cost | Oct 1–26 | Nov 1–26 | Change, all costs incl. unchanged ones, "no bill yet" for monthly bills not in yet, "Less: extra cash found" row, Total row; columns add up to the totals. Rows open their expenses and stay open after redraws (`NF81.mopen`). Phones: name on its own line, three numbers under it. Options page (artifact) shows this plus two other ways (paired bars, scorecard).
- Home owner view: Profit margin label/number now identical to Profit so far (16px label, 30px number, same top); "Pulled it down" removed; margin tile shows same days last month and "By sale type (before expenses)": Walk-in ₱ profit + margin %, Delivery ₱ + % (`nf81Channels`: walk-in cost from sale lines qty × unitCost, delivery = total cost − walk-in; both add up to Profit before expenses). Profit so far tile: each bar under its own label row, chip at the bottom (fills the tile). Biggest costs no longer leaves Home: it opens "Where your money went" under the tiles (`nf81Costs`, `NF81.costs`): every cost with amount, bar and share, extra-cash row, Total = tile total; tap a row for its expenses; Close.
- Getting paid → Payments to confirm: amount 24px, name 18px, method line 16px, date · order 15.5px, buttons 16px, bigger icon tile.

### 18.2 Tests
test81.js (27 checks incl. table sums, header alignment, results position, Utang label, inline costs sums), full.js 1440/390 0 errors, muts, audit, overflow 0, gray 0 (pages, popups and the new areas with every row opened), brown 0, CI build matches local.

## 19. ROUND 82 (26 Nov 2026): get paid faster, onboarding, offline — read this first
New files: `dev/src/u82_app.py` (+ `r82.css/js` polish & plans, `r82p.css/js` get paid faster, `r82o.css/js` onboarding, `r82x.js` operations, `r82f.js` offline), `dev/src/u99y_assets.py` (logo image kept once: −412 KB, gzip download 2.19 MB → 1.87 MB), new `sw.js` (offline caching + push). Migrations (applied via MCP): `r82_get_paid` (downstream_sales.due_date; tables utang_links, utang_claims (+guard trigger), utang_reminder_log; RPCs create_utang_link, get_utang_statement, report_utang_payment, report_payment_by_link_v2; private bucket pay-proofs with link-token policies) and `r82_plans` (plan_features/seat limits/prices, subscriptions.extra_seats/extra_branches, nifti_extra_seats, guard_team_seats, my_plan, admin_set_extras). SQL in `supabase_migrations/2026-11-26-r82-*.sql`.

### 19.1 Get paid faster (Free)
- Collect today (Home under the owner view, and top of Getting paid): everyone due or late, ranked by amount × days late; Remind opens the existing reminder sheet (Viber/WhatsApp/Messenger/SMS/email, remembered per customer in contact_prefs as `ut:<name>`) with a Taglish message + pay link; shop-utang reminders log to utang_reminder_log (stage = schedule offset), delivery-order reminders keep colLogManual. Record payment inline (shop utang: oldest first across bills, `uc:<id>`).
- Days to get paid (this month vs same days last month), How old the money owed is (0–30 / 31–60 / 60+, tap to list).
- Pay link for shop customers `#ut/<token>` (same statement page as delivery orders), "I've paid" on both kinds now takes a screenshot (shrunk to ≤1600px, stored in pay-proofs/<token>/). Shop reports show in Payments to confirm ("Shop utang · from their statement link", See screenshot, It came in / Not in yet with reasons).
- Due dates on utang: New sale (Utang) "Pay by" chips (next payday 15th/month end, 1 week, 15, 30, pick); default terms in settings (books_settings.utang_terms); change in place on each utang in the tracker. Utang limits (default + per customer, books_settings.utang_limit_default / utang_limits) warn in New sale; never block.
- Receipt offer after every payment (record, confirm, utang report): "Send receipt" opens the same sheet with a thank-you + remaining balance.
- Demo: 6 extra shop-utang sales dated outside Oct 1–26 and November (profit numbers unchanged) + one utang report from Aling Nena.

### 19.2 Onboarding & ease of use
- Welcome setup (`nf82OnbOpen`): kind of business → what to help with first → which pages show (writes the existing Pages you use state `books_settings.menu` with mode 'all' + off list; nothing deleted). Opens by itself once for a new real shop. Hidden pages show a banner with "Show it in my menu".
- Start here on Home (7 steps with Show me → opens the screen and spotlights the button); the older "Bring your shop in" card hides while it shows. 1-minute spotlight tour (`nf82TourStart`). Settings card "Your shop and menu"; user menu: Start here guide, Pages you use, Send feedback.
- Help desk card at the bottom of Home: Send feedback (+ capture this screen via html2canvas 1.4.1 from cdnjs, or upload; goes to support_messages 'feedback' with the picture in receipts/<biz>/), Weekly check-in (faces 1–5, support_messages 'checkin', books_settings.nf_ops.checkin), Bring in your records (items Excel template + upload; utang CSV template + upload → prefilled "Someone owes me" form).

### 19.3 Works without internet
- sw.js keeps the app, icons, supabase-js and fonts; pages network-first (6 s) then the saved copy. Supabase data is never cached by the worker.
- Signed-in shops reopen offline: business context saved in localStorage `nifti-off-ctx`; books snapshot in IndexedDB `nifti-offline/kv` key `bk:<biz>` after every load; while offline `sb.from/rpc/storage.from` answer "offline" instantly (they used to wait up to 30 s on token refresh). Offline banner shows what still works and how many entries wait to upload.

### 19.4 Other
- Money overview: legend colours, Left in the business centred + green; cost table header "Last month / This month" with the this-month column tinted. Home margin tile: share of sales walk-in vs delivery (adds to 100%). Expenses: Where the money went = one bar + table with last month; waiting-for-OK rows tinted with a solid Approve button (no extra tag); type and note stacked.
- Plans: Free 3 people (+ statements, credit limits, who pays late, purchase history), Pro ₱990 10 people (+ spending caps, watchdog), Business ₱2,490 / ₱24,900 30 people, 2 branches; extra people ₱99/month on paid plans. Landing: Taglish promise under the headline.
- Options artifact: Expenses 3 ways + interface preview (5-item phone bar, one main button per card) — NOT built yet, waiting for the owner's pick.

### 19.5 Tests
test82.js (36 checks), full.js 1440/390 0 errors, muts, audit, overflow 0, gray 0 (incl. every new popup and the pay page), brown 0, offline reload (demo) and offline reopen of a signed-in shop (simulated session), CI build = local.

## 20. ROUND 83 (26 Nov 2026): simpler setup, Who owes you, phone bar — read this first
New: `dev/src/u83_app.py` (injects `r83.css/js`); large edits in `r82o.js/css` (onboarding), `r82x.js` (bring-in sheet), `r82p.js` (Who owes you), `r82.js` (expense palette, Business copy). No migrations. `sw.js` cache → nifti-app-v83.
- Rules from the owner: never gray text (always #0B0F14); white text/icons on every dark button (r83 `nf83FixContrast` adds `.nf83-lt` automatically); only one popup at a time (`nf83CloseOverlays`).
- Taglish landing line removed.
- Welcome setup = 2 steps (type of business, what you want; ticks aligned right) + done screen; no page-toggle wall. Start here: per-step skip ×, card close ×, pay step has an inline GCash form; spotlight blocks clicks behind it.
- Bring in items/utang (`nf83BringOpen('items'|'owed')`): type rows, or paste from notes; spreadsheet/photo/ready list are optional "other ways". Old Excel template entry redirects here.
- Who owes you (`nf83WhoHtml`) replaces Collect today, aging, owed-to-you and customer cards: header total (shop utang vs delivery split), 3 tiles (late / due this week / later), aligned rows that expand to bills + Record payment / Send pay link / Show QR. Home uses the compact version. Getting paid = Payments to confirm + Who owes you + settings.
- Pay link for non-Nifti customers: link goes inside the Viber/SMS reminder and receipt; QR sheet to scan at the counter; copy link.
- Money cost table: wider centred columns, last-month column dashed border, black totals.
- Expenses: calmer palette, one font size in the table, dashed last-month column, "Recent changes" panel in All expenses (Undo edits, Bring back removed items, 30 days, stored per business in localStorage `nifti-exp-undo:<biz>`), "(vale)" hidden from labels (data key unchanged).
- Business plan copy: branches side by side, delivery runs with cash per driver, who-did-what log, roles with peso limits, morning owner summary, done-with-you setup, 30 people.
- Phone (≤980px): bottom bar Home · Sell · Get paid · Stock · Menu (Menu badge = orders + messages). Page headers on phones lay buttons out as an even 2-column grid; tour button is a light chip; BIR 2307 shows one side switch; Orders shows one title.
- Tests: test83.js, t83e.js (expenses undo/bring back + phone bar), full.js 0 errors, muts/ovf/contrast/gray/brown clean, CI build = local.
