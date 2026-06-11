#!/usr/bin/env bash
# Easy Italia Hub — switch del dominio in tutto il sito.
# Uso:  ./scripts/set-domain.sh easyitaliahub.com
# Sostituisce il dominio in canonical, Open Graph, Twitter, hreflang,
# JSON-LD, sitemap.xml e robots.txt. Idempotente: legge il dominio
# attuale dal canonical della home.
set -euo pipefail
cd "$(dirname "$0")/.."

NEW="${1:?Uso: ./scripts/set-domain.sh nuovodominio.tld (senza https:// e senza slash finale)}"
NEW="${NEW#https://}"; NEW="${NEW#http://}"; NEW="${NEW%/}"

OLD=$(grep -o 'rel="canonical" href="https://[^/"]*' index.html | head -1 | sed 's|.*https://||')
[ -n "$OLD" ] || { echo "ERRORE: canonical non trovato in index.html"; exit 1; }
[ "$OLD" != "$NEW" ] || { echo "Il dominio è già $NEW — niente da fare."; exit 0; }

echo "Dominio attuale: $OLD  →  nuovo: $NEW"
FILES=$(grep -l "$OLD" *.html sitemap.xml robots.txt 2>/dev/null || true)
for f in $FILES; do
  sed -i "s|https://$OLD|https://$NEW|g" "$f"
  echo "  aggiornato: $f"
done

echo
echo "Fatto. Prossimi passi manuali:"
echo "  1. git diff per controllare, poi commit+push (parte il deploy)"
echo "  2. Su Vercel: Settings → Domains → aggiungi $NEW (+ www) e segui le istruzioni DNS"
echo "  3. Verifica con: curl -sI https://$NEW | head -5"
