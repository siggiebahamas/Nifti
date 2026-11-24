function qsScanSku(code){
 const raw=String(code||'').trim();if(!raw||!QS)return;
 const key=raw.toLowerCase();
 const stock=(inventoryData||[]).find(x=>[x.code,x.sku,x.barcode,x.name].some(v=>String(v||'').trim().toLowerCase()===key));
 const menu=(BK.menu||[]).find(x=>x.active&&[x.code,x.sku,x.barcode,x.name].some(v=>String(v||'').trim().toLowerCase()===key));
 const name=(stock&&stock.name)||(menu&&menu.name);
 if(!name){showToast('SKU not found. Check the item code in Stock.','warn');return;}
 const found=QS.lines.find(x=>String(x.product||'').toLowerCase()===String(name).toLowerCase());
 if(found)found.qty=(Number(found.qty)||0)+1;else QS.lines.push({product:name,qty:1,price:String(bkItemPrice(name)||'')});
 qsRender();setTimeout(()=>{const el=document.getElementById('qsSkuScan');if(el)el.focus();},0);
}