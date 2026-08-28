/* Safety Agent — il controllo che gira PRIMA che un testo arrivi a una persona.
 *
 * Perché non è un altro prompt all'AI. Un modello che si autovaluta dice di sì
 * quasi sempre, e quando dice di no non sai perché. Queste sono regole scritte:
 * si leggono, si discutono, e sbagliano sempre allo stesso modo — che per un
 * controllo è una virtù.
 *
 * L'AI resta un secondo parere, non il primo (spec §3, agente Safety).
 *
 * Ogni problema ha una gravità:
 *   blocco    · non si pubblica, punto. Va riscritto.
 *   avviso    · si pubblica solo con l'occhio di una persona sopra.
 *   nota      · si segnala e basta.                                         */

import { FORMATI, temaRegolato } from './marca.mjs';

/* Promesse che una piattaforma informativa non può fare. Sono le frasi con cui
   si presentano quelli che si fanno pagare per le pratiche: se le scrivessimo
   noi, saremmo indistinguibili da loro. */
const PROMESSE = [
  /\bgarant\w+/i, /\b100\s*%\b/i, /\bsicur\w+ al\b/i, /\bti facciamo ottenere\b/i,
  /\botterr\w+\b/i, /\bapprovazione garantita\b/i, /\bsenza rischi\b/i,
  /\bguarantee\w*\b/i, /\bwe get you\b/i, /\bassured\b/i,
];

/* Il vocabolario dello scambio artificiale. La specifica lo vieta (§5) e le
   piattaforme pure: non è prudenza, è la differenza fra crescere e sparire. */
const SCAMBIO = [
  /\bmetti(?:ci)? like\b/i, /\bfollow ?4 ?follow\b/i, /\bseguimi e ti seguo\b/i,
  /\btagga (?:cinque|5|dieci|10) amici\b/i, /\bcondividi per (?:vincere|partecipare)\b/i,
  /\blike ?4 ?like\b/i, /\bcommenta "?(?:si|yes)"? per\b/i,
];

/* Dati che non si chiedono in pubblico. In un commento sotto un post finiscono
   sotto gli occhi di chiunque, e questa comunità viene truffata proprio così. */
/* Non basta che il termine compaia: una guida sul codice fiscale DEVE poter
   dire «codice fiscale». Il problema è chiederlo. Quindi si cerca il verbo
   della richiesta accanto al dato — trovato provando, perché la prima versione
   bloccava tutti i post sulla guida al codice fiscale. */
const DATI_PERSONALI = [
  /\b(?:manda|mandaci|mandami|invia|inviaci|inviami|scrivi|scrivici|allega|dammi|mostrami|caricare?)\b[^.\n]{0,50}\b(?:codice fiscale|passaporto|iban|documenti|permesso di soggiorno|carta d'identit)/i,
  /\b(?:il tuo|la tua|i tuoi)\s+(?:iban|numero di carta|dati bancari)\b/i,
  /\bsend (?:me|us)\b[^.\n]{0,40}\b(?:passport|documents|permit|id card|iban)/i,
  /\bcommenta (?:con|il) (?:il )?(?:tuo )?(?:numero|codice fiscale|telefono)\b/i,
];

const URGENZA = [
  /\bultimi? giorni?\b/i, /\baffrettati\b/i, /\bsolo per oggi\b/i, /\bscade tra poche ore\b/i,
  /\bhurry\b/i, /\blast chance\b/i,
];

function cerca(regole, testo) {
  return regole.filter((r) => r.test(testo)).map((r) => String(r));
}

/**
 * @param {object} pezzo  { testo, formato, lingua, fonte }
 * @returns {{ok:boolean, gravita:'blocco'|'avviso'|'nota'|null, problemi:string[]}}
 */
export function controlla(pezzo) {
  const testo = String(pezzo.testo || '');
  const problemi = [];
  let gravita = null;
  const alza = (g) => {
    const ordine = { nota: 1, avviso: 2, blocco: 3 };
    if (!gravita || ordine[g] > ordine[gravita]) gravita = g;
  };

  if (!testo.trim()) {
    return { ok: false, gravita: 'blocco', problemi: ['testo vuoto'] };
  }

  if (cerca(PROMESSE, testo).length) {
    problemi.push('promette un esito: è esattamente il linguaggio di chi si fa pagare per le pratiche');
    alza('blocco');
  }
  if (cerca(SCAMBIO, testo).length) {
    problemi.push('chiede like, follow o tag in cambio: vietato dalla specifica (§5) e dalle piattaforme');
    alza('blocco');
  }
  if (cerca(DATI_PERSONALI, testo).length) {
    problemi.push('chiede dati personali in pubblico');
    alza('blocco');
  }
  if (cerca(URGENZA, testo).length) {
    problemi.push('urgenza artificiale');
    alza('avviso');
  }

  /* Fonte obbligatoria sui temi regolati. Un post sul permesso di soggiorno
     senza il link all'ente è il modo più veloce di diventare noi stessi la
     fonte sbagliata che qualcuno citerà. */
  if (temaRegolato(testo) && !pezzo.fonte) {
    problemi.push('tema regolato senza fonte ufficiale collegata');
    alza('blocco');
  }

  /* Cifre e date senza fonte: «entro 60 giorni», «costa 80 euro». Se il numero
     non viene da un ente, prima o poi è sbagliato. */
  const numeri = /(\d+\s*(?:€|euro|giorni|mesi|anni)\b)/i.test(testo);
  if (numeri && !pezzo.fonte) {
    problemi.push('cita importi o tempi senza fonte');
    alza('avviso');
  }

  const f = FORMATI[pezzo.formato];
  if (f) {
    if (testo.length > f.max) {
      problemi.push(`troppo lungo per ${f.nome}: ${testo.length} caratteri su ${f.max}`);
      alza('avviso');
    }
    const hashtag = (testo.match(/#[\p{L}\p{N}_]+/gu) || []).length;
    if (hashtag > f.hashtag) {
      problemi.push(`${hashtag} hashtag su ${f.hashtag} consigliati`);
      alza('nota');
    }
  }

  if (/\bAI\b|\bintelligenza artificiale\b/i.test(testo) === false && pezzo.immagineGenerata) {
    problemi.push('immagine generata: va etichettata al momento della pubblicazione (art. 50 Reg. UE 2024/1689)');
    alza('avviso');
  }

  return { ok: gravita !== 'blocco', gravita, problemi };
}

/* La coda delle azioni non decide da sola: decide questa funzione, e lo fa
   sempre allo stesso modo (spec §5 e §12).
     auto      · niente da rivedere, e l'azione è di quelle preautorizzate
     revisione · passa da una persona
     manuale   · nessuna API lo permette: lo fa una persona a mano            */
export function modalita(pezzo, esito) {
  if (esito.gravita === 'blocco') return 'scartato';
  if (pezzo.azione === 'commento' || pezzo.azione === 'messaggio') return 'revisione';
  if (pezzo.azione === 'invito' || pezzo.azione === 'like') return 'manuale';
  if (esito.gravita === 'avviso') return 'revisione';
  return pezzo.preautorizzato ? 'auto' : 'revisione';
}
