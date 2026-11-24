# Round 69: role-aware dashboards and end-to-end workflow clarity.
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()

# Use raw count records for the per-person variance summary.
P("""function mhPersonNet(name, m){ const by = mhCounts(); return Object.values(by).filter(c => mhFirst(c.by) === mhFirst(name) && (!m || bkMonth(c.day) === m)).reduce((a, c) => a + c.diff, 0); }""",
"""function mhPersonNet(name, m){ return BK.counts.filter(c => !c.reopenedAt && mhFirst(c.by) === mhFirst(name) && (!m || bkMonth(c.day) === m)).reduce((a, c) => a + (Number(c.difference) || 0), 0); }""")

P("A different counter the next day exposes a gap someone is hiding.",
  "A second person provides an independent check and reduces single-person handling risk.")
P("Missing stock plus missing cash points to theft, not a miscount.",
  "A stock variance near a cash variance is a reason to review both records and recount. Neither one proves theft or misconduct.")
P("was short ${per[n]} times this month.",
  "had a cash variance recorded ${per[n]} times this month.")
P("were short ${wd[w]} times this month.",
  "had a cash variance on ${wd[w]} days this month.")
P("Check for a leak, a wrong bill, or someone using it.",
  "Review receipts, timing and category coding before deciding what changed.")

# Preserve the creator ID on sales for exact staff-owned record filtering.
P("paidWith: r.paid_with || '', payments: r.payments || [], branch: r.branch || null, by: r.created_by_name || '', note: r.note || '',",
  "paidWith: r.paid_with || '', payments: r.payments || [], branch: r.branch || null, by: r.created_by_name || '', byId: r.created_by, note: r.note || '',")

t=S['text']
k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r69_dashboard_ux.css')+'\n'+t[k:]
P("function renderSidebarForViewAsRole(){", rd('r69_dashboard_ux.js')+"\nfunction renderSidebarForViewAsRole(){")

# The employee variance cards use each person's own count rows, not a daily
# aggregate that could assign two people's counts to the first name in the day.
P("""const mo = mhKey(y, m, 1).slice(0, 7), people = [...new Set(Object.values(by).filter(c => bkMonth(c.day) === mo).map(c => mhFirst(c.by)))];
  const pp = people.map(n => { const net = mhPersonNet(n, mo), offs = Object.values(by).filter(c => bkMonth(c.day) === mo && mhFirst(c.by) === n && Math.abs(c.diff) >= 1).sort((a, b) => a.day.localeCompare(b.day));
    const lastDay = Object.values(by).filter(c => mhFirst(c.by) === n).map(c => c.day).sort().pop();
    return `<button class="cdpp" type="button" onclick="mhOpenDay('${lastDay}')">${mhEsc(mhFull(n))} · net <b class="t${mhTone(net)}">${mhSigned(net)}</b>${offs.length ? `<span class="muted">· ${offs.map(c => mhLabel(c.day) + ' ' + mhSigned(c.diff)).join(', ')}</span>` : ''}</button>`; }).join('');""",
"""const mo = mhKey(y, m, 1).slice(0, 7), rawCounts = BK.counts.filter(c => !c.reopenedAt && bkMonth(c.day) === mo), people = [...new Set(rawCounts.map(c => mhFirst(c.by)))];
  const pp = people.map(n => { const rows = rawCounts.filter(c => mhFirst(c.by) === n), net = rows.reduce((a, c) => a + (Number(c.difference) || 0), 0), offs = rows.filter(c => Math.abs(Number(c.difference) || 0) >= 1).sort((a, b) => a.day.localeCompare(b.day));
    const lastDay = rows.map(c => c.day).sort().pop();
    return `<button class="cdpp" type="button" onclick="mhOpenDay('${lastDay}')">${mhEsc(mhFull(n))} · net <b class="t${mhTone(net)}">${mhSigned(net)}</b>${offs.length ? `<span class="muted">· ${offs.map(c => mhLabel(c.day) + ' ' + mhSigned(Number(c.difference) || 0)).join(', ')}</span>` : ''}</button>`; }).join('');""")
