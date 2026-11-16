/* ===== Round 38: the phone app's setup, ready for the Play Store =====
   Google asks apps that read notifications, the screen or contacts to say plainly, before asking,
   what they read, why, and where it goes. Each switch now opens that short note first.
   "Catch messages in the open chat" is no longer optional: without it, a chat you have open on screen
   would never reach Nifti. */
const NF38D = {
  notif: {title: 'Nifti reads your Viber notifications',
    what: 'The name, message text and time of each Viber notification.',
    why: 'So customer and supplier messages land in Nifti, next to their orders, and your team can reply.',
    not: 'Nifti ignores every other app. It never reads your SMS, calls, or other chat apps.',
    then: "NiftiAndroid.open('notif')"},
  screen: {title: 'Nifti reads the Viber chat you have open',
    what: 'The messages in the Viber chat on your screen: who sent each one, the text and the time.',
    why: "Viber shows no notification for a chat that's already open, muted or read on this phone. Without this, those messages would never reach Nifti.",
    not: 'Only Viber chats. Nifti does not read other apps, does not tap or type for you, and does not see passwords.',
    then: "NiftiAndroid.open('screen')"},
  perms: {title: 'Alerts, Viber photos and your contacts',
    what: 'Photos and files Viber saves to this phone, and the names and numbers in your contacts.',
    why: 'Photos of orders and payment slips go with the right chat, and a saved number tells Nifti which customer or supplier sent it.',
    not: 'Contacts are only matched against Viber senders. Nifti never messages your contacts and never uploads your contact list.',
    then: "NiftiAndroid.open('perms')"},
};
function nf38Agreed(k){ try{ return JSON.parse(localStorage.getItem('nifti-disclosed') || '{}')[k]; }catch(e){ return false; } }
function nf38Disclose(k){
  const d = NF38D[k]; if(!d) return;
  if(nf38Agreed(k)){ try{ new Function(d.then)(); }catch(e){} return; }
  slModal('nf38Disc', `<div class="sl-sheet-h"><b>${d.title}</b><button class="sl-x" onclick="slClose('nf38Disc')" aria-label="Close">✕</button></div>
    <div class="nf38-disc">
      <p><b>What Nifti reads</b>${d.what}</p>
      <p><b>Why</b>${d.why}</p>
      <p><b>What it doesn't do</b>${d.not}</p>
      <p><b>Where it goes</b>Only to your own business in Nifti, sent encrypted. Only people on your team can see it. It's never sold or shared, and you can switch this off any time in your phone's Settings.</p>
      <a class="nf38-disc-l" href="privacy.html#android" target="_blank" rel="noopener">Full privacy policy</a>
    </div>
    <div class="nf38-disc-b"><button type="button" class="btn btn-outline" onclick="slClose('nf38Disc')">Not now</button>
      <button type="button" class="btn btn-primary" onclick="nf38Agree('${k}')">I agree, continue</button></div>`);
}
function nf38Agree(k){
  let m = {}; try{ m = JSON.parse(localStorage.getItem('nifti-disclosed') || '{}'); }catch(e){}
  m[k] = Date.now(); try{ localStorage.setItem('nifti-disclosed', JSON.stringify(m)); }catch(e){}
  slClose('nf38Disc');
  try{ new Function(NF38D[k].then)(); }catch(e){}
}
(function(){
  if(typeof nf37vSteps !== 'function') return;
  const base = nf37vSteps;
  const w = function(A){
    const steps = base.apply(this, arguments);
    steps.forEach(s => {
      if(!s.btns) return;
      if(s.k === 'screen'){
        s.opt = false;
        s.title = 'Catch messages in the chat you have open';
        s.sub = "Viber shows no notification for a chat that's open, muted or already read on this phone. Turn on <b>Nifti</b> under <b>Downloaded apps</b> (or <b>Installed apps</b>) so every one of those messages comes in too.";
      }
      if(NF38D[s.k]) s.btns = s.btns.map(b => b && b[1] === NF38D[s.k].then ? [b[0], `nf38Disclose('${s.k}')`, b[2]] : b);
    });
    // the open-chat reader matters as much as notifications: ask for it right after them
    const i = steps.findIndex(s => s.k === 'screen');
    if(i > 1){ const [s] = steps.splice(i, 1); steps.splice(1, 0, s); }
    return steps;
  };
  window.nf37vSteps = w; try{ nf37vSteps = w; }catch(e){}
})();
