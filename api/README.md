# AI Consigliere — Setup

Endpoint serverless `/api/chat` che implementa il **Consigliere AI** del documento strategico
(§3.7 + §9-C): Claude API + RAG sulla knowledge base, risposte verificate, multilingua.

## File
- `chat.js` — funzione serverless Vercel. Legge `ANTHROPIC_API_KEY` da env, fa RAG, chiama Claude.
- `_knowledge.js` — knowledge base + funzione `retrieve()` (recupero per keyword, top-K).

## Attivazione (quando hai la chiave)
1. Su Vercel → progetto → **Settings → Environment Variables**, aggiungi:
   - `ANTHROPIC_API_KEY` = la tua chiave Anthropic (Production + Preview)
   - *(opzionale)* `CLAUDE_MODEL` = es. `claude-sonnet-4-5` (default già impostato)
2. Redeploy. Fatto: il bot risponde con Claude + RAG.

> ⚠️ La chiave NON va mai nel codice client. Vive solo come variabile d'ambiente lato server.

## Comportamento senza chiave
Finché `ANTHROPIC_API_KEY` non è impostata, l'endpoint risponde in **demo mode** con un
messaggio cortese multilingua (it/en/si/ta). La UI resta pienamente funzionante.

## Knowledge base
`_knowledge.js` contiene chunk curati su: piattaforma e 9 fasi, permesso di soggiorno, SPID,
codice fiscale, residenza, tessera sanitaria, NASpI, cittadinanza, money transfer, busta paga,
partita IVA, community, marketplace.

**Importante (dal documento):** i dettagli burocratici (costi, scadenze, requisiti) cambiano.
Il system prompt impone al modello di **non inventare** numeri e di rimandare sempre alle
**fonti ufficiali** (Polizia di Stato, INPS, Agenzia delle Entrate, Ministero dell'Interno,
Comune/ASL). Per scalare, si può sostituire il recupero per keyword con embeddings/vector DB.
