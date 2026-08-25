// api/_battito.js — il battito dei lavori automatici.
//
// Perché esiste. I lavori che girano da soli — il digest delle scadenze alle
// 7:30, quello dei voli alle 7, gli avvisi del Consolato il lunedì — quando
// smettono di funzionare non lo dicono a nessuno. È già successo: il digest
// interrogava una colonna che non esisteva e per giorni nessun promemoria è
// partito, su un sito che ricorda alla gente la scadenza del permesso.
//
// Come funziona. Alla fine di ogni lavoro si chiama `battito(nome)`. Se esiste
// la variabile d'ambiente corrispondente — BATTITO_SCADENZE, BATTITO_VOLI — si
// manda un ping all'indirizzo che c'è dentro (healthchecks.io, Better Stack,
// cronitor: parlano tutti lo stesso linguaggio, una GET). Chi sorveglia sa che
// il lavoro doveva farsi vivo a quell'ora: se il ping non arriva, avvisa.
//
// Tre regole, tutte per lo stesso motivo — il battito non deve MAI far cadere
// il lavoro che sorveglia:
//   • senza variabile d'ambiente non fa niente e non si lamenta;
//   • ogni errore viene inghiottito;
//   • dopo tre secondi si rinuncia.
//
// `battito(nome, 'fail')` segnala un fallimento invece di un successo: è la
// differenza fra «non è arrivato niente» (forse è caduta la rete) e «il lavoro
// è partito ed è andato male», che si legge subito.
'use strict';

const TIMEOUT_MS = 3000;

async function battito(nome, esito) {
  const base = process.env['BATTITO_' + String(nome || '').toUpperCase()];
  if (!base) return false;
  const url = esito === 'fail' ? base.replace(/\/+$/, '') + '/fail' : base;
  try {
    const stop = AbortSignal.timeout ? AbortSignal.timeout(TIMEOUT_MS) : undefined;
    await fetch(url, { method: 'GET', signal: stop });
    return true;
  } catch (e) {
    // Un battito perso non è un problema del lavoro: si annota e si tira avanti.
    console.warn('[battito]', nome, esito || 'ok', String(e && e.message || e));
    return false;
  }
}

module.exports = { battito };
