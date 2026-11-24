/* Controllo incrociato delle traduzioni: ogni pagina in ogni lingua.

   Per ciascuna combinazione misura quattro cose diverse, che si guastano in
   modi diversi:
     1. chiavi data-i18n rimaste in italiano (dizionario di eih.js o di pagina)
     2. frammenti del corpo non coperti dal dizionario di /assets/i18n/
     3. quanto testo latino resta visibile in <main> (il sintomo che vede l'utente)
     4. voci adiacenti che ricevono la stessa traduzione: un titolo spezzato
        dal markup, o due voci di menu o di piede con la stessa etichetta

   Uso: node scripts/audit-lingue.mjs [base-url] [pagina,...] [lingua,...]      */
import pw from 'playwright';
const { chromium } = pw;
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:3100';
const PAGINE = process.argv[3]
  ? process.argv[3].split(',')
  : readdirSync('.').filter(f => f.endsWith('.html')).map(f => f.slice(0, -5))
      .filter(n => !['404', 'offline'].includes(n));
const LINGUE = (process.argv[4] || 'en,si,ta').split(',');

const SCRITTURA = { si: /[඀-෿]/, ta: /[஀-௿]/ };
const b = await chromium.launch();
const esito = [];

for (const lg of LINGUE) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1200 }, serviceWorkers: 'block' });
  await ctx.addInitScript((l) => {
    try {
      // 'eih-lang-scelta' dice al sito che questa e' una scelta vera: senza
      // di esso la lingua predefinita (inglese) avrebbe la meglio.
      localStorage.setItem('eih-lang', l);
      localStorage.setItem('eih-lang-scelta', '1');
      // Corsi e percorso mostrano il contenuto solo a chi e' iscritto, e le
      // lezioni avanzate solo a chi ha il badge: da visitatore anonimo quei
      // testi non entrano mai nel giro delle traduzioni e restano in italiano
      // a chi il sito lo usa davvero. Qui si guarda la pagina come la vede un
      // iscritto: le lezioni base si leggono, le avanzate mostrano il loro
      // titolo e il motivo per cui sono ancora chiuse.
      localStorage.setItem('eih-registered', '1');
      // Il percorso apre una fase alla volta: senza uno stato completo si
      // estrarrebbero i passi della sola prima fase, e gli altri trentadue
      // resterebbero in italiano per chi arriva fin la'.
      var fatti = {};
      for (var f = 1; f <= 9; f++) for (var p = 0; p < 4; p++) fatti[f + '-' + p] = true;
      localStorage.setItem('eih-journey', JSON.stringify({ current: 9, completed: fatti, registered: true }));
      localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: true, marketing: true }));
    } catch (e) {}
  }, lg);
  const p = await ctx.newPage();
  p.setDefaultTimeout(30000);

  for (const nome of PAGINE) {
    const url = BASE + '/' + (nome === 'index' ? '' : nome);
    try { await p.goto(url, { waitUntil: 'domcontentloaded' }); }
    catch (e) { esito.push({ lg, nome, errore: 'caricamento' }); continue; }
    /* La traduzione vera, non un'attesa fissa.

       I 2,6 secondi bastavano a rete veloce: su una pagina lenta il dizionario
       arrivava dopo, menu e piede non esistevano ancora, e il controllo della
       cornice leggeva l'italiano delle voci di menu proprio quando doveva
       trovarle tradotte. La pagina pero' sa dire quando ha finito: pronta si
       scioglie appena il primo passaggio ha applicato il dizionario di pagina,
       e il dizionario _ui traduce menu e piede appena nascono. Si aspettano
       loro, con un limite di tempo: una pagina senza dizionario non deve
       fermare l'audit. */
    await p.evaluate(() => window.EIHPageI18N && window.EIHPageI18N.pronta).catch(() => {});
    // eih-i18n-page.js si carica da solo fuori dall'italiano; se manca lo
    // aggiungo, e aspetto che anche quella copia abbia tradotto
    if (!(await p.evaluate(() => !!window.EIHPageI18N))) {
      await p.addScriptTag({ path: resolve('assets/eih-i18n-page.js') }).catch(() => {});
      await p.evaluate(() => window.EIHPageI18N && window.EIHPageI18N.pronta).catch(() => {});
    }
    // Menu e piede li costruisce eih.js, a volte dopo il corpo: si aspetta che
    // siano marcati, altrimenti la cornice resterebbe fuori dal controllo.
    await p.waitForFunction(() => {
      if (!document.querySelector('nav, footer')) return true;
      return !!document.querySelector('nav[data-tr-ok], footer[data-tr-ok], nav [data-tr-ok], footer [data-tr-ok]');
    }, null, { timeout: 10000 }).catch(() => {});

    const r = await p.evaluate((lang) => {
      const re = { si: /[඀-෿]/, ta: /[஀-௿]/ }[lang];
      // In inglese la spia dell'italiano rimasto sono le vocali accentate. Due
      // classi di stringa non c'entrano e vanno tolte prima del confronto:
      //   · × e ÷ stanno nello stesso tratto Latin-1 ma non sono lettere
      //     («Sworn translations (3 docs × €80)» e' gia' inglese);
      //   · i nomi propri tengono i loro accenti anche tradotti
      //     («Abarekà Nandree (non-profit) — Via Venini, Milan»).
      // Si guardano solo le vocali accentate che l'italiano usa davvero: la û
      // di «vesak kûdu» e' una traslitterazione dal singalese, non italiano.
      const ACCENTI_IT = /[àèéìíòóùúÀÈÉÌÍÒÓÙÚ]/;
      const senzaNomi = (t) => t.replace(/\p{Lu}[\p{L}'’-]*/gu, ' ');
      const tradotto = (t) => (re ? re.test(t) : !ACCENTI_IT.test(senzaNomi(t)));

      // 1. chiavi data-i18n ferme all'italiano
      // Un elemento con data-i18n e data-no-tr insieme dichiara che il valore
      // resta com'e' di proposito (SPID, SIM / eSIM, nomi di programmi).
      const chiavi = [...document.querySelectorAll('[data-i18n],[data-i18n-html]')]
        .filter(el => !el.closest('[data-no-tr]'));
      const ferme = [];
      for (const el of chiavi) {
        const k = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-html');
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length < 3 || /^[\d\s€%.,:/–—-]+$/.test(t)) continue;
        if (!tradotto(t)) ferme.push(k + ' → ' + t.slice(0, 30));
      }

      // 2. frammenti del corpo non tradotti
      const api = window.EIHPageI18N;
      let corpoTot = 0, corpoFermi = 0;
      const esempiCorpo = [];
      if (api) {
        for (const v of api.raccogli()) {
          corpoTot++;
          if (!tradotto(v.testo)) {
            corpoFermi++;
            if (esempiCorpo.length < 3) esempiCorpo.push(v.testo.slice(0, 40));
          }
        }
      }

      // 3. sintomo visibile: parole latine in main
      const main = document.querySelector('main') || document.body;
      const parole = (main.innerText || '').split(/\s+/).filter(w => w.length > 3);
      const latine = parole.filter(w => /^[A-Za-zÀ-ÿ'’]+$/.test(w));

      return {
        chiaviTot: chiavi.length, chiaviFerme: ferme.length, esempiChiavi: ferme.slice(0, 3),
        corpoTot, corpoFermi, esempiCorpo,
        parole: parole.length, latine: latine.length,
        avviso: !!document.getElementById('eih-tr-avviso')
      };
    }, lg);

    // 4. due voci adiacenti con la stessa traduzione
    // Un titolo spezzato dal markup — «Forum,<br><em>domande reali.</em>» — e'
    // due frammenti, non una frase. Se il dizionario li traduce allo stesso
    // modo, la pagina legge «Forum, Forum,»: e' successo in singalese e tamil,
    // dove il titolo del forum ripeteva la parola invece di dire «domande
    // reali». Lo stesso vale per menu e piede: due voci consecutive con la
    // stessa etichetta non si notano finche' non si legge la pagina in quella
    // lingua, ed e' il caso che questo controllo deve prendere.
    // Tre sorgenti, un criterio solo:
    //   · corpo — frammenti tradotti a impronta dal dizionario di pagina;
    //   · chiavi — elementi data-i18n, tradotti dal dizionario di eih.js;
    //   · cornice — menu, piede e modali, tradotti dal dizionario _ui.
    // Il corpo si legge dall'HTML come e' arrivato dal server: la tipografia
    // cinetica riscrive i titoli parola per parola, e nel DOM tradotto i due
    // frammenti originali non esistono piu'. Chiavi e cornice invece si
    // leggono dal DOM vivo: li' la traduzione e' gia' il testo dell'elemento,
    // non c'e' nessuna impronta da cercare.
    const dup = await p.evaluate(async ([lang, nome]) => {
      const api = window.EIHPageI18N;
      // Adiacenti conta solo dentro lo stesso blocco di testo: due «Leggi di
      // piu'» in due schede diverse non sono un errore. Il <br> e le <em> del
      // titolo invece non interrompono il blocco, ed e' proprio li' che il
      // doppione si nasconde.
      const BLOCCO = 'h1,h2,h3,h4,h5,h6,p,li,td,th,dt,dd,figcaption,blockquote,summary,div,section,article,header,footer,aside,nav,form';
      // Menu e piede elencano le voci in <li> distinti: li' il blocco e' la
      // lista che li contiene, altrimenti due voci consecutive non si
      // incontrerebbero mai.
      const LISTA = 'h1,h2,h3,h4,h5,h6,p,td,th,dt,dd,figcaption,blockquote,summary,div,section,article,header,footer,aside,nav,form,ul,ol';
      const norm = (t) => t.toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, ' ')  // il punto finale non fa la differenza
        .replace(/\s+/g, ' ').trim();
      const re = { si: /[඀-෿]/, ta: /[஀-௿]/ }[lang];
      const ACCENTI_IT = /[àèéìíòóùúÀÈÉÌÍÒÓÙÚ]/;
      // In inglese non si distingue l'italiano dall'inglese guardando
      // l'alfabeto: resta la spia delle vocali accentate, senza i nomi propri.
      const tradotto = (t) => (re ? re.test(t) : !ACCENTI_IT.test(t.replace(/\p{Lu}[\p{L}'’-]*/gu, ' ')));

      const esempi = [], gia = new Set();
      // voci: { id: come si chiama la voce, trad: quel che si legge,
      //         blocco: l'elemento che la contiene }
      function cerca(voci, fonte) {
        for (let i = 1; i < voci.length; i++) {
          const a = voci[i - 1], b = voci[i];
          if (a.id === b.id) continue;   // stessa voce ripetuta: non e' traduzione
          if (!a.blocco || a.blocco !== b.blocco) continue;
          if (typeof a.trad !== 'string' || typeof b.trad !== 'string') continue;
          const na = norm(a.trad), nb = norm(b.trad);
          // "" e' una traduzione voluta (svuota uno spezzone): non e' un doppione
          if (!na || na !== nb) continue;
          const chiave = fonte + '\u241f' + a.id + '\u241f' + b.id;
          if (gia.has(chiave)) continue;
          gia.add(chiave);
          esempi.push({ fonte, it: [a.id, b.id], trad: b.trad });
        }
      }

      // 4a. corpo: HTML servito + dizionario di pagina
      const [html, diz] = await Promise.all([
        fetch(location.pathname + location.search, { cache: 'no-store' }).then(r => r.ok ? r.text() : null),
        // e' lo stesso file che la pagina ha gia' scaricato: arriva dalla cache
        fetch('/assets/i18n/' + nome + '.' + lang + '.json').then(r => r.ok ? r.json() : null)
      ]).catch(() => []);
      if (html && diz) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        let radice = document.importNode(doc.querySelector('main') || doc.body, true);
        // raccogli() sa partire solo da <main>. Le due pagine che non ce l'hanno
        // (registrati, media-kit) si controllano dentro un <main> finto, senza
        // menu e piede: e' la stessa regola che usa raccogli() quando <main>
        // manca.
        if (radice.tagName !== 'MAIN') {
          radice.querySelectorAll('nav,footer').forEach(e => e.remove());
          const finto = document.createElement('main');
          finto.append(...radice.childNodes);
          radice = finto;
        }
        // I frammenti si estraggono con la stessa raccogli() che traduce la
        // pagina, cosi' le regole di cosa e' traducibile restano in un posto
        // solo. Le voci senza traduzione restano nell'elenco: spezzano
        // l'adiacenza, e la loro assenza e' gia' segnalata come corpo non
        // tradotto.
        cerca(api.raccogli(radice).filter(v => v.nodo).map(v => ({
          id: v.testo,
          trad: diz[api.impronta(v.testo)],
          blocco: v.nodo.parentElement.closest(BLOCCO)
        })), 'corpo');
      }

      // 4b. chiavi: il testo che si legge e' gia' quello del dizionario di
      // eih.js. Due chiavi diverse con la stessa etichetta sono la
      // ripetizione che si scopre solo leggendo la pagina tradotta.
      const chiavi = [];
      for (const el of document.querySelectorAll('[data-i18n],[data-i18n-html]')) {
        if (el.closest('[data-no-tr]')) continue;
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length < 3) continue;
        chiavi.push({
          id: el.getAttribute('data-i18n') || el.getAttribute('data-i18n-html'),
          trad: tradotto(t) ? t : null,
          blocco: el.closest(LISTA)
        });
      }
      cerca(chiavi, 'chiavi');

      // 4c. cornice: menu, piede, barra laterale e modali, dove il testo non
      // ha chiavi e lo traduce il dizionario _ui. Qui raccogli() non serve:
      // scarta i frammenti senza lettere latine, e dopo la traduzione il testo
      // e' in singalese o tamil — non lo vedrebbe mai. applica() pero' lascia
      // data-tr-ok sull'elemento che ha preso la traduzione, ed e' quello il
      // segno da seguire. L'italiano di partenza non c'e' piu' (la pagina ha
      // gia' sostituito il testo), quindi l'esempio dice dove sta la voce
      // invece di cosa diceva.
      const dove = (el) => el.tagName.toLowerCase() +
        (el.getAttribute('href') ? '[' + el.getAttribute('href') + ']' : '') +
        (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');
      const cornice = [];
      // Senza <main> non c'e' distinzione fra corpo e cornice: raccogli() li'
      // ripiega sul documento intero, e il controllo del corpo ha gia' guardato
      // tutto. Qui si salta, per non contare due volte lo stesso doppione.
      const haMain = !!document.querySelector('main');
      for (const el of document.querySelectorAll('[data-tr-ok]')) {
        if (!haMain || el.closest('main')) continue;   // dentro <main> e' il dizionario di pagina
        // Si prendono i nodi di testo diretti, non textContent: un contenitore
        // intero puo' risultare marcato perche' lo era un suo attributo (e'
        // il caso dell'aria-label di <nav>), e allora textContent schiaccerebbe
        // tutte le voci del menu in una sola.
        const testi = [...el.childNodes].filter(n => n.nodeType === 3 && n.nodeValue.trim().length > 2);
        testi.forEach((n, i) => {
          const t = n.nodeValue.replace(/\s+/g, ' ').trim();
          // un titolo spezzato dal markup ha piu' nodi nello stesso elemento:
          // il numero li distingue e restano due voci adiacenti
          cornice.push({ id: dove(el) + (testi.length > 1 ? ' #' + (i + 1) : ''),
            trad: tradotto(t) ? t : null, blocco: el.closest(LISTA) });
        });
      }
      cerca(cornice, '_ui');

      return { doppi: esempi.length, esempi: esempi.slice(0, 3) };
    }, [lg, nome]);

    esito.push({ lg, nome, ...r, doppi: dup.doppi, esempiDoppi: dup.esempi });
  }
  await ctx.close();
}
await b.close();

writeFileSync('/tmp/audit-lingue.json', JSON.stringify(esito, null, 1));

for (const lg of LINGUE) {
  const righe = esito.filter(e => e.lg === lg && !e.errore);
  righe.sort((a, b2) => (b2.corpoFermi + b2.chiaviFerme + b2.doppi) - (a.corpoFermi + a.chiaviFerme + a.doppi));
  console.log('\n═══ ' + lg.toUpperCase() + ' ═══');
  console.log('pagina'.padEnd(22), 'chiavi ferme', ' corpo non tradotto', ' latino in main', ' doppioni', ' avviso');
  for (const r of righe) {
    if (!r.chiaviFerme && !r.corpoFermi && !r.doppi) continue;
    const perc = r.parole ? Math.round(r.latine * 100 / r.parole) : 0;
    console.log(
      r.nome.padEnd(22),
      String(r.chiaviFerme + '/' + r.chiaviTot).padStart(12),
      String(r.corpoFermi + '/' + r.corpoTot).padStart(19),
      String(perc + '%').padStart(15),
      String(r.doppi).padStart(9),
      String(r.avviso ? 'sì' : '—').padStart(7));
    // Ogni doppione si stampa per esteso, con la sorgente: chi corregge deve
    // sapere quali due voci si contendono la stessa parola, e se sono nel
    // corpo, in una chiave o nella cornice.
    for (const c of r.esempiDoppi)
      console.log('   ⚠ stessa traduzione (' + c.fonte + '):', c.it.join(' + '), '→', c.trad.slice(0, 60));
  }
  const sospette = righe.reduce((n, r) => n + r.doppi, 0);
  console.log('voci con la stessa traduzione:', sospette);
  const pulite = righe.filter(r => !r.chiaviFerme && !r.corpoFermi && !r.doppi).map(r => r.nome);
  console.log('senza carenze:', pulite.length ? pulite.join(', ') : 'nessuna');
}
