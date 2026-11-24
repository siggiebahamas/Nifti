# Round 69: role-aware dashboards and end-to-end workflow clarity.
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()

# Use raw count records for the per-person variance summary; do not attribute a
# same-day aggregate to whichever employee happened to be the first record.
P("""function mhPersonNet(name, m){ const by = mhCounts(); return Object.values(by).filter(c => mhFirst(c.by) === mhFirst(name) && (!m || bkMonth(c.day) === m)).reduce((a, c) => a + c.diff, 0); }""",
"""function mhPersonNet(name, m){ return BK.counts.filter(c => !c.reopenedAt && mhFirst(c.by) === mhFirst(name) && (!m || bkMonth(c.day) === m)).reduce((a, c) => a + (Number(c.difference) || 0), 0); }""")

P("A different counter the next day exposes a gap someone is hiding.",
  "A second person provides an independent check and reduces single-person handling risk.")
P("Missing stock plus missing cash points to theft, not a miscount.",
  "A stock variance near a cash variance is a reason to review both records and recount. Neither one proves theft or misconduct.")
P("was short \\u0024{per[n]} times this month.",
  "had a cash variance recorded \\u0024{per[n]} times this month.")
P("were short \\u0024{wd[w]} times this month.",
  "had a cash variance on \\u0024{wd[w]} days this month.")
P("Check for a leak, a wrong bill, or someone using it.",
  "Review receipts, timing and category coding before deciding what changed.")

# Preserve the creator ID on sales so the staff view can be scoped to the
# signed-in team member rather than relying on display names.
P("paidWith: r.paid_with || '', payments: r.payments || [], branch: r.branch || null, by: r.created_by_name || '', note: r.note || '',",
  "paidWith: r.paid_with || '', payments: r.payments || [], branch: r.branch || null, by: r.created_by_name || '', byId: r.created_by, note: r.note || '',")

t=S['text']
k=t.index('</style>')
S['text']=t[:k]+'\\n'+rd('r69_dashboard_ux.css')+'\\n'+t[k:]
P("function renderSidebarForViewAsRole(){", rd('r69_dashboard_ux.js')+"\\nfunction renderSidebarForViewAsRole(){")
