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

## Tool esterni
- Le 13 skill in `.claude/skills/` sono attive in ogni sessione (scelta dell'utente, 3/8/2026). Se torna l'autocompact thrashing, la causa è qui: si tolgono dal repo, non si toccano gli script.
- Nient'altro va caricato di default. Catalogo e riattivazione: `.references/tools-archive.md`, **solo se l'utente lo chiede** e dopo conferma. Mai installazioni automatiche in `scripts/session-bootstrap.sh`.
- Immagini/video AI: riattivare MCP **meigen** (da `.references/mcp-disabled.json`), mai altri provider. Conferma prima di video, batch >1, 2K/4K.

## GitHub
- Dopo ogni push: creare PR e mergiarla autonomamente (squash su main). L'utente non tocca GitHub.

## Codebase: Easy Italia Hub
**Stack:** HTML statico + Vanilla JS + Vercel Serverless + Supabase + Gemini AI
**Deploy:** Vercel auto-deploy su push a `main`; forzare comunque il deploy (`vercel --prod` o dashboard).
**Stato:** Demo mode (localStorage). Supabase/Stripe/Resend opzionali.
**Comandi:** `npx serve . -l 3000` (preview) · `node scripts/chat-redteam.mjs <url>` (red-team AI)
**Skill utili:** `verify` dopo modifiche visive · `security-review` su auth/API/input · `code-review` prima di push complessi · `web-design-guidelines` su CSS/HTML.
