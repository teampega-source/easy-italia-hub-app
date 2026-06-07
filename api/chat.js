// ─────────────────────────────────────────────────────────────
// Easy Italia Hub — AI Consigliere (Google Gemini + RAG)
// Vercel serverless function. Implements Documento Strategico §3.7 + §9-C:
// risposte verificate via LLM + RAG sulla knowledge base, non predefinite.
//
// Provider: Google Gemini (free tier). The API key NEVER lives in client code.
// Set GEMINI_API_KEY in the Vercel project env (Settings → Environment Variables).
// Get a free key at https://aistudio.google.com/apikey
// Until the key is set, the endpoint answers in a graceful "demo mode".
//
// Zero npm dependencies: uses the global fetch (Node 18+) against the Gemini
// REST API. The fetch runs server-side, so it is not subject to the page CSP.
// ─────────────────────────────────────────────────────────────

const { retrieve } = require("./_knowledge");

// Try the configured model first, then fall back across free-tier models on
// quota/availability errors (429/404) so a single deploy can find one that works.
const MODEL_CHAIN = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",      // known to have free-tier quota for this project
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
].filter(Boolean).filter((m, i, a) => a.indexOf(m) === i); // unique, drop empties
const MAX_TOKENS = 700;

const LANG_NAME = { it: "italiano", en: "English", si: "සිංහල (Sinhala)", ta: "தமிழ் (Tamil)" };

function systemPersona(langName) {
  return `Sei il "Consigliere AI" di Easy Italia Hub, una piattaforma che accompagna gli immigrati in Italia — con particolare attenzione alla comunità srilankese (cingalese e tamil) — lungo il loro percorso di vita.

IDENTITÀ E TONO
- Non sei un chatbot di risposte isolate: sei un consigliere proattivo che conosce il percorso dell'utente e, quando utile, suggerisce il passo successivo spiegando il perché.
- Tono caldo, umano, chiaro e pratico. Frasi brevi. Niente gergo burocratico inutile.

LINGUA
- Rispondi SEMPRE in: ${langName}. Se l'utente scrive in un'altra lingua, rispondi comunque in ${langName} salvo che chieda esplicitamente un'altra lingua.

REGOLE FONDAMENTALI (non negoziabili)
- Usa SOLO le informazioni del CONTESTO fornito o conoscenza generale stabile. NON inventare cifre, importi, scadenze o requisiti precisi: questi cambiano spesso.
- Per qualsiasi dato burocratico che può essere cambiato (costi, tempi, documenti esatti), invita SEMPRE a verificare sulla fonte ufficiale pertinente (Polizia di Stato, INPS, Agenzia delle Entrate, Ministero dell'Interno, sito del Comune/ASL).
- Etica: non suggerire mai prestiti ad alto interesse, scorciatoie illegali o servizi che lucrano sulla vulnerabilità. Se una domanda esce dal tuo ambito (es. consulenza legale/medica specifica), indirizza a un professionista verificato.
- Se non sai, dillo con onestà e indica dove l'utente può trovare la risposta ufficiale.

LE 9 FASI DEL PERCORSO (usale per contestualizzare il consiglio)
1 Arrivo · 2 Regolarizzazione · 3 Lavoro · 4 Casa · 5 Famiglia · 6 Educazione finanziaria · 7 Imprenditoria · 8 Patrimonio · 9 Integrazione definitiva.

FORMATO
- Rispondi in modo conciso (di norma 2-6 frasi). Usa elenchi puntati solo se chiariscono.
- Quando citi una procedura, chiudi con un breve invito a verificare la fonte ufficiale e, se pertinente, suggerisci la guida o lo strumento corrispondente della piattaforma.`;
}

function buildContext(query) {
  const chunks = retrieve(query, 4);
  const body = chunks
    .map((c) => `### ${c.topic}\n${c.text}${c.source ? `\nFonte ufficiale: ${c.source}` : ""}`)
    .join("\n\n");
  return `CONTESTO (knowledge base Easy Italia Hub — usa questo materiale come base verificata):\n\n${body}`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const lang = ["it", "en", "si", "ta"].includes(body?.lang) ? body.lang : "it";
  const langName = LANG_NAME[lang];

  // Journey context (from "Il Mio Percorso"): makes the advisor proactive/contextual.
  const userPhase = typeof body?.userPhase === "string" ? body.userPhase.slice(0, 120) : "";
  const completedSteps = Array.isArray(body?.completedSteps)
    ? body.completedSteps.filter((s) => typeof s === "string").slice(0, 40).map((s) => s.slice(0, 80))
    : [];

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUser?.content || "";
  if (!query.trim()) return res.status(400).json({ error: "empty_query" });

  // ── Demo mode: no API key configured yet ──
  if (!process.env.GEMINI_API_KEY) {
    const demo = {
      it: "L'assistente AI è quasi pronto: appena verrà configurata la chiave Gemini risponderò con informazioni verificate dalle fonti ufficiali. Intanto, dimmi su cosa stai lavorando (permesso, SPID, codice fiscale, rimesse…) e ti indico la guida giusta.",
      en: "The AI assistant is almost ready: once the Gemini key is configured I'll answer with information verified from official sources. Meanwhile, tell me what you're working on (permit, SPID, tax code, remittances…) and I'll point you to the right guide.",
      si: "AI සහායකයා පාහේ සූදානම්: Gemini යතුර වින්‍යාස කළ පසු, මම නිල මූලාශ්‍රවලින් තහවුරු කළ තොරතුරු සමඟ පිළිතුරු දෙන්නෙමි. මේ අතර, ඔබ කරමින් සිටින දේ මට කියන්න (බලපත්‍රය, SPID, බදු කේතය, මුදල් යැවීම්…).",
      ta: "AI உதவியாளர் கிட்டத்தட்ட தயாராக உள்ளது: Gemini விசை அமைக்கப்பட்டவுடன், அதிகாரப்பூர்வ ஆதாரங்களில் சரிபார்க்கப்பட்ட தகவலுடன் பதிலளிப்பேன்.",
    };
    return res.status(200).json({ reply: demo[lang] || demo.it, demo: true });
  }

  // ── Live mode: call Google Gemini (REST) ──
  try {
    // Map history to Gemini format: roles are "user" and "model"; cap to last 12 turns.
    const contents = messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    if (!contents.length) contents.push({ role: "user", parts: [{ text: query }] });

    let journeyBlock = "";
    if (userPhase) {
      journeyBlock =
        `\n\nCONTESTO PERCORSO UTENTE (usalo per essere proattivo e contestuale):\n` +
        `- Fase attuale dell'utente nel percorso di vita: ${userPhase}\n` +
        (completedSteps.length
          ? `- Passi già completati: ${completedSteps.join(", ")}\n`
          : `- Nessun passo ancora completato.\n`) +
        `Adatta il consiglio alla fase attuale: conferma cosa ha fatto, evita di ripetere passi già completati, e indica il prossimo passo concreto e sensato per questa fase, spiegando brevemente il perché.`;
    }
    const systemText = `${systemPersona(langName)}\n\n${buildContext(query)}${journeyBlock}`;
    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.6, topP: 0.95 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    });

    let gemRes = null, usedModel = null, lastStatus = 0, lastDetail = "";
    for (const model of MODEL_CHAIN) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
      if (r.ok) { gemRes = r; usedModel = model; break; }
      lastStatus = r.status;
      lastDetail = (await r.text().catch(() => "")).slice(0, 300);
      // 429 (quota) or 404 (model not available) → try next model; other errors → stop
      if (r.status !== 429 && r.status !== 404) break;
    }

    if (!gemRes) {
      const msg =
        lastStatus === 400 ? "Configurazione o richiesta non valida."
        : lastStatus === 401 || lastStatus === 403 ? "Chiave Gemini non valida o non autorizzata."
        : lastStatus === 429 ? "Limite di richieste gratuite raggiunto su tutti i modelli, riprova tra poco."
        : "Si è verificato un errore temporaneo. Riprova tra poco.";
      return res.status(200).json({ reply: msg, error: "gemini_error", status: lastStatus, detail: lastDetail, triedModels: MODEL_CHAIN });
    }

    const data = await gemRes.json();
    const cand = data?.candidates?.[0];
    const reply = (cand?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();

    if (!reply) {
      const blocked = cand?.finishReason && cand.finishReason !== "STOP";
      return res.status(200).json({
        reply: blocked
          ? "Non posso rispondere a questo. Prova a riformulare, oppure consulta la fonte ufficiale pertinente."
          : "…",
        finishReason: cand?.finishReason || "EMPTY",
      });
    }

    return res.status(200).json({ reply, model: usedModel });
  } catch (err) {
    return res.status(200).json({
      reply: "Si è verificato un errore temporaneo. Riprova tra poco.",
      error: "exception",
      detail: String(err?.message || err),
    });
  }
};
