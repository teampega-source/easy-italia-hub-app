#!/usr/bin/env bash
# Bootstrap sessione (hook SessionStart) — ripristina tool installati in sessioni precedenti. Idempotente.
set -u
D=/root/.claude/skills
mkdir -p "$D"

# Clona repo e copia skill (SKILL.md) in $D. $1=url $2=subdir skill (glob) $3=dir marker
install_skill() {
  [ -d "$D/$3" ] && return 0
  T=$(mktemp -d)
  if git clone --depth 1 "$1" "$T/r" >/dev/null 2>&1; then
    for s in "$T"/r/$2/; do
      [ -f "$s/SKILL.md" ] && cp -r "$s" "$D/"
    done
  fi
  rm -rf "$T"
}

# 9router: 8 skill + server locale
install_skill https://github.com/decolua/9router.git 'skills/*' 9router
(
  command -v 9router >/dev/null 2>&1 || npm install -g 9router >/dev/null 2>&1
  curl -sf --max-time 2 http://127.0.0.1:20128/api/health >/dev/null 2>&1 ||
    nohup 9router --tray --skip-update --host 127.0.0.1 >/dev/null 2>&1 &
) </dev/null >/dev/null 2>&1 &

# planning-with-files: planning persistente su file
install_skill https://github.com/OthmanAdi/planning-with-files.git 'skills/planning-with-files' planning-with-files

# agency-agents: 220+ agenti specializzati in /root/.claude/agents
A=/root/.claude/agents
if [ ! -f "$A/sales-coach.md" ]; then
  T=$(mktemp -d)
  if git clone --depth 1 https://github.com/msitarzewski/agency-agents.git "$T/r" >/dev/null 2>&1; then
    mkdir -p "$A"
    for d in "$T"/r/*/; do
      case "$(basename "$d")" in examples|scripts|integrations|.github) continue;; esac
      cp "$d"*.md "$A/" 2>/dev/null
    done
  fi
  rm -rf "$T"
fi

exit 0
