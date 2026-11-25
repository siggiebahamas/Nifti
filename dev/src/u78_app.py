# Round 78 (dashboard): owner view margin, Getting paid compact and inline, easy confirmations (proof later),
# Money overview simplified with owner draws, BIR 2307 uploads instead of the fill-in helper.
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r78.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r78.js') + "\nfunction renderSidebarForViewAsRole(){")

# --- Easy confirmations: a payment or a delivery can be saved with the basics; the photo / reference / signature can come later ---
P("  if(method !== 'cash' && !reference){ markFieldInvalid('payRef_'+id, 'Please enter the '+(method==='check'?'check number':'reference number')+\" — it's how the supplier finds this payment in their own account.\"); return; }\n", "")
P("  if(side==='buyer' && !file && amount > PAYMENT_PROOF_REQUIRED_THRESHOLD){\n    markFieldInvalid('paidProof_'+id, `Payments over ${fmtPHP(PAYMENT_PROOF_REQUIRED_THRESHOLD)} need a screenshot or photo of the receipt.`);\n    return;\n  }\n", "")
P("proofUrl: isSafeProofUrl(proofUrl) ? proofUrl : null, proofName: proofName || null, submittedBy: side, recordedBy: side === 'supplier' ? slMemberName() : null};",
  "proofUrl: isSafeProofUrl(proofUrl) ? proofUrl : null, proofName: proofName || null, submittedBy: side, recordedBy: side === 'supplier' ? slMemberName() : null};\n    { const _m = []; if(method !== 'cash' && !reference) _m.push('ref'); if(!entry.proofUrl && method !== 'cash' && side === 'buyer') _m.push('proof'); if(_m.length){ entry.missing = _m; setTimeout(() => { try{ showToast('Saved. It is marked “add proof later”, so you can finish it anytime.', 'info'); }catch(e){} }, 1800); } }")
P("  if(!name){ markFieldInvalid('supplierDcName_'+id, 'Please enter the name of the person who received the goods.'); return; }\n  if(!signatureDataUrl){ markFieldInvalid(padId, 'Please capture a signature before submitting.'); return; }\n", "")
P("capturedBy:'supplier', receivedBy:name, signatureDataUrl, buyerAcknowledged:false};",
  "capturedBy:'supplier', receivedBy:name, signatureDataUrl, buyerAcknowledged:false};\n    if(!signatureDataUrl && !proofUrl) po.deliveryConfirmation.missing = ['proof'];")
# the order steps: only the basics are required
P("ph: method === 'check' ? 'e.g. 000781' : 'e.g. 5521 0087 113', req: 1, need: method === 'check' ? 'Type the check number' : 'Type the reference number', mode: 'numeric'}",
  "ph: method === 'check' ? 'e.g. 000781' : 'e.g. 5521 0087 113', opt: 1, hint: 'You can add it later', need: method === 'check' ? 'Type the check number' : 'Type the reference number', mode: 'numeric'}")
P("hint: needPhoto ? `Needed for payments over ${bkPeso(PAYMENT_PROOF_REQUIRED_THRESHOLD)}` : 'They confirm faster with a photo', req: needPhoto ? 1 : 0, opt: needPhoto ? 0 : 1,",
  "hint: needPhoto ? 'Good to have for big payments. You can add it later.' : 'They confirm faster with a photo. You can add it later.', req: 0, opt: 1,")
P("{type: 'text', id: 'rcv', label: 'Who received it?', ph: 'Name of the person who signed', req: 1, need: 'Type who received it'},",
  "{type: 'text', id: 'rcv', label: 'Who received it?', ph: 'Name of the person who signed', opt: 1, need: 'Type who received it'},")
P("{type: 'tiles', id: 'proof', label: 'Proof it arrived', req: 1, need: 'Add a signature or a photo',", "{type: 'tiles', id: 'proof', label: 'Proof it arrived', opt: 1, hint: 'You can add it later', need: 'Add a signature or a photo',")
P("if(proof === 'photo') tasks.push({type: 'photo', id: 'photo', label: 'Photo of the signed receipt', req: 1, need: 'Add the photo of the signed receipt'});",
  "if(proof === 'photo') tasks.push({type: 'photo', id: 'photo', label: 'Photo of the signed receipt', opt: 1, need: 'Add the photo of the signed receipt'});")
# freight "delivered" step: a photo is welcome but not required; without it the delivery is marked "proof missing"
P("  if(key==='delivered' && !photoFile){\n    markFieldInvalid('deliveryPhoto_'+id, 'A delivery photo is required before this milestone can be marked complete.');\n    return;\n  }\n  if(key==='delivered' && photoInput.dataset.qualityConfirmed !== '1'){",
  "  if(key==='delivered' && photoFile && photoInput.dataset.qualityConfirmed !== '1'){")
P("    if(key==='delivered'){ po.status = 'delivered'; po.atRisk = false; po.riskNote = ''; }",
  "    if(key==='delivered'){ po.status = 'delivered'; po.atRisk = false; po.riskNote = ''; if(!photoUrl){ po.deliveryConfirmation = po.deliveryConfirmation || {confirmedDate: APP_TODAY, capturedBy: side}; po.deliveryConfirmation.missing = ['proof']; } }")
P("A delivery photo is required to mark this complete.", "A delivery photo helps if anything goes wrong. You can add it later.")
# +Create: the owner can note money they took out from anywhere
_cc = "<div class=\"notif-item\" style=\"cursor:pointer;\" onclick=\"closeCreateMenu(); go('cashcount');\"><div><div class=\"notif-text\">Count today's cash</div></div></div>"
P(_cc, _cc + "\n            <div class=\"notif-item\" style=\"cursor:pointer;\" onclick=\"closeCreateMenu(); nf78TookMoney();\"><div><div class=\"notif-text\">I took money out (owner)</div></div></div>")
