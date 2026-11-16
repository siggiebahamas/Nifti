# Round 38: counts stay until handled, Money overview spacing + attachments, new-contact layout, Team tabs and people row,
# app bridges (print, share, downloads) and the open-chat catch-up
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

JS = [f for f in ['r38.js', 'r38_app.js'] if os.path.exists(os.path.join(HERE, f))]
CSS = [f for f in ['r38.css'] if os.path.exists(os.path.join(HERE, f))]
P("function renderSidebarForViewAsRole(){", "\n".join(rd(f) for f in JS) + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 38 css ===== */\n' + "\n".join(rd(f) for f in CSS) + '\n' + t[i:]

# Privacy notice: what the Nifti phone app reads (Google asks for this in the policy itself)
P('''  <h2>Who else handles it, and why</h2>''', '''  <h2 id="android">The Nifti phone app (Android)</h2>
  <p>The app is optional. It brings your Viber chats into Nifti and shows Nifti's alerts. It only does what you switch on, and you can switch any of it off in your phone's Settings.</p>
  <ul>
    <li><strong>Viber notifications.</strong> With notification access on, the app reads the sender's name, the message text and the time of Viber notifications only. Every other app is ignored.</li>
    <li><strong>The open Viber chat.</strong> With the Nifti accessibility setting on, the app reads the messages in the Viber chat on your screen (who sent each one, the text and the time), because Viber shows no notification for a chat that is already open. It reads Viber only. It never taps, types or reads passwords, and it is not used for anything else.</li>
    <li><strong>Viber photos and files.</strong> With photo access on, photos and files that Viber saves to the phone are sent to the chat they came from.</li>
    <li><strong>Contacts.</strong> With contacts access on, a sender's saved name is matched to their number so Nifti knows which customer or supplier it is. Your contact list is never uploaded and your contacts are never messaged.</li>
    <li><strong>Replies.</strong> When someone on your team replies in Nifti, the app sends that reply from your Viber on this phone.</li>
  </ul>
  <p>All of it goes, encrypted, only to your own business in Nifti, where only your team can see it. It is never sold, never used for ads, and never shared. The phone keeps a device key made for that phone only, never your password. Disconnect the phone in Nifti (Messages, Connect Viber) to stop it at once; your Viber messages are deleted with your business account like the rest of your records.</p>

  <h2>Who else handles it, and why</h2>''')
