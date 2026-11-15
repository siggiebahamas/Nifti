# Round 31: colored summary boxes, money coming up you can open, red unread counts, quieter menu foot,
# AI tools under Money, and chat smarts (quotes, invoices, order confirms, price changes, deliveries)
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

# tone classes: the new colors are cleared on each pass too
P("el.classList.remove('nt-bad', 'nt-warn', 'nt-good', 'nt-plain');", "el.classList.remove('nt-bad', 'nt-warn', 'nt-good', 'nt-plain', 'nt-info', 'nt-note', 'nt-gray');")

# AI tools: no "New" tag, and it sits under the Money group
P('<span>Notebook reader</span><em class="nf22-new">New</em></button></div>', '<span>Notebook reader</span></button></div>')
P('''  const at = box.querySelector('.nf20-g[data-g="money"]') || box.querySelector('#nf22Foot');
  if(g.parentElement !== box || g.nextElementSibling !== at) box.insertBefore(g, at || null);''',
  '''  const groups = [...box.querySelectorAll(':scope > .nf20-g')].filter(x => x !== g), lastG = groups[groups.length - 1];
  if(lastG){ if(lastG.nextElementSibling !== g) lastG.after(g); }
  else { const at = box.querySelector('#nf22Foot'); if(g.parentElement !== box || g.nextElementSibling !== at) box.insertBefore(g, at || null); }''')

# menu foot: plain rows, plan name as a small chip, "Help" with a red count
P('''<button type="button" class="nf26-plan" id="nf26PlanNav" onclick="nf26OpenPlans()">${NF26_STAR_IC}<span><b>Plans &amp; pricing</b><small id="nf26PlanSub">See what Pro adds</small></span></button>
      <button type="button" class="nf26-help" id="nf26HelpNav" onclick="nf26Help()">${NF26_HELP_IC}<span><b>Need help?</b><small>Message the Nifti team</small></span></button>''',
  '''<button type="button" class="nf26-plan" id="nf26PlanNav" onclick="nf26OpenPlans()">${NF26_STAR_IC}<span class="nf31-lbl">Plans &amp; pricing</span><small id="nf26PlanSub">Free</small></button>
      <button type="button" class="nf26-help" id="nf26HelpNav" onclick="nf26Help()" title="Message the Nifti team">${NF26_HELP_IC}<span class="nf31-lbl">Help</span></button>''')
P("const t = typeof nf26PlanLine === 'function' ? nf26PlanLine() : ''; if(sub && t && sub.textContent !== t) sub.textContent = t;",
  "const t = typeof nf31PlanChip === 'function' ? nf31PlanChip() : ''; if(sub && t && sub.textContent !== t) sub.textContent = t;")

# chat smarts under each message from the other side
P('<div class="msg-time">${tickHtml}${m.time}</div>\n    </div>', '<div class="msg-time">${tickHtml}${m.time}</div>${typeof nf31Ins === \'function\' ? nf31Ins(m, conv) : \'\'}\n    </div>')

P("function renderSidebarForViewAsRole(){", rd('r31.js') + "\n" + rd('r31_ai.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 31 css ===== */\n' + rd('r31.css') + '\n' + rd('r31_ai.css') + '\n' + t[i:]
