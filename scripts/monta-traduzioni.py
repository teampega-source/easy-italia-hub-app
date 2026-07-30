#!/usr/bin/env python3
"""Trasforma le traduzioni scritte in chiaro nei dizionari che usa il browser.

Ingresso : i18n-src/<pagina>.json          impronta → testo italiano
           traduzioni/<pagina>.<lg>.json   testo italiano → traduzione
Uscita   : assets/i18n/<pagina>.<lg>.json  impronta → traduzione

Si scrive la traduzione accanto all'italiano, non accanto a un'impronta:
cosi' un refuso in un'impronta non puo' passare inosservato. Le voci che non
corrispondono a nessun frammento estratto vengono segnalate.
"""
import glob
import io
import json
import os
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def normalizza(t):
    return ' '.join(t.split())


def monta(pagina, lingua):
    sorgente = os.path.join(RADICE, 'i18n-src', pagina + '.json')
    if not os.path.exists(sorgente):
        return pagina, lingua, 'manca ' + sorgente
    italiano = json.load(io.open(sorgente, encoding='utf-8'))
    per_testo = {normalizza(v): k for k, v in italiano.items()}

    tradotto = os.path.join(RADICE, 'traduzioni', '%s.%s.json' % (pagina, lingua))
    if not os.path.exists(tradotto):
        return pagina, lingua, 'nessuna traduzione'
    # le frasi che ricorrono su piu' pagine (avvertenza AI, bottoni) stanno in
    # _comuni e valgono ovunque; la traduzione di pagina ha comunque la meglio
    voci, generiche = {}, set()
    comuni = os.path.join(RADICE, 'traduzioni', '_comuni.%s.json' % lingua)
    if os.path.exists(comuni):
        voci.update(json.load(io.open(comuni, encoding='utf-8')))
        generiche = set(voci)
    voci.update(json.load(io.open(tradotto, encoding='utf-8')))

    fuori, orfane = {}, []
    for it, tr in voci.items():
        k = per_testo.get(normalizza(it))
        if k is None:
            if it not in generiche:   # le frasi comuni mancano quasi ovunque: normale
                orfane.append(it[:44])
            continue
        # la stringa vuota e' voluta (spezzoni di testata da svuotare)
        if tr == '' or (tr and normalizza(tr) != normalizza(it)):
            fuori[k] = tr

    dest = os.path.join(RADICE, 'assets', 'i18n')
    os.makedirs(dest, exist_ok=True)
    fuori['_meta'] = {'pagina': pagina, 'lingua': lingua,
                      'copertura': round(100.0 * len(fuori) / max(1, len(italiano)))}
    io.open(os.path.join(dest, '%s.%s.json' % (pagina, lingua)), 'w', encoding='utf-8').write(
        json.dumps(fuori, ensure_ascii=False, indent=0, sort_keys=True) + '\n')
    nota = '%d/%d frammenti (%d%%)' % (len(fuori) - 1, len(italiano), fuori['_meta']['copertura'])
    if orfane:
        nota += '  ⚠ %d voci senza riscontro: %s' % (len(orfane), '; '.join(orfane[:3]))
    return pagina, lingua, nota


if __name__ == '__main__':
    if len(sys.argv) > 1:
        coppie = [(p, lg) for p in sys.argv[1].split(',') for lg in (sys.argv[2].split(',') if len(sys.argv) > 2 else ['en', 'si', 'ta'])]
    else:
        coppie = []
        for f in sorted(glob.glob(os.path.join(RADICE, 'traduzioni', '*.json'))):
            n = os.path.basename(f)[:-5]
            p, _, lg = n.rpartition('.')
            coppie.append((p, lg))
    for p, lg, nota in (monta(p, lg) for p, lg in coppie):
        print('%-24s %-3s %s' % (p, lg, nota))
