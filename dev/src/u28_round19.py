# Round 19: tab buttons that never went dead, 10 lines in the left menu, landing pages after logout,
# customers | suppliers side by side on a PC, and the pages that lost a menu line are reachable again.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''

# the demo no longer jumps over the landing page on every load
P("try{ const a = document.querySelector('#view-app .app-page.active'); if(a) navigate(a.id.slice(5)); }catch(e){}",
  "try{ const a = document.querySelector('#view-app .app-page.active'), app = document.getElementById('view-app'); if(a && ((typeof nf19InApp === 'function' && nf19InApp()) || (app && !app.classList.contains('hidden')))) navigate(a.id.slice(5)); }catch(e){}")
P("bootNifti().then(() => { if(window._openSignup", "bootNifti().then(() => { try{ nf19AfterBoot(); }catch(e){} if(window._openSignup")

P("function renderSidebarForViewAsRole(){", rd('r19.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 19 css begin ===== */\n' + rd('r19.css') + '\n/* ===== Round 19 css end ===== */\n' + t[i:]
