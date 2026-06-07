# AI Consigliere — Setup (Google Gemini, free tier)

Endpoint serverless `/api/chat` che implementa il **Consigliere AI** del documento strategico
(§3.7 + §9-C): LLM + RAG sulla knowledge base, risposte verificate, multilingua.

**Provider: Google Gemini** (tier gratuito). Zero dipendenze npm — usa `fetch` globale (Node 18+)
contro le REST API di Gemini, lato server (nessun problema di CSP).

## File
- `chat.js` — funzione serverless Vercel. Legge `GEMINI_API_KEY` da env, fa RAG, chiama Gemini.
- `_knowledge.js` — knowledge base + funzione `retrieve()` (recupero per keyword, top-K).

## Attivazione (chiave gratuita, nessun pagamento)
1. Crea una chiave gratuita su **https://aistudio.google.com/apikey** (serve un account Google).
2. Su Vercel → progetto **deploy** → **Settings → Environment Variables**, aggiungi:
   - `GEMINI_API_KEY` = la tua chiave (Production + Preview)
   - *(opzionale)* `GEMINI_MODEL` = es. `gemini-2.0-flash` (default già impostato)
3. Redeploy. Fatto: il bot risponde con Gemini + RAG.

> ⚠️ La chiave NON va mai nel codice client. Vive solo come variabile d'ambiente lato server.

## Comportamento senza chiave
Finché `GEMINI_API_KEY` non è impostata, l'endpoint risponde in **demo mode** con un
messaggio cortese multilingua (it/en/si/ta). La UI resta pienamente funzionante.

## Limiti del tier gratuito
Gemini free tier ha limiti di richieste/minuto e giornalieri (ok per lancio/test). In caso di
superamento l'endpoint risponde con un messaggio cortese (HTTP 429 gestito). Per un prodotto reale
valutare un piano a pagamento e la verifica GDPR (i dati del free tier possono essere usati da
Google per migliorare i modelli).

## Knowledge base
`_knowledge.js` contiene chunk curati su: piattaforma e 9 fasi, permesso di soggiorno, SPID,
codice fiscale, residenza, tessera sanitaria, NASpI, cittadinanza, money transfer, busta paga,
partita IVA, community, marketplace.

**Importante (dal documento):** i dettagli burocratici (costi, scadenze, requisiti) cambiano.
Il system prompt impone al modello di **non inventare** numeri e di rimandare sempre alle
**fonti ufficiali** (Polizia di Stato, INPS, Agenzia delle Entrate, Ministero dell'Interno, Comune/ASL).

## Cambiare provider in futuro
La funzione è isolata: per passare a un altro provider (Groq, OpenRouter, Anthropic…) basta
sostituire la sezione "Live mode" in `chat.js` mantenendo `systemPersona()` e `buildContext()`.
