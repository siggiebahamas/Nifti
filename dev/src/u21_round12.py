# Round 12: order table columns visually centred, round initials everywhere, stock "on the way" in the Status column,
# Money overview profit card in accounting format, cash outlook shows the next five items.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
P("function renderSidebarForViewAsRole(){", rd('r12.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 12 css begin ===== */\n' + rd('r12.css') + '\n/* ===== Round 12 css end ===== */\n' + t[i:]

# stock: no "+200 inbound" under the bar; an order on the way shows in Status and the action opens it
P("""const inboundHtml = (inboundInfo.status==='ok' && inboundInfo.quantity>0) ? `<div class="inv-row-sub" style="color:var(--green);">+${inboundInfo.quantity} inbound</div>` : '';""",
  """const inboundHtml = '';
    const nfInb = (inboundInfo.status==='ok' && inboundInfo.quantity>0 && tracked && (item.status==='critical' || item.status==='warning')) ? nfInboundInfo(item.name, inboundInfo.quantity) : null;""")
P("""      <td><span class="status-pill-icon ${sm.cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${sm.icon}</svg>${sm.label}</span></td>
      ${warehouseCell}${supplierCell}
      <td>${actionCell}</td>""",
  """      <td>${nfInb ? nfInb.pill : `<span class="status-pill-icon ${sm.cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${sm.icon}</svg>${sm.label}</span>`}</td>
      ${warehouseCell}${supplierCell}
      <td>${nfInb && nfInb.action ? nfInb.action : actionCell}</td>""")

# money overview: accounting format (red costs, grouped expenses, single rule for gross profit, double rule for profit)
P("""        <div class="pl-r"><span>− Cost of what you sold</span><b>${bkPeso(p.cost)}</b></div>""",
  """        <div class="pl-r pl-neg"><span>− Cost of what you sold</span><b>${bkPeso(p.cost)}</b></div>""")
P("""        <div class="pl-r"><span>− Expenses</span><b>${bkPeso(p.expenses)}</b></div>
        ${cats.map(([k, v]) => `<div class="pl-r pl-sub"><span>${escapeHtml(k)}</span><span>${bkPeso(v)}</span></div>`).join('')}""",
  """        <div class="pl-r pl-neg"><span>− Expenses</span><b>${bkPeso(p.expenses)}</b></div>
        ${cats.length ? `<div class="pl-grp">${cats.map(([k, v]) => `<div class="pl-r pl-sub"><span>${escapeHtml(k)}</span><span>${bkPeso(v)}</span></div>`).join('')}</div>` : ''}""")
# cash outlook: the next five money in/out, not every repeat for 90 days
P("""    <details class="lg-det"><summary>Show the ${items.length} items</summary>${items.sort((a, b) => a.d.localeCompare(b.d)).slice(0, 120).map(x => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(x.what)}</b><small>${bkDayLabel(x.d)}${x.late ? ' · overdue' : ''}</small></div><span class="bk-amt ${x.amt < 0 ? 'bk-bad' : ''}">${bkPeso(x.amt)}</span></div>`).join('')}</details></section>`;""",
  """    ${items.length ? `<div class="nf-next5"><h3>Next money in and out</h3>${items.sort((a, b) => a.d.localeCompare(b.d)).slice(0, 5).map(x => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(x.what)}</b><small>${bkDayLabel(x.d)}${x.late ? ' · overdue' : ''}</small></div><span class="bk-amt ${x.amt < 0 ? 'bk-bad' : ''}">${bkPeso(x.amt)}</span></div>`).join('')}${items.length > 5 ? `<p>${items.length - 5} more in the next 90 days are already counted in the table above.</p>` : ''}</div>` : ''}</section>`;""")
