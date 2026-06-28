/* eih-search.js — Action search overlay. Intercetta la lente .nav-search-btn
   (evita /cerca), apre un pannello con suggerimenti adattati alle pagine della piattaforma. */
(function(){
  if(window.__eihSearch)return; window.__eihSearch=1;

  var ACTIONS=[
    {u:'/percorso',e:'🤖',c:'Servizi',t:'Assistente AI Personale',k:'ai assistente chatbot domande aiuto burocrazia'},
    {u:'/guide',e:'📖',c:'Guide',t:'Guide burocratiche',k:'permesso soggiorno codice fiscale spid residenza tessera sanitaria cittadinanza'},
    {u:'/guida-ssn',e:'🏥',c:'Guide',t:'Sistema Sanitario Nazionale',k:'ssn salute medico pronto soccorso farmacia asl esenzione ticket'},
    {u:'/patente',e:'🚗',c:'Guide',t:'Patente di guida',k:'patente auto convertire straniera motorizzazione quiz autoscuola'},
    {u:'/housing',e:'🏠',c:'Guide',t:'Casa in Affitto',k:'casa affitto appartamento contratto inquilino deposito utenze'},
    {u:'/assegno-unico',e:'👶',c:'Guide',t:'Assegno Unico Universale',k:'assegno figli bambini isee inps'},
    {u:'/diritti-inps',e:'🏛️',c:'Guide',t:'Diritti INPS',k:'inps naspi disoccupazione pensione contributi maternità malattia'},
    {u:'/riconoscimento-titoli',e:'🎓',c:'Guide',t:'Riconoscimento Titoli',k:'titolo studio laurea diploma nostrificazione università professione'},
    {u:'/ricongiungimento',e:'👨‍👩‍👧',c:'Guide',t:'Ricongiungimento Familiare',k:'famiglia visto permesso coniuge figli genitori nulla osta'},
    {u:'/fisco',e:'💶',c:'Guide',t:'Fisco e Redditi',k:'fisco dichiarazione 730 irpef partita iva detrazioni rimborso caf tasse'},
    {u:'/documenti',e:'📋',c:'Guide',t:'Documenti essenziali',k:'carta identità passaporto codice fiscale stato famiglia certificati anagrafe'},
    {u:'/scuola',e:'🎒',c:'Guide',t:'Scuola e Istruzione',k:'scuola iscrizione figli università nido asilo elementari medie'},
    {u:'/moduli',e:'📄',c:'Servizi',t:'Moduli e Lettere tipo',k:'moduli lettere disdetta reclamo richiesta autocertificazione template'},
    {u:'/community',e:'👥',c:'Servizi',t:'Community',k:'community forum gruppo supporto stranieri immigrati'},
    {u:'/corsi',e:'🗣️',c:'Servizi',t:'Corsi di Italiano',k:'corsi italiano lingua imparare a1 b1 b2 c1 online gratuito'},
    {u:'/opportunita',e:'✨',c:'Servizi',t:'Opportunità',k:'lavoro borse studio tirocinio bando concorso stage'},
    {u:'/money-transfer',e:'💸',c:'Servizi',t:'Money Transfer',k:'rimessa soldi estero commissioni western union wise remitly'},
    {u:'/associazioni',e:'🤝',c:'Servizi',t:'Associazioni',k:'associazioni immigrati patronato caf sportello assistenza'},
    {u:'/mercatino',e:'🛍️',c:'Servizi',t:'Mercatino',k:'mercatino annunci compra vendi seconda mano usato'},
    {u:'/podcast',e:'🎙️',c:'Servizi',t:'Podcast',k:'podcast audio episodi storie immigrati'},
    {u:'/mappa',e:'🗺️',c:'Servizi',t:'Mappa dei Servizi',k:'mappa patronato caf questura comune vicino'},
    {u:'/cv-builder',e:'📝',c:'Strumenti',t:'CV Builder',k:'cv curriculum vitae europass lavoro candidatura'},
    {u:'/dizionario-medico',e:'🩺',c:'Strumenti',t:'Dizionario Medico',k:'dizionario medico glossario termini sinhala tamil'},
    {u:'/traduci',e:'🌐',c:'Strumenti',t:'Traduttore',k:'traduci traduttore traduzione lingua documento'},
    {u:'/permesso-tracker',e:'📍',c:'Strumenti',t:'Tracker Permesso',k:'permesso soggiorno scadenza rinnovo promemoria'},
    {u:'/emergenze',e:'🚨',c:'Strumenti',t:'Numeri di Emergenza',k:'emergenze 112 118 115 ambasciata consolato carabinieri'},
    {u:'/voli',e:'✈️',c:'Strumenti',t:'Voli Sri Lanka — Italia',k:'voli aereo colombo roma milano tariffe compagnie'},
    {u:'/certificazioni',e:'📜',c:'Strumenti',t:'Certificazioni Linguistiche',k:'certificazione celi cils plida dante esame livello'},
    {u:'/guida-conti',e:'🏦',c:'Strumenti',t:'Conti Bancari',k:'conto banca corrente aprire bancomat carta credito'},
    {u:'/cargo',e:'📦',c:'Strumenti',t:'Cargo — Spedizioni',k:'cargo spedizione pacco bagaglio corriere sri lanka'},
    {u:'/academy',e:'🎓',c:'Formazione',t:'Academy',k:'academy corsi formazione online diritti lavoratore'},
    {u:'/ai-teacher',e:'🤖',c:'Formazione',t:'AI Teacher',k:'ai teacher insegnante italiano conversazione pratica'},
    {u:'/profili',e:'👤',c:'Formazione',t:'Profili Utente',k:'profilo percorso personalizzato lavoratore studente familiare'},
    {u:'/news',e:'📰',c:'Azienda',t:'News',k:'news notizie aggiornamenti leggi novità'},
    {u:'/chi-siamo',e:'🙋',c:'Azienda',t:'Chi siamo',k:'chi siamo storia team missione comunità srilankese'},
    {u:'/contatti',e:'✉️',c:'Azienda',t:'Contatti',k:'contatti scrivici email collaborazione segnalazione'},
    {u:'/abbonamenti',e:'⭐',c:'Account',t:'Abbonamenti',k:'abbonamento premium piano prezzo supporto'},
    {u:'/privacy',e:'🔒',c:'Legal',t:'Privacy Policy',k:'privacy gdpr dati personali'},
    {u:'/termini',e:'📑',c:'Legal',t:'Termini di Servizio',k:'termini condizioni uso legale'},
    {u:'/cookie',e:'🍪',c:'Legal',t:'Cookie Policy',k:'cookie informativa tracciamento'},
    {u:'/note-legali',e:'⚖️',c:'Legal',t:'Note Legali',k:'note legali disclaimer responsabilità'}
  ];
  // Suggeriti iniziali (azioni rapide più usate)
  var QUICK=['/percorso','/guide','/guida-ssn','/permesso-tracker','/voli','/mappa','/traduci','/moduli'];

  var CSS=
  '.eih-srch-ov{position:fixed;inset:0;z-index:99999;display:none;align-items:flex-start;justify-content:center;background:rgba(8,10,16,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:12vh 16px 16px}'+
  '.eih-srch-ov.on{display:flex;animation:eih-srch-fade .18s ease}'+
  '@keyframes eih-srch-fade{from{opacity:0}to{opacity:1}}'+
  '.eih-srch{width:100%;max-width:560px;background:var(--bg-elevated,#fff);border:1px solid var(--border,#e5e7eb);border-radius:16px;box-shadow:0 24px 60px -12px rgba(0,0,0,.4);overflow:hidden;animation:eih-srch-pop .2s cubic-bezier(.2,.8,.2,1)}'+
  '@keyframes eih-srch-pop{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}'+
  '.eih-srch-top{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border,#e5e7eb)}'+
  '.eih-srch-top svg{flex-shrink:0;color:var(--fg-muted,#94a3b8)}'+
  '.eih-srch-in{flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--fg,#0f172a)}'+
  '.eih-srch-in::placeholder{color:var(--fg-muted,#94a3b8)}'+
  '.eih-srch-esc{font-size:11px;font-weight:600;color:var(--fg-muted,#94a3b8);border:1px solid var(--border,#e5e7eb);border-radius:6px;padding:2px 6px;background:var(--bg-base,#f8fafc);cursor:pointer}'+
  '.eih-srch-list{max-height:48vh;overflow-y:auto;padding:6px}'+
  '.eih-srch-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-muted,#94a3b8);padding:10px 12px 4px}'+
  '.eih-srch-it{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;text-decoration:none;color:var(--fg,#0f172a)}'+
  '.eih-srch-it:hover,.eih-srch-it.sel{background:rgba(37,99,235,.09)}'+
  '.eih-srch-em{font-size:18px;width:24px;text-align:center;flex-shrink:0}'+
  '.eih-srch-tt{flex:1;font-size:14px;font-weight:500;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '.eih-srch-tt mark{background:rgba(37,99,235,.18);color:inherit;border-radius:3px;padding:0 1px}'+
  '.eih-srch-bd{font-size:11px;font-weight:600;color:var(--fg-secondary,#475569);background:var(--bg-base,#f1f5f9);border:1px solid var(--border,#e5e7eb);border-radius:999px;padding:2px 9px;flex-shrink:0}'+
  '.eih-srch-empty{padding:28px 16px;text-align:center;color:var(--fg-muted,#94a3b8);font-size:14px}'+
  '@media(max-width:600px){.eih-srch-ov{padding:8vh 10px 10px}.eih-srch-list{max-height:60vh}}';

  var ov,inp,list,items=[],sel=-1;

  function esc(s){return s.replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function hl(t,q){if(!q)return esc(t);var w=q.trim().split(/\s+/).filter(Boolean).map(function(x){return x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');});if(!w.length)return esc(t);return esc(t).replace(new RegExp('('+w.join('|')+')','gi'),'<mark>$1</mark>');}

  function score(a,terms){var t=a.t.toLowerCase(),k=a.k.toLowerCase(),u=a.u.toLowerCase(),s=0;terms.forEach(function(x){if(t.indexOf(x)>-1)s+=10;if(u.indexOf(x)>-1)s+=8;if(k.indexOf(x)>-1)s+=3;});return s;}

  function build(){
    var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
    ov=document.createElement('div');ov.className='eih-srch-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Cerca');
    ov.innerHTML='<div class="eih-srch">'+
      '<div class="eih-srch-top">'+
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'+
        '<input class="eih-srch-in" type="text" placeholder="Cerca pagine, servizi, strumenti…" aria-label="Cerca" autocomplete="off" spellcheck="false">'+
        '<button class="eih-srch-esc" type="button" aria-label="Chiudi">Esc</button>'+
      '</div>'+
      '<div class="eih-srch-list" role="listbox"></div>'+
    '</div>';
    document.body.appendChild(ov);
    inp=ov.querySelector('.eih-srch-in');list=ov.querySelector('.eih-srch-list');
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
    ov.querySelector('.eih-srch-esc').addEventListener('click',close);
    inp.addEventListener('input',function(){render(inp.value);});
    inp.addEventListener('keydown',onKey);
  }

  function render(q){
    q=(q||'').trim();var html='';
    if(!q){
      var quick=QUICK.map(function(u){return ACTIONS.find(function(a){return a.u===u;});}).filter(Boolean);
      html='<div class="eih-srch-lbl">Suggeriti</div>'+rows(quick,'');
    }else{
      var terms=q.toLowerCase().split(/\s+/).filter(Boolean);
      var res=ACTIONS.map(function(a){return {a:a,s:score(a,terms)};}).filter(function(o){return o.s>0;}).sort(function(x,y){return y.s-x.s;}).map(function(o){return o.a;});
      html=res.length?rows(res,q):'<div class="eih-srch-empty">Nessun risultato per "'+esc(q)+'"</div>';
    }
    list.innerHTML=html;
    items=Array.prototype.slice.call(list.querySelectorAll('.eih-srch-it'));
    sel=items.length?0:-1;mark();
    items.forEach(function(el){el.addEventListener('mouseenter',function(){sel=items.indexOf(el);mark();});});
  }
  function rows(arr,q){return arr.map(function(a){return '<a class="eih-srch-it" role="option" href="'+a.u+'" data-u="'+a.u+'"><span class="eih-srch-em">'+a.e+'</span><span class="eih-srch-tt">'+hl(a.t,q)+'</span><span class="eih-srch-bd">'+a.c+'</span></a>';}).join('');}
  function mark(){items.forEach(function(el,i){el.classList.toggle('sel',i===sel);if(i===sel)el.scrollIntoView({block:'nearest'});});}

  function onKey(e){
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='ArrowDown'){e.preventDefault();if(items.length){sel=(sel+1)%items.length;mark();}return;}
    if(e.key==='ArrowUp'){e.preventDefault();if(items.length){sel=(sel-1+items.length)%items.length;mark();}return;}
    if(e.key==='Enter'){e.preventDefault();if(sel>-1&&items[sel])go(items[sel].getAttribute('data-u'));return;}
  }
  function go(u){close();location.href=u;}

  function open(){if(!ov)build();render('');ov.classList.add('on');document.documentElement.style.overflow='hidden';setTimeout(function(){inp.focus();},30);}
  function close(){if(!ov)return;ov.classList.remove('on');document.documentElement.style.overflow='';}

  // Intercetta la lente in fase di cattura → batte il wipe-handler di eih.js ed evita /cerca
  document.addEventListener('click',function(e){
    var btn=e.target.closest&&e.target.closest('.nav-search-btn');
    if(!btn)return;
    e.preventDefault();e.stopPropagation();
    open();
  },true);
  // Click su un risultato (capture, per battere il wipe)
  document.addEventListener('click',function(e){
    var it=e.target.closest&&e.target.closest('.eih-srch-it');
    if(!it)return;e.preventDefault();e.stopPropagation();go(it.getAttribute('data-u'));
  },true);
  // Scorciatoia ⌘K / Ctrl+K e /
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&(e.key==='k'||e.key==='K')){e.preventDefault();ov&&ov.classList.contains('on')?close():open();}
  });
})();
