import { chromium } from 'playwright';
import fs from 'fs';
const PAGINE = fs.readdirSync('.').filter(f=>f.endsWith('.html')).map(f=>f.slice(0,-5))
  .filter(p=>!/^(404|offline)$/.test(p)).sort();
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:1400,height:900} });
await c.addInitScript(()=>{try{localStorage.setItem('eih-lang','si')}catch(e){}});
const p = await c.newPage();
const out = [];
for (const pg of PAGINE) {
  try { await p.goto('http://localhost:3100/'+(pg==='index'?'':pg), { waitUntil:'domcontentloaded', timeout:20000 }); }
  catch(e){ out.push([pg,-1]); continue; }
  await p.waitForTimeout(2200);
  const n = await p.evaluate(()=>{
    let c=0; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n;
    while((n=w.nextNode())){ const t=(n.nodeValue||'').trim();
      if(t.length<8||/[඀-෿]/.test(t)||!/[a-zàèéìòù]{3}/i.test(t))continue;
      const el=n.parentElement; if(!el||el.closest('script,style,noscript'))continue;
      if(!el.getClientRects().length||el.closest('[hidden]'))continue; c++; }
    return c;
  });
  out.push([pg,n]);
}
await b.close();
out.sort((a,b2)=>b2[1]-a[1]);
for (const [pg,n] of out) if (n>4) console.log(pg.padEnd(24), n);
console.log('TOTALE:', out.reduce((s,r)=>s+Math.max(0,r[1]),0));
