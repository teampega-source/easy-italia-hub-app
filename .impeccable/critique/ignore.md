# Impeccable Critique — ignore list

## bounce-easing (intentional)

- `index.html` line 1192: `bubbleIn` — chat message entry animation. Spring è idiomatico per messaggi (Signal/iMessage pattern). Intenzionale.
- `index.html` line 1919: `avatarPop` — avatar stagger pop-in. Spring su pop-in brevi (0.55s) è accettato. Intenzionale.
- `index.html` line 2239: `dotBounce` — AI typing indicator. Il bounce È il significato dell'animazione. Non modificare.

## layout-transition (acceptable)

- `index.html` line 272: `transition: padding` — nav scrolled state. Padding collapsing accettato per nav.
- `index.html` line 1529: `transition: width, height` — cursor ring resize. Custom cursor, non impatta layout reale.
- `index.html` line 1938: `transition: width` — progress bar. Width su un elemento interno a overflow:hidden, nessun reflow visibile.
