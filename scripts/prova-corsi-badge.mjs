/* Prova end-to-end di corsi base e avanzati, percorso e badge.
   Uso: npx serve . -l 3100 &  node scripts/prova-corsi-badge.mjs [base-url]
   Esce con codice 1 se un controllo non passa. */
import pw from 'playwright';
const { chromium } = pw;
const BASE = process.argv[2] || 'http://localhost:3100';
const b = await chromium.launch();

async function pagina(stato) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, serviceWorkers: 'block' });
  await ctx.addInitScript((s) => {
    try {
      localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: true, marketing: true }));
      for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    } catch (e) {}
  }, stato || {});
  const p = await ctx.newPage();
  p.setDefaultTimeout(25000);
  const errori = [];
  p.on('pageerror', e => errori.push(String(e).slice(0, 120)));
  return { ctx, p, errori };
}

function riga(nome, atteso, avuto) {
  const ok = atteso === avuto;
  console.log((ok ? '  ok   ' : '  ✗    ') + nome.padEnd(52) + (ok ? String(avuto) : `atteso ${atteso}, avuto ${avuto}`));
  return ok ? 0 : 1;
}
let guasti = 0;

// ── 1. corsi, visitatore non iscritto ────────────────────────────
{
  const { ctx, p, errori } = await pagina();
  await p.goto(BASE + '/corsi', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ({
    baseIt: document.querySelectorAll('#it-base-list .lesson').length,
    bloccate: document.querySelectorAll('#it-base-list .lesson.locked').length,
    advIt: document.querySelectorAll('#it-adv-list .adv-card').length,
    advVersoEsame: [...document.querySelectorAll('#it-adv-list .adv-card')].every(a => a.getAttribute('href') === '/esame'),
    invito: !document.getElementById('reg-prompt')?.hidden
  }));
  console.log('\n── corsi · non iscritto');
  guasti += riga('lezioni base elencate (it)', 6, r.baseIt);
  guasti += riga('tutte bloccate', 6, r.bloccate);
  guasti += riga('schede avanzate mostrate', 6, r.advIt);
  guasti += riga('avanzate rimandano all\'esame', true, r.advVersoEsame);
  guasti += riga('invito a registrarsi visibile', true, r.invito);
  guasti += riga('nessun errore js', 0, errori.length);
  if (errori.length) console.log('       ', errori.join(' · '));
  await ctx.close();
}

// ── 2. corsi, iscritto: lezioni aperte e progresso ───────────────
{
  const { ctx, p, errori } = await pagina({ 'eih-registered': '1' });
  await p.goto(BASE + '/corsi', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const prima = await p.evaluate(() => ({
    lezioni: document.querySelectorAll('#it-base-list .lesson').length,
    bloccate: document.querySelectorAll('#it-base-list .lesson.locked').length,
    bottoni: document.querySelectorAll('#it-base-list .lesson-mark').length,
    progresso: (document.getElementById('it-base-progress').textContent || '').trim()
  }));
  console.log('\n── corsi · iscritto');
  guasti += riga('lezioni base sbloccate (it)', 6, prima.lezioni);
  guasti += riga('nessuna bloccata', 0, prima.bloccate);
  guasti += riga('bottone "completata" su ogni lezione', 6, prima.bottoni);
  guasti += riga('etichetta progresso presente', true, prima.progresso.length > 0);

  // apre la prima lezione e la segna completata
  await p.click('#it-base-list .lesson:first-child summary');
  await p.waitForTimeout(400);
  const corpoVisibile = await p.evaluate(() => !!document.querySelector('#it-base-list .lesson[open] .lesson-body'));
  guasti += riga('la lezione si apre e mostra il testo', true, corpoVisibile);
  await p.click('#it-base-list .lesson:first-child .lesson-mark');
  await p.waitForTimeout(1500);
  const dopo = await p.evaluate(() => ({
    fatte: document.querySelectorAll('#it-base-list .lesson-done-badge').length,
    progresso: (document.getElementById('it-base-progress').textContent || '').trim()
  }));
  guasti += riga('lezione segnata come completata', 1, dopo.fatte);
  guasti += riga('progresso aggiornato', true, dopo.progresso !== prima.progresso);
  // il progresso deve sopravvivere al ricaricamento
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const dopoReload = await p.evaluate(() => document.querySelectorAll('#it-base-list .lesson-done-badge').length);
  guasti += riga('il progresso resta dopo il ricaricamento', 1, dopoReload);
  guasti += riga('nessun errore js', 0, errori.length);
  if (errori.length) console.log('       ', errori.join(' · '));
  await ctx.close();
}

// ── 3. iscritto ma senza badge: gli avanzati restano chiusi ──────
{
  const { ctx, p } = await pagina({ 'eih-registered': '1' });
  await p.goto(BASE + '/corsi', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ({
    schede: document.querySelectorAll('#it-adv-list .adv-card').length,
    lezioni: document.querySelectorAll('#it-adv-list .lesson').length
  }));
  console.log('\n── corsi avanzati · iscritto senza badge');
  guasti += riga('schede avanzate ancora chiuse', 6, r.schede);
  guasti += riga('nessuna lezione avanzata accessibile', 0, r.lezioni);
  await ctx.close();
}

// ── 4. col badge Bronzo gli avanzati si aprono davvero ───────────
{
  const { ctx, p, errori } = await pagina({
    'eih-registered': '1',
    'eih-badge': JSON.stringify({ level: 'bronzo', score: 65, date: new Date().toISOString() })
  });
  await p.goto(BASE + '/corsi', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ({
    lezioni: document.querySelectorAll('#it-adv-list .lesson').length,
    schede: document.querySelectorAll('#it-adv-list .adv-card').length,
    conTesto: [...document.querySelectorAll('#it-adv-list .lesson-body')].filter(b => (b.textContent || '').trim().length > 120).length,
    bottoni: document.querySelectorAll('#it-adv-list .lesson-mark').length
  }));
  console.log('\n── corsi avanzati · con badge Bronzo');
  guasti += riga('sei lezioni avanzate aperte', 6, r.lezioni);
  guasti += riga('nessuna scheda bloccata rimasta', 0, r.schede);
  guasti += riga('ogni lezione ha un contenuto vero', 6, r.conTesto);
  guasti += riga('si possono segnare come completate', 6, r.bottoni);

  await p.click('#it-adv-list .lesson:first-child summary');
  await p.waitForTimeout(300);
  await p.click('#it-adv-list .lesson:first-child .lesson-mark');
  await p.waitForTimeout(1500);
  guasti += riga('lezione avanzata segnata', 1, await p.evaluate(() => document.querySelectorAll('#it-adv-list .lesson-done-badge').length));
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  guasti += riga('resta segnata dopo il ricaricamento', 1, await p.evaluate(() => document.querySelectorAll('#it-adv-list .lesson-done-badge').length));
  guasti += riga('nessun errore js', 0, errori.length);
  if (errori.length) console.log('       ', errori.join(' · '));
  await ctx.close();
}

// ── 4. esame: assegna il badge e sblocca il livello avanzato ─────
{
  const { ctx, p, errori } = await pagina({ 'eih-registered': '1', 'eih-corso-completato': '1' });
  await p.goto(BASE + '/esame', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  console.log('\n── esame · badge');
  const start = await p.evaluate(() => {
    const b = document.getElementById('start-btn');
    if (b) b.click();
    return !!b;
  });
  guasti += riga('bottone per iniziare l\'esame', true, start);
  await p.waitForTimeout(1200);
  const domande = await p.evaluate(() => document.querySelectorAll('#quiz-form .q').length);
  guasti += riga('domande generate', true, domande > 0);
  // risponde correttamente a tutte
  await p.evaluate(() => {
    document.querySelectorAll('#quiz-form .q').forEach((q) => {
      const r = q.querySelector('input[type="radio"]');
      if (r) r.checked = true;
    });
  });
  const punteggio = await p.evaluate(() => {
    const b = document.getElementById('submit-btn');
    if (b) b.click();
    return !!b;
  });
  guasti += riga('bottone per consegnare', true, punteggio);
  await p.waitForTimeout(1200);
  const esito = await p.evaluate(() => ({
    risultato: document.getElementById('quiz-result')?.style.display === 'block',
    badge: (function () { try { return JSON.parse(localStorage.getItem('eih-badge') || 'null'); } catch (e) { return null; } })()
  }));
  guasti += riga('schermata del risultato mostrata', true, esito.risultato);
  guasti += riga('punteggio registrato', true, esito.badge !== null && typeof esito.badge.score === 'number');
  guasti += riga('nessun errore js', 0, errori.length);
  if (errori.length) console.log('       ', errori.join(' · '));
  await ctx.close();
}

// ── 5. percorso (riservato agli iscritti: da anonimo e' tutto bloccato) ──
{
  const { ctx, p } = await pagina();
  await p.goto(BASE + '/percorso', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  console.log('\n── percorso · non iscritto');
  const anon = await p.evaluate(() => ({
    fasi: document.querySelectorAll('.phase').length,
    bloccate: document.querySelectorAll('.phase-lock-msg').length,
    passi: document.querySelectorAll('.step-check').length
  }));
  guasti += riga('nove fasi mostrate', 9, anon.fasi);
  guasti += riga('tutte bloccate con invito a iscriversi', 9, anon.bloccate);
  guasti += riga('nessun passo accessibile', 0, anon.passi);
  await ctx.close();
}

{
  const { ctx, p, errori } = await pagina({ 'eih-registered': '1' });
  await p.goto(BASE + '/percorso', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  console.log('\n── percorso · iscritto');
  const r = await p.evaluate(() => ({
    fasi: document.querySelectorAll('.phase, .ph, [class*="phase"]').length,
    passi: document.querySelectorAll('.step-check').length,
    chat: !!document.querySelector('#chat-log, #chat-panel, [id*="chat"]')
  }));
  guasti += riga('fasi del percorso rese', true, r.fasi > 0);
  guasti += riga('passi spuntabili presenti', true, r.passi > 0);
  guasti += riga('assistente presente', true, r.chat);
  if (r.passi > 0) {
    await p.evaluate(() => document.querySelector('.step-check').click());
    await p.waitForTimeout(800);
    const segnato = await p.evaluate(() => !!document.querySelector('.step.checked'));
    guasti += riga('il passo si segna come fatto', true, segnato);
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3500);
    const resta = await p.evaluate(() => !!document.querySelector('.step.checked'));
    guasti += riga('il passo resta dopo il ricaricamento', true, resta);
  }
  guasti += riga('nessun errore js', 0, errori.length);
  if (errori.length) console.log('       ', errori.join(' · '));
  await ctx.close();
}

await b.close();
console.log(guasti ? `\n${guasti} controlli falliti` : '\nTutti i controlli passati.');
process.exit(guasti ? 1 : 0);
