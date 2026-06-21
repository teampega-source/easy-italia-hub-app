---
name: Easy Italia Hub
description: Piattaforma di orientamento burocratico per la comunità dello Sri Lanka in Italia
colors:
  taupe: "#c4a882"
  gold: "#9a7d45"
  coral: "#eb5939"
  warm-brown: "#7d7058"
  warm-brown-deep: "#665b46"
  green: "#1f9d55"
  ink: "#161412"
  fg: "#1c1a17"
  fg-secondary: "#524c44"
  fg-muted: "#636058"
  bg-base: "#ffffff"
  bg-elevated: "#ffffff"
  surface: "rgba(40,36,30,0.025)"
  border: "rgba(118,118,118,0.14)"
  border-bright: "rgba(118,118,118,0.26)"
typography:
  display:
    fontFamily: "Clash Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 5.5vw, 4.25rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Clash Grotesk, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Clash Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Satoshi, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Satoshi, Inter, system-ui, sans-serif"
    fontSize: "0.66rem"
    fontWeight: 500
    letterSpacing: "0.3em"
rounded:
  sm: "10px"
  md: "16px"
  full: "9999px"
spacing:
  1: "0.5rem"
  2: "1rem"
  3: "1.5rem"
  4: "2rem"
  5: "3rem"
  6: "4rem"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, {colors.warm-brown-deep}, {colors.warm-brown})"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0.8rem 1.75rem"
  button-primary-hover:
    backgroundColor: "linear-gradient(135deg, {colors.warm-brown-deep}, {colors.warm-brown})"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0.8rem 1.75rem"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  nav-cta:
    backgroundColor: "linear-gradient(135deg, {colors.warm-brown-deep}, {colors.warm-brown})"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0.55rem 1.4rem"
---

# Design System: Easy Italia Hub

## 1. Overview

**Creative North Star: "La Porta d'Ingresso"**

Easy Italia Hub è il sistema che apre porte — dall'esterno verso il dentro, dalla confusione burocratica verso la chiarezza operativa. Ogni pagina è un passo avanti in un percorso che l'utente conosce e sente come sicuro. Il design non vuole impressionare: vuole orientare. L'autorevolezza si guadagna con la precisione delle informazioni, non con il peso visivo.

La palette è calda e terrosa — taupe, oro, corallo — perché evoca accoglienza senza perdere serietà. Non è la freddezza asettica di un portale governativo né la vivacità distraente di un'app di consumo. È la dignità silenziosa di un ufficio ben tenuto, dove sai di essere nel posto giusto.

La tipografia è netta. Clash Grotesk porta autorevolezza nei titoli; Satoshi porta leggibilità nel corpo. La gerarchia è deliberata: ogni pagina ha un titolo principale, un sottotitolo, contenuto — senza ambiguità di importanza.

**Key Characteristics:**
- Palette terrosa e calda: taupe, oro antico, corallo discreto
- Tipografia a contrasto: geometrico stretto per i titoli, umanista per il corpo
- Gesto hover: lift verticale leggero (translateY -3px) + ombra — mai bounce
- Sfondo con rumore sottile e gradiente radiale: profondità senza decorazione
- Motion: deceleration-first per reveal; spring riservata a interazioni dirette (hover, modal)
- Accessibilità: focus ring visibili, touch target 44px, contrasti WCAG AA

## 2. Colors: La Palette del Crocevia

Una palette terrosa costruita su un'unica voce cromatica primaria — il caldo-marrone — con accenti selezionati che comunicano significato, non decorazione.

### Primary
- **Taupe Accogliente** (`#c4a882`): colore identitario del brand. Usato nel logo accent, cursor dot, cursor ring, separatori eyebrow. Il calore del sistema.
- **Caldo-Marrone Istituzionale** (`#7d7058`): colore operativo principale. Bottoni CTA, link attivi, focus ring. Leggermente più scuro del taupe: trasmette solidità.
- **Caldo-Marrone Profondo** (`#665b46`): versione scura per gradient su bottoni primari e hover.

### Secondary
- **Oro Antico** (`#9a7d45`): accenti testuali — eyebrow labels, link inline, nav active state, badge "fatto". Evoca competenza e cura artigianale.

### Tertiary
- **Corallo Discreto** (`#eb5939`): accento di azione e stato "in corso". Usato sparingly: badge "now" sulla roadmap, cursor ring hover, accent button variant. Non è un allarme — è un segnale.
- **Verde Conferma** (`#1f9d55`): stati positivi, successo, diritti INPS verificati. Funzionale, non decorativo.

### Neutral
- **Inchiostro** (`#161412`): testo principale, logo, titoli. Quasi-nero caldo, non freddo.
- **Fg Secondary** (`#524c44`): paragrafi body, descrizioni card. Contrasto ≥ 7:1 su bg-base.
- **Fg Muted** (`#636058`): metadati, label nav, footer. Contrasto ≥ 5.7:1 su bg-base (WCAG AA).
- **Bg Base** (`#ffffff`): sfondo pagina (con gradiente radiale e noise overlay al 3.5%).
- **Surface** (`rgba(40,36,30,0.025)`): background card/input a riposo — appena visibile.

### Named Rules
**The One Accent Rule.** Coral e gold non appaiono mai insieme nello stesso componente. Coral è azione; gold è informazione. La loro co-presenza crea conflitto gerarchico.

**The Warmth Rule.** Nessun colore freddo nelle UI primarie. Blues e purples sono vietati come accent — il sistema è mediterraneo, non nordico.

## 3. Typography: Autorità e Leggibilità

**Display/Headline Font:** Clash Grotesk (sans-serif geometrico stretto, fallback system-ui)
**Body Font:** Satoshi (sans-serif umanista, fallback Inter → system-ui)

**Carattere:** La coppia crea tensione produttiva — la geometria netta di Clash Grotesk impone chiarezza gerarchica; l'umanesimo di Satoshi rende il corpo leggibile a qualsiasi lunghezza. Nessuna serif: il sistema è pratico, non accademico.

### Hierarchy
- **Display** (600, clamp(2.4rem→4.25rem), line-height 1, tracking -0.035em): Hero headlines, page titles `h1`. Massimo una per pagina.
- **Headline** (600, 2rem, line-height 1.1, tracking -0.02em): Section titles `h2`. Fino a 3 per pagina.
- **Title** (600, 1.125rem, line-height 1.3): Card titles `h3`, form section headers.
- **Body** (400, 1rem, line-height 1.75): Tutto il testo di contenuto. Max-width 620px (≈65ch) per leggibilità ottimale.
- **Label** (500, 0.66rem, tracking 0.3em, uppercase): Eyebrow labels, footer nav headers, badge text. Solo in gold o fg-muted — mai in coral su sfondo bianco.

### Named Rules
**The One Weight Rule.** I titoli usano sempre 600. Il body usa sempre 400. Il peso 500 è riservato a label e UI micro-copy (bottoni, nav). Non esiste un 700 nel sistema — la forza viene dalla dimensione e dal tracking, non dal peso.

**The Terse Copy Rule.** Nessun headline supera i 6 token (parole). L'utente è in una situazione burocratica stressante: ogni parola extra è rumore.

## 4. Elevation

Il sistema è **quasi-piatto per impostazione predefinita**. Le superfici a riposo non hanno ombra propria — la profondità viene dal colore di superficie (`--surface` leggermente tintato) e dal bordo sottile. Le ombre entrano solo su hover e per i layer soprastanti (modal, dropdown).

### Shadow Vocabulary
- **Ambient Hover** (`0 16px 40px rgba(20,30,48,0.10)`): Cards `.icard` e roadmap card su hover. Diffusa, bassa intensità.
- **Button Glow** (`0 8px 28px rgba(125,112,88,0.18)`): Bottoni primary a riposo. Non è un'ombra tradizionale — è un glow caldo direzionale.
- **Button Glow Hover** (`0 16px 44px rgba(125,112,88,0.18)`): Intensificazione del glow su hover.
- **Modal** (`0 32px 64px rgba(0,0,0,0.15)`): Layer modal/drawer. L'unica ombra ad alto contrasto.
- **Dropdown** (`0 16px 40px rgba(20,30,48,0.14)`): Language menu e qualsiasi popup floating.

### Named Rules
**The Flat-By-Default Rule.** Le superfici sono piatte a riposo. Le ombre comunicano stato (hover, elevation, focus) — non decorazione. Un elemento ombrato a riposo è drift.

**The Warm Shadow Rule.** Le ombre su bottoni usano il warm-brown glow (`rgba(125,112,88,0.18)`), non nero neutro. Ombre nere su superfici calde creano dissonanza.

## 5. Components

### Buttons

**Carattere:** tasti solidi come sigilli — il gesto hover porta l'elemento verso l'utente, non lo schiaccia.

- **Shape:** Pill completa (`border-radius: 9999px`)
- **Primary:** Gradient warm-brown-deep → warm-brown, testo bianco, padding 0.8rem 1.75rem, glow shadow, min-height 44px
- **Primary Hover:** `translateY(-3px)` + glow intensificato. Nessun bounce.
- **Primary Active:** `scale(0.97)` + transition-duration ridotta a 150ms
- **Ghost:** Bordo 1px `border-bright`, sfondo trasparente, testo ink. Hover: `translateY(-2px)` + surface-hover fill
- **Focus visible:** `outline: 2px solid warm-brown; outline-offset: 3px` — mai nascosto
- **Accent variant:** Gradient coral, glow rosso. Solo per azioni ad alto impatto.
- **Loading state:** Spinner overlay, pointer-events:none, testo nascosto

### Cards / Containers

- **Corner Style:** Gently rounded (16px) per card principali; moderatamente rounded (10px) per elementi UI (input, badge, dropdown)
- **Background:** `var(--surface)` a riposo — appena tintato, quasi bianco
- **Hover:** `translateY(-4px)` + ambient shadow. Transizione 280ms ease-deceleration (mai spring su hover cards)
- **Border:** `1px solid var(--border)` a riposo; `border-bright` su hover
- **Internal Padding:** sp-3 (1.5rem) standard; sp-2 (1rem) per card compatte

### Inputs / Fields

- **Style:** Sfondo `var(--surface)`, bordo `var(--border)`, radius 10px, padding 0.7rem 0.9rem, min-height 44px
- **Focus:** `border-color: rgba(125,112,88,0.5)` + `box-shadow: 0 0 0 3px rgba(125,112,88,0.1)` — ring caldo, non blu
- **Error:** `border-color: coral` + glow corallo 10% opacity
- **Error message:** 0.72rem, coral, inline sotto il campo

### Navigation

- **Style:** Fixed top, backdrop-blur 20px + saturate(1.5), border-bottom sottile. Diventa compatta (scrolled) dopo 80px di scroll.
- **Logo:** Clash Grotesk 600, accent in taupe
- **Links:** Satoshi 0.875rem 400, fg-muted a riposo → ink su hover. Active: gold 600
- **CTA button:** Nav-CTA pill (warm-brown gradient, più piccolo del btn-primary: 0.55rem 1.4rem)
- **Mobile:** Drawer full-width animato — translateY slide + opacity fade con ease-deceleration

### Roadmap Cards (componente firma)

Struttura a griglia con colonna quarter (data) a destra e card a sinistra. La colonna quarter cambia colore per comunicare lo stato (gold = completato, coral = in corso). Lo stato visivo della card stessa viene da `box-shadow: inset 2px 0 0` — 2px è il limite: oltre è AI slop.

### Eyebrow Labels

`0.66rem / 500 / tracking 0.3em / uppercase / gold`. Sempre preceduti da una linea orizzontale (`width: 32px, height: 1px, gold`). Il pattern è fisso: `—— TITOLO SEZIONE`.

## 6. Do's and Don'ts

### Do:
- **Do** usare `ease-deceleration` (`cubic-bezier(0.0, 0.0, 0.2, 1)`) per reveal e fade — gli elementi arrivano, non rimbalzano
- **Do** riservare `ease-spring` (`cubic-bezier(0.16, 1, 0.3, 1)`) esclusivamente a interazioni dirette dell'utente: hover su bottoni, apertura modal, toggle nav
- **Do** mantenere `box-shadow: inset` ≤ 2px per indicatori di stato sulle card
- **Do** usare `translateY(-3px)` come gesto hover canonico sui bottoni; `translateY(-4px)` sulle card
- **Do** mantenere tutti i touch target a min-height 44px / min-width 44px
- **Do** testare il contrasto di `--fg-muted` su bg-base prima di ogni deploy — minimo 4.5:1 WCAG AA
- **Do** usare il warm-brown glow (`rgba(125,112,88,0.18)`) per le ombre sui bottoni, non nero neutro
- **Do** limitare la larghezza del testo body a 620px (≈65ch) nelle pagine di contenuto

### Don't:
- **Don't** usare `border-left` colorato > 1px come indicatore di stato — è il pattern SaaS americano generico più riconoscibile. Usa `box-shadow: inset` o un dot badge.
- **Don't** applicare `ease-spring` alle transizioni di opacity (fade-in/out), alle animazioni di scroll reveal, o alle barre di avanzamento — il bounce su elementi che scorrono verso l'interno è il segnale più forte di "AI ha scritto questo CSS"
- **Don't** introdurre colori freddi (blue, purple, teal) come accent primari — il sistema è mediterraneo e caldo; i freddi creano dissonanza
- **Don't** usare glassmorphism con blur > 4px su superfici di contenuto — il backdrop-blur è riservato a nav e modal (UI chrome), non a card o sezioni
- **Don't** aggiungere più di un accent colorato per schermata — coral e gold non appaiono insieme come accent principali sullo stesso componente
- **Don't** creare headline che superano i 6 token — l'utente è in un momento di bisogno informativo, non in uno showroom
- **Don't** progettare come un SaaS americano generico: niente hero con gradiente viola, niente card con badge "NEW" in verde lime, niente testimonial con avatar stock photo su sfondo grigio
- **Don't** usare font-weight 700 o bold nel sistema — il peso massimo è 600 (Clash Grotesk display). La forza visiva viene da dimensione e tracking.
