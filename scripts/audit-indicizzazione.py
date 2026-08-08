#!/usr/bin/env python3
"""Controlla che mappa del sito, noindex e canonical dicano la stessa cosa.

Search Console si lamenta quando le tre dichiarazioni si contraddicono: una
pagina elencata nella mappa ma marcata noindex, una pagina indicizzabile che
nella mappa non c'e', un canonical che punta altrove.

Uso:  python3 scripts/audit-indicizzazione.py     (esce 1 se trova qualcosa)
"""
import glob
import io
import os
import re
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://easyitaliahub.it'
# pagine che di proposito restano fuori dalla mappa e non sono indicizzabili
FUORI = {'404', 'offline', 'media-kit-atena', 'conferma-newsletter'}


def main():
    os.chdir(RADICE)
    mappa = set()
    for u in re.findall(r'<loc>([^<]+)</loc>', io.open('sitemap.xml', encoding='utf-8').read()):
        p = u.replace(BASE, '').strip('/')
        if p.split('/')[0] in ('en', 'si', 'ta'):
            p = '/'.join(p.split('/')[1:])
        mappa.add(p or 'index')

    guai = []
    for f in sorted(glob.glob('*.html')):
        nome = os.path.basename(f)[:-5]
        if nome in FUORI:
            continue
        t = io.open(f, encoding='utf-8', errors='replace').read()
        m = re.search(r'<meta name="robots" content="([^"]+)"', t)
        noindex = bool(m and 'noindex' in m.group(1))
        nella = nome in mappa
        if noindex and nella:
            guai.append('%-24s noindex ma elencata nella mappa' % ('/' + nome))
        if not noindex and not nella:
            guai.append('%-24s indicizzabile ma fuori dalla mappa' % ('/' + nome))
        c = re.search(r'<link rel="canonical" href="([^"]+)"', t)
        if c and not noindex:
            atteso = BASE + ('/' if nome == 'index' else '/' + nome)
            if c.group(1).rstrip('/') != atteso.rstrip('/'):
                guai.append('%-24s canonical → %s' % ('/' + nome, c.group(1)))

    for g in guai:
        print(' ', g)
    print('%d contraddizioni · %d indirizzi nella mappa' % (len(guai), len(mappa)))
    return 1 if guai else 0


if __name__ == '__main__':
    sys.exit(main())
