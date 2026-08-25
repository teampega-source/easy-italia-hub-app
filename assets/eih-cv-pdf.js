/* eih-cv-pdf.js — costruisce il PDF del curriculum, senza librerie.

   Il pulsante «Scarica PDF» apriva la finestra di stampa del browser: chi
   clicca si aspetta un file nella cartella dei download, non una stampante,
   e su molti telefoni quella finestra non porta da nessuna parte. Qui il PDF
   nasce nel browser e scende come file, con il nome della persona sopra.

   Come: un PDF minimo scritto a mano. Testo in Helvetica e Helvetica-Bold,
   che ogni lettore ha già dentro — nessun font da incorporare, nessun peso
   aggiunto — con codifica WinAnsi, che copre le accentate italiane. La foto,
   se c'è, passa per una <canvas> e diventa JPEG: l'unico formato che il PDF
   sa leggere così com'è, senza comprimere niente a mano.

   Il limite, dichiarato: WinAnsi non ha il singalese né il tamil. Se il
   curriculum contiene quelle scritture `EIH_CV_PDF.scrivibile()` dice di no,
   e la pagina passa alla stampa del browser, che i caratteri ce li ha.       */
(function () {
  'use strict';
  if (window.EIH_CV_PDF) return;

  var A4 = { l: 595.28, a: 841.89 }, BORDO = 54;
  var SCURO = '0.09 0.08 0.07', MEDIO = '0.34 0.31 0.28', TENUE = '0.52 0.49 0.45';

  /* ── Testo ──────────────────────────────────────────────────────────── */

  // WinAnsi coincide con Latin-1 tranne 0x80–0x9F, dove stanno le virgolette
  // curve, i trattini lunghi e l'euro: sono proprio i segni che un curriculum
  // scritto a computer contiene di sicuro.
  var WINANSI = { 0x20AC: 128, 0x201A: 130, 0x0192: 131, 0x201E: 132, 0x2026: 133, 0x2020: 134,
    0x2021: 135, 0x02C6: 136, 0x2030: 137, 0x0160: 138, 0x2039: 139, 0x0152: 140, 0x017D: 142,
    0x2018: 145, 0x2019: 146, 0x201C: 147, 0x201D: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151,
    0x02DC: 152, 0x2122: 153, 0x0161: 154, 0x203A: 155, 0x0153: 156, 0x017E: 158, 0x0178: 159 };

  function codice(punto) {
    if (punto === 0x2212) return 45;               // meno tipografico → trattino
    if (punto < 0x100 && !(punto >= 0x80 && punto < 0xA0)) return punto;
    return WINANSI[punto] != null ? WINANSI[punto] : null;
  }
  function scrivibile(testo) {
    var s = String(testo || '');
    for (var i = 0; i < s.length; i++) if (codice(s.codePointAt(i)) === null) return false;
    return true;
  }
  function ripulisci(testo) {
    var s = String(testo == null ? '' : testo), fuori = '';
    for (var i = 0; i < s.length; i++) {
      var c = codice(s.charCodeAt(i));
      if (c !== null) fuori += String.fromCharCode(c);
    }
    return fuori.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  /* Le larghezze: si chiedono al browser. Helvetica, dove manca, viene
     sostituita da un carattere con le stesse metriche (Arial, Liberation
     Sans, Nimbus Sans), quindi la misura torna. */
  var pennello = null;
  function largo(testo, corpo, grassetto) {
    if (!pennello) pennello = document.createElement('canvas').getContext('2d');
    pennello.font = (grassetto ? 'bold ' : '') + corpo + 'px Helvetica, Arial, "Liberation Sans", sans-serif';
    return pennello.measureText(String(testo || '')).width;
  }
  function spezza(testo, corpo, grassetto, larghezza) {
    var righe = [];
    String(testo || '').split('\n').forEach(function (paragrafo) {
      var parole = paragrafo.split(/\s+/).filter(Boolean), riga = '';
      if (!parole.length) { righe.push(''); return; }
      parole.forEach(function (p) {
        var prova = riga ? riga + ' ' + p : p;
        if (largo(prova, corpo, grassetto) <= larghezza) { riga = prova; return; }
        if (riga) righe.push(riga);
        riga = p;
      });
      if (riga) righe.push(riga);
    });
    return righe;
  }

  /* ── La foto ────────────────────────────────────────────────────────── */
  function fotoJpeg(dataUrl) {
    return new Promise(function (ok) {
      if (!dataUrl) return ok(null);
      var img = new Image();
      img.onload = function () {
        var L = 300, A = Math.round(L * 1.24);            // tessera 3×3,7 circa
        var c = document.createElement('canvas');
        c.width = L; c.height = A;
        var g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, L, A);
        // ritaglio centrale: la foto entra piena, senza deformarsi
        var s = Math.max(L / img.width, A / img.height);
        var pl = img.width * s, pa = img.height * s;
        g.drawImage(img, (L - pl) / 2, (A - pa) / 2, pl, pa);
        var b64 = c.toDataURL('image/jpeg', 0.86).split(',')[1];
        var bin = atob(b64), byte = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) byte[i] = bin.charCodeAt(i);
        ok({ dati: byte, l: L, a: A });
      };
      img.onerror = function () { ok(null); };
      img.src = dataUrl;
    });
  }

  /* ── Il documento ───────────────────────────────────────────────────── */
  function crea(dati, etichette, foto) {
    var pagine = [], flusso = '', y = A4.a - BORDO;
    var largh = A4.l - BORDO * 2;

    function nuova() { pagine.push(flusso); flusso = ''; y = A4.a - BORDO; }
    function spazio(quanto) { if (y - quanto < BORDO + 24) nuova(); }
    function testo(s, x, corpo, grassetto, colore) {
      flusso += 'BT /' + (grassetto ? 'F2' : 'F1') + ' ' + corpo + ' Tf ' +
        (colore || SCURO) + ' rg 1 0 0 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Tm (' + ripulisci(s) + ') Tj ET\n';
    }
    function paragrafo(s, x, corpo, grassetto, colore, larghezza, interlinea) {
      var righe = spezza(s, corpo, grassetto, larghezza || largh);
      righe.forEach(function (r) {
        spazio(corpo * 1.2);
        testo(r, x, corpo, grassetto, colore);
        y -= corpo * (interlinea || 1.32);
      });
    }
    function riga(spessore, colore) {
      flusso += (colore || '0.87 0.85 0.81') + ' RG ' + (spessore || 0.6) + ' w ' +
        BORDO + ' ' + y.toFixed(2) + ' m ' + (A4.l - BORDO) + ' ' + y.toFixed(2) + ' l S\n';
    }
    function sezione(titolo) {
      spazio(46);
      y -= 16;
      testo(String(titolo).toUpperCase(), BORDO, 8.5, true, TENUE);
      y -= 5;
      riga(0.6);
      y -= 12;
    }

    /* testata */
    var largoTesta = largh - (foto ? 78 : 0);
    var yTesta = y;
    y -= 19;
    paragrafo(dati.nome || etichette.senzaNome, BORDO, 19, true, SCURO, largoTesta, 1.16);
    if (dati.ruolo) { y -= 2; paragrafo(dati.ruolo, BORDO, 10.5, false, MEDIO, largoTesta); }
    var contatti = [];
    if (dati.citta) contatti.push(dati.citta);
    if (dati.email) contatti.push(dati.email);
    if (dati.tel) contatti.push(dati.tel);
    if (dati.patente) contatti.push(etichette.patente);
    if (contatti.length) { y -= 3; paragrafo(contatti.join('   ·   '), BORDO, 9, false, MEDIO, largoTesta); }

    if (foto) {
      var fl = 68, fa = Math.round(fl * foto.a / foto.l);
      var fx = A4.l - BORDO - fl, fy = yTesta - fa + 4;
      flusso += 'q ' + fl + ' 0 0 ' + fa + ' ' + fx.toFixed(2) + ' ' + fy.toFixed(2) + ' cm /Im1 Do Q\n';
      if (y > fy) y = fy;
    }

    y -= 10;
    riga(1.2, '0.11 0.10 0.09');
    y -= 4;

    if (dati.profilo) { sezione(etichette.profilo); paragrafo(dati.profilo, BORDO, 9.5, false, MEDIO); }

    function voci(titolo, elenco) {
      if (!elenco.length) return;
      sezione(titolo);
      elenco.forEach(function (v) {
        spazio(34);
        var periodo = v.periodo || '';
        var largoPeriodo = periodo ? largo(periodo, 8.5, false) + 12 : 0;
        var capo = v.titolo + (v.org ? '  ·  ' + v.org : '');
        var righe = spezza(capo, 10, true, largh - largoPeriodo);
        if (periodo) {
          flusso += 'BT /F1 8.5 Tf ' + TENUE + ' rg 1 0 0 1 ' +
            (A4.l - BORDO - largo(periodo, 8.5, false)).toFixed(2) + ' ' + y.toFixed(2) +
            ' Tm (' + ripulisci(periodo) + ') Tj ET\n';
        }
        righe.forEach(function (r, i) {
          testo(r, BORDO, 10, true, SCURO);
          y -= i === righe.length - 1 ? 13 : 12.5;
        });
        if (v.desc) { paragrafo(v.desc, BORDO, 9, false, MEDIO); y -= 2; }
        y -= 4;
      });
    }

    voci(etichette.esperienze, dati.exp);
    voci(etichette.istruzione, dati.edu);

    if (dati.skills.length) {
      sezione(etichette.competenze);
      paragrafo(dati.skills.join('  ·  '), BORDO, 9.5, false, MEDIO);
    }
    if (dati.langs.length) {
      sezione(etichette.lingue);
      dati.langs.forEach(function (l) {
        spazio(16);
        testo(l.lingua, BORDO, 9.5, true, SCURO);
        flusso += 'BT /F1 9.5 Tf ' + MEDIO + ' rg 1 0 0 1 ' +
          (A4.l - BORDO - largo(l.livello, 9.5, false)).toFixed(2) + ' ' + y.toFixed(2) +
          ' Tm (' + ripulisci(l.livello) + ') Tj ET\n';
        y -= 14;
      });
    }

    spazio(40);
    y -= 14;
    riga(0.6);
    y -= 11;
    paragrafo(etichette.consenso, BORDO, 7.4, false, TENUE, largh, 1.4);

    nuova();
    return pagine;
  }

  /* ── L'involucro PDF ────────────────────────────────────────────────── */
  /* Dentro il PDF ogni carattere e' un byte: WinAnsi. TextEncoder scriverebbe
     UTF-8, e il punto centrale e l'apostrofo curvo — i due segni che questo
     documento usa a ogni riga — uscirebbero come due caratteri strani. */
  function byte(s) {
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xFF;
    return b;
  }

  function impacchetta(pagine, foto, titolo) {
    var oggetti = [], pezzi = [];
    function agg(corpo) { oggetti.push(corpo); return oggetti.length; }   // numerazione da 1

    var nCatalogo = agg(null), nPagine = agg(null);
    var nF1 = agg('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    var nF2 = agg('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    var nImg = 0;
    if (foto) nImg = agg({ flusso: foto.dati, dizionario: '<< /Type /XObject /Subtype /Image /Width ' + foto.l +
      ' /Height ' + foto.a + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + foto.dati.length + ' >>' });

    var risorse = '<< /Font << /F1 ' + nF1 + ' 0 R /F2 ' + nF2 + ' 0 R >>' +
      (nImg ? ' /XObject << /Im1 ' + nImg + ' 0 R >>' : '') + ' >>';
    var numeriPagina = [];
    pagine.forEach(function (flusso) {
      var corpo = byte(flusso);
      var nCont = agg({ flusso: corpo, dizionario: '<< /Length ' + corpo.length + ' >>' });
      numeriPagina.push(agg('<< /Type /Page /Parent ' + nPagine + ' 0 R /MediaBox [0 0 ' + A4.l + ' ' + A4.a +
        '] /Resources ' + risorse + ' /Contents ' + nCont + ' 0 R >>'));
    });

    oggetti[nCatalogo - 1] = '<< /Type /Catalog /Pages ' + nPagine + ' 0 R >>';
    oggetti[nPagine - 1] = '<< /Type /Pages /Count ' + numeriPagina.length + ' /Kids [' +
      numeriPagina.map(function (n) { return n + ' 0 R'; }).join(' ') + '] >>';

    var nInfo = agg('<< /Title (' + ripulisci(titolo) + ') /Producer (Easy Italia Hub) >>');

    var lunghezza = 0, posizioni = [];
    function spingi(x) {
      var b = typeof x === 'string' ? byte(x) : x;
      pezzi.push(b); lunghezza += b.length;
    }
    spingi('%PDF-1.4\n%âãÏÓ\n');
    oggetti.forEach(function (o, i) {
      posizioni[i] = lunghezza;
      spingi((i + 1) + ' 0 obj\n');
      if (o && o.flusso) { spingi(o.dizionario + '\nstream\n'); spingi(o.flusso); spingi('\nendstream\n'); }
      else spingi(o + '\n');
      spingi('endobj\n');
    });
    var inizioTavola = lunghezza;
    var tavola = 'xref\n0 ' + (oggetti.length + 1) + '\n0000000000 65535 f \n';
    posizioni.forEach(function (p) { tavola += ('0000000000' + p).slice(-10) + ' 00000 n \n'; });
    tavola += 'trailer\n<< /Size ' + (oggetti.length + 1) + ' /Root ' + nCatalogo + ' 0 R /Info ' + nInfo +
      ' 0 R >>\nstartxref\n' + inizioTavola + '\n%%EOF\n';
    spingi(tavola);
    return new Blob(pezzi, { type: 'application/pdf' });
  }

  /* Le stesse primitive servono alle lettere di /moduli: pagina A4, gli stessi
     due font di sistema, la stessa codifica. Meglio prestarle che riscriverle
     — e una correzione alla scrittura del PDF vale per tutti e due. */
  window.EIH_PDF = {
    A4: A4, BORDO: BORDO, SCURO: SCURO, MEDIO: MEDIO, TENUE: TENUE,
    scrivibile: scrivibile, ripulisci: ripulisci, largo: largo, spezza: spezza,
    impacchetta: impacchetta
  };

  window.EIH_CV_PDF = {
    scrivibile: scrivibile,
    /* dati: { nome, ruolo, citta, email, tel, patente, profilo, foto,
               exp:[{titolo,org,periodo,desc}], edu:[…], skills:[], langs:[{lingua,livello}] } */
    genera: function (dati, etichette) {
      return fotoJpeg(dati.foto).then(function (foto) {
        return impacchetta(crea(dati, etichette, foto), foto, dati.nome || 'Curriculum vitae');
      });
    }
  };
})();
