/* Il rapporto quotidiano (spec §15).
 *
 * Scritto per essere letto dal telefono, la mattina, in due minuti: prima cosa
 * c'è da fare oggi, poi le bozze già pronte da copiare, in fondo i numeri.
 *
 * Un rapporto che comincia con le metriche non lo legge nessuno la seconda
 * volta. Comincia con il lavoro.                                            */

import { NOME_LINGUA, FORMATI } from './lib/marca.mjs';

const SEGNO = { scartato: '✕', revisione: '•', auto: '✓' };

export function scrivi({ oggi, bozze, commenti, risposte, gruppi, pubblicazione, lingue }) {
  const r = [];
  r.push(`# Easy Italia Hub — rapporto social del ${oggi}`);
  r.push('');

  const daFare = [];
  if (gruppi && gruppi.messaggi && gruppi.messaggi.length) daFare.push(`**${gruppi.messaggi.length} messaggi da incollare nei gruppi**`);
  if (risposte) {
    const rev = risposte.filter((x) => x.modalita === 'revisione').length;
    if (rev) daFare.push(`${rev} risposte da rivedere`);
  }
  daFare.push(`${bozze.length} temi pronti, ${bozze.length * lingue.length} versioni fra le lingue`);
  r.push('**Oggi:** ' + daFare.join(' · '));
  r.push('');

  if (pubblicazione) {
    r.push(pubblicazione.fatto
      ? `✓ **Pubblicato sulla Pagina da solo:** ${pubblicazione.titolo}`
      : `· Nessuna pubblicazione automatica — ${pubblicazione.motivo}`);
    r.push('');
  }

  /* I gruppi stanno in cima, prima delle bozze: sono l'unica cosa che richiede
     davvero le tue mani, e un rapporto che le mette in fondo non le fa fare. */
  if (gruppi && gruppi.messaggi && gruppi.messaggi.length) {
    r.push('## Da incollare nei gruppi — dieci minuti');
    r.push('');
    for (const m of gruppi.messaggi) {
      r.push(`### ${m.gruppo.nome}${m.gruppo.citta ? ' · ' + m.gruppo.citta : ''}`);
      if (m.gruppo.url) r.push(`<${m.gruppo.url}>`);
      r.push(`*tema: ${m.tema} · ${NOME_LINGUA[m.lingua] || m.lingua}${m.grezzo ? ' · BOZZA GREZZA' : ''}*`);
      r.push('```');
      r.push(String(m.messaggio).trim());
      r.push('```');
      if (m.verifica && m.verifica.problemi && m.verifica.problemi.length) {
        r.push(`⚠️ ${m.verifica.problemi.join('; ')}`);
      }
      r.push('');
    }
    if (gruppi.saltati && gruppi.saltati.length) {
      r.push(`*In pausa questa settimana: ${gruppi.saltati.join(', ')}. Nello stesso gruppo si torna dopo sette giorni.*`);
      r.push('');
    }
  } else if (gruppi && gruppi.senzaElenco) {
    r.push('> Nessun gruppo configurato. Copia `social/gruppi.esempio.json` in `social/gruppi.json` e mettici i gruppi veri: l\'agente scriverà i messaggi e terrà il conto di dove è già passato.');
    r.push('');
  }

  if (risposte && risposte.length) {
    r.push('## Commenti sotto i nostri post');
    for (const x of risposte) {
      const c = (commenti || []).find((y) => y.id === x.idCommento) || {};
      r.push(`**${c.from?.name || 'qualcuno'}** (${NOME_LINGUA[x.lingua] || x.lingua}): ${(c.message || '').slice(0, 200)}`);
      r.push(x.modalita === 'auto' ? '↳ risposta inviata da sola:' : '↳ da rivedere:');
      r.push('```');
      r.push(x.risposta || '(da scrivere: nessun modello collegato)');
      r.push('```');
      r.push('');
    }
  }

  if (bozze.some((b) => Object.values(b.lingue).some((l) => l.grezzo))) {
    r.push('> ⚠️ Bozze **grezze**: manca `GEMINI_API_KEY` e il tema non è nel repertorio, quindi il testo è montato dai pezzi verificati e non scritto. Serve a vedere la forma, non da pubblicare così.');
    r.push('');
  }
  if (bozze.some((b) => Object.values(b.lingue).some((l) => l.origine === 'repertorio'))) {
    r.push('> ℹ️ Testi dal **repertorio**: scritti a mano nelle quattro lingue e tenuti nel repository, quindi pubblicabili così come sono. Con `GEMINI_API_KEY` l\'agente scriverebbe sul tema del giorno invece di pescare dal repertorio.');
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

  r.push('## Legenda');
  r.push('`✓` pronto · `•` da rivedere prima di pubblicare · `✕` scartato dal controllo di sicurezza');
  r.push('');
  r.push('La Pagina pubblica e risponde da sola. I gruppi no: Meta ha chiuso la Groups API nell\'aprile 2024, e farlo con un browser pilotato significa perdere il profilo e la Pagina. Per questo i messaggi qui sopra si incollano a mano.');
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
