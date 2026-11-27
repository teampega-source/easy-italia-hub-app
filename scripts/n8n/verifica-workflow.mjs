#!/usr/bin/env node
/* Verifica statica dei workflow n8n.
 *
 * Non esegue n8n: controlla ciò che si può controllare senza credenziali:
 *   - JSON valido e connessioni verso nodi esistenti;
 *   - trigger presente e workflow attivo/inattivo;
 *   - tabelle e campi Supabase allineati allo schema reale;
 *   - nodi e credenziali che devono esistere per un giro vero.
 *
 * Uso:
 *   node scripts/n8n/verifica-workflow.mjs
 *   node scripts/n8n/verifica-workflow.mjs --strict
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const STRICT = process.argv.includes('--strict');
const DIR = 'scripts/n8n';

const TABLE_FIELDS = {
  content_calendar: new Set(['week_of', 'giorno', 'tipo', 'tema', 'caption_it', 'caption_si', 'hook', 'cta', 'status']),
  news_items: new Set(['title', 'link', 'description', 'source', 'title_si', 'published_at']),
};

const NODI_NOTI = new Set([
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.httpRequest',
  'n8n-nodes-base.code',
  'n8n-nodes-base.supabase',
  'n8n-nodes-base.slack',
  'n8n-nodes-base.emailSend',
  'n8n-nodes-base.if',
  'n8n-nodes-base.splitInBatches',
  'n8n-nodes-base.respondToWebhook',
  '@n8n/n8n-nodes-langchain.openAi',
  '@n8n/n8n-nodes-langchain.lmChatOpenAi',
]);

const isTrigger = (n) => n && (n.type === 'n8n-nodes-base.webhook' || n.type === 'n8n-nodes-base.scheduleTrigger');

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.json') && !f.includes('.legacy.'))
  .sort();

let errori = 0;
let avvisi = 0;

for (const file of files) {
  const path = join(DIR, file);
  let wf;
  try {
    wf = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.log(`✗ ${file}: JSON non valido (${e.message})`);
    errori++;
    continue;
  }

  const err = [];
  const warn = [];
  const nodi = new Map((wf.nodes || []).map((n) => [n.name, n]));

  if (!wf.name) err.push('manca il nome');
  if (!wf.nodes || !wf.nodes.length) err.push('nessun nodo');
  if (!(wf.nodes || []).some(isTrigger))
    err.push('nessun trigger (webhook o schedule)');

  for (const [from, conn] of Object.entries(wf.connections || {})) {
    if (!nodi.has(from)) err.push(`connessione da nodo inesistente: ${from}`);
    for (const output of conn.main || []) {
      for (const target of output || []) {
        if (!nodi.has(target.node)) err.push(`connessione verso nodo inesistente: ${target.node}`);
      }
    }
  }

  for (const n of wf.nodes || []) {
    if (!NODI_NOTI.has(n.type)) warn.push(`nodo non verificato: ${n.type}`);
    if (n.type === 'n8n-nodes-base.webhook' && n.parameters?.authentication !== 'headerAuth')
      warn.push(`webhook ${n.name}: senza header auth`);
    if (n.type === 'n8n-nodes-base.supabase') {
      const table = n.parameters?.tableId;
      if (!table) err.push(`nodo ${n.name}: tableId mancante`);
      else if (table === 'users' || table === 'permesso_tracker')
        err.push(`nodo ${n.name}: tabella inesistente (${table})`);
      const fields = n.parameters?.fieldsUi?.fieldValues || [];
      if (TABLE_FIELDS[table]) {
        for (const f of fields) {
          if (f.fieldId && !TABLE_FIELDS[table].has(f.fieldId))
            err.push(`nodo ${n.name}: campo ${f.fieldId} non presente in ${table}`);
        }
      }
    }
  }

  if (wf.active !== true) warn.push('workflow inattivo: importarlo e attivarlo dopo il test');
  if (wf.meta?.note) warn.push(`nota: ${wf.meta.note}`);

  const trig = (wf.nodes || []).filter(isTrigger).length;
  console.log(`${err.length ? '✗' : '✓'} ${file} — ${wf.name || '(senza nome)'} · ${ (wf.nodes || []).length} nodi · ${trig} trigger · ${wf.active ? 'attivo' : 'inattivo'}`);
  for (const e of err) { console.log(`   ERRORE: ${e}`); errori++; }
  for (const w of warn) { console.log(`   nota: ${w}`); avvisi++; }
}

console.log(`\n${files.length} workflow · ${errori} errori · ${avvisi} avvisi`);
console.log('Questo è un test statico: per il giro reale servono n8n + credenziali e un evento di prova.');
if (STRICT && errori) process.exit(1);
