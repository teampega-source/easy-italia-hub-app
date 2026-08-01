#!/usr/bin/env python3
"""Monta traduzioni/_ui.json (it -> [en, si, ta]) nei dizionari impronta->testo
serviti da /assets/i18n/_ui.<lingua>.json. Stessa impronta FNV-1a del browser."""
import json, pathlib

def impronta(t):
    s = ' '.join(t.split())
    # charCodeAt() del browser scorre unita' UTF-16, non punti di codice: senza
    # questa conversione le emoji (coppie surrogate) davano impronte diverse e
    # le voci di menu con l'icona restavano in italiano.
    unita = s.encode('utf-16-le')
    h = 0x811c9dc5
    for i in range(0, len(unita), 2):
        h ^= unita[i] | (unita[i + 1] << 8)
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) & 0xFFFFFFFF
    return format(h, '08x')

base = pathlib.Path(__file__).resolve().parent.parent
src = json.loads((base / 'traduzioni' / '_ui.json').read_text(encoding='utf-8'))
for i, lg in enumerate(('en', 'si', 'ta')):
    out = {impronta(k): v[i] for k, v in src.items() if v[i]}
    p = base / 'assets' / 'i18n' / f'_ui.{lg}.json'
    p.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(lg, len(out), p.name)
