/* Content Agent + agente delle lingue (spec §6 e §3).
 *
 * Da un'opportunità — una guida, un avviso del Consolato, uno strumento — esce
 * un pacchetto pronto: post Facebook, caption Instagram, copione Reel e Storia,
 * ognuno in sinhala, italiano, inglese e tamil, con la fonte attaccata.
 *
 * Due cose che questo file fa e che di solito si dimenticano.
 *
 * La prima: le lingue non sono traduzioni. Tradurre parola per parola un post
 * italiano in sinhala produce testo corretto e morto. L'istruzione chiede di
 * riscrivere per chi legge in quella lingua, tenendo in italiano i nomi delle
 * cose che negli uffici si chiamano così — permesso di soggiorno, codice
 * fiscale, questura. Chi arriva allo sportello deve saper dire la parola.
 *
 * La seconda: senza chiave del modello non si sbaglia niente e non si finge.
 * Esce comunque una bozza, montata dai pezzi verificati: si vede la forma, si
 * prova tutta la catena, e si capisce a colpo d'occhio che il testo è grezzo. */

import { genera, leggiJson, disponibile } from '../lib/ai.mjs';
import { VOCE, FORMATI, INVITO, LINGUE, NOME_LINGUA } from '../lib/marca.mjs';
import { controlla, modalita } from '../lib/sicurezza.mjs';

const ISTRUZIONE = `${VOCE}

Scrivi contenuti social per la pagina Facebook e Instagram di Easy Italia Hub.

Regole di forma:
- una sola idea per post, quella che risolve un problema pratico;
- la prima riga deve valere da sola: nel feed è l'unica che si legge;
- niente emoji a pioggia: al massimo due, e solo se servono a orientare;
- l'invito finale è sempre lo stesso indirizzo, senza "clicca qui";
- se il tema è regolato (permesso, INPS, cittadinanza, tasse), il post deve
  dire che la fonte ufficiale è collegata, senza citare cifre non presenti
  nella fonte.

Rispondi SOLO con JSON valido, senza testo attorno, in questa forma:
{"facebook":"…","instagram":"…","reel":"…","storia":"…","hashtag":["…"]}`;

function bozzaAsciutta(opp, lingua) {
  /* Montata, non generata: nessuna frase inventata, solo i pezzi che abbiamo
     già verificato più l'invito. Serve a vedere la forma. */
  const invito = INVITO[lingua] || INVITO.it;
  const t = opp.titolo;
  return {
    facebook: `${t}\n\n${invito}\n${opp.fonte}`,
    instagram: `${t}\n\n${invito}`,
    reel: `[gancio] ${t}\n[1] …\n[2] …\n[3] …\n[invito] ${invito}`,
    storia: `${t} — ${invito}`,
    hashtag: ['#EasyItaliaHub', '#SriLankansInItaly'],
    grezzo: true,
  };
}

/**
 * Un pacchetto completo per una singola opportunità.
 * @param {object} opp  da agenti/fonti.mjs
 * @param {object} opz  { lingue }
 */
export async function pacchetto(opp, { lingue = LINGUE } = {}) {
  const fuori = { opportunita: opp, lingue: {}, generatoDaModello: disponibile() };

  for (const lg of lingue) {
    const richiesta = [
      `Lingua di scrittura: ${NOME_LINGUA[lg]} (${lg}).`,
      lg === 'it' ? '' : 'Non tradurre letteralmente dall\'italiano: riscrivi per chi legge in questa lingua. Lascia in italiano i nomi delle pratiche e degli uffici (permesso di soggiorno, codice fiscale, questura, patronato, CAF): sono le parole da dire allo sportello.',
      '',
      `Tema: ${opp.titolo}`,
      `Fonte da collegare: ${opp.fonte} (${opp.fonteNome})`,
      opp.tipo === 'avviso-consolato'
        ? 'È un avviso ufficiale del Consolato: riporta il fatto e rimanda all\'originale, non riassumere il contenuto e non aggiungere interpretazioni.'
        : '',
      '',
      'Limiti:',
      ...Object.entries(FORMATI).map(([k, f]) => `- ${k}: max ${f.max} caratteri. ${f.righe}`),
      `- invito da usare: ${INVITO[lg] || INVITO.it}`,
    ].filter(Boolean).join('\n');

    const r = await genera(ISTRUZIONE, richiesta, { temperatura: 0.8, max: 1400 });
    const dati = r.testo ? leggiJson(r.testo) : null;
    const testi = dati && dati.facebook ? dati : bozzaAsciutta(opp, lg);

    /* Il controllo gira su ogni formato separatamente: i limiti sono diversi e
       un problema su Instagram non deve bloccare il post di Facebook. */
    const verifiche = {};
    for (const formato of Object.keys(FORMATI)) {
      const testo = testi[formato] || '';
      const esito = controlla({ testo, formato, lingua: lg, fonte: opp.fonte });
      verifiche[formato] = { ...esito, modalita: modalita({ azione: 'post' }, esito) };
    }

    fuori.lingue[lg] = { testi, verifiche, modello: r.modello || null, grezzo: Boolean(testi.grezzo) };
  }
  return fuori;
}

/** Tutte le opportunità di oggi, in fila. */
export async function pacchetti(opportunita, opz) {
  const fuori = [];
  for (const o of opportunita) fuori.push(await pacchetto(o, opz));
  return fuori;
}
