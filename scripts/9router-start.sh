#!/usr/bin/env bash
# Bootstrap 9Router (hook SessionStart) — idempotente
set -u
D=/root/.claude/skills
if [ ! -d "$D/9router" ]; then
  T=$(mktemp -d)
  if git clone --depth 1 https://github.com/decolua/9router.git "$T/9r" >/dev/null 2>&1; then
    mkdir -p "$D"
    for s in "$T"/9r/skills/*/; do
      [ -f "$s/SKILL.md" ] && cp -r "$s" "$D/"
    done
  fi
  rm -rf "$T"
fi
(
  command -v 9router >/dev/null 2>&1 || npm install -g 9router >/dev/null 2>&1
  curl -sf --max-time 2 http://127.0.0.1:20128/api/health >/dev/null 2>&1 ||
    nohup 9router --tray --skip-update --host 127.0.0.1 >/dev/null 2>&1 &
) </dev/null >/dev/null 2>&1 &
exit 0
