# Foto «vera» — prompt anti «sembra fatta con l'AI»

> **Aggiornamento 27/07/2026** — la hero mostra ora `assets/img/hero-community.webp`,
> fornita dall'utente: una stretta di mano in piazza, luce invernale piatta,
> piumini veri, folla sullo sfondo. Molto piu credibile della precedente.
> Il prompt qui sotto resta valido per le prossime immagini.

La vecchia immagine (`assets/img/community-welcome.webp`, ora solo poster del
video in `registrati.html`) si riconosceva subito come generata: luce da studio,
pelle senza pori, sorrisi simmetrici, bandierine tenute in posa, sfondo di
palazzo di vetro anonimo. È la classica resa da pubblicità.

Questo prompt è costruito per ottenere l'opposto: **uno scatto rubato**, non una
posa. Le regole che seguono contano più del soggetto.

## Le cinque cose che tradiscono l'AI (e come si evitano)

1. **Luce troppo bella** → chiedere luce disponibile, dura, mista (sole + neon).
2. **Pelle perfetta** → chiedere pori, lucido sulla fronte, occhiaie, capelli fuori posto.
3. **Posa frontale e sorrisi da catalogo** → nessuno guarda l'obiettivo, gesto a metà.
4. **Composizione centrata** → soggetto decentrato, un braccio tagliato dal bordo.
5. **Nitidezza uniforme** → grana ISO alto, micro-mosso, messa a fuoco su una persona sola.

## Prompt (in inglese: i generatori rendono molto meglio)

```
Candid documentary photograph, shot on a Canon EOS 5D with a 35mm lens at f/2.8,
ISO 1600, available light only.

A Sri Lankan family — a woman in her 30s in ordinary everyday clothes (a creased
cotton kurta, no jewellery on display), a man in a worn polo shirt, and a boy of
about 8 with a school backpack — walking out of a municipal office doorway on an
ordinary Italian street. Late morning, overcast, flat grey light with a hard patch
of sun on the pavement.

Nobody looks at the camera. The woman is mid-sentence, looking down at a folder of
documents in her hand; the man is half-turned, checking something behind him; the
boy is distracted by something off-frame. Mouths caught mid-word, not smiling for
a photo.

Real skin: visible pores, slight shine on the forehead, tired eyes, uneven skin
tone, a few flyaway hairs. Clothes creased and lived-in, cheap fabric. The folder
has a bent corner.

Background: a real Italian side street — peeling ochre plaster, a scooter parked
badly, wheelie bins, an air-conditioning unit, laundry on a balcony, faded
municipal signage, graffiti tag on the corner. Nothing tidy, nothing symmetrical.

Composition off-centre, the man's shoulder cropped by the right edge of the frame,
slight camera tilt. Shallow depth of field: only the woman's face is in focus, the
boy is slightly soft. Faint motion blur on the boy's hand. Visible film grain,
slight chromatic aberration at the edges, mild lens vignetting.

Muted, slightly desaturated colours. No colour grading, no bokeh balls, no lens
flare, no golden hour.
```

## Prompt negativo

```
studio lighting, softbox, beauty retouching, flawless skin, symmetrical faces,
perfect teeth, everyone smiling at camera, posed group portrait, corporate
headshot, business suits, holding flags, glass office building, stock photo,
advertisement, cinematic colour grading, golden hour, bokeh balls, lens flare,
oversaturated, HDR, 8k, hyperdetailed, plastic skin, airbrushed, centred
composition, clean background, illustration, 3d render, cgi
```

## Formato

- **Proporzione**: 5:4 (l'attuale è 1402×1122). Larghezza utile ~1400 px.
- **Output**: convertire in WebP qualità 82 → deve stare **sotto i 150 KB**
  (`sharp('in.png').resize(1400).webp({quality:82}).toFile('out.webp')`).
- **Destinazione**: `assets/img/community-welcome.webp`, sostituendo il file attuale.
- Aggiornare il testo alternativo in `index.html` con ciò che si vede davvero.

## Controllo prima di pubblicare

Guardala a schermo intero e chiediti: **la pubblicherei come foto di cronaca?**
Se la risposta è no, si rigenera. I punti che di solito saltano: mani (dita in
più, dita fuse), scritte sui cartelli (lettere inventate), orecchini spaiati,
riflessi incoerenti nelle vetrine, sfondo troppo ordinato.

## Come si genera (verificato il 27/07/2026)

Il server MCP **meigen** è già armato in `.mcp.json` e si avvia senza problemi,
ma la generazione si ferma qui:

> `No image generation providers configured. Get a MeiGen API token at
> https://www.meigen.ai (sign in → Settings → API Keys), then set
> MEIGEN_API_TOKEN in your environment or MCP config and restart the host.`

Serve quindi **una** di queste due chiavi nelle variabili d'ambiente:

- `MEIGEN_API_TOKEN` — da meigen.ai, Settings → API Keys
- `OPENAI_API_KEY` — meigen accetta qualunque endpoint compatibile OpenAI

Una volta impostata, alla sessione successiva la generazione parte da sola.

## Come si monta l'immagine

```
npm i sharp
node scripts/monta-hero.js <file-immagine> "<testo alternativo>"
```

Ritaglia a 5:4, converte in WebP (qualità 82, avvisa se supera i 150 KB),
sostituisce `assets/img/community-welcome.webp` e aggiorna dimensioni e testo
alternativo in `index.html`. Va bene per qualsiasi immagine, anche una foto
scattata col telefono.
