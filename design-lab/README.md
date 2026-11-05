# Nifti design lab

Ten dashboard concepts for Nifti, built for the *Dashboard Design Exploration Brief*. This is a separate prototype. It uses sample data only and does not touch the production app (`Nifti_Sept17.html`) or Supabase.

**Open it:** `design-lab/index.html` (works from the file system), or `/design-lab/` on the GitHub Pages site. Use the tabs to switch concepts; each concept has **About** (identity, components) and **8 tasks** (walks through the brief's eight workflows). **Review** holds the audit, concept map and scores.

Every action button says it is a prototype. Nothing is sent or saved.

## How it is built

- `data.js`: one shared, realistic day at a Philippine hardware distributor (Dela Cruz Hardware, Valenzuela City, Wed 26 Aug 2026). Every concept reads the same numbers, so the concepts can be compared fairly.
- `flows.js`: the content for the eight workflows (cash, profit, the electricity spike, overdue customers, the cement shortage, the Metro Steel cheque, Rico's ₱800 short drawer, Ask Nifti). Each concept presents this content in its own way.
- `lab.js` / `lab.css`: the lab shell (tabs, About, 8 tasks, Review). The shell styles stay neutral so they don't colour the concepts.
- `concepts/NN-name.js|css`: each concept owns its DOM, CSS scope (`.cx-<id>`), fonts and interactions.

## 1 · Audit of the current product

**What exists:** a single-file app with about 33 pages (Home, Orders, Messages, Customers and suppliers, Stock, Sales, Expenses, Cash count, Who owes you, Profit and prices, To check, Books, Bank, Payroll, Month-end, Online store, Cheques, Routes, Returns, BIR 2307, Watchdog, Team…). The Supabase data covers both order sides, sales, expenses, blind cash counts, stock moves, a double-entry ledger, an audit log and price approvals. Controls already live: blind counts, price lock, receipts on every sale, expense approvals, month-end lock and edit history.

**Design limitations:**
- Every page uses the same recipe: a title, a row of number cards, white rounded panels and a table. The theme rounds (Aurora, Dusk and others) changed the paint, not the structure.
- Hierarchy comes only from size and colour. Nothing says why a number moved or what to do next.
- Related signals live on separate pages. The owner has to connect cash, receivables, stock and staff in their own head.
- Charts are rare and mostly decorative. There is no forward view of cash.
- The Dusk screenshot also shows a contrast bug: purple text on a purple "Tally" button.

**Opportunities:**
- Nifti already holds the data to connect signals across areas. Example: a short drawer, plus missing stock, plus a day with only one sale.
- A cash forecast built from cheques, rent, salaries and promised payments.
- Plain-language explanations, with the evidence behind them.
- Distributor-specific views: days of stock against supplier lead time, orders in transit, capital tied up in slow stock.

## How the ten concepts were kept structurally different

Each concept was assigned a different organising idea before any styling. No two concepts share their primary navigation or their main chart type.

- **Architecture:** command board, newspaper, spatial map, numbered report, checklist, operations flow, decision deck, query explorer, timeline, radial cycles.
- **Navigation:** exception queue, front page to article, camera flight, scroll index, bottom tabs, yard zones, deck progress, sentence builder, time axis, tappable shapes.
- **Detail pattern:** context panel, article page, map card, inline expansion, bottom sheet, clipboard docket, evidence drawer, inspector, day ledger, ripple dialog.
- **Fonts:** a different family for each concept (Plex, Newsreader/Source Sans, Sora, Archivo, Nunito, Barlow, Manrope, Schibsted/Spline Mono, Red Hat, Outfit). No dark themes, and no brown.

## 2 · The ten concepts

| # | Concept | Territory | Architecture | Navigation | Data language | Type |
|---|---|---|---|---|---|---|
| 1 | **Bridge** | Financial command centre | Overview + right context panel | Command bar (Ctrl/⌘K), no sidebar | Position beam, ranked impact bars, runway line | IBM Plex Sans + Mono |
| 2 | **The Ledger** | Editorial financial intelligence | Newspaper front page + article pages | Section bar like a newspaper | Word-sized sparklines, annotated bars, small multiples | Newsreader + Source Sans 3 |
| 3 | **Atlas** | Next-generation spatial interface | Single zoomable spatial canvas | Camera, breadcrumbs, minimap, layers | Node-link map sized by money | Sora |
| 4 | **Raster** | Premium Swiss-inspired minimalism | Single document with numbered sections | Fixed numbered index + scroll-spy | Bar-tables, dot-line rows, count matrix | Archivo (two widths) |
| 5 | **Kumusta** | Approachable financial workspace | One friendly scrolling page | Big section chips (bottom bar on phones) | Money jars, shelf boxes, chat bubbles | Nunito |
| 6 | **Yard** | Modern distribution operations | Operations board: lanes, cover, dock, capital | Anchor bar of yard zones | Conveyor lanes, cover/lead bars, schedule grid, area blocks | Barlow + Barlow Condensed |
| 7 | **Brief** | Decision-first briefing | Linear deck of decisions, overview last | Progress segments, rail, keyboard | One purpose-built chart per decision | Manrope |
| 8 | **Lens** | Analytical explorer | Explorer: sentence → canvas → inspector | Sentence builder and pinned lenses | Adaptive: line, columns, ranked and diverging bars | Schibsted Grotesk + Spline Sans Mono |
| 9 | **Meridian** | Time-first timeline | Single timeline with swim lanes | Time axis, day picking, zoom | Lanes, spans, forecast points, columns | Red Hat Display + Mono |
| 10 | **Tide** | Cyclical rhythm | Radial: dial, ring, wave | Tap shapes; centre readout; dialog | Radial bars, arcs, smoothed wave, rose | Outfit |

### 1. Bridge — One beam, one queue, one runway

- **Vision:** The owner's bridge: position, exceptions and runway on one calm screen, with everything else one click away in a context panel.
- **Philosophy and emotion:** Control without noise. The owner should feel "I know where I stand" in ten seconds. No decorative charts; every mark answers a question.
- **What makes it different:** The Position Beam: what you have and what you owe drawn on one scale, so working capital is visible, not calculated. Exceptions ranked by pesos at stake, not by module.
- **Typography:** IBM Plex Sans for words, Plex Mono for every figure so columns align like a ledger. Three sizes only: 13, 15, 28.
- **Colour:** Near-white canvas, ink navy, one signal blue for selection. Red and amber appear only on exceptions, always with a shape (▲ act, ● watch) so colour is never the only cue.
- **Visual language:** No cards. Sections are separated by hairlines and whitespace. Segments, rows and chart marks are all clickable.
- **Motion:** Context panel slides in 200 ms from the right; the page narrows instead of being covered, so the owner never loses context.
- **Architecture:** Overview first (position, exceptions, changes, runway). Detail always opens in the right-hand context panel. A command bar (Ctrl/⌘K) jumps to any customer, supplier, item or question.
- **Custom components:** Position Beam (assets against obligations on one scale, every segment clickable); Exception Queue (ranked by pesos at stake, with severity shapes and impact bars); Since Yesterday ledger (what moved overnight, in one column); Runway (14-day cash line with a safety band and outgoing-payment markers); Context panel (slide-in detail that keeps the overview visible); Command bar (jump or ask from anywhere with Ctrl/⌘K)
- **The 8 tasks:** *open*: Overview loads in reading order: position, exceptions, changes, runway. · *metric*: Click a beam segment or the profit line; the context panel explains it. · *expense*: Exception "Electricity 51% above normal" opens usage, cost and likely cause. · *overdue*: Top exception opens the receivables breakdown with patterns. · *stock*: Exception "Cement runs out" opens days-left against supplier lead time. · *supplier*: Triangle markers on the runway or the Metro Steel exception open the payment check. · *staff*: Rico's exception opens the drawer tally and cross-checks. · *ask*: Command bar suggests questions; the answer opens in the context panel.

### 2. The Ledger — Your business as this morning's front page

- **Vision:** Nifti writes the owner a newspaper every morning. The most important story is the lead; numbers sit inside sentences that explain them.
- **Philosophy and emotion:** Owners read stories, not dashboards. Editorial hierarchy (headline, deck, lead, sidebar) is a centuries-old way to say what matters most. Calm, intelligent, a little proud.
- **What makes it different:** Headlines generated from the data, word-sized sparklines inside sentences, annotated charts, a "Corrections and amendments" box for edit history, and "Letters to the desk" for questions.
- **Typography:** Newsreader (optical sizes) for headlines and numerals, Source Sans 3 for body. Small caps kickers, a strict baseline rhythm, 65-character columns.
- **Colour:** Paper white, ink black, one deep blue for links and highlights, editorial red only for kickers that need attention. Rules, not boxes.
- **Visual language:** Column grid and hairline rules. Charts carry direct labels instead of legends. No cards anywhere.
- **Motion:** Almost none: stories open as a page turn (instant swap with focus moved to the headline). Letters fade in after a short "checking your records" line.
- **Architecture:** Front page (lead story, In numbers, three secondary stories, due this week, corrections, letters). Every headline opens a full article. Sections: Money, Trade, Stock, People, Letters.
- **Custom components:** Generated lead headline (the day's most important development written as a headline and deck); Word-sized sparklines (trends inside the sentence they explain); Annotated profit chart (projection outline and direct labels, no legend); Small multiples (electricity usage month by month at a glance); Corrections and amendments (edit history presented the way newspapers own their mistakes); Letters to the desk (ask a question, receive a written reply with its sources)
- **The 8 tasks:** *open*: The front page: lead story first, then In numbers, then the three stories that need attention. · *metric*: Click any figure under In numbers, or the lead headline, to read the full article. · *expense*: Story "Electricity bill jumps 51%" opens the article with usage and likely cause. · *overdue*: "Who owes what" in the lead story opens the receivables article. · *stock*: Story "Cement will run out on Friday" shows days left against supplier lead time. · *supplier*: "Due this week" lists every payment; the Metro Steel link opens the check. · *staff*: Story "A short drawer on Monday" opens Rico's full tally. · *ask*: Letters to the desk: pick a question and the desk writes back with sources.

### 3. Atlas — Your business as a living map

- **Vision:** Nifti as a map you can fly around: customers on the left sending money in, suppliers on the right taking it out, stock below, people above. Position on screen has meaning.
- **Philosophy and emotion:** Relationships are the real story of a distributor. Seeing who you depend on, and how much flows along each line, builds intuition no table can. Curious, oriented, in control.
- **What makes it different:** The Business Map itself: node size is pesos at stake, line thickness is money in motion, a triangle marks trouble. Click and the camera flies there; context sits beside the node instead of replacing the map.
- **Typography:** Sora throughout: geometric, open, readable at small map sizes. Labels are direct on the map; no legends needed.
- **Colour:** Pale cool canvas with a dot grid. Teal for money in, coral for money out, graphite for goods and people. Late customers get dashed lines and a triangle, not just red.
- **Visual language:** Circles, curves and hairlines on an open field; the only rectangles are the context card and controls.
- **Motion:** Camera flights ease out over 0.5 s (instant if the user prefers reduced motion). Highlights pulse once when Nifti answers a question.
- **Architecture:** One spatial overview. Zoom levels: Business → group (Customers, Suppliers, Stock, People) → single node. Breadcrumbs and a minimap show where you are; layers switch money, goods and people on and off.
- **Custom components:** Business map (nodes sized by pesos, lines by money in motion); Camera flight (click a node and the view travels to it); Context card (details beside the node, the map stays visible); Minimap (always shows where you are on the whole business); Layer switch (money, goods and people on or off); Ask the map (answers light up the nodes they talk about)
- **The 8 tasks:** *open*: The whole business on one map: who owes you on the left, who you owe on the right. · *metric*: Click the centre (cash) to see position and the 14-day outlook. · *expense*: Click "Bills this month" at the top; electricity is flagged. · *overdue*: Click a customer; the biggest circle is Riverside Builders. · *stock*: Zoom to Stock; the red dots are items that run out before the supplier can deliver. · *supplier*: Click Metro Steel on the right to check the cheque. · *staff*: Click Rico Reyes at the top; the matching rod shelf lights up below. · *ask*: Ask the map a question; the answer highlights the customers, suppliers or items it mentions.

### 4. Raster — Seven numbered sections, nothing decorative

- **Vision:** A financial report designed like Swiss poster typography: a numbered index, a strict grid, huge exact numbers, and footnotes for everything unusual.
- **Philosophy and emotion:** Precision is calming. When every figure is aligned, labelled and in its place, the owner trusts it. Composed, exact, quietly confident.
- **What makes it different:** Footnotes as the alert system: anomalies are numbered marks next to the figure they affect, and each opens inline. Bar-tables put tiny exact bars inside the cells, so tables and charts are one thing.
- **Typography:** Archivo in two widths: condensed for numerals and the index, normal for text. Five sizes on a strict scale, all figures tabular.
- **Colour:** White and black. One red, used only for footnote marks and figures below a line that matters. Grey hairlines for structure.
- **Visual language:** No boxes, no shadows, no rounded corners. Every element sits on a 12-column grid with an 8-pixel baseline.
- **Motion:** None except smooth scrolling to a section and footnotes opening in place.
- **Architecture:** One long document with a fixed numbered index (scroll-spy shows where you are): 01 Position, 02 Performance, 03 Receivables, 04 Payables, 05 Stock, 06 Cash counts, 07 Question.
- **Custom components:** Numbered index with scroll-spy (always shows which section you are in); Numeral tower (four figures at poster scale with their footnote marks); Bar-tables (tables whose cells carry tiny exact bars); Dot-line stock rows (days left against supplier lead time in one line); Person-by-day count matrix (who counted, which day, how far off); Inline footnotes (anomalies numbered beside the figure and opened in place)
- **The 8 tasks:** *open*: Section 01 Position: four exact numbers, each with its footnote mark. · *metric*: Footnote 6 beside Cash opens the 14-day position. · *expense*: Footnote 4 beside August expenses in Performance. · *overdue*: Section 03 Receivables plots days late on one exact axis. · *stock*: Section 05 Stock: lines that stop before their tick run out first. · *supplier*: Section 04 Payables lists every bill with the bank balance after it. · *staff*: Section 06 Cash counts: footnote 5 beside Rico Reyes. · *ask*: Section 07 Question: the answer is set as a quotation with its source.

### 5. Kumusta — A friendly shop assistant, not a finance tool

- **Vision:** Nifti greets the owner like a trusted shop assistant: here is your money, here is today's list, here is your team. Sophisticated numbers, told in plain Filipino-English.
- **Philosophy and emotion:** Many owners are intimidated by finance software. Warmth, plain words and physical metaphors (jars, shelves, a to-do list) make them feel capable. Relieved, encouraged, in charge.
- **What makes it different:** Money Jars filled to scale (have, owed to you, you owe), a Shelf view where each box is a day of stock, and an "Explain simply" switch on every detail.
- **Typography:** Nunito: rounded, friendly, very legible. Large sizes (17 px body, 30 px headlines) and short sentences.
- **Colour:** White and soft sky bands, sky blue for action, sunflower for money owed, coral only for things to fix, mint for done.
- **Visual language:** Full-width bands instead of boxes; simple drawn objects (jars, shelf boxes, chat bubbles) carry the data.
- **Motion:** Gentle: the progress ring fills as items are ticked, the answer arrives after a short typing indicator, the detail sheet slides up.
- **Architecture:** One scrolling page in plain order: Today (greeting + list), Your money, Your shelves, Your team, Ask Nifti. Details open as a sheet from the bottom with an "Explain simply" switch.
- **Custom components:** Today's list with progress ring (the morning plan as a checklist that feels good to finish); Money Jars (have, owed to you and you owe, filled to the same scale); Shelf view (each box is a day of stock; a line marks supplier lead time); Explain simply (every detail can be rewritten in one plain sentence); Team chat (staff status written as messages, with Nifti's flags inline); Ask like a person (question chips and a chat-style answer)
- **The 8 tasks:** *open*: A greeting that says how many things need you, then today's list. · *metric*: Tap a Money Jar; the detail sheet explains it in plain words. · *expense*: "Look at the electricity bill" in today's list. · *overdue*: Tap the yellow jar or "Call Riverside Builders". · *stock*: Your shelves: short rows of boxes are items about to run out. · *supplier*: Tap the red jar or "Check tomorrow's cheque". · *staff*: Your team: Rico's message from Nifti opens the tally. · *ask*: Ask Nifti: pick a question and the answer arrives as a chat reply.

### 6. Yard — The business drawn as goods and money in motion

- **Vision:** A distributor thinks in trucks, shelves and days. Yard draws Nifti the way goods actually move: inbound lane, warehouse, outbound lane, then the dock schedule and the shelf.
- **Philosophy and emotion:** Operations first, accounting as a consequence. When the owner sees an order stuck on a lane or a shelf running dry before the truck arrives, the money problem explains itself. Practical, alert, on top of things.
- **What makes it different:** Order tickets on conveyor lanes, a cover-against-lead-time chart (the one picture every distributor needs), an 8-day dock schedule mixing trucks and cash, and a capital map of the shelf.
- **Typography:** Barlow Condensed in caps for signage-like headers, lanes and tickets; Barlow for reading. Numbers tabular.
- **Colour:** White yard, graphite ink, safety yellow used only as a thin marker stripe, blue for inbound, teal for outbound, red for anything that stops the flow.
- **Visual language:** Lanes, tickets with perforated edges, notches and blocks. Each section is a band with a signage-style header, not a card.
- **Motion:** Tickets lift on hover; the docket slides in like a clipboard from the right.
- **Architecture:** One operations board: Flow (inbound → warehouse → outbound), Cover against lead time, Dock schedule, Capital on the shelf, Crew and drawers. Every ticket, bar and block opens a docket.
- **Custom components:** Conveyor lanes with order tickets (each order is a ticket on its stage); Warehouse hinge (stock value sits between inbound and outbound); Cover against lead time (days of stock with a notch for supplier lead time); Dock schedule (trucks in, trucks out and cash, day by day); Capital on the shelf (blocks sized by pesos tied up, shaded by slow movers); Docket panel (manifest-style detail with stage tracker)
- **The 8 tasks:** *open*: The flow board: inbound, warehouse, outbound, then what arrives and leaves this week. · *metric*: Money lane on the dock schedule; "cash low" on 2 Sep opens the position. · *expense*: Ask the yard about costs, or open bills from the crew band (electricity is flagged). · *overdue*: Billed tickets on the outbound lane open receivables. · *stock*: Cover chart: red bars stop before their notch. · *supplier*: Metro Steel ticket or the I-beam block opens the payment check and the overstock warning. · *staff*: Crew band: Rico's row opens the drawer tally. · *ask*: Radio box at the top: ask the yard; answer appears below.

### 7. Brief — Six decisions, one at a time, then you are done

- **Vision:** The owner does not open Nifti to look at numbers; they open it to know what to do. Brief turns the day into a short deck of decisions, each with one picture and two or three real choices, and only then shows the state of the business.
- **Philosophy and emotion:** A dashboard should end. Brief has a finish line: when the six decisions are made, Nifti says so. Calm, decisive, finished.
- **What makes it different:** Linear, one-card-at-a-time architecture with a progress bar and keyboard shortcuts. The overview is the last card, not the first. Every card has its own purpose-built chart and an evidence drawer with the full working.
- **Typography:** Manrope throughout: heavy 800 for the question, 500 for reasoning. Big type, few words.
- **Colour:** Pale lilac-grey room, white cards, deep indigo for the primary choice. Category chips carry the only other colour. Red only on the number that caused the decision.
- **Visual language:** A stack of cards with edges showing how many remain. Rounded, generous padding, one visual per card.
- **Motion:** The card rises in; when you decide, a stamp appears and the next card slides up. Respects reduced motion.
- **Architecture:** Deck of 6 decisions (cash, customers, stock, suppliers, costs, staff) → summary card with five numbers, metric drill-down and Ask Nifti. Rail on the right lists the deck.
- **Custom components:** Decision card (question, reason, one tailored chart, 2–3 choices); Deck progress (segmented bar you can jump through, plus ←/→ and 1–3 keys); Evidence drawer (the full investigation behind a card); Decision stamp (records the choice with a Change link); Finish card (the business at a glance, only after decisions); Deck rail (every decision and its outcome in one list)
- **The 8 tasks:** *open*: Opens on decision 1 of 6. Progress shows what is left. · *metric*: Finish card: tap Cash now for the detail. · *expense*: Decision 5: electricity; Show the evidence explains the jump. · *overdue*: Decision 2: Riverside; evidence lists all four late customers. · *stock*: Decision 3: cement runs out Friday. · *supplier*: Decision 4: I-beam order and the cheque check in the evidence. · *staff*: Decision 6: Rico, 24 Aug, with every count since 19 Aug. · *ask*: Finish card: Ask Nifti.

### 8. Lens — Say what you want to see; Lens picks the chart

- **Vision:** For the owner who wants to look for themselves. Instead of a fixed page, Lens is a sentence ("Show me cash by day, next 14 days") that turns into the right chart, with notes on what it says and an inspector for any mark.
- **Philosophy and emotion:** Curiosity over curation. The owner asks; Lens answers with honest charts and plain notes. Precise, open, a little nerdy.
- **What makes it different:** The navigation is a sentence, not a menu. Chart form follows the question (line for time ahead, ranked bars for who, diverging bars for against-normal). Every mark is clickable into an inspector.
- **Typography:** Schibsted Grotesk for words, Spline Sans Mono for every number so columns align.
- **Colour:** White canvas on faint graph-paper dots, violet for focus and selection, amber for the highlighted series, red only when a value crosses a line.
- **Visual language:** One large canvas, slim notes column, pinned lenses as a shelf. Thin rules, small radius, nothing decorative.
- **Motion:** Bars grow from zero when the sentence changes; the inspector slides up under the chart.
- **Architecture:** Pinned lenses (rail) · Sentence builder · Canvas (chart or table) · Inspector · Notes and Ask. Eight measures × 1–2 splits = 14 views.
- **Custom components:** Sentence builder ("Show me [measure] by [split]" with dependent options); Adaptive chart canvas (picks line, columns, ranked or diverging bars); Mark inspector (click any bar or point for the full story); Pinned lenses (saved views as a shelf); Notes column (what the current view says, in plain words); Chart / table switch (every view as a sortable-style table)
- **The 8 tasks:** *open*: Opens on the pinned "Cash, next 14 days" lens with notes. · *metric*: Pick any measure in the sentence; click a point to inspect. · *expense*: "Expenses by against normal": electricity is the long red bar. · *overdue*: "Money owed to me by customer": click Riverside. · *stock*: "Stock by days left": red bars stop short of the supplier notch. · *supplier*: "Money I owe by due date": click Metro Steel. · *staff*: "Drawer counts by count": 24 Aug is the only long bar. · *ask*: Ask Nifti in the notes column; the chart switches to the data behind the answer.

### 9. Meridian — Everything on one line of time, with today as the meridian

- **Vision:** Owners think in days: when does the cheque clear, when does cement run out, when did the drawer go short. Meridian puts every money, stock and staff event on one shared timeline, behind and ahead of today.
- **Philosophy and emotion:** Cause and timing are the story. Seeing that the Metro Steel balance, rent and salaries all land in the same three days explains the cash dip better than any total. Composed, navigational, precise.
- **What makes it different:** A single horizontal time axis is the whole navigation. Seven swim lanes share it. The "today" meridian splits history from forecast. Pick any day to get its ledger.
- **Typography:** Red Hat Display for labels and headings, Red Hat Mono for dates and pesos.
- **Colour:** White chart room, navy ink, the past in a faint wash and the future in white. Dark blue for money in, red for money out or trouble, amber for watch, green for done.
- **Visual language:** Swim lanes, a meridian line, day ticks and capsules. Like a Gantt chart crossed with a bank statement.
- **Motion:** The timeline glides to keep today in view; the selected day band slides between columns.
- **Architecture:** Behind / Ahead strip · Timeline (Sales, Cash ahead, Customers, Suppliers, Stock, Drawers, Costs) · Day ledger · Detail panel · Ask. Month or fortnight zoom.
- **Custom components:** Meridian timeline (seven lanes on one time axis, today as the divide); Behind / Ahead strip (what happened next to what is coming); Day ledger (every event, sale and forecast for one day); Span capsules (late invoices drawn as length of lateness); Zoom switch (month or fortnight); Forecast lane (cash points against the safety line)
- **The 8 tasks:** *open*: Timeline centred on today; the ledger shows today. · *metric*: Cash lane: the red point on 2 Sep opens the cash detail. · *expense*: Costs lane: the red Electricity capsule. · *overdue*: Customers lane: Riverside's capsule is the longest. · *stock*: Stock lane: "Cement out" on 28 Aug. · *supplier*: Suppliers lane: cheque on 27 Aug. · *staff*: Drawers lane: the red −₱800 on 24 Aug. · *ask*: Ask about any day, under the ledger.

### 10. Tide — The business as rhythms: the month, the money cycle, the cash tide

- **Vision:** A distributor's money moves in cycles: buy, shelve, sell, wait, collect, pay. Tide draws Nifti in circles and waves so the owner feels the rhythm, then shows exactly where it is off-beat.
- **Philosophy and emotion:** Calm, but not vague. Shapes you can read in one breath (a dial for the month, a ring for the money cycle, a wave for cash) with exact numbers one tap away. Unhurried, assured, quietly premium.
- **What makes it different:** Radial and cyclical where every other concept is linear: a 31-day dial, a cash-conversion ring that nobody else shows, a tide table of highs and lows, and a weekday rose. Details open as a dialog that grows from what you tapped.
- **Typography:** Outfit throughout: light 300 for the big figures, 600 for labels. Round, open, quiet.
- **Colour:** Sea-blue gradient on a near-white ground, a lilac ring for stock time, dark blue for money in, red for anything below a line or late. Plenty of air.
- **Visual language:** Circles, arcs and one wave. No cards; sections float on soft white with a hairline.
- **Motion:** The dialog ripples open from its source; the attention list breathes with a slow ring pulse (off under reduced motion).
- **Architecture:** Month dial with centre readout · Money cycle · Cash tide table · Week rhythm · Pulse (things off-beat) · Ask Nifti button.
- **Custom components:** Month dial (31 days around a ring: sales bars, drawer counts, upcoming events); Money cycle ring (days on the shelf + waiting for customers − supplier credit); Tide table (cash highs and lows ahead, with the safety line); Week rhythm rose (average sales by weekday); Pulse list (five off-beat items with a breathing marker); Ripple dialog (details grow from the tapped element)
- **The 8 tasks:** *open*: The dial: the month so far, today marked, profit in the centre. · *metric*: Tide table: the 2 Sep low opens the cash detail. · *expense*: Pulse: Electricity. · *overdue*: Money cycle: the "waiting for customers" arc, or Riverside in Pulse. · *stock*: Pulse: Portland Cement, or the shelf arc. · *supplier*: Money cycle: the supplier credit ring. · *staff*: Dial: tap 24, then Rico's drawer. · *ask*: Round Ask Nifti button, bottom right.

## 4 · Critical evaluation

Scored 1–5, deliberately harshly.

| Concept | Originality | Usability | Visual | IA | Accessibility | Scalability | Distributor fit | Total |
|---|---|---|---|---|---|---|---|---|
| 1. Bridge | 3 | 5 | 4 | 4 | 5 | 4 | 4 | 29 |
| 2. The Ledger | 5 | 4 | 5 | 4 | 4 | 3 | 4 | 29 |
| 3. Atlas | 5 | 3 | 5 | 4 | 3 | 3 | 5 | 28 |
| 4. Raster | 3 | 4 | 5 | 4 | 5 | 5 | 4 | 30 |
| 5. Kumusta | 4 | 5 | 3 | 4 | 5 | 3 | 4 | 28 |
| 6. Yard | 5 | 4 | 4 | 5 | 4 | 4 | 5 | 31 |
| 7. Brief | 5 | 5 | 4 | 4 | 4 | 3 | 5 | 30 |
| 8. Lens | 4 | 3 | 4 | 3 | 4 | 5 | 3 | 26 |
| 9. Meridian | 4 | 3 | 4 | 3 | 3 | 4 | 4 | 25 |
| 10. Tide | 5 | 4 | 5 | 4 | 3 | 4 | 4 | 29 |

- **Bridge.** Holds up: Fastest to read; the beam makes working capital tangible; everything is one click from the overview. Falls short: Structurally close to a well-made admin overview. The beam is the only truly new idea.
- **The Ledger.** Holds up: The strongest point of view: numbers arrive with their meaning. Feels expensive and calm; very readable. Falls short: Reading is slower for owners who only want the numbers; story generation must be excellent every day or it feels canned.
- **Atlas.** Holds up: Unmistakably different and memorable; makes concentration risk (one customer, one supplier) obvious at a glance. Falls short: Spatial maps get crowded as a business grows; reading exact numbers is slower than a list; harder on small phones and for keyboard users.
- **Raster.** Holds up: Superb clarity and density without clutter; scales to many more rows; accessible by design. Falls short: Swiss reporting is a known style, so originality is limited; the long document asks the owner to scroll rather than being pointed to one action.
- **Kumusta.** Holds up: The most welcoming; perfect for first-time or nervous owners; every term is explained. Falls short: The metaphors (jars, shelves) stop scaling with a big catalogue; can feel less "serious" to a bank or an accountant reading over the owner's shoulder.
- **Yard.** Holds up: Most specific to distributors: cover against lead time and the dock schedule answer daily operational questions no generic dashboard does. Falls short: Finance (profit, expenses) is secondary and reached indirectly; owners who think money-first will look for it.
- **Brief.** Holds up: Clearest answer to "what do I do today"; finishes, so it respects a busy owner's time. Falls short: Exploring freely is harder; a day with 15 decisions would need grouping or a cap.
- **Lens.** Holds up: Most flexible: one canvas answers dozens of questions with the right chart, and scales to new data without new screens. Falls short: Puts the asking on the owner. The home has no opinion about what matters today, which a busy owner needs most.
- **Meridian.** Holds up: Best at "when": collisions of payments, run-outs and promises are obvious at a glance. Falls short: Dense, and needs sideways scrolling on a phone. "Who owes me most" is easier in a list than on a time axis.
- **Tide.** Holds up: Most memorable and calming, and the money-cycle ring explains cash pressure (customers take longer than suppliers give) in one picture. Falls short: Radial charts are less precise than bars; exact comparisons depend on the centre readout and dialogs.

### Self-critique: the five weakest

1. **Meridian** is the weakest overall: the timeline is powerful for planning but hard to read on a phone, and most daily questions are "what" and "who", not "when".
2. **Kumusta** wins on warmth but its sophistication is thin. Jars and shelves are charming the first time and slow the tenth; at fifty products the shelf metaphor breaks, and it hides depth instead of organising it.
3. **Bridge** is excellent to use but a panel of design leaders would call it a refined version of a familiar overview page: list plus line chart plus side panel. The Position Beam alone does not make it a signature.
4. **Raster** is beautifully disciplined but it is a known style applied well rather than a new idea. It presents information precisely without doing much of the thinking for the owner.
5. **Lens** is an analyst's tool. Busy owners will not build sentences, and without a strong "today" view it fails the 5-second test.

## Next round (brief section 12)

Five replacement concepts that avoid the patterns of these ten: no sidebars, KPI rows, card grids or tables as the primary structure. They will be built after you have reviewed these. Production changes (Stage 6) wait for your selection and approval.
