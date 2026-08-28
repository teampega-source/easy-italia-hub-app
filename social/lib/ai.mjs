/* Il cancello verso il modello, uno solo per tutti gli agenti (spec §10).
 *
 * Perché passare di qui invece di chiamare Gemini dove serve: il giorno in cui
 * si cambia modello — o si esaurisce la quota gratuita — si cambia un file.
 * E soprattutto: senza chiave il sistema non si rompe, entra in modalità
 * asciutta e produce comunque una bozza montata dai testi verificati del sito.
 * Serve a provare tutta la catena senza spendere e senza rete.
 *
 * Le chiavi non stanno qui: arrivano dall'ambiente (spec §18).              */

const CATENA = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
].filter(Boolean).filter((m, i, a) => a.indexOf(m) === i);

export function disponibile() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/* Ogni chiamata lascia una traccia: quale modello, quanti caratteri, quanto ci
   ha messo, com'è finita. È la tabella ai_runs della specifica (§9), tenuta in
   memoria qui e scritta da chi chiama. */
export const registro = [];

export async function genera(istruzione, richiesta, { temperatura = 0.7, max = 1200 } = {}) {
  const avvio = Date.now();
  if (!disponibile()) {
    registro.push({ modello: 'asciutto', ms: 0, esito: 'senza-chiave' });
    return { testo: null, modello: null, asciutto: true };
  }
  let ultimo = null;
  for (const modello of CATENA) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: istruzione }] },
            contents: [{ role: 'user', parts: [{ text: richiesta }] }],
            generationConfig: { temperature: temperatura, maxOutputTokens: max },
          }),
          signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined,
        }
      );
      /* 429 è quota finita, 404 è modello ritirato: in entrambi i casi si
         scende di un gradino invece di fallire. */
      if (r.status === 429 || r.status === 404) { ultimo = `${modello}: ${r.status}`; continue; }
      if (!r.ok) { ultimo = `${modello}: ${r.status} ${(await r.text()).slice(0, 200)}`; continue; }
      const d = await r.json();
      const testo = d?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      registro.push({ modello, ms: Date.now() - avvio, esito: testo ? 'ok' : 'vuoto', caratteri: testo.length });
      if (testo) return { testo, modello, asciutto: false };
      ultimo = `${modello}: risposta vuota`;
    } catch (e) {
      ultimo = `${modello}: ${e.message || e}`;
    }
  }
  registro.push({ modello: CATENA.join('>'), ms: Date.now() - avvio, esito: 'errore', dettaglio: ultimo });
  return { testo: null, modello: null, asciutto: true, errore: ultimo };
}

/* Il modello risponde in JSON solo se glielo si chiede con severità, e a volte
   lo incarta lo stesso in un blocco di codice. */
export function leggiJson(testo) {
  if (!testo) return null;
  const pulito = String(testo).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(pulito); } catch (e) {}
  const i = pulito.indexOf('{'), j = pulito.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(pulito.slice(i, j + 1)); } catch (e) {} }
  return null;
}
