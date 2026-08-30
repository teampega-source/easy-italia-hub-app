/* Il ponte fra l'agente e la pagina che l'utente apre (spec §8).
 *
 * L'agente girava in un lavoro automatico e scriveva in social/coda/<data>/.
 * Per leggere quella roba bisognava aprire GitHub — e chi deve usarla non apre
 * GitHub, mai, per scelta scritta in CLAUDE.md. Il risultato era un agente che
 * lavorava tutte le mattine per nessuno.
 *
 * Qui il giro di oggi diventa un file solo, che viaggia col sito e che la
 * pagina /ai-social legge. Da lì si copia e si incolla su Facebook: è il
 * percorso vero, perché la pubblicazione automatica ha bisogno di un token
 * Meta che oggi non c'è.
 *
 * Cosa NON finisce qui dentro: chiavi, token, indirizzi email, niente di
 * nessuna persona. Solo testi destinati comunque a essere pubblici. Il file sta
 * in assets/ e quindi è raggiungibile da chiunque: è la ragione per cui questa
 * riga esiste ed è scritta prima del codice.                                  */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { FORMATI } from './lib/marca.mjs';

const FILE = new URL('../assets/dati/ai-social.json', import.meta.url).pathname;

/* Il calendario della specifica (§8). Non è un vincolo: è un promemoria di che
   aria dovrebbe avere la settimana, così non escono sette post sul permesso. */
export const CALENDARIO = [
  { giorno: 'lun', tema: 'Informazione' },
  { giorno: 'mar', tema: 'Lavoro' },
  { giorno: 'mer', tema: 'Documenti' },
  { giorno: 'gio', tema: 'Vita in Italia' },
  { giorno: 'ven', tema: 'News' },
  { giorno: 'sab', tema: 'Community' },
  { giorno: 'dom', tema: 'Community' },
];

function conta(bozze) {
  const c = { pezzi: 0, pronti: 0, revisione: 0, scartati: 0 };
  for (const b of bozze) {
    for (const L of Object.values(b.lingue)) {
      for (const v of Object.values(L.verifiche)) {
        c.pezzi++;
        if (v.modalita === 'scartato') c.scartati++;
        else if (v.modalita === 'revisione') c.revisione++;
        else c.pronti++;
      }
    }
  }
  return c;
}

export function componi({ oggi, bozze, gruppi, pubblicazione, stato }) {
  return {
    generato: new Date().toISOString(),
    oggi,
    stato,
    conteggi: { temi: bozze.length, ...conta(bozze) },
    formati: Object.fromEntries(Object.entries(FORMATI).map(([k, f]) => [k, f.nome])),
    calendario: CALENDARIO,
    post: bozze.map((b) => ({
      titolo: b.opportunita.titolo,
      tipo: b.opportunita.tipo,
      fonte: b.opportunita.fonte,
      fonteNome: b.opportunita.fonteNome,
      punteggio: b.opportunita.punteggio,
      lingue: Object.fromEntries(Object.entries(b.lingue).map(([lg, L]) => [lg, {
        origine: L.origine || (L.grezzo ? 'montaggio' : 'modello'),
        modalita: L.verifiche.facebook?.modalita || 'revisione',
        problemi: [...new Set(Object.values(L.verifiche).flatMap((v) => v.problemi || []))],
        testi: {
          facebook: L.testi.facebook || '',
          instagram: L.testi.instagram || '',
          reel: L.testi.reel || '',
          storia: L.testi.storia || '',
        },
        hashtag: L.testi.hashtag || [],
      }])),
    })),
    gruppi: {
      senzaElenco: Boolean(gruppi?.senzaElenco),
      inPausa: gruppi?.saltati || [],
      messaggi: (gruppi?.messaggi || []).map((m) => ({
        gruppo: m.gruppo.nome,
        citta: m.gruppo.citta || null,
        url: m.gruppo.url || null,
        lingua: m.lingua,
        tema: m.tema,
        messaggio: m.messaggio,
        grezzo: Boolean(m.grezzo),
      })),
    },
    pubblicazione: pubblicazione || null,
  };
}

export function scrivi(dati) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(dati, null, 1) + '\n');
  return FILE;
}
