# Istruzioni per Claude

## Stile
- Rispondere sempre in italiano, estremamente breve, orientato all'azione. Zero riempitivi.
- Solo codice/modifiche essenziali. Niente doc non richiesta, niente commenti ridondanti.

## Autonomia
- Mai chiedere conferme, tranne: azioni distruttive irreversibili, spese reali, **attivazione di nuovi tool** (v. sotto).
- Se un approccio fallisce, provare alternative senza fermarsi.

## Riduzione token — IMPERATIVO
- Ogni modifica a `api/chat.js` o ai prompt LLM deve ridurre i token: verificare che il risultato sia più corto dell'originale.
- Questo CLAUDE.md deve restare minimo. Non aggiungere sezioni, elenchi di tool o tabelle.

## Tool esterni — SOLO ON-DEMAND
- Nessuna skill, agente o server MCP extra viene caricato di default: gonfiavano il contesto (autocompact thrashing).
- Catalogo completo e istruzioni di riattivazione: `.references/tools-archive.md`. Attivare **solo se l'utente lo chiede** e dopo conferma. Mai reinserire installazioni automatiche in `scripts/session-bootstrap.sh` o voci fisse in questo file.
- Immagini/video AI: riattivare MCP **meigen** (da `.references/mcp-disabled.json`), mai altri provider. Conferma prima di video, batch >1, 2K/4K.

## GitHub
- Dopo ogni push: creare PR e mergiarla autonomamente (squash su main). L'utente non tocca GitHub.

## Codebase: Easy Italia Hub
**Stack:** HTML statico + Vanilla JS + Vercel Serverless + Supabase + Gemini AI
**Deploy:** Vercel auto-deploy su push a `main`; forzare comunque il deploy (`vercel --prod` o dashboard).
**Stato:** Demo mode (localStorage). Supabase/Stripe/Resend opzionali.
**Comandi:** `npx serve . -l 3000` (preview) · `node scripts/chat-redteam.mjs <url>` (red-team AI)
**Skill utili:** `verify` dopo modifiche visive · `security-review` su auth/API/input · `code-review` prima di push complessi · `web-design-guidelines` su CSS/HTML.
