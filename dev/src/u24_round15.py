# Round 15: Customers & suppliers header without the empty row, and words on the left of the Home chart.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
P("navigate('invite')\">+ Invite a customer</button>", "navigate('invite')\"><span class=\"nf-inv-l\">+ Invite a customer</span><span class=\"nf-inv-s\">+ Invite</span></button>")
P("navigate('invite')\">+ Invite a supplier</button>", "navigate('invite')\"><span class=\"nf-inv-l\">+ Invite a supplier</span><span class=\"nf-inv-s\">+ Invite</span></button>")
P("function renderSidebarForViewAsRole(){", rd('r15.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 15 css begin ===== */\n' + rd('r15.css') + '\n/* ===== Round 15 css end ===== */\n' + t[i:]
