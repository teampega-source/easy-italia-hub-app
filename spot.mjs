import { chromium } from 'playwright';
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:1400,height:900} });
await c.addInitScript(()=>{try{localStorage.setItem('eih-lang','si')}catch(e){}});
const p = await c.newPage();
for (const pg of ['guide','opportunita','','italia-srilanka','community','privacy','lavoro-diritti']) {
  await p.goto('http://localhost:3100/'+pg, { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(2200);
  const ex = await p.evaluate(()=>{
    const o=[]; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n;
    while((n=w.nextNode())){ const t=(n.nodeValue||'').trim();
      if(t.length<8||/[඀-෿]/.test(t)||!/[a-zàèéìòù]{3}/i.test(t))continue;
      const el=n.parentElement; if(!el||el.closest('script,style,noscript'))continue;
      if(!el.getClientRects().length||el.closest('[hidden]'))continue; o.push(t.slice(0,42)); }
    return o;
  });
  console.log((pg||'index').padEnd(16), JSON.stringify(ex));
}
await b.close();
