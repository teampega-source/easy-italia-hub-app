# Istruzioni per Claude

## Stile di risposta
- Estremamente breve e orientato all'azione
- Rispondere sempre in italiano
- Zero frasi di riempimento (no "Certamente", "Ottima domanda", ecc.)
- Non ripetere la richiesta. Non spiegare cosa si sta per fare — farlo e basta.

## Riduzione token — IMPERATIVO
- Ogni modifica a `api/chat.js` o al sistema AI deve ridurre i token al minimo possibile.
- System prompt e security reminder: più brevi possibile mantenendo sicurezza.
- Prima di modificare prompt LLM: verificare che il risultato sia più corto dell'originale.
- CLAUDE.md stesso deve restare il più breve possibile — non aggiungere sezioni verbose.

## Output
- Solo codice/modifiche essenziali. Niente doc non richiesta. Niente commenti ridondanti.

## Generazione immagini/video AI
- Usare **sempre MeiGen** (`mcp__meigen__*`). Mai Higgsfield o altri provider.
- Conferma prima di: video, batch >1 immagine, risoluzione 2K/4K.

## GitHub — gestione autonoma
- Dopo ogni push: creare PR e mergiarla **autonomamente** (squash su main). L'utente non tocca GitHub.

## Flusso di lavoro
- `/plan` prima di modifiche multi-file. `/compact` quando il contesto diventa lungo.

## Servizi gratuiti
Prima di scegliere servizi esterni consultare `.references/free-for-dev/README.md`.

## Skill disponibili

| Skill | Quando |
|-------|--------|
| `deep-research` | Ricerca su librerie/standard |
| `verify` | Dopo ogni modifica visiva — obbligatorio prima di dichiarare done |
| `run` | Server locale (`npx serve . -l 3000`) |
| `code-review` | Prima di push su feature complesse |
| `security-review` | Su auth, API, input utente |
| `plan` | Prima di modifiche multi-file o architetturali |
| `web-design-guidelines` | Su ogni modifica CSS/HTML |
| `vercel-optimize` | Audit costi/performance Vercel |
| `writing-guidelines` | Su testi UX e copy interfaccia |

## Strumenti richiesti dall'utente
- **jcode** (`https://github.com/1jehuang/jcode`): harness agente AI (Rust). Installato in `/root/.local/bin/jcode` (v0.31.2). Installare/aggiornare con: `curl -fsSL https://raw.githubusercontent.com/1jehuang/jcode/master/scripts/install.sh | bash`

## Codebase: Easy Italia Hub
**Stack:** HTML statico + Vanilla JS + Vercel Serverless + Supabase + Gemini AI  
**Deploy:** Vercel auto-deploy su push a `main`. Nessun build step.  
**Stato:** Demo mode (localStorage). Supabase/Stripe/Resend opzionali.  
**Comandi:** `npx serve . -l 3000` (preview) · `node api/test/chat-redteam.mjs <url>` (red-team AI)
