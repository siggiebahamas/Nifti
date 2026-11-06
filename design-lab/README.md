# Nifti design lab: 10 visual themes

Open `/design-lab/` on the Pages site. The lab loads the real app with demo data in a frame and lets you:

- switch between 10 themes instantly,
- jump to any page (22 menu pages plus Edit history),
- view desktop or phone size,
- compare two themes side by side on the same page.

You can also click around inside the frame; it's the working app.

Themes are visual only. They change fonts, colours, spacing, borders, shadows, buttons, badges and other small details. Every feature, page, number, button and permission stays as it is. The live app is unchanged until a theme is approved: themes apply only when `<html data-th="…">` is set.

## Stage 1 · Audit: what every theme must preserve

- **Menu (22 pages):**
  - Home, Orders, Messages, Customers & suppliers, Stock.
  - Money: Money overview, Sales, Expenses, Cash count, Who owes you, Profit & prices.
  - Bookkeeping: To check, Books & reports, Bank & deposits, Payroll, Month-end close.
  - Sell more: Online store, Price list, Follow-ups.
  - Control: Owner's watchdog, Team.
  - More tools, and Settings, which includes the Activity log ("Edit history").
- **Home (approved Mist design):**
  - 8 headline tiles.
  - What to do (Act Today, This Week, Fine).
  - Where every order is (6 stages, selling and buying).
  - What runs out (days left or pesos on the shelf, with colour levels).
  - Cash drawer by person: calendar, day tally, who counts, optional protections.
  - Recent orders and Messages.
- **Shared components:**
  - Sidebar with badges, top bar (search, language, + Create, notifications, account).
  - Page titles, buyer/supplier tabs, KPI tiles and strips, panels and cards.
  - Tables with sortable headers, list rows, chips and filters, segmented tabs.
  - Status pills, buttons (primary, outline, small, danger, row actions), forms and toggles.
  - Bottom sheets and modals, toasts, bottom navigation on phones.
- **Meaning of colour (kept in every theme):**
  - Red: late, short, loss, danger.
  - Amber/yellow: order soon, pending, needs you.
  - Green: done, healthy, profit.
  - The theme's accent marks the action to take.

## How it is built (design tokens)

- `themes/neutral.css` (generated): replaces the app's hard-coded beige and brown with tokens.
- `themes/mist.css` (generated): maps every Home colour to tokens.
- `themes/base.css`: the engine. Maps each component to tokens and adds shared polish: hover, press, disabled, focus rings, menus and badges.
- `themes/t01…t10-*.css`: each theme sets its tokens, fonts and signature details.

## The 10 themes (round 3)

What changed in round 3, following your feedback:
- **Page colour vs tables:** the page background is now a clearly different tone from tables and cards, like the current look but with more contrast. Tables and cards are white with a visible edge, and tables have a tinted header band.
- **Coloured summary boxes:** the 8 Home summary boxes are colour-coded by meaning, Coastline-style.
- **Fonts:** premium modern fonts only.
- **Text:** no light-gray text.

| # | Theme | Page colour | Accent | Type | Signature |
|---|---|---|---|---|---|
| 01 | Evergreen | Sage | Deep green | Instrument Serif + Instrument Sans | Closest to today, serif titles |
| 02 | Harbor Slate | Slate blue | Navy | Onest | Navy menu, yellow marks what needs you |
| 03 | Celadon | Soft teal | Teal | Manrope | Pill buttons, filled teal menu highlight |
| 04 | Pewter Emerald | Cool gray | Emerald | Geist + Geist Mono | Black menu highlight, left-edge tile colours |
| 05 | Coastline Deep | Aqua | Teal | Figtree | Numbers coloured by meaning |
| 06 | Ivory Forest | Warm stone | Forest green | Fraunces + Hanken Grotesk | Serif section titles and figures |
| 07 | Indigo Mist | Lavender gray | Indigo | Sora + Albert Sans | Top-edge tile colours |
| 08 | Sky Royal | Sky blue | Royal blue | Bricolage Grotesque + Instrument Sans | Characterful titles, pill buttons |
| 09 | Jade Fresh | Mint | Jade | Plus Jakarta Sans | Solid coloured tile icons |
| 10 | Lagoon | Cool teal-gray | Teal | Be Vietnam Pro | Deep teal menu, mint highlights |

Summary-box colour key, the same in every theme:
- **Blue:** sales.
- **Slate:** costs and what you owe.
- **Green or red:** profit or loss.
- **Amber:** cash today.
- **Teal:** customer orders.
- **Red:** owed to you (late money).
- **Violet:** coming from suppliers.

## Stage 6 · Quality check

Each theme was checked on all 22 pages and Edit history at desktop width, and on Home and key pages at phone width. The checks:

- **Premium:** no default-looking components.
- **Typography:** a deliberate pairing, with tabular figures for money.
- **Colour:** every colour has one meaning.
- **Tables and cards:** consistent radii, borders and headers.
- **Buttons:** hover, press, disabled and focus states.
- **Readability:** no text below about 13px in the main views, and dark enough to read.
- **Status colours:** the same everywhere.
- **No horizontal scrolling** on phones.

Rejected along the way, per the brief:
- dark-heavy layouts;
- purple-to-blue gradients;
- glass effects;
- pastel "toy" tiles;
- exaggerated rounding.

## Next stages

5. You pick a theme.
6. Refine it: typography, colour, buttons, cells, tables, cards, navigation and small details.
7. After approval, apply it to the live app by loading the theme files and setting `data-th`.
