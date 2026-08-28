/* Il rapporto quotidiano (spec §15).
 *
 * Scritto per essere letto dal telefono, la mattina, in due minuti: prima cosa
 * c'è da fare oggi, poi le bozze già pronte da copiare, in fondo i numeri.
 *
 * Un rapporto che comincia con le metriche non lo legge nessuno la seconda
 * volta. Comincia con il lavoro.                                            */

import { NOME_LINGUA, FORMATI } from './lib/marca.mjs';

const SEGNO = { scartato: '✕', revisione: '•', auto: '✓' };

export function scrivi({ oggi, bozze, commenti, lingue }) {
  const r = [];
  r.push(`# Easy Italia Hub — rapporto social del ${oggi}`);
  r.push('');

  const daFare = [];
  if (commenti && commenti.length) daFare.push(`${commenti.length} commenti da leggere sotto i nostri post`);
  daFare.push(`${bozze.length} temi pronti, ${bozze.length * lingue.length} versioni fra le lingue`);
  r.push('**Oggi:** ' + daFare.join(' · '));
  r.push('');

  if (bozze.some((b) => Object.values(b.lingue).some((l) => l.grezzo))) {
    r.push('> ⚠️ Bozze **grezze**: manca `GEMINI_API_KEY`, quindi il testo è montato dai pezzi verificati e non scritto. Serve a vedere la forma, non da pubblicare così.');
    r.push('');
  }

  bozze.forEach((b, i) => {
    const o = b.opportunita;
    r.push(`## ${i + 1}. ${o.titolo}`);
    r.push(`*${o.tipo} · punteggio ${o.punteggio} · fonte: ${o.fonteNome}*`);
    r.push(`<${o.fonte}>`);
    r.push('');
    for (const lg of Object.keys(b.lingue)) {
      const L = b.lingue[lg];
      r.push(`### ${NOME_LINGUA[lg] || lg}`);
      for (const [formato, f] of Object.entries(FORMATI)) {
        const testo = L.testi[formato];
        if (!testo) continue;
        const v = L.verifiche[formato] || {};
        r.push(`**${f.nome}** ${SEGNO[v.modalita] || '?'}${v.problemi && v.problemi.length ? ' — ' + v.problemi.join('; ') : ''}`);
        r.push('```');
        r.push(String(testo).trim());
        r.push('```');
      }
      if (L.testi.hashtag && L.testi.hashtag.length) r.push('`' + L.testi.hashtag.join(' ') + '`');
      r.push('');
    }
  });

  if (commenti && commenti.length) {
    r.push('## Commenti da rivedere');
    for (const c of commenti.slice(0, 20)) {
      r.push(`- **${c.from?.name || 'anonimo'}** · ${(c.message || '').slice(0, 180)}`);
    }
    r.push('');
  }

  r.push('## Legenda');
  r.push('`✓` pronto · `•` da rivedere prima di pubblicare · `✕` scartato dal controllo di sicurezza');
  r.push('');
  r.push('Like, commenti sotto post altrui e inviti restano azioni manuali: nessuna API ufficiale li permette, e farli con un browser pilotato significa perdere la pagina.');
  return r.join('\n');
}

/** Manda il rapporto via Resend, se configurato. Altrimenti lo dice e basta. */
export async function manda(markdown, oggi) {
  const chiave = process.env.RESEND_API_KEY;
  const a = process.env.SOCIAL_REPORT_TO || process.env.CONTACT_TO_EMAIL;
  if (!chiave || !a) return 'non inviato: RESEND_API_KEY o SOCIAL_REPORT_TO mancanti';
  const html = '<pre style="font:13px/1.55 ui-monospace,Menlo,monospace;white-space:pre-wrap">' +
    markdown.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</pre>';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chiave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Easy Italia Hub <notifiche@easyitaliahub.it>',
      to: [a],
      subject: `Social — bozze e commenti del ${oggi}`,
      html,
    }),
  });
  return r.ok ? 'inviato a ' + a : 'errore Resend ' + r.status;
}
