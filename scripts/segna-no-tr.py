#!/usr/bin/env python3
"""Marca con data-no-tr gli elementi il cui testo non va tradotto.

Nomi propri, marchi, sigle di volo, indirizzi email: la ragione per non
tradurli vive accanto al testo, nel markup, non in un elenco dentro un
controllo. Questo script mette l'attributo sull'elemento che contiene
esattamente quel testo, cosi' non serve farlo a mano su decine di pagine.

Uso: python3 scripts/segna-no-tr.py <pagina.html> <testo> [testo...]
     python3 scripts/segna-no-tr.py --elenco elenco.json
     (elenco.json = { "pagina.html": ["testo", ...] })
"""
import io
import json
import os
import re
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Icone e immagini non contano come contenuto: un link fatto di <svg> piu' il
# nome di un ente e' comunque un elemento il cui unico testo e' quel nome.
ORNAMENTO = (r'(?:\s|<svg\b[^>]*>(?:(?!</svg>).)*</svg>|<img\b[^>]*>|<br\s*/?>)*')


def segna(percorso, testi):
    src = io.open(percorso, encoding='utf-8').read()
    fatti, mancati = 0, []
    for testo in testi:
        atteso = re.escape(testo).replace('\\ ', r'\s+')
        # il testo cercato e' l'unico testo dell'elemento: dentro solo ornamenti
        cerca = re.compile(r'<([a-zA-Z][\w-]*)((?:"[^"]*"|\'[^\']*\'|[^>"\'])*)>(' +
                           ORNAMENTO + atteso + ORNAMENTO + r')</\1>')
        trovato = False
        pos = 0
        while True:
            m = cerca.search(src, pos)
            if not m:
                break
            trovato = True
            if 'data-no-tr' in m.group(2) or 'data-i18n' in m.group(2):
                pos = m.end()
                continue
            nuovo = '<%s%s data-no-tr>%s</%s>' % (m.group(1), m.group(2), m.group(3), m.group(1))
            src = src[:m.start()] + nuovo + src[m.end():]
            fatti += 1
            pos = m.start() + len(nuovo)
        if not trovato:
            mancati.append(testo)
    io.open(percorso, 'w', encoding='utf-8').write(src)
    return fatti, mancati


if __name__ == '__main__':
    if sys.argv[1] == '--elenco':
        elenco = json.load(io.open(sys.argv[2], encoding='utf-8'))
    else:
        elenco = {sys.argv[1]: sys.argv[2:]}
    for pagina, testi in elenco.items():
        f, m = segna(os.path.join(RADICE, pagina), testi)
        print('%-28s %3d segnati%s' % (pagina, f, ('  · non trovati: ' + ' | '.join(m)) if m else ''))
