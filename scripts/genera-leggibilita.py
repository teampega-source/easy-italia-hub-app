#!/usr/bin/env python3
"""Rigenera assets/eih-leggibilita.css dalle regole del sito.

Legge ogni font-size fisso sotto la soglia — anche dentro le media query e
dentro gli <style> delle pagine — e riscrive un unico blocco che alza quelle
misure sotto i 1024px. Le misure grandi non vengono toccate.

Uso:  python3 scripts/genera-leggibilita.py
"""
import collections
import glob
import io
import os
import re

SOGLIA = 13.0          # px: sotto questa misura, su schermo stretto, non si legge
LARGHEZZA = 1023       # px: fin qui il sito non usa l'impaginazione da scrivania
RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USCITA = os.path.join(RADICE, 'assets', 'eih-leggibilita.css')


def px(v):
    v = v.strip()
    m = re.match(r'^([\d.]+)rem$', v)
    if m:
        return float(m.group(1)) * 16
    m = re.match(r'^([\d.]+)px$', v)
    return float(m.group(1)) if m else None


def _fine(css, apre):
    prof = 0
    for k in range(apre, len(css)):
        if css[k] == '{':
            prof += 1
        elif css[k] == '}':
            prof -= 1
            if prof == 0:
                return k
    return len(css) - 1


def blocchi(css):
    """(selettore, corpo) di ogni regola, entrando dentro @media e @supports."""
    fuori, i = [], 0
    while i < len(css):
        j = css.find('{', i)
        if j < 0:
            break
        testa = css[i:j].strip()
        fine = _fine(css, j)
        if testa.startswith('@') and not testa.startswith(('@font-face', '@page')):
            fuori += blocchi(css[j + 1:fine])
        else:
            fuori.append((testa, css[j + 1:fine]))
        i = fine + 1
    return fuori


def raccogli(css, minimo):
    for sel, corpo in blocchi(css):
        if not sel or sel.startswith('@'):
            continue
        if re.match(r'^(\d+%|from|to)(\s*,\s*(\d+%|from|to))*$', sel):
            continue                      # fotogrammi di un'animazione
        f = re.search(r'font-size:\s*([^;}]+)', corpo)
        if not f:
            continue
        p = px(f.group(1))
        if p is None or p >= SOGLIA:
            continue
        sel = ' '.join(sel.split())
        if sel not in minimo or p < minimo[sel]:
            minimo[sel] = p


def main():
    os.chdir(RADICE)
    minimo = collections.OrderedDict()
    for f in ['eih.css'] + sorted(glob.glob('assets/*.css')):
        if f.endswith('eih-leggibilita.css'):
            continue
        raccogli(io.open(f, encoding='utf-8', errors='replace').read(), minimo)
    for f in sorted(glob.glob('*.html')):
        if f in ('404.html', 'offline.html', 'media-kit-atena.html'):
            continue
        s = io.open(f, encoding='utf-8', errors='replace').read()
        for st in re.findall(r'<style[^>]*>(.*?)</style>', s, re.S):
            raccogli(st, minimo)

    righe = ['  :root{--text-xs:0.8125rem;--text-sm:0.9375rem}']
    righe += ['  %s{font-size:%.4frem}' % (sel, SOGLIA / 16) for sel in minimo]
    testo = (
        '/* Leggibilità su schermo stretto — file generato, non si scrive a mano.\n'
        '   Rigenera con:  python3 scripts/genera-leggibilita.py\n\n'
        '   Etichette, pillole e didascalie erano scritte fra 8 e 12px: su\n'
        "   telefono, e nell'app installata, ci voleva il cannocchiale. Sotto i\n"
        '   %dpx nessun testo scende sotto i %dpx. Le misure grandi restano\n'
        '   dove sono: si alza solo il fondo della scala. */\n'
        '@media (max-width:%dpx){\n%s\n}\n'
        % (LARGHEZZA + 1, int(SOGLIA), LARGHEZZA, '\n'.join(righe))
    )
    io.open(USCITA, 'w', encoding='utf-8').write(testo)
    print('%d selettori · %s' % (len(minimo), os.path.relpath(USCITA, RADICE)))


if __name__ == '__main__':
    main()
