// Easy Italia Hub — AI CV Enhancer (Gemini)
// POST { text: string, lang?: 'it'|'en'|'si'|'ta', section?: string }
// Returns { enhanced: string, model: string }
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const MODEL_CHAIN = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
].filter(Boolean).filter((m, i, a) => a.indexOf(m) === i);

const MAX_INPUT_CHARS = 3000;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (isRateLimited(clientIp(req), { name: 'cv-enhance', max: 10 })) {
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto e riprova.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const rawText = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!rawText) return res.status(400).json({ error: 'empty_text' });

  const text = rawText.slice(0, MAX_INPUT_CHARS);
  const lang = ['it', 'en', 'si', 'ta'].includes(body?.lang) ? body.lang : 'it';
  const section = typeof body?.section === 'string' ? body.section.slice(0, 60) : '';

  const langInstr = {
    it: 'Rispondi SOLO in italiano.',
    en: 'Reply ONLY in English.',
    si: 'Reply ONLY in Sinhala (සිංහල).',
    ta: 'Reply ONLY in Tamil (தமிழ்).',
  }[lang];

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({
      enhanced: text,
      demo: true,
      note: 'Modalità demo: configura GEMINI_API_KEY per abilitare il miglioramento AI.',
    });
  }

  const sectionCtx = section ? ` della sezione "${section}"` : '';
  const prompt = `Sei un esperto di CV per il mercato del lavoro italiano. Migliora il seguente testo${sectionCtx} di un curriculum vitae: rendilo più professionale, più incisivo e più adatto al mercato italiano, mantenendo la voce in prima persona, eliminando ridondanze, usando verbi d'azione e quantificando i risultati dove possibile. NON aggiungere informazioni inventate — lavora solo con ciò che hai. Restituisci SOLO il testo migliorato, senza commenti, spiegazioni o intestazioni. ${langInstr}

TESTO ORIGINALE:
${text}`;

  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 600, temperature: 0.5, topP: 0.95 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  });

  let gemRes = null, usedModel = null;
  for (const model of MODEL_CHAIN) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
    if (r.ok) { gemRes = r; usedModel = model; break; }
    const status = r.status;
    if (status !== 429 && status !== 404) break;
  }

  if (!gemRes) {
    return res.status(200).json({ enhanced: text, error: 'gemini_unavailable' });
  }

  const data = await gemRes.json();
  const enhanced = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!enhanced) return res.status(200).json({ enhanced: text, error: 'empty_response' });

  return res.status(200).json({ enhanced, model: usedModel });
};
