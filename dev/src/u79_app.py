# Round 79 (dashboard): Getting paid settles everything in place (record a payment, settle utang), cleaner colours,
# centred profit statement, BIR 2307 one-tap marks and guide-only wording.
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r79.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r79.js') + "\nfunction renderSidebarForViewAsRole(){")

# --- walk-in sale: optional photo (kept with the sale, shown on utang lines) ---
P("note: String(QS.note || '').trim().slice(0, 300), branch: bkHereBranch()};", "note: String(QS.note || '').trim().slice(0, 300), branch: bkHereBranch()};\n  const _nf79Photo = QS.photo || null; if(_nf79Photo) sale.photo = _nf79Photo;")
P("    } else Object.assign(sale, bkRowSale(data));\n  }",
  "    } else Object.assign(sale, bkRowSale(data));\n    if(_nf79Photo && !sale.pending){ try{ const _pp = await bkUploadPhoto(_nf79Photo, 'sale-' + sale.id); await sb.from('downstream_sales').update({photo_path: _pp}).eq('id', sale.id); sale.photo = _pp; }catch(e){ console.warn('sale photo', e); } }\n  }")
P("voidedAt: r.voided_at, voidedBy: r.voided_by_name || '', voidReason: r.void_reason || ''}; }", "voidedAt: r.voided_at, voidedBy: r.voided_by_name || '', voidReason: r.void_reason || '', photo: r.photo_path || ''}; }")
P("      ${typeof nf45CustHtml === 'function' ? nf45CustHtml(custs) : ''}</section>", "      ${typeof nf45CustHtml === 'function' ? nf45CustHtml(custs) : ''}</section>\n    ${QS.paidWith === 'credit' && typeof nf79UtangPhotoHtml === 'function' ? nf79UtangPhotoHtml() : ''}", 2)

# --- BIR 2307: one tap to mark sent (no "how did you send it" question that went nowhere); the amount before VAT can't exceed the bill ---
P("  if(status === 'sent') note = prompt('How did you send it? (optional, e.g. \"emailed to accounting@…\")', '') || null;\n", "")
P("  if(c.amount <= 0){ markFieldInvalid('ewtBase_' + poId, 'Enter the amount before VAT.'); return; }",
  "  if(c.amount <= 0){ markFieldInvalid('ewtBase_' + poId, 'Enter the amount before VAT.'); return; }\n  { const _mx = roundPeso(poTotal(po) / (1 + Number(po.taxRate || 0))); if(c.base > _mx + 0.5){ markFieldInvalid('ewtBase_' + poId, `The amount before VAT can't be more than this bill's ${fmtPHP(_mx)}.`); return; } }")
