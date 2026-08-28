/* La memoria dell'agente: cosa ha già pubblicato, dove, e quando.
 *
 * Senza questo file l'autonomia è pericolosa: un agente senza memoria
 * ripubblica lo stesso post ogni volta che gira, scrive nello stesso gruppo tre
 * volte in una settimana e si fa cacciare. Con la memoria, sa dire di no.
 *
 * Sta in un file JSON versionato perché ogni giro del lavoro automatico parte
 * da una copia pulita del repository: se la memoria vivesse solo lì dentro,
 * ogni mattina l'agente si sveglierebbe smemorato. Il lavoro lo riscrive e lo
 * spinge, come fa già con gli avvisi del Consolato.                          */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const FILE = new URL('../memoria.json', import.meta.url).pathname;

const VUOTA = { pubblicati: [], gruppi: {}, risposte: [] };

export function leggi() {
  if (!existsSync(FILE)) return { ...VUOTA };
  try {
    const d = JSON.parse(readFileSync(FILE, 'utf8'));
    return { ...VUOTA, ...d };
  } catch (e) {
    /* Una memoria illeggibile non deve fermare la giornata, ma nemmeno passare
       inosservata: si riparte da vuota e lo si dice forte. */
    console.error('[memoria] file illeggibile, riparto da vuota:', e.message);
    return { ...VUOTA };
  }
}

export function scrivi(m) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(m, null, 2) + '\n');
}

const giorni = (iso) => (Date.now() - Date.parse(iso)) / 86400000;

/* ── Regole di ripetizione ────────────────────────────────────────────────
   Non sono preferenze estetiche: sono la differenza fra una pagina utile e
   una pagina che ripete. I numeri sono bassi di proposito — meglio pubblicare
   poco e buono che riempire il feed. */
export const REGOLE = {
  postAlGiorno: 1,          // la Pagina non è una radio
  stessoTemaGiorni: 21,     // tre settimane prima di riparlare della stessa cosa
  stessoGruppoGiorni: 7,    // in un gruppo si torna dopo una settimana, non prima
  gruppiAlGiorno: 8,        // oltre, il ritmo diventa quello di un robot
};

export function giaPubblicato(m, titolo) {
  return (m.pubblicati || []).some(
    (p) => p.titolo === titolo && giorni(p.quando) < REGOLE.stessoTemaGiorni
  );
}

export function postOggi(m) {
  const oggi = new Date().toISOString().slice(0, 10);
  return (m.pubblicati || []).filter((p) => String(p.quando).slice(0, 10) === oggi).length;
}

export function gruppoDisponibile(m, idGruppo) {
  const ultimo = (m.gruppi || {})[idGruppo];
  return !ultimo || giorni(ultimo) >= REGOLE.stessoGruppoGiorni;
}

export function segnaPost(m, { titolo, formato, idEsterno, dove = 'pagina' }) {
  m.pubblicati = m.pubblicati || [];
  m.pubblicati.push({ titolo, formato, dove, idEsterno: idEsterno || null, quando: new Date().toISOString() });
  /* La memoria non cresce all'infinito: oltre i sei mesi non serve più a
     nessuna decisione e rende solo pesante ogni lettura. */
  m.pubblicati = m.pubblicati.filter((p) => giorni(p.quando) < 180);
  return m;
}

export function segnaGruppo(m, idGruppo) {
  m.gruppi = m.gruppi || {};
  m.gruppi[idGruppo] = new Date().toISOString();
  return m;
}

export function segnaRisposta(m, { idCommento, modalita }) {
  m.risposte = m.risposte || [];
  m.risposte.push({ idCommento, modalita, quando: new Date().toISOString() });
  m.risposte = m.risposte.filter((r) => giorni(r.quando) < 90);
  return m;
}

export function giaRisposto(m, idCommento) {
  return (m.risposte || []).some((r) => r.idCommento === idCommento);
}
