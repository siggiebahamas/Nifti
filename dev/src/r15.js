/* ===== Round 15: chart labels on Home ("How the business is doing") ===== */
/* Same chart as Round 11, plus plain words on the left: "Sales" next to the bars, "Profit / Loss" next to the profit bars.
   On a phone the words sit above each chart so the bars keep their width. */
nfTrendSvg = function(months){
  const ph = typeof nfIsPhone === 'function' && nfIsPhone();
  const W = ph ? 340 : 690, labW = ph ? 0 : 118, padX = ph ? 4 : 12, x0 = labW + padX, x1 = W - padX;
  const cap = ph ? 28 : 0, top = 26 + cap, sH = ph ? 104 : 118, n = months.length, bw = (x1 - x0) / n, barW = Math.min(44, bw * (ph ? 0.62 : 0.52));
  const maxS = Math.max(1, ...months.map(m => m.sales)), maxP = Math.max(1, ...months.map(m => Math.abs(m.profit))), avg = months.reduce((a, m) => a + m.sales, 0) / n;
  const lblY = top + sH + 22, plTop = lblY + 22 + (ph ? 30 : 0), plH = 84, z = plTop + plH / 2, H = plTop + plH + 16;
  const ay = top + sH - avg / maxS * sH, anyLoss = months.some(m => m.profit < 0);
  const plName = anyLoss ? 'Profit / Loss' : 'Profit';
  let s = `<svg viewBox="0 0 ${W} ${H}" class="nft-svg" role="img" aria-label="Sales and ${plName.toLowerCase()}, last ${n} months"><defs>
    <linearGradient id="nftS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C7D7EE"/><stop offset="1" stop-color="#E6EEF8"/></linearGradient>
    <linearGradient id="nftN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F6FD6"/><stop offset="1" stop-color="#5B8FE3"/></linearGradient></defs>`;
  if(ph){
    s += `<text x="${padX}" y="18" class="nft-lab">Sales <tspan class="nft-lab2" dx="4">each month</tspan></text>`;
    s += `<text x="${padX}" y="${lblY + 36}" class="nft-lab">${plName} <tspan class="nft-lab2" dx="4">after all costs</tspan></text>`;
  } else {
    const sy = top + sH / 2;
    s += `<text x="0" y="${sy - 2}" class="nft-lab">Sales</text><text x="0" y="${sy + 16}" class="nft-lab2">each month</text>`;
    s += `<text x="0" y="${z - 2}" class="nft-lab">${plName}</text><text x="0" y="${z + 16}" class="nft-lab2">after all costs</text>`;
    s += `<line x1="${labW - 8}" x2="${labW - 8}" y1="${top - 8}" y2="${top + sH}" stroke="#E3E7EC"/><line x1="${labW - 8}" x2="${labW - 8}" y1="${plTop}" y2="${plTop + plH}" stroke="#E3E7EC"/>`;
  }
  s += `<line x1="${x0}" x2="${x1}" y1="${top + sH}" y2="${top + sH}" stroke="#DDE3EA"/><line x1="${x0}" x2="${x1}" y1="${ay}" y2="${ay}" stroke="#94A3B8" stroke-dasharray="4 4"/>`;
  s += `<line x1="${x0}" x2="${x1}" y1="${z}" y2="${z}" stroke="#CBD5E1"/>`;
  months.forEach((m, i) => { const cx = x0 + bw * (i + 0.5), h = Math.max(3, m.sales / maxS * sH), now = i === n - 1, x = cx - barW / 2;
    s += `<g><title>${m.label}: sales ${nfP(m.sales)}, ${m.profit < 0 ? 'loss' : 'profit'} ${nfP(Math.abs(m.profit))}</title><rect x="${x}" y="${top + sH - h}" width="${barW}" height="${h}" rx="8" fill="${now ? 'url(#nftN)' : 'url(#nftS)'}"/>`;
    s += `<text x="${cx}" y="${top + sH - h - 7}" text-anchor="middle" class="nft-v${now ? ' now' : ''}">${nfShort(m.sales)}</text><text x="${cx}" y="${lblY}" text-anchor="middle" class="nft-m${now ? ' now' : ''}">${m.label}${now && !ph ? ' (so far)' : ''}</text>`;
    const bh = Math.max(3, Math.abs(m.profit) / maxP * (plH / 2 - 6)), loss = m.profit < 0, pw = barW * 0.7;
    s += `<rect x="${cx - pw / 2}" y="${loss ? z : z - bh}" width="${pw}" height="${bh}" rx="5" fill="${loss ? '#EF4444' : '#22A06B'}"/><text x="${cx}" y="${loss ? z + bh + 13 : z - bh - 5}" text-anchor="middle" class="nft-p ${loss ? 'l' : 'g'}">${m.profit < 0 ? '' : '+'}${nfShort(m.profit)}</text></g>`; });
  return s + '</svg>';
};
