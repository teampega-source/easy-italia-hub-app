/* Gli avvisi del Consolato Generale dello Sri Lanka a Milano.

   Perché esiste. Il Consolato ci ha risposto (agosto 2026) autorizzando la
   diffusione dei propri avvisi e chiedendo di rimandare sempre alla fonte
   ufficiale. Copiarli a mano dentro news.html avrebbe due difetti: invecchia
   da solo, e riscrivere un testo consolare significa diventarne l'autore. Qui
   si prendono titolo, categoria e link — nient'altro — e si rimanda al loro
   sito per il contenuto.

   Cosa NON fa. Non copia il corpo degli avvisi, non li traduce e non li
   riassume: restano in inglese, come li pubblica il Consolato, con il link
   all'originale. Se domani chiedono di smettere, si cancella questo file e la
   sezione sparisce.

   Il sito del Consolato risponde 503 a chi non si presenta come browser: vale
   la stessa avvertenza di scripts/verifica-fonti.mjs.

   Uso:
     node scripts/avvisi-consolato.mjs           # rigenera l'elenco
     node scripts/avvisi-consolato.mjs --mostra  # stampa e basta
*/
import { writeFileSync } from 'node:fs';

const FONTE = 'https://www.cg-milan.gov.lk/en/allPosts?category=News';
const SITO = 'https://www.cg-milan.gov.lk';
const QUANTI = 6;
const SOLO_MOSTRA = process.argv.includes('--mostra');
const AGENTE = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

function ripulisci(s) {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/&#x27;|&#39;/g, '’').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const r = await fetch(FONTE, { headers: { 'User-Agent': AGENTE }, redirect: 'follow' });
if (!r.ok) {
  console.error('il sito del Consolato ha risposto', r.status, '— elenco non aggiornato');
  process.exit(1);
}
const html = await r.text();

/* Ogni scheda comincia con l'etichetta di accessibilità del link. È il punto
   più stabile della pagina: le classi cambiano a ogni ricostruzione del sito,
   quell'attributo no. */
const pezzi = html.split('aria-label="Read more about ');
const voci = [];
for (const p of pezzi.slice(1)) {
  const fine = p.indexOf('"');
  if (fine < 0) continue;
  const titolo = ripulisci(p.slice(0, fine));
  const via = p.match(/href="(\/posts\/[0-9a-f]{24})"/);
  if (!via) continue;
  /* Fra il link e il titolo il sito stampa la categoria: News, Statements,
     Mission Releases… La teniamo perché distingue un avviso consolare da un
     comunicato politico. */
  const testo = ripulisci(p.slice(fine, fine + 900).replace(/<[^>]+>/g, ' '));
  const cat = (testo.match(/\b(News|Notices?|Statements?|Mission Releases?|Promotions?|Events?|Others?)\b/) || [])[1] || 'News';
  if (voci.some(v => v.url.endsWith(via[1]))) continue;
  voci.push({ titolo, url: SITO + via[1], cat });
  if (voci.length >= QUANTI) break;
}

if (!voci.length) {
  console.error('nessun avviso riconosciuto: la pagina del Consolato è cambiata, controllare il formato');
  process.exit(1);
}

const oggi = new Date().toISOString().slice(0, 10);
for (const v of voci) console.log('·', v.cat.padEnd(18), v.titolo.slice(0, 90));

if (SOLO_MOSTRA) process.exit(0);

const file =
`/* Avvisi del Consolato Generale dello Sri Lanka a Milano.

   Generato da scripts/avvisi-consolato.mjs — non scrivere qui a mano.
   Titolo, categoria e link, niente altro: il testo resta sul sito del
   Consolato, che ne è l'unico autore. Diffusione autorizzata dal Consolato
   stesso, agosto 2026. */
window.EIH_AVVISI_CONSOLATO = {
  letto: ${JSON.stringify(oggi)},
  fonte: ${JSON.stringify(SITO + '/en')},
  voci: [
${voci.map(v => '    ' + JSON.stringify(v)).join(',\n')}
  ]
};
`;
writeFileSync('assets/eih-avvisi-consolato.js', file);
console.log('\nscritto assets/eih-avvisi-consolato.js —', voci.length, 'avvisi ·', oggi);
