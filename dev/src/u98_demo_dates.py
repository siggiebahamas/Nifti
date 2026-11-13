# U98 (runs just before u99): the demo's "today" is the real today.
# The demo was written on Wed, Aug 26 2026, with every sample date typed in by hand. Each of those dates (and the
# "Aug 20, 9:15 AM" style chat times) now goes through nfDD()/nfDS(), which move it forward by the number of days
# between Aug 26 2026 and the real today, only while no business is signed in. A signed-in business never sees a
# moved date. The demo starts fresh each new day, so yesterday's saved demo doesn't carry old dates.
import re
from patchlib import S
t = S['text']
scripts = [m for m in re.finditer(r'<script(?:\s[^>]*)?>', t)]
best = max(scripts, key=lambda m: (t.find('</script>', m.end()) - m.end()) if 'src=' not in m.group(0) else -1)
a = best.end(); b = t.find('</script>', a)
js = t[a:b]
n1 = n2 = 0
def rep_iso(m):
    global n1; n1 += 1
    q, d, tm = m.group(1), m.group(2), m.group(3) or ''
    return 'nfDD(%s%s%s%s)' % (q, d, tm, q)
js = re.sub(r"""(['"])(2026-0[4-9]-[0-3]\d)((?:T[0-9:.]+Z?)?)\1(?!\s*:)""", rep_iso, js)  # not object keys (the holiday list)
def rep_md(m):
    global n2; n2 += 1
    return 'nfDS(%s%s%s)' % (m.group(1), m.group(2), m.group(1))
js = re.sub(r"""(['"])((?:Jul|Aug|Sep) \d{1,2}(?:, \d{1,2}:\d{2} [AP]M)?)\1(?!\s*:)""", rep_md, js)
helper = r"""
// ---- the demo's today is the real today (see u98_demo_dates.py) ----
const NF26_DEMO_BASE = Date.UTC(2026, 7, 26);
const NF26_SHIFT = (function(){ const d = new Date(); return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - NF26_DEMO_BASE) / 864e5); })();
const NF26_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function nfDemoNow(){ return typeof myBusiness === 'undefined' || !myBusiness; }
function nfDD(s){
  if(!NF26_SHIFT || !nfDemoNow()) return s;
  const y = +s.slice(0, 4), m = +s.slice(5, 7) - 1, d = +s.slice(8, 10); const x = new Date(Date.UTC(y, m, d) + NF26_SHIFT * 864e5);
  return x.getUTCFullYear() + '-' + String(x.getUTCMonth() + 1).padStart(2, '0') + '-' + String(x.getUTCDate()).padStart(2, '0') + s.slice(10);
}
function nfDS(s){
  if(!NF26_SHIFT || !nfDemoNow()) return s;
  const m = s.match(/^([A-Z][a-z]{2}) (\d{1,2})(.*)$/); if(!m) return s; const mi = NF26_MON.indexOf(m[1]); if(mi < 0) return s;
  const x = new Date(Date.UTC(2026, mi, +m[2]) + NF26_SHIFT * 864e5); return NF26_MON[x.getUTCMonth()] + ' ' + x.getUTCDate() + m[3];
}
(function(){ try{
  const d = new Date(), today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  if(localStorage.getItem('nifti-demo-day') !== today){
    ['nifti-app-state-v2', 'nifti-books-demo-v4', 'nifti-ledger-demo-v3', 'nifti-payroll-demo-v2', 'nifti-issues-demo-v1', 'nifti-order-photos-demo-v1'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('nifti-demo-day', today);
  }
}catch(e){} })();
"""
t = t[:a] + helper + js + t[b:]
S['text'] = t
print('demo dates moved to today:', n1, 'dates,', n2, 'chat times')
