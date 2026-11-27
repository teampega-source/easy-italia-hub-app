#!/usr/bin/env node
/* Genera calendario-2027.ics: solo scadenze nazionali ricorrenti.
 * Le scadenze personali (permesso, passaporto) non entrano qui: dipendono
 * dal documento di ciascuno. Rigenerare con: node scripts/genera-calendario-2027.mjs
 */
import { writeFileSync } from 'node:fs';

const eventi = [
  {
    uid: 'isee-dsu-2027',
    data: '20270115',
    titolo: 'ISEE / DSU 2027 — controlla e presenta',
    descrizione: 'Presenta la DSU per Assegno Unico, bonus e agevolazioni. Verifica il calendario INPS/CAF: la data è un promemoria, non un termine legale unico.',
  },
  {
    uid: 'imu-acconto-2027',
    data: '20270616',
    titolo: 'IMU 2027 — acconto (solo proprietari)',
    descrizione: 'Prima rata IMU per chi possiede immobili. Verifica aliquota ed esenzioni del tuo Comune.',
  },
  {
    uid: '730-2027',
    data: '20270930',
    titolo: 'Dichiarazione dei redditi 730 — termine ordinario',
    descrizione: 'Termine ordinario della dichiarazione. Controlla il modello precompilato e le detrazioni; possibili proroghe.',
  },
  {
    uid: 'imu-saldo-2027',
    data: '20271216',
    titolo: 'IMU 2027 — saldo (solo proprietari)',
    descrizione: 'Seconda rata IMU per chi possiede immobili. Verifica le delibere del tuo Comune.',
  },
];

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const righe = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Easy Italia Hub//Calendario scadenze 2027//IT',
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
  'X-WR-CALNAME:Easy Italia Hub — Scadenze 2027',
  'X-WR-CALDESC:Promemoria delle scadenze nazionali 2027. Verifica sempre la fonte ufficiale.',
  'X-WR-TIMEZONE:Europe/Rome',
];

for (const e of eventi) {
  righe.push(
    'BEGIN:VEVENT',
    `UID:${e.uid}@easyitaliahub.it`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
    `DTSTART;VALUE=DATE:${e.data}`,
    `DTEND;VALUE=DATE:${e.data.slice(0, 6)}${String(Number(e.data.slice(6)) + 1).padStart(2, '0')}`,
    `SUMMARY:${esc(e.titolo)}`,
    `DESCRIPTION:${esc(e.descrizione)}`,
    'URL:https://easyitaliahub.it/calendario-2027',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  );
}
righe.push('END:VCALENDAR', '');

writeFileSync('calendario-2027.ics', righe.join('\r\n'), 'utf8');
console.log('calendario-2027.ics ·', eventi.length, 'eventi');
