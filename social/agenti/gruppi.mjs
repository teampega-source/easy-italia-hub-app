/* I gruppi Facebook — la parte che va fatta a mano, preparata perché costi
 * dieci minuti invece di due ore.
 *
 * Perché a mano. Meta ha chiuso la Groups API nell'aprile 2024: non esiste più
 * nessun endpoint per entrare in un gruppo, pubblicare o commentare lì dentro.
 * Non è una questione di permessi da chiedere — l'hanno tolto a tutti. L'unica
 * strada tecnica rimasta è un browser che finge di essere una persona, e chi la
 * prende perde il profilo e con lui la Pagina.
 *
 * Quindi qui l'agente fa tutto tranne il clic: sceglie i gruppi di oggi
 * rispettando i tempi, scrive il messaggio giusto per quel gruppo nella sua
 * lingua, e tiene il conto di dove è già passato. Chi copia e incolla sei
 * messaggi in sei gruppi diversi impiega dieci minuti.
 *
 * L'elenco dei gruppi lo scrivi tu una volta: social/gruppi.json (l'esempio è
 * accanto). Nessuno scraping, nessuna scoperta automatica — i gruppi in cui si
 * scrive si scelgono a mano, perché in ognuno ci sono regole diverse e in
 * qualcuno la promozione è vietata del tutto.                                */

import { readFileSync, existsSync } from 'node:fs';
import { genera, leggiJson } from '../lib/ai.mjs';
import { VOCE, NOME_LINGUA } from '../lib/marca.mjs';
import { controlla } from '../lib/sicurezza.mjs';
import { gruppoDisponibile, REGOLE } from '../lib/registro.mjs';

const FILE = new URL('../gruppi.json', import.meta.url).pathname;

export function elenco() {
  if (!existsSync(FILE)) return [];
  try {
    const d = JSON.parse(readFileSync(FILE, 'utf8'));
    return Array.isArray(d) ? d : d.gruppi || [];
  } catch (e) {
    console.error('[gruppi] elenco illeggibile:', e.message);
    return [];
  }
}

const ISTRUZIONE = `${VOCE}

Scrivi un messaggio da pubblicare in un gruppo Facebook della comunità
srilankese in Italia.

La regola che conta più di tutte: in un gruppo non si fa pubblicità, si
risponde a un bisogno. Il messaggio deve essere utile anche a chi non clicca
il link.

Forma:
- apri con la cosa concreta che risolvi, non con "ciao a tutti siamo...";
- tre righe al massimo;
- il link una volta sola, alla fine;
- niente maiuscole gridate, niente emoji a raffica, niente "condividi";
- se il gruppo ha una regola citata, rispettala alla lettera.

Rispondi SOLO con JSON: {"messaggio":"…","perche":"…"}`;

export async function messaggi(opportunita, memoria, { quanti = REGOLE.gruppiAlGiorno } = {}) {
  const tutti = elenco();
  const disponibili = tutti.filter((g) => g.attivo !== false && gruppoDisponibile(memoria, g.id));
  const scelti = disponibili.slice(0, quanti);
  const fuori = [];

  for (let i = 0; i < scelti.length; i++) {
    const g = scelti[i];
    /* Un tema diverso per ogni gruppo: lo stesso messaggio copiato in sei
       gruppi lo notano gli amministratori prima ancora degli iscritti. */
    const o = opportunita[i % opportunita.length];
    const lg = g.lingua || 'si';

    const r = await genera(
      ISTRUZIONE,
      [
        `Gruppo: ${g.nome}${g.citta ? ' (' + g.citta + ')' : ''}`,
        g.regole ? `Regole del gruppo: ${g.regole}` : '',
        `Lingua del gruppo: ${NOME_LINGUA[lg]}`,
        `Tema di oggi: ${o.titolo}`,
        `Pagina da collegare: ${o.fonte}`,
      ].filter(Boolean).join('\n'),
      { temperatura: 0.8, max: 500 }
    );

    const d = r.testo ? leggiJson(r.testo) : null;
    const messaggio = d?.messaggio
      || `${o.titolo}\n\n${o.fonte}`;   // ripiego asciutto: montato, non inventato

    fuori.push({
      gruppo: g,
      tema: o.titolo,
      lingua: lg,
      messaggio,
      perche: d?.perche || 'bozza grezza: manca il modello',
      grezzo: !d?.messaggio,
      verifica: controlla({ testo: messaggio, formato: 'facebook', fonte: o.fonte }),
      /* Sempre manuale. Non c'è una condizione al mondo che lo renda
         automatico, perché non c'è l'API. */
      modalita: 'manuale',
    });
  }

  return {
    messaggi: fuori,
    saltati: disponibili.length < tutti.filter((g) => g.attivo !== false).length
      ? tutti.filter((g) => g.attivo !== false && !gruppoDisponibile(memoria, g.id)).map((g) => g.nome)
      : [],
    senzaElenco: tutti.length === 0,
  };
}
