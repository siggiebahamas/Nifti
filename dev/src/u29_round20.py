# Round 20: a sign-in message that says what's wrong, the owner's full menu (Money has all 8 pages),
# "Who sees what" for staff, tabs in a coloured band, Orders in two columns, clean cards in both-sides
# pages, and a much shorter landing page with no Free/Pro badges.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''

# sign in: plain words instead of "Invalid login credentials"
P("""  const { error } = await sb.auth.signInWithPassword({ email, password });
  if(error){ if(errEl) errEl.textContent = error.message; return; }""",
  """  const { error } = await sb.auth.signInWithPassword({ email, password });
  if(error){ if(errEl){ try{ nf20SignInError(errEl, error); }catch(e){ errEl.textContent = error.message; } } return; }""")

P("function renderSidebarForViewAsRole(){", rd('r20.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 20 css begin ===== */\n' + rd('r20.css') + '\n/* ===== Round 20 css end ===== */\n' + t[i:]
