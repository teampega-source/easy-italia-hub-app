/* Easy Italia Hub — stato auth nella nav.
   Se l'utente è loggato (reale via EIH_AUTH, o demo via localStorage
   'eih-registered'/'eih-demo-user'), sostituisce "Accedi"/"Registrati gratis"
   con l'accesso alla Dashboard + "Esci". Funziona con entrambe le nav
   (index hardcoded ed eih.js #site-nav). Idempotente. */
(function(){
  if(window.__eihNavAuth)return;window.__eihNavAuth=1;

  function demoUser(){
    try{ if(localStorage.getItem('eih-registered')==='1'){
      return JSON.parse(localStorage.getItem('eih-demo-user')||'{}')||{}; } }catch(e){}
    return null;
  }
  window.eihLogout=function(){
    function done(){ try{localStorage.removeItem('eih-registered');localStorage.removeItem('eih-demo-user');}catch(e){} location.href='/'; }
    if(window.EIH_AUTH&&EIH_AUTH.signOut){ try{EIH_AUTH.signOut().then(done,done);}catch(e){done();} }
    else done();
  };

  function apply(u){
    var rights=document.querySelectorAll('.site-nav .nav-right');
    for(var i=0;i<rights.length;i++){
      var r=rights[i],login=r.querySelector('.nav-login'),cta=r.querySelector('.nav-cta');
      if(!login||!cta)continue;
      var state=u?'in':'out';
      if(r.getAttribute('data-auth')===state)continue;
      r.setAttribute('data-auth',state);
      if(u){
        var nm=((u.name||u.email||'')+'').trim();
        var label=nm?nm.split(/[\s@]/)[0]:'Dashboard';
        cta.textContent='👤 '+label;
        cta.removeAttribute('data-i18n');
        cta.setAttribute('onclick',"location.href='/dashboard'");
        cta.setAttribute('title','La mia Dashboard');
        login.textContent='Esci';
        login.removeAttribute('data-i18n');
        login.setAttribute('onclick','eihLogout()');
        login.setAttribute('title','Esci');
      }
      // logged-out: lascia i default invariati
    }
  }

  function run(){
    var demo=demoUser();
    if(window.EIH_AUTH&&EIH_AUTH.getUser){
      try{ EIH_AUTH.getUser().then(function(x){apply(x||demo);},function(){apply(demo);}); }
      catch(e){ apply(demo); }
    } else apply(demo);
    // aggiornamenti live (login/logout reali)
    if(window.EIH_AUTH&&EIH_AUTH.onChange&&!window.__eihNavAuthSub){
      window.__eihNavAuthSub=1;
      try{ EIH_AUTH.onChange(function(ev,session){ apply((session&&session.user)||demoUser()); }); }catch(e){}
    }
  }

  function boot(){
    run();
    // la nav di eih.js può essere iniettata dopo: riprova finché compare .nav-right
    if(!document.querySelector('.site-nav .nav-right')){
      var mo=new MutationObserver(function(){ if(document.querySelector('.site-nav .nav-right')){ mo.disconnect(); run(); } });
      mo.observe(document.documentElement,{childList:true,subtree:true});
      setTimeout(function(){try{mo.disconnect();}catch(e){}run();},1500);
    }
  }
  if(document.readyState!=='loading')boot();else document.addEventListener('DOMContentLoaded',boot);
})();
