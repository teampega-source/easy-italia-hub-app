/* La parte che lavora da sola: pubblica sulla Pagina e manda le risposte
 * fisse ai commenti (spec §5 e §12).
 *
 * L'autonomia qui è vera — nessuno clicca — ma passa da cinque cancelli, e
 * bastano tutti e cinque per lasciarla passare:
 *
 *   1. l'interruttore SOCIAL_AUTOPUBBLICA=1 esiste ed è acceso;
 *   2. il connettore Meta è collegato;
 *   3. il testo non è grezzo (c'è stato un modello a scriverlo);
 *   4. il controllo di sicurezza non ha alzato nemmeno un avviso;
 *   5. la memoria dice che quel tema non è già uscito nelle ultime tre
 *      settimane, e che oggi non abbiamo già pubblicato.
 *
 * Se uno solo dice di no, il pezzo torna nella coda da approvare. Un agente
 * che pubblica «quasi sempre bene» su una pagina che è il canale di fiducia di
 * una comunità è peggio di uno che non pubblica.                             */

import { pubblica as pubblicaSuMeta, rispondi as rispondiSuMeta, stato } from './connettori/meta.mjs';
import { leggi, scrivi, segnaPost, segnaRisposta, giaPubblicato, giaRisposto, postOggi, REGOLE } from './lib/registro.mjs';

export function acceso() {
  return process.env.SOCIAL_AUTOPUBBLICA === '1';
}

/* Un post per la Pagina mette insieme due lingue: sinhala sopra, italiano
   sotto. È una pagina sola e un pubblico misto: due post separati dimezzano
   la portata di entrambi, e chi legge italiano scorre comunque. */
function messaggioPagina(pacchetto) {
  const si = pacchetto.lingue.si?.testi?.facebook;
  const it = pacchetto.lingue.it?.testi?.facebook;
  return [si, it].filter(Boolean).join('\n\n— — —\n\n');
}

function pulito(pacchetto, lingue = ['si', 'it']) {
  return lingue.every((lg) => {
    const L = pacchetto.lingue[lg];
    if (!L || L.grezzo) return false;
    const v = L.verifiche.facebook;
    return v && !v.gravita;                 // nemmeno un avviso: qui si è severi
  });
}

/**
 * @returns {{fatto:boolean, motivo?:string, id?:string, titolo?:string}}
 */
export async function pubblicaDelGiorno(bozze) {
  if (!acceso()) return { fatto: false, motivo: 'SOCIAL_AUTOPUBBLICA non è 1' };
  const s = stato();
  if (!s.collegato) return { fatto: false, motivo: s.motivo };

  const memoria = leggi();
  if (postOggi(memoria) >= REGOLE.postAlGiorno) {
    return { fatto: false, motivo: `già ${REGOLE.postAlGiorno} post oggi` };
  }

  const scarti = [];
  for (const b of bozze) {
    const titolo = b.opportunita.titolo;
    if (giaPubblicato(memoria, titolo)) { scarti.push(`${titolo}: già uscito da meno di ${REGOLE.stessoTemaGiorni} giorni`); continue; }
    if (!pulito(b)) { scarti.push(`${titolo}: bozza grezza o con avvisi`); continue; }

    const messaggio = messaggioPagina(b);
    if (!messaggio) { scarti.push(`${titolo}: manca il testo`); continue; }

    const r = await pubblicaSuMeta({ messaggio, link: b.opportunita.fonte });
    if (!r.pubblicato) return { fatto: false, motivo: r.motivo, scarti };

    scrivi(segnaPost(memoria, { titolo, formato: 'facebook', idEsterno: r.id }));
    return { fatto: true, id: r.id, titolo, scarti };
  }
  return { fatto: false, motivo: 'nessuna bozza ha passato i cancelli', scarti };
}

/** Manda solo le risposte fisse: tutto il resto resta in coda. */
export async function mandaRisposteAuto(risposte) {
  if (!acceso()) return { inviate: 0, motivo: 'SOCIAL_AUTOPUBBLICA non è 1' };
  if (!stato().collegato) return { inviate: 0, motivo: stato().motivo };

  const memoria = leggi();
  let inviate = 0;
  const errori = [];
  for (const r of risposte) {
    if (r.modalita !== 'auto' || !r.risposta) continue;
    if (giaRisposto(memoria, r.idCommento)) continue;
    if (r.verifica && r.verifica.gravita) continue;
    try {
      await rispondiSuMeta(r.idCommento, r.risposta);
      segnaRisposta(memoria, { idCommento: r.idCommento, modalita: 'auto' });
      inviate++;
    } catch (e) {
      errori.push(`${r.idCommento}: ${e.message}`);
    }
  }
  scrivi(memoria);
  return { inviate, errori };
}
