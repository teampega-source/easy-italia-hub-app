// ─────────────────────────────────────────────────────────────
// Easy Italia Hub — AI Consigliere (Claude API + RAG)
// Vercel serverless function. Implements Documento Strategico §3.7 + §9-C:
// "Collegare il bot all'API di Claude con sistema RAG sulla knowledge base,
//  così risponde con informazioni verificate invece di risposte predefinite."
//
// The API key NEVER lives in client code. Set ANTHROPIC_API_KEY in the Vercel
// project env (Settings → Environment Variables). Until then the endpoint
// answers in a graceful "demo mode" so the UI keeps working.
// ─────────────────────────────────────────────────────────────

const { retrieve } = require("./_knowledge");

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";
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
  // CORS for same-origin is automatic; keep it strict.
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

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUser?.content || "";

  if (!query.trim()) {
    return res.status(400).json({ error: "empty_query" });
  }

  // ── Demo mode: no API key configured yet ──
  if (!process.env.ANTHROPIC_API_KEY) {
    const demo = {
      it: "L'assistente AI è quasi pronto: appena verrà configurata la chiave Claude risponderò con informazioni verificate dalle fonti ufficiali. Intanto, dimmi su cosa stai lavorando (permesso, SPID, codice fiscale, rimesse…) e ti indico la guida giusta.",
      en: "The AI assistant is almost ready: once the Claude key is configured I'll answer with information verified from official sources. Meanwhile, tell me what you're working on (permit, SPID, tax code, remittances…) and I'll point you to the right guide.",
      si: "AI සහායකයා පාහේ සූදානම්: Claude යතුර වින්‍යාස කළ පසු, මම නිල මූලාශ්‍රවලින් තහවුරු කළ තොරතුරු සමඟ පිළිතුරු දෙන්නෙමි. මේ අතර, ඔබ කරමින් සිටින දේ මට කියන්න (බලපත්‍රය, SPID, බදු කේතය, මුදල් යැවීම්…) — මම නිවැරදි මාර්ගෝපදේශය වෙත ඔබව යොමු කරමි.",
      ta: "AI உதவியாளர் கிட்டத்தட்ட தயாராக உள்ளது: Claude விசை அமைக்கப்பட்டவுடன், அதிகாரப்பூர்வ ஆதாரங்களில் சரிபார்க்கப்பட்ட தகவலுடன் பதிலளிப்பேன்.",
    };
    return res.status(200).json({ reply: demo[lang] || demo.it, demo: true });
  }

  // ── Live mode: call Claude ──
  let Anthropic;
  try {
    Anthropic = require("@anthropic-ai/sdk");
  } catch {
    return res.status(500).json({ error: "sdk_missing", reply: "Configurazione incompleta: dipendenza @anthropic-ai/sdk mancante." });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Keep only role/content, cap history to last 12 turns.
    const history = messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        // Stable persona → cached across requests for cost/latency.
        { type: "text", text: systemPersona(langName), cache_control: { type: "ephemeral" } },
        // Per-query retrieved knowledge (RAG).
        { type: "text", text: buildContext(query) },
      ],
      messages: history.length ? history : [{ role: "user", content: query }],
    });

    const reply = (response.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return res.status(200).json({ reply: reply || "…", model: MODEL });
  } catch (err) {
    const status = err?.status || 500;
    const msg =
      status === 401 ? "Chiave API non valida o assente."
      : status === 429 ? "Troppo traffico in questo momento, riprova tra poco."
      : "Si è verificato un errore temporaneo. Riprova tra poco.";
    return res.status(200).json({ reply: msg, error: "claude_error", detail: String(err?.message || err) });
  }
};
