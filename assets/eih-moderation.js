/* Easy Italia Hub — moderazione contenuti community (mercatino, forum).
   Due strumenti leggeri, senza backend dedicato:
   1) scamGuard(text): riconosce pattern tipici di truffa/spam e, se presenti,
      chiede una conferma extra prima di pubblicare (protegge chi pubblica e chi legge).
   2) reportButton(payload): pulsante "🚩 Segnala" che invia la segnalazione alla
      casella di moderazione via /api/email. Nessuna tabella nuova. */
(function () {
  'use strict';

  // Pattern ad alto rischio: pagamento anticipato, crypto, canali fuori piattaforma
  // per estorcere denaro. Volutamente prudenti: generano solo un avviso, non un blocco.
  var SCAM = [
    /\bbitcoin\b|\bcrypto\b|\busdt\b|\bwestern union\b|\bmoneygram\b/i,
    /pagamento\s+anticipat|anticipo\s+(di\s+)?(soldi|denaro|caparra)|caparra\s+prima/i,
    /invia(mi)?\s+(i\s+)?soldi|manda(mi)?\s+(i\s+)?soldi|ricarica\s+(postepay|carta)/i,
    /garanzia\s+del\s+visto|visto\s+garantit|permesso\s+garantit|documenti\s+garantit/i,
    /lavoro\s+garantit|guadagn[io]\s+facil|soldi\s+facil/i,
  ];

  function isSuspicious(text) {
    var t = String(text || '');
    return SCAM.some(function (re) { return re.test(t); });
  }

  // Ritorna true se si può procedere (nessun sospetto, o l'utente conferma comunque).
  function scamGuard(text) {
    if (!isSuspicious(text)) return true;
    return window.confirm(
      '⚠️ Attenzione: questo testo contiene frasi tipiche delle truffe ' +
      '(pagamenti anticipati, garanzie su visti/permessi/lavoro, richieste di denaro).\n\n' +
      'Non pagare mai in anticipo e non condividere codici o documenti con sconosciuti.\n\n' +
      'Vuoi pubblicare lo stesso?'
    );
  }

  function reportButton(getPayload, cls) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls || 'eih-report-btn';
    btn.textContent = '🚩 Segnala';
    btn.setAttribute('aria-label', 'Segnala contenuto inappropriato');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var reason = window.prompt('Perché segnali questo contenuto? (truffa, offensivo, spam…)');
      if (reason === null) return;
      var p = getPayload() || {};
      btn.disabled = true;
      var prev = btn.textContent;
      btn.textContent = 'Invio…';
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: 'Segnalazione moderazione',
          email: 'moderazione@easyitaliahub.it',
          message: '[SEGNALAZIONE ' + (p.area || 'contenuto') + ']\nMotivo: ' + (reason || '—') +
            '\nID: ' + (p.id || '—') + '\nTitolo: ' + (p.title || '—') +
            '\nURL: ' + location.href,
        }),
      }).then(function (r) { return r.json(); }).then(function (d) {
        btn.textContent = (d && (d.ok || d.demo)) ? '✓ Segnalato' : prev;
        if (!(d && (d.ok || d.demo))) btn.disabled = false;
      }).catch(function () { btn.textContent = prev; btn.disabled = false; });
    });
    return btn;
  }

  window.EIHModeration = { isSuspicious: isSuspicious, scamGuard: scamGuard, reportButton: reportButton };
})();
