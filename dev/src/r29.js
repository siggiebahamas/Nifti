/* ===== Round 29: real files in chat. Photos up to 1080p, PDFs keep their names, nothing expires ===== */
// Before this, a chat "attachment" only saved the file's name and size. Now the file itself goes to private storage
// (bucket chat-files, readable only by the two businesses in that chat) and stays until someone deletes the chat.
const NF29 = {urls: {}, max: 1920};
function nf29Size(n){ const k = n / 1024; return k > 1024 ? (k / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(k)) + ' KB'; }
function nf29Safe(name){ return String(name || 'file').normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').slice(-90) || 'file'; }
function nf29Img(file){
  return new Promise(res => { const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { const k = Math.min(1, NF29.max / Math.max(img.width, img.height)); const w = Math.round(img.width * k), h = Math.round(img.height * k);
      if(k === 1 && file.size < 2.5 * 1024 * 1024 && /jpe?g/i.test(file.type)){ URL.revokeObjectURL(url); return res({blob: file, w, h, type: file.type}); }
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob(b => { URL.revokeObjectURL(url); res({blob: b || file, w, h, type: 'image/jpeg'}); }, 'image/jpeg', 0.88); };
    img.onerror = () => { URL.revokeObjectURL(url); res({blob: file, w: 0, h: 0, type: file.type}); };
    img.src = url; });
}
handleFileSelect = async function(e){
  const file = e.target.files && e.target.files[0]; if(!file) return;
  if(file.size > 25 * 1024 * 1024){ showToast('That file is over 25 MB. Send a smaller one.', 'warn'); e.target.value = ''; return; }
  const isImg = /^image\//.test(file.type) && !/gif|svg/.test(file.type);
  let blob = file, w = 0, h = 0, type = file.type || 'application/octet-stream', name = file.name;
  if(isImg){ const r = await nf29Img(file); blob = r.blob; w = r.w; h = r.h; type = r.type; if(type === 'image/jpeg' && !/\.jpe?g$/i.test(name)) name = name.replace(/\.[^.]+$/, '') + '.jpg'; }
  pendingAttachment = {name, size: nf29Size(blob.size), type, w, h, image: isImg, _file: blob, _url: URL.createObjectURL(blob)};
  document.getElementById('attachPreview').innerHTML = `<div class="nf29-pre">${isImg ? `<img src="${pendingAttachment._url}" alt="">` : `<span class="nf29-fi">${ATTACHMENT_ICON_SVG}</span>`}<span><b>${escapeHtml(name)}</b><small>${pendingAttachment.size}${isImg ? ` · ${w} × ${h}` : ''}</small></span><button type="button" onclick="pendingAttachment=null; document.getElementById('attachPreview').innerHTML=''; document.getElementById('fileInput').value='';" aria-label="Remove">✕</button></div>`;
};
window.handleFileSelect = handleFileSelect;
(function(){
  const base = window.sendRealMessage; if(typeof base !== 'function' || base._nf29) return;
  const w = async function(conv, localMsg){
    const a = localMsg.attachment;
    if(a && a._file && conv && conv.conversationRowId){
      try{ const path = `${conv.conversationRowId}/${localMsg.id}/${nf29Safe(a.name)}`;
        const { error } = await sb.storage.from('chat-files').upload(path, a._file, {contentType: a.type, upsert: true}); if(error) throw error;
        const keepUrl = a._url; localMsg.attachment = {name: a.name, size: a.size, type: a.type, w: a.w, h: a.h, image: a.image, path}; NF29.urls[path] = keepUrl;
      }catch(e){ showToast("Couldn't send the file. Check your internet and try again.", 'error'); localMsg._pendingSync = true; if(activeConvId === conv.id) renderThread(conv); return; }
    }
    return base.apply(this, arguments);
  };
  w._nf29 = true; window.sendRealMessage = w; try{ sendRealMessage = w; }catch(e){}
})();
function nf29Att(m){
  const a = m.attachment || {}, key = a.path || '', local = a._url || NF29.urls[key] || '';
  const img = a.image || /^image\//.test(a.type || '');
  const attrs = `data-nf29="${escapeHtml(key)}" data-nf29n="${escapeHtml(a.name || 'file')}"${local ? ` data-nf29u="${escapeHtml(local)}"` : ''}`;
  if(img) return `<button type="button" class="nf29-img" ${attrs} onclick="nf29Open(this, true)"><img ${local ? `src="${escapeHtml(local)}"` : ''} alt="${escapeHtml(a.name || 'Photo')}" loading="lazy"></button>`;
  return `<button type="button" class="msg-attachment nf29-file" ${attrs} onclick="nf29Open(this, false)">${ATTACHMENT_ICON_SVG}<span><b>${escapeHtml(a.name || 'File')}</b><small>${escapeHtml(a.size || '')}${key || local ? ' · tap to open' : ' · not saved (sent before files were kept)'}</small></span></button>`;
}
async function nf29Url(path, name, download){
  if(!path) return '';
  const k = path + (download ? '|d' : ''); if(NF29.urls[k] && NF29.urls[k].exp > Date.now()) return NF29.urls[k].u;
  const { data, error } = await sb.storage.from('chat-files').createSignedUrl(path, 3600, download ? {download: name} : undefined); if(error) throw error;
  NF29.urls[k] = {u: data.signedUrl, exp: Date.now() + 3300000}; return data.signedUrl;
}
async function nf29Open(el, isImg){
  const path = el.dataset.nf29, name = el.dataset.nf29n, local = el.dataset.nf29u;
  try{ const url = local || await nf29Url(path, name, !isImg);
    if(!url){ showToast('This file was sent before files were kept, so only its name was saved.', 'warn'); return; }
    if(isImg){ let ov = document.getElementById('nf29View'); if(!ov){ ov = document.createElement('div'); ov.id = 'nf29View'; ov.className = 'nf29-view'; ov.onclick = e => { if(e.target === ov || e.target.closest('.nf29-x')) ov.hidden = true; }; document.body.appendChild(ov); }
      const dl = local || (path ? await nf29Url(path, name, true) : url);
      ov.innerHTML = `<div class="nf29-vh"><b>${escapeHtml(name)}</b><a href="${escapeHtml(dl)}" download="${escapeHtml(name)}">Save</a><button type="button" class="nf29-x" aria-label="Close">✕</button></div><img src="${escapeHtml(url)}" alt="${escapeHtml(name)}">`; ov.hidden = false; }
    else { const a = document.createElement('a'); a.href = url; a.download = name; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
  }catch(e){ showToast((e && e.message) || "Couldn't open the file.", 'error'); }
}
// photos load their picture after the thread is drawn
async function nf29Fill(){
  const imgs = [...document.querySelectorAll('.nf29-img[data-nf29]:not([data-nf29u])')].filter(b => b.dataset.nf29 && !b.querySelector('img').getAttribute('src'));
  for(const b of imgs){ try{ b.querySelector('img').src = await nf29Url(b.dataset.nf29, b.dataset.nf29n, false); }catch(e){} }
}
(function(){
  const rt = window.renderThread;
  if(typeof rt === 'function' && !rt._nf29){ const w = function(){ const r = rt.apply(this, arguments); setTimeout(nf29Fill, 0); return r; }; w._nf29 = true; window.renderThread = w; try{ renderThread = w; }catch(e){} }
  const rf = window.renderFilesView;
  if(typeof rf === 'function' && !rf._nf29){ const w = function(conv){ const body = document.getElementById('threadBody'); const files = conv.messages.filter(m => m.attachment);
      body.innerHTML = `<div class="nf29-fh">Every file and photo with ${escapeHtml(conv.name)}, kept for good</div>` + (files.length ? `<div class="nf29-grid">${files.map(m => `<div class="nf29-cell">${nf29Att(m)}<small>${escapeHtml(m.date || '')} ${escapeHtml(m.time || '')}</small></div>`).join('')}</div>` : `<p class="nf29-none">No files shared in this conversation yet.</p>`);
      setTimeout(nf29Fill, 0); }; w._nf29 = true; window.renderFilesView = w; try{ renderFilesView = w; }catch(e){} }
  const fi = document.getElementById('fileInput'); if(fi) fi.setAttribute('accept', 'image/*,application/pdf,.xlsx,.xls,.csv,.doc,.docx');
})();
