/* Cancellazione dei dati dell'utente — art. 17 GDPR, diritto alla cancellazione.

   Perché non basta una lista. In `profili.html` il pulsante «cancella tutti i
   miei dati» aveva un elenco di chiavi scritto a mano. Un elenco scritto a mano
   invecchia come una data scritta a mano: al momento del controllo cancellava
   dieci chiavi, di cui cinque non esistevano più, e ne lasciava indietro
   quindici — fra cui l'account (`eih-user`), da quanto tempo l'utente è
   iscritto, i corsi seguiti, l'iscrizione alla newsletter e l'attribuzione
   pubblicitaria (`eih-utm`). Cioè quasi tutto quello per cui uno preme quel
   pulsante.

   Qui non si elenca niente: si cancella tutto quello che porta il prefisso
   `eih-`. Una chiave nuova è coperta il giorno in cui nasce, senza che nessuno
   debba ricordarsi di aggiungerla. Non è un'astrazione gratuita: `eih-first-visit`
   sfuggiva a chi cercava le chiavi nel codice, perché è scritta attraverso una
   variabile e non come testo. Un elenco a mano non poteva prenderla; il
   prefisso la prende.

   Dopo la cancellazione una chiave ricompare quasi subito, ed è giusto così:
   il browser adesso è un visitatore nuovo, e viene marcato come tale. Quello
   che è sparito non torna.

   Tre cose che una `removeItem` non fa e che qui si fanno:
   - la **sottoscrizione push** non sta nel browser, sta sul server di Google o
     di Apple. Svuotare localStorage non la tocca: il telefono continuerebbe a
     ricevere notifiche da un account cancellato;
   - le **cache del service worker** contengono le pagine già visitate, e fra
     quelle c'è la propria area personale;
   - `sessionStorage` è memoria come le altre.

   Uso:
     EIHCancella().then(function (esito) { … })     // esito.chiavi, .push, .cache
*/
(function () {
  'use strict';
  var PREFISSO = 'eih-';

  function chiaviDi(deposito) {
    var fuori = [];
    try {
      for (var i = 0; i < deposito.length; i++) {
        var k = deposito.key(i);
        if (k && k.indexOf(PREFISSO) === 0) fuori.push(k);
      }
    } catch (e) {}
    return fuori;
  }

  function svuota(deposito) {
    var k = chiaviDi(deposito);
    for (var i = 0; i < k.length; i++) { try { deposito.removeItem(k[i]); } catch (e) {} }
    return k;
  }

  function spegniPush() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.getRegistration) {
      return Promise.resolve(false);
    }
    return navigator.serviceWorker.getRegistration()
      .then(function (reg) {
        if (!reg || !reg.pushManager) return false;
        return reg.pushManager.getSubscription().then(function (sub) {
          if (!sub) return false;
          return sub.unsubscribe().then(function () { return true; }, function () { return false; });
        });
      })
      .catch(function () { return false; });
  }

  function svuotaCache() {
    if (!('caches' in window)) return Promise.resolve(0);
    return caches.keys()
      .then(function (nomi) {
        return Promise.all(nomi.map(function (n) { return caches.delete(n); }))
          .then(function () { return nomi.length; });
      })
      .catch(function () { return 0; });
  }

  window.EIHCancella = function () {
    var chiavi = svuota(window.localStorage).concat(svuota(window.sessionStorage));
    /* Prima si svuota la memoria, poi si spengono le notifiche e la cache: se
       una delle due fallisce — succede, sono chiamate di rete — i dati sul
       dispositivo sono comunque già andati, che è la parte che conta. */
    return Promise.all([spegniPush(), svuotaCache()])
      .then(function (r) {
        return { chiavi: chiavi, push: r[0], cache: r[1] };
      });
  };
})();
