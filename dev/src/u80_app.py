# Round 80 (dashboard): utang you can find and track (history, undo), Money overview cost jumps, cleaner Getting paid,
# profit margin tile with what pulled it down, Create menu sections.
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r80.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r80.js') + "\nfunction renderSidebarForViewAsRole(){")

# --- plainer names for the "someone owes me" buttons (not only utang) ---
P("Bring in old utang</button>", "Bring in old records</button>")
P('onclick="openOpeningBalances()">+ Add what a customer owes</button>', 'onclick="openOpeningBalances()">+ Someone owes me</button>')
P('<div class="notif-text">Add what a customer owes you</div>', '<div class="notif-text">Someone owes me</div>')
S['text'] = S['text'].replace('Tap "+ Add what a customer owes".', 'Tap "+ Someone owes me".').replace('tap "+ Add what a customer owes".', 'tap "+ Someone owes me".')
P('"+ Add what a customer owes": "+ Itala ang utang ng customer",', '"+ Add what a customer owes": "+ Itala ang utang ng customer",\n"+ Someone owes me": "+ May utang sa akin",\n"Someone owes me": "May utang sa akin",\n"Bring in old records": "Ipasok ang lumang tala",')

# --- utang: payment history column and quick ways in ---
P("voidReason: r.void_reason || '', photo: r.photo_path || ''}; }", "voidReason: r.void_reason || '', photo: r.photo_path || '', payLog: Array.isArray(r.payment_log) ? r.payment_log : []}; }")
_rs = "<div class=\"notif-item\" style=\"cursor:pointer;\" onclick=\"closeCreateMenu(); go('sales'); setTimeout(()=>{ if(typeof openQuickSale==='function') openQuickSale(); }, 60);\"><div><div class=\"notif-text\">Record a sale</div></div></div>"
P(_rs, _rs + "\n            <div class=\"notif-item\" style=\"cursor:pointer;\" onclick=\"closeCreateMenu(); nf80NewUtang();\"><div><div class=\"notif-text\">Record utang (pay later)</div></div></div>")

# --- header buttons moved onto the toolbar came back missing after the page redrew (e.g. "+ New sale" on a second visit) ---
P("  const head = pg.querySelector(':scope > .page-head') || pg.querySelector('.page-head'); if(!head || head.offsetParent === null) return;\n  pg.querySelectorAll('.nf55-bar')",
  "  const head = pg.querySelector(':scope > .page-head') || pg.querySelector('.page-head'); if(!head || head.offsetParent === null) return;\n  if(head._nf55b) head._nf55b.forEach(b => { if(!b.isConnected || !pg.contains(b)) head.appendChild(b); });\n  pg.querySelectorAll('.nf55-bar')")
P("  if(have){ const acts = document.createElement('div'); acts.className = 'nf55-acts'; btns.forEach(b => acts.appendChild(b)); have.appendChild(acts); return; }",
  "  if(have){ head._nf55b = btns; const acts = document.createElement('div'); acts.className = 'nf55-acts'; btns.forEach(b => acts.appendChild(b)); have.appendChild(acts); return; }")
P("  const acts = document.createElement('div'); acts.className = 'nf55-acts'; btns.forEach(b => acts.appendChild(b)); bar.appendChild(acts);\n}",
  "  head._nf55b = btns; const acts = document.createElement('div'); acts.className = 'nf55-acts'; btns.forEach(b => acts.appendChild(b)); bar.appendChild(acts);\n}")
