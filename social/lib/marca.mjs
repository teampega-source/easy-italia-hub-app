/* La voce del progetto, scritta una volta sola.
 *
 * Ogni agente che produce testo passa di qui. Se la voce sta dentro i prompt,
 * dopo tre mesi ce ne sono quattro versioni leggermente diverse e nessuno sa
 * quale è quella vera.
 *
 * Fonte: la specifica «AI Social & Community Manager», §17 (brand e lingue) e
 * §7 (fact check).                                                          */

export const SITO = 'https://easyitaliahub.it';

/* Sinhala e italiano per primi: sono le lingue in cui la comunità cerca e non
   trova niente. Inglese e tamil dopo, non per ultimi per caso — l'inglese lo
   legge chi è arrivato da poco, il tamil una parte precisa della comunità. */
export const LINGUE = ['si', 'it', 'en', 'ta'];

export const NOME_LINGUA = { si: 'sinhala', it: 'italiano', en: 'inglese', ta: 'tamil' };

export const VOCE = `Sei la voce di Easy Italia Hub, piattaforma gratuita per la
comunità srilankese in Italia.

Tono: amichevole, semplice, diretto, affidabile. Ti rivolgi a una persona sola,
non a un pubblico. Frasi corte. Nessun entusiasmo pubblicitario.

Non sei un ente, non sei un patronato, non sei un avvocato. Spieghi come
funzionano le cose e rimandi alla fonte ufficiale.

Cosa non fai mai:
- non prometti esiti ("otterrai", "garantito", "sicuro al 100%");
- non dai una scadenza o un importo che non sia nella fonte citata;
- non usi paura o urgenza inventata per far cliccare;
- non chiedi documenti, codici fiscali o dati personali nei commenti;
- non prometti di "far ottenere" permessi, visti o cittadinanza.`;

/* I temi su cui un errore non è un fastidio ma un danno: qui la fonte
   ufficiale è obbligatoria, non consigliata. */
export const TEMI_REGOLATI = [
  'permesso', 'soggiorno', 'cittadinanza', 'visto', 'ricongiungimento',
  'questura', 'prefettura', 'inps', 'bonus', 'assegno', 'isee', 'tasse',
  'agenzia delle entrate', 'residenza', 'anagrafe', 'sanitaria', 'ssn',
  'patente', 'spid', 'cie', 'contratto', 'licenziamento', 'naspi',
];

export function temaRegolato(testo) {
  const t = String(testo || '').toLowerCase();
  return TEMI_REGOLATI.some((k) => t.includes(k));
}

/* Limiti veri delle piattaforme, non arrotondati per eccesso: un testo che
   viene tagliato a metà frase nel feed è peggio di un testo corto. */
export const FORMATI = {
  facebook:  { nome: 'Post Facebook',      max: 500,  hashtag: 5,  righe: 'Prima riga sotto i 90 caratteri: è l\'unica che si vede prima del "Altro".' },
  instagram: { nome: 'Caption Instagram',  max: 400,  hashtag: 12, righe: 'Prima riga sotto i 70 caratteri.' },
  reel:      { nome: 'Copione Reel (30s)', max: 700,  hashtag: 6,  righe: 'Scritto per essere letto ad alta voce: gancio nei primi 2 secondi, poi tre punti, poi invito.' },
  storia:    { nome: 'Storia',             max: 160,  hashtag: 2,  righe: 'Una frase sola, leggibile in due secondi.' },
};

export const INVITO = {
  it: 'Tutto gratis su easyitaliahub.it',
  en: 'Everything free at easyitaliahub.it',
  si: 'සියල්ල නොමිලේ: easyitaliahub.it',
  ta: 'அனைத்தும் இலவசம்: easyitaliahub.it',
};
