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
   python3 apply.py u1_data u2_shell u3_demo_stock u4_books u5_polish u6_i18n u7_more u8_plans u9_books2 u10_site u11_pricelock u12_stockrun u13_mhome u14_polish u15_round6 u16_round7 u17_round8 u18_round9 u19_round10 u20_round11 u21_round12 u22_round13 u23_round14 u24_round15 u25_round16 u26_round17 u27_round18 u28_round19 u29_round20 u30_round21 u31_round22 u32_round23 u33_round24 u34_round25 u35_round26 u36_round27 u37_round29 u38_round31 u39_round32 u40_round33 u42_round35 u43_round36 u44_round37 u45_round38 u46_round39 u47_round40 u48_round41 u49_round42 u50_round43 u51_round44 u52_round45 u53_round46 u54_round47 u55_round48 u97_black_text u98_demo_dates u99_dates u99z_scale
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
