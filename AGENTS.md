# AGENTS.md

Istruzioni per qualsiasi agente AI (Codex, Gemini, Cursor, Claude Code, CloudCLI).
Regole complete in `CLAUDE.md` — leggerlo. Sintesi operativa qui sotto.

## Progetto
Easy Italia Hub — sito su **easyitaliahub.it**.
Stack: HTML statico + Vanilla JS + Vercel Serverless + Supabase + Gemini AI. Nessun build step.

## Deploy
- Push su `main` → Vercel auto-deploy in produzione su easyitaliahub.it.
- Forzare il deploy ad ogni modifica, non affidarsi solo al merge.

## Stile
- Risposte in italiano, brevissime, orientate all'azione. Zero riempitivi.
- Fare, non spiegare cosa si sta per fare.

## Token — imperativo
- Ogni modifica a `api/chat.js` o ai prompt AI deve ridurre i token. Il risultato deve essere più corto dell'originale.

## MCP & Skill
- MCP server: `.mcp.json` (root). Skill: `.agents/skills/`.
- Immagini/video AI: sempre MeiGen (`mcp__meigen__*`). Mai altri provider.

## Comandi
- `npx serve . -l 3000` — preview locale.
- `node scripts/chat-redteam.mjs <url>` — red-team AI.

## Servizi esterni
Consultare `.references/free-for-dev/README.md` prima di scegliere servizi a pagamento.
