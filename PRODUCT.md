# Product

## Register

brand

## Users

Comunità srilankese in Italia (prima generazione e giovani nati/cresciuti in Italia). Usano il sito in momenti di bisogno burocratico — rinnovo permesso di soggiorno, SPID, codice fiscale, diritti INPS — ma anche per connettersi con la propria comunità e trovare lavoro/opportunità. Contesto d'uso: spesso da mobile, spesso in situazioni di stress o confusione burocratica, con italiano come seconda lingua. La piattaforma serve anche consulenti e community leader che aiutano altri.

## Product Purpose

Easy Italia Hub è la piattaforma di riferimento per la comunità srilankese in Italia: guide burocratiche passo-passo in 4 lingue (IT/EN/SI/TA), AI assistant per domande pratiche, marketplace comunitario, tracker permesso di soggiorno, CV builder, calcolatori INPS e rimesse. Esistenza: togliere solitudine e confusione a chi affronta il sistema italiano da fuori. Successo: utente che risolve da solo una pratica burocratica che prima richiedeva un intermediario.

## Brand Personality

Moderno, inclusivo, autorevole. Voce: un amico esperto che conosce il sistema e ti spiega le cose chiaramente — senza paternalismo, senza burocrazia, senza pietismo. Caldo ma competente. Non condiscendente.

## Anti-references

- **App SaaS startup generica**: gradiente viola/teal, hero metrics ("10.000+ utenti"), card identiche, look Notion/Linear — questo è un prodotto per una comunità reale, non una pitch deck.
- **Siti governativi italiani**: freddi, burocratici, mal navigabili — esattamente il problema che EIH risolve.
- **ONG/charity**: tono pietistico, fotografie di "migranti in difficoltà", aesthetic da raccolta fondi — la comunità srilankese è forte, non fragile.
- **Portale etnico folkloristico**: bandiere, elefanti, pattern batik decorativi — non è un sito turistico o culturale in senso folkloristico.

## Design Principles

1. **Chiarezza prima dell'eleganza** — ogni schermata ha un'azione principale ovvia. Mai sacrificare la leggibilità per l'effetto visivo.
2. **Autorevolezza senza distanza** — il tono visivo deve ispirare fiducia (gerarchia tipografica solida, spaziatura generosa) ma restare umano e accessibile.
3. **Mobile first, stress test** — l'utente tipo è su mobile in un momento difficile. Niente layout che richiedano zoom, niente form lunghi senza feedback immediato.
4. **Biculturalismo visivo discreto** — il calore culturale è nella voce e nella palette (taupe, oro, corallo), non in elementi etnici espliciti.
5. **Il prodotto è doppio** — landing/guide (brand: design IS the product) e app tools (product: design SERVES the workflow). Ogni surface applica il suo peso: le pagine istituzionali possono essere più espressive; dashboard e form devono essere puliti e efficienti.

## Accessibility & Inclusion

- WCAG AA come minimo (4.5:1 testo normale, 3:1 testo grande) — già applicato su `--fg-muted`.
- 4 lingue: IT/EN/SI/TA — mai assumere che l'utente legga fluentemente in italiano.
- Reduced motion: ogni animazione deve avere fallback `prefers-reduced-motion`.
- Touch target minimo 44px su mobile.
- Form con inline validation e messaggi di errore chiari in italiano.
