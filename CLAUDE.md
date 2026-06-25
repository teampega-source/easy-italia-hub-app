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
- **cc-nano-banana** (`https://github.com/kkoppenhaver/cc-nano-banana`): skill generazione immagini via Gemini CLI. Installato in `/root/.claude/skills/nano-banana/SKILL.md`. Richiede: `GEMINI_API_KEY` env var + `gemini extensions install https://github.com/gemini-cli-extensions/nanobanana --consent` (manuale). Comandi: `gemini --yolo "/generate|/edit|/icon|/diagram|/pattern|/story"`.
- **claude-ads** (`https://github.com/AgriciDaniel/claude-ads`): skill audit pubblicitario multi-piattaforma (Google, Meta, TikTok, LinkedIn, ecc.). Installato in `/root/.claude/skills/ads/` (22 sub-skill) + `/root/.claude/agents/` (10 agenti). Reinstallare con: `curl -fsSL https://raw.githubusercontent.com/AgriciDaniel/claude-ads/main/install.sh | bash --target=claude`. Trigger: `/ads audit|google|meta|youtube|linkedin|tiktok|microsoft|apple|amazon|budget|creative|landing|plan|competitor|dna|generate`.
- **hyperframes** (`https://github.com/heygen-com/hyperframes`): skill video AI (HTML→MP4). Installato in `/root/.claude/skills/` (18 skill: hyperframes, website-to-video, product-launch-video, embedded-captions, motion-graphics, ecc.). Reinstallare: scarica ogni `skills/<nome>/SKILL.md` da GitHub. Trigger: `/hyperframes`, `/website-to-video`, `/product-launch-video`, `/faceless-explainer`, `/slideshow`, `/motion-graphics`, ecc.
- **Open-Generative-AI** (`https://github.com/Anil-matcha/Open-Generative-AI`): studio generativo AI (immagini, video, lip-sync, cinema). Nessuna Claude Code skill — app web/desktop. Usa online: `https://muapi.ai/open-generative-ai`. Skills per agenti: `https://github.com/SamurAIGPT/Generative-Media-Skills`. API key: MuAPI.
- **odysseus** (`https://github.com/pewdiepie-archdaemon/odysseus`): workspace AI self-hosted (chat, agenti, ricerca web, email, note, calendario). Avvia con `docker compose up -d --build` poi apri `http://localhost:7000`. MCP servers (`image_gen`, `email`, `memory`, `rag`) in `mcp_servers/` — attivabili solo con l'app in esecuzione.
- **agents.sabrina.dev** (`https://agents.sabrina.dev`): libreria 1000+ template AI gratuiti per **n8n** e **Make.com**. Nessuna installazione — scarica template e importa. Utili per Easy Italia Hub: social media auto-posting (destinazioni/attività), lead generation (tour operator/strutture), email drip (viaggiatori), chatbot supporto prenotazioni, CRM automation, content AI, SEO automation. 100% free, no signup. Richiede istanza n8n (self-host gratuito) o account Make.com (free tier).

## Codebase: Easy Italia Hub
**Stack:** HTML statico + Vanilla JS + Vercel Serverless + Supabase + Gemini AI  
**Deploy:** Vercel auto-deploy su push a `main`. Nessun build step.  
**Stato:** Demo mode (localStorage). Supabase/Stripe/Resend opzionali.  
**Comandi:** `npx serve . -l 3000` (preview) · `node scripts/chat-redteam.mjs <url>` (red-team AI)
