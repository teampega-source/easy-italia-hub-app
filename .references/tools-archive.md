# Archivio strumenti — DISATTIVATI

Tutto qui è **disattivato** per alleggerire il contesto (causava autocompact thrashing).
Riattivare un tool **solo se l'utente lo chiede esplicitamente**, e chiedendo conferma prima di installare.
Niente va aggiunto a `scripts/session-bootstrap.sh`: nessuna reinstallazione automatica.

## Server MCP (ex `.mcp.json`)
Config completa in `mcp-disabled.json`. Per riattivarne uno: copiare la voce in `.mcp.json`.
- **meigen** — generazione immagini/video AI (provider preferito quando serve)
- **shadcn** · **@21st-dev/magic** — componenti UI React (il sito è HTML statico: quasi mai utili)
- **task-master-ai** · **glif** — non usati dal progetto

## Skill / agenti (ex bootstrap + installazioni manuali)
- **9router** (`github.com/decolua/9router`): gateway AI locale OpenAI-compatible + 8 skill. `npm i -g 9router` poi `9router --tray --skip-update --host 127.0.0.1` (porta 20128).
- **planning-with-files** (`github.com/OthmanAdi/planning-with-files`): planning persistente su file. Clonare `skills/planning-with-files` in `/root/.claude/skills/`.
- **agency-agents** (`github.com/msitarzewski/agency-agents`): 220+ agenti specializzati. Copiare i `.md` in `/root/.claude/agents/`. ⚠️ Pesantissimo sul contesto — installare solo il singolo agente che serve.
- **claude-ads** (`github.com/AgriciDaniel/claude-ads`): audit pubblicitario. `curl -fsSL https://raw.githubusercontent.com/AgriciDaniel/claude-ads/main/install.sh | bash --target=claude`.
- **hyperframes** (`github.com/heygen-com/hyperframes`): video HTML→MP4, 18 skill. Scaricare i singoli `SKILL.md` da GitHub.
- **cc-nano-banana** (`github.com/kkoppenhaver/cc-nano-banana`): immagini via Gemini CLI. Richiede `GEMINI_API_KEY` + `gemini extensions install https://github.com/gemini-cli-extensions/nanobanana --consent`.

## CLI / app esterne
- **jcode** (`github.com/1jehuang/jcode`): harness agente Rust. `curl -fsSL https://raw.githubusercontent.com/1jehuang/jcode/master/scripts/install.sh | bash`
- **acpx** (`github.com/openclaw/acpx`): CLI Agent Client Protocol. `npm install -g acpx`
- **odysseus** (`github.com/pewdiepie-archdaemon/odysseus`): workspace AI self-hosted. `docker compose up -d --build` → `localhost:7000`
- **Open-Generative-AI** (`github.com/Anil-matcha/Open-Generative-AI`): studio generativo web — usare online su `muapi.ai/open-generative-ai` (API key MuAPI)
- **agents.sabrina.dev**: 1000+ template n8n/Make.com per automazioni (social, lead gen, email drip, chatbot). Nessuna installazione.

## Altri riferimenti in `.references/`
Consultare solo al bisogno: `free-for-dev/` (servizi gratuiti), `ai-tool-directory.md`, `ai-prompt-pack/prompts.json`, `silent-failure-checklist.md` (code review), `ai-video-studio-kit/` (⚠️ scorer TRIBE v2 solo non-commerciale), `flux-fusion-megaprompt.md`, `evolving-megacycle-prompt.md`, `universal-sentient-operator.md`, `uncaged-operator-course.md`, `claude-md-templates/`, `ai-studio-code.js` (i18n IT/SI/EN + email anti-phishing).
