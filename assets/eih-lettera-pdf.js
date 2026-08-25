/* eih-lettera-pdf.js — la lettera di /moduli diventa un file, non una stampa.

   Il pulsante chiamava `window.print()`. In tutte e quattro le lingue
   l'interfaccia era tradotta e il pulsante c'era, ma non scaricava niente:
   apriva la finestra di stampa, che su parecchi telefoni non porta da nessuna
   parte. È lo stesso difetto già corretto sul curriculum, rimasto qui.

   Qui la lettera nasce come PDF nel browser e scende nella cartella dei
   download, con un nome che dice cos'è. Nessuna libreria, nessuna rete: i
   dati di chi scrive non escono dal dispositivo, come promette la pagina.

   Le primitive (pagina, font, codifica, impacchettamento) sono quelle di
   eih-cv-pdf.js, prestate tramite window.EIH_PDF.

   Il limite, dichiarato: la codifica WinAnsi copre il latino, non il singalese
   né il tamil. Non è una rinuncia — la lettera è indirizzata a un ufficio
   italiano ed è scritta in italiano — ma se un campo contiene quelle scritture
   `scrivibile()` dice di no e la pagina torna alla stampa del browser, che i
   caratteri ce li ha.                                                        */
(function () {
  'use strict';
  if (window.EIH_LETTERA_PDF) return;

  function base() { return window.EIH_PDF || null; }

  /* Una lettera formale sta in una pagina: mittente in alto a sinistra,
     destinatario a destra, oggetto in grassetto, corpo giustificato a
     sinistra, luogo e data in basso a sinistra, firma a destra sopra la
     riga. È la forma che gli uffici si aspettano. */
  function disegna(P, l) {
    var pagine = [], flusso = '', y = P.A4.a - P.BORDO;
    var largh = P.A4.l - P.BORDO * 2;
    var COL = largh * 0.46;                     // colonne di testata

    function nuova() { pagine.push(flusso); flusso = ''; y = P.A4.a - P.BORDO; }
    function spazio(quanto) { if (y - quanto < P.BORDO + 30) nuova(); }
    function scrivi(s, x, corpo, grassetto, colore) {
      flusso += 'BT /' + (grassetto ? 'F2' : 'F1') + ' ' + corpo + ' Tf ' +
        (colore || P.SCURO) + ' rg 1 0 0 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) +
        ' Tm (' + P.ripulisci(s) + ') Tj ET\n';
    }
    /* Il testo delle lettere arriva con gli a capo dentro: si spezzano prima
       quelli veri, poi ogni riga sulla larghezza disponibile. Una riga vuota
       resta vuota — nelle lettere separa i paragrafi e conta. */
    function blocco(testo, x, corpo, grassetto, larghezza, interlinea, allineaADestra) {
      String(testo == null ? '' : testo).split('\n').forEach(function (par) {
        if (!par.trim()) { y -= corpo * (interlinea || 1.45); return; }
        P.spezza(par, corpo, grassetto, larghezza).forEach(function (r) {
          spazio(corpo * 1.4);
          scrivi(r, allineaADestra ? x - P.largo(r, corpo, grassetto) : x, corpo, grassetto);
          y -= corpo * (interlinea || 1.45);
        });
      });
    }

    /* testata: mittente a sinistra, destinatario a destra, sulla stessa fascia */
    var yTesta = y;
    blocco(l.mittente, P.BORDO, 10, false, COL, 1.4);
    var yMitt = y;
    y = yTesta;
    blocco(l.destinatario, P.A4.l - P.BORDO, 10, false, COL, 1.4, true);
    y = Math.min(yMitt, y) - 34;

    blocco(l.oggetto, P.BORDO, 11, true, largh, 1.4);
    y -= 16;
    blocco(l.corpo, P.BORDO, 10.5, false, largh, 1.55);

    /* luogo, data e firma: mai spezzati dalla pagina */
    spazio(76);
    y -= 30;
    scrivi(l.luogoData, P.BORDO, 10, false);
    var xFirma = P.A4.l - P.BORDO - 150;
    scrivi(l.etichettaFirma || 'Firma', xFirma + 55, 10, false, P.MEDIO);
    y -= 40;
    flusso += '0.42 0.40 0.37 RG 0.7 w ' + xFirma + ' ' + y.toFixed(2) + ' m ' +
              (P.A4.l - P.BORDO) + ' ' + y.toFixed(2) + ' l S\n';
    y -= 12;
    if (l.firma) scrivi(l.firma, xFirma, 9, false, P.MEDIO);

    pagine.push(flusso);
    return pagine;
  }

  function nomeFile(titolo) {
    var s = String(titolo || 'lettera').toLowerCase()
      .replace(/[àáâä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
      .replace(/[òóôö]/g, 'o').replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    return (s || 'lettera') + '.pdf';
  }

  window.EIH_LETTERA_PDF = {
    /* Vero solo se il PDF si può davvero scrivere: modulo presente e testo
       dentro i caratteri che la codifica conosce. */
    possibile: function (lettera) {
      var P = base();
      if (!P) return false;
      var tutto = [lettera.mittente, lettera.destinatario, lettera.oggetto,
                   lettera.corpo, lettera.luogoData, lettera.firma].join('\n');
      return P.scrivibile(tutto);
    },
    nomeFile: nomeFile,
    /* lettera: { mittente, destinatario, oggetto, corpo, luogoData, firma,
                  etichettaFirma, titolo } */
    genera: function (lettera) {
      var P = base();
      if (!P) return null;
      return P.impacchetta(disegna(P, lettera), null, lettera.titolo || 'Lettera');
    }
  };
})();
