/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — shared runtime (eih.js)
   Injects nav + footer, handles i18n, lang switch, mobile menu,
   custom cursor, preloader, page-transition wipe, scroll reveal.
   Each page: <body data-page="guide"> + <div id="site-nav"></div>
   + content + <div id="site-footer"></div> + <script src="eih.js">.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const I18N={
    it:{ "nav.guide":"Guide","nav.community":"Community","nav.journey":"Il Mio Percorso","nav.news":"News","nav.map":"Mappa","nav.contact":"Contattaci","nav.login":"Accedi","nav.signup":"Registrati gratis",
      "nav.voli":"Voli","nav.profile":"Profilo",
      "m.quicknav":"Navigazione rapida","m.flights":"Voli Sri Lanka","m.languages":"Corsi di Lingue","m.opportunities":"Opportunità","m.cargo":"Spedizioni Cargo","m.templates":"Moduli e Lettere","m.openaccount":"Aprire un Conto","m.assegno":"Calcol. Assegno Unico","m.inps":"Verifica Diritti INPS","m.titles":"Riconosc. Titoli","m.medical":"Dizionario Medico","m.dashboard":"La mia Dashboard","m.tracker":"Tracker Permesso","m.docs":"Archivio Documenti","m.cvbuilder":"CV Builder",
      "f.tag":"Il punto di riferimento della comunità srilankese in Italia. Guide, AI multilingua, community e servizi — tutto in un unico posto.",
      "f.product":"Prodotto","f.aiAssistant":"Assistente AI","f.mapServices":"Mappa servizi","f.company":"Azienda","f.about":"Chi siamo","f.advertising":"Pubblicità","f.contact":"Contatti","f.account":"Account","f.register":"Registrati","f.subscriptions":"Abbonamenti","f.copy":"© 2026 Easy Italia Hub. Tutti i diritti riservati.","f.privacy":"Privacy Policy","f.cookie":"Cookie Policy","f.terms":"Termini di Servizio","f.legal":"Note legali" },
    en:{ "nav.guide":"Guides","nav.community":"Community","nav.journey":"My Journey","nav.news":"News","nav.map":"Map","nav.contact":"Contact us","nav.login":"Log in","nav.signup":"Sign up free",
      "nav.voli":"Flights","nav.profile":"Profile",
      "m.quicknav":"Quick navigation","m.flights":"Sri Lanka Flights","m.languages":"Language Courses","m.opportunities":"Opportunities","m.cargo":"Cargo Shipping","m.templates":"Forms & Letters","m.openaccount":"Open a Bank Account","m.assegno":"Assegno Unico Calc.","m.inps":"INPS Rights Check","m.titles":"Qual. Recognition","m.medical":"Medical Dictionary","m.dashboard":"My Dashboard","m.tracker":"Permit Tracker","m.docs":"Document Archive","m.cvbuilder":"CV Builder",
      "f.tag":"The reference point for the Sri Lankan community in Italy. Guides, multilingual AI, community and services — all in one place.",
      "f.product":"Product","f.aiAssistant":"AI Assistant","f.mapServices":"Services map","f.company":"Company","f.about":"About us","f.advertising":"Advertising","f.contact":"Contact","f.account":"Account","f.register":"Register","f.subscriptions":"Subscriptions","f.copy":"© 2026 Easy Italia Hub. All rights reserved.","f.privacy":"Privacy Policy","f.cookie":"Cookie Policy","f.terms":"Terms of Service","f.legal":"Legal notice" },
    si:{ "nav.guide":"මාර්ගෝපදේශ","nav.community":"ප්‍රජාව","nav.journey":"මගේ ගමන","nav.news":"පුවත්","nav.map":"සිතියම","nav.contact":"අපව අමතන්න","nav.login":"පිවිසෙන්න","nav.signup":"නොමිලේ ලියාපදිංචි වන්න",
      "nav.voli":"ගුවන් ගමන්","nav.profile":"පැතිකඩ",
      "m.quicknav":"ඉක්මන් සොයන","m.flights":"ශ්‍රී ලංකා ගුවන් ගමන්","m.languages":"භාෂා පාඨමාලා","m.opportunities":"අවස්ථා","m.cargo":"ගෙවල් ගෙනයාම","m.templates":"ෆෝරම් සහ ලිපි","m.openaccount":"බැංකු ගිණුමක්","m.assegno":"Assegno Unico ගණකය","m.inps":"INPS අයිතිවාසිකම්","m.titles":"සුදුස්සකම් හඳුනාගැනීම","m.medical":"වෛද්‍ය ශබ්දකෝෂය","m.dashboard":"මගේ ඩෑෂ්බෝඩ්","m.tracker":"බලපත්‍ර ලුහුබැඳීම","m.docs":"ලේඛනාගාරය","m.cvbuilder":"CV Builder",
      "f.tag":"ඉතාලියේ ශ්‍රී ලාංකික ප්‍රජාවේ විශ්වාසනීය මධ්‍යස්ථානය. මාර්ගෝපදේශ, බහුභාෂා AI, ප්‍රජාව සහ සේවා — සියල්ල එක තැනක.",
      "f.product":"නිෂ්පාදනය","f.aiAssistant":"AI සහායක","f.mapServices":"සේවා සිතියම","f.company":"සමාගම","f.about":"අප ගැන","f.advertising":"දැන්වීම්","f.contact":"සම්බන්ධ වන්න","f.account":"ගිණුම","f.register":"ලියාපදිංචි වන්න","f.subscriptions":"දායකත්ව","f.copy":"© 2026 Easy Italia Hub. සියලු හිමිකම් ඇවිරිණි.","f.privacy":"පෞද්ගලිකත්ව ප්‍රතිපත්තිය","f.cookie":"කුකී ප්‍රතිපත්තිය","f.terms":"සේවා කොන්දේසි","f.legal":"නෛතික දැන්වීම" },
    ta:{ "nav.guide":"வழிகாட்டிகள்","nav.community":"சமூகம்","nav.journey":"என் பயணம்","nav.news":"செய்திகள்","nav.map":"வரைபடம்","nav.contact":"தொடர்பு கொள்ளுங்கள்","nav.login":"உள்நுழைய","nav.signup":"இலவசமாக பதிவு",
      "nav.voli":"விமானங்கள்","nav.profile":"சுயவிவரம்",
      "m.quicknav":"விரைவு வழிசெலுத்தல்","m.flights":"இலங்கை விமானங்கள்","m.languages":"மொழி வகுப்புகள்","m.opportunities":"வாய்ப்புகள்","m.cargo":"சரக்கு அனுப்புதல்","m.templates":"படிவங்கள் & கடிதங்கள்","m.openaccount":"வங்கி கணக்கு திறக்க","m.assegno":"Assegno Unico கணக்கு","m.inps":"INPS உரிமைகள்","m.titles":"தகுதி அங்கீகாரம்","m.medical":"மருத்துவ அகராதி","m.dashboard":"என் டாஷ்போர்டு","m.tracker":"அனுமதி கண்காணிப்பு","m.docs":"ஆவண காப்பகம்","m.cvbuilder":"CV Builder",
      "f.tag":"இத்தாலியில் இலங்கை சமூகத்தின் நம்பகமான மையம். வழிகாட்டிகள், பன்மொழி AI, சமூகம் மற்றும் சேவைகள் — அனைத்தும் ஒரே இடத்தில்.",
      "f.product":"தயாரிப்பு","f.aiAssistant":"AI உதவியாளர்","f.mapServices":"சேவை வரைபடம்","f.company":"நிறுவனம்","f.about":"எங்களைப் பற்றி","f.advertising":"விளம்பரம்","f.contact":"தொடர்பு","f.account":"கணக்கு","f.register":"பதிவு செய்ய","f.subscriptions":"சந்தாக்கள்","f.copy":"© 2026 Easy Italia Hub. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.","f.privacy":"தனியுரிமைக் கொள்கை","f.cookie":"குக்கீ கொள்கை","f.terms":"சேவை விதிமுறைகள்","f.legal":"சட்டக் குறிப்பு" }
  };
  const LANG_META={it:{flag:"🇮🇹",code:"IT"},en:{flag:"🇬🇧",code:"EN"},si:{flag:"🇱🇰",code:"SI"},ta:{flag:"🇱🇰",code:"TA"}};
  let lang=(function(){try{return localStorage.getItem('eih-lang')}catch(e){return null}})()||'it';
  if(!I18N[lang])lang='it';
  const active=document.body.getAttribute('data-page')||'';

  function navHTML(){
    return '<nav class="site-nav" aria-label="Navigazione principale">'+
      '<a href="/" class="nav-logo">Easy <span class="accent">Italia</span> Hub</a>'+
      '<button class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false" onclick="EIH.toggleMenu()"><span></span><span></span><span></span></button>'+
      '<div class="nav-collapse" id="nav-collapse">'+
        '<ul class="nav-links">'+
          '<li><a href="/guide" data-i18n="nav.guide"'+(active==='guide'?' class="active"':'')+'>Guide</a></li>'+
          '<li><a href="/community" data-i18n="nav.community"'+(active==='community'?' class="active"':'')+'>Community</a></li>'+
          '<li><a href="/percorso" data-i18n="nav.journey"'+(active==='percorso'?' class="active"':'')+'>Il Mio Percorso</a></li>'+
          '<li><a href="/news" data-i18n="nav.news"'+(active==='news'?' class="active"':'')+'>News</a></li>'+
          '<li><a href="/voli" data-i18n="nav.voli"'+(active==='voli'?' class="active"':'')+'>Voli</a></li>'+
          '<li><a href="/mappa" data-i18n="nav.map"'+(active==='mappa'?' class="active"':'')+'>Mappa</a></li>'+
          '<li><a href="/contatti" data-i18n="nav.contact"'+(active==='contatti'?' class="active"':'')+'>Contattaci</a></li>'+
        '</ul>'+
        '<div class="nav-right">'+
          '<div class="lang-switch"><button class="lang-btn" id="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Lingua" onclick="EIH.toggleLang(event)"><span class="lang-flag" id="lang-flag">🇮🇹</span><span class="lang-code" id="lang-code">IT</span><svg class="lang-chevron" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>'+
            '<ul class="lang-menu" id="lang-menu" role="menu"><li><button role="menuitem" onclick="EIH.setLang(\'it\')"><span>🇮🇹</span> Italiano</button></li><li><button role="menuitem" onclick="EIH.setLang(\'en\')"><span>🇬🇧</span> English</button></li><li><button role="menuitem" onclick="EIH.setLang(\'si\')"><span>🇱🇰</span> සිංහල</button></li><li><button role="menuitem" onclick="EIH.setLang(\'ta\')"><span>🇱🇰</span> தமிழ்</button></li></ul></div>'+
          '<button class="nav-login" data-i18n="nav.login" onclick="openAuth(\'login\')">Accedi</button>'+
          '<button class="nav-cta" data-i18n="nav.signup" onclick="openAuth(\'signup\')">Registrati gratis</button>'+
        '</div>'+
        '<div class="nav-mobile-extra">'+
          '<div class="nav-m-sect">'+
            '<p class="nav-m-head" data-i18n="m.quicknav">Navigazione rapida</p>'+
            '<ul>'+
              '<li><a href="/">Home</a></li>'+
              '<li><a href="/guide" data-i18n="nav.guide">Guide</a></li>'+
              '<li><a href="/percorso" data-i18n="f.aiAssistant">Assistente AI</a></li>'+
              '<li><a href="/voli" data-i18n="m.flights">Voli Sri Lanka</a></li>'+
              '<li><a href="/mappa" data-i18n="nav.map">Mappa</a></li>'+
              '<li><a href="/dashboard" data-i18n="nav.profile">Profilo</a></li>'+
            '</ul>'+
          '</div>'+
          '<div class="nav-m-sect">'+
            '<p class="nav-m-head" data-i18n="f.product">Prodotto</p>'+
            '<ul>'+
              '<li><a href="/guide" data-i18n="nav.guide">Guide</a></li>'+
              '<li><a href="/percorso" data-i18n="f.aiAssistant">Assistente AI</a></li>'+
              '<li><a href="/community" data-i18n="nav.community">Community</a></li>'+
              '<li><a href="/corsi" data-i18n="m.languages">Corsi di Lingue</a></li>'+
              '<li><a href="/opportunita" data-i18n="m.opportunities">Opportunità</a></li>'+
              '<li><a href="/money-transfer">Money Transfer</a></li>'+
              '<li><a href="/cargo" data-i18n="m.cargo">Spedizioni Cargo</a></li>'+
              '<li><a href="/voli" data-i18n="m.flights">Voli Sri Lanka</a></li>'+
              '<li><a href="/travel-sri-lanka">Travel Hub Sri Lanka</a></li>'+
              '<li><a href="/moduli" data-i18n="m.templates">Moduli e Lettere</a></li>'+
              '<li><a href="/guida-conti" data-i18n="m.openaccount">Aprire un Conto</a></li>'+
              '<li><a href="/assegno-unico" data-i18n="m.assegno">Calcol. Assegno Unico</a></li>'+
              '<li><a href="/diritti-inps" data-i18n="m.inps">Verifica Diritti INPS</a></li>'+
              '<li><a href="/riconoscimento-titoli" data-i18n="m.titles">Riconosc. Titoli</a></li>'+
              '<li><a href="/dizionario-medico" data-i18n="m.medical">Dizionario Medico</a></li>'+
              '<li><a href="/mappa" data-i18n="f.mapServices">Mappa servizi</a></li>'+
            '</ul>'+
          '</div>'+
          '<div class="nav-m-sect">'+
            '<p class="nav-m-head" data-i18n="f.company">Azienda</p>'+
            '<ul>'+
              '<li><a href="/chi-siamo" data-i18n="f.about">Chi siamo</a></li>'+
              '<li><a href="/news" data-i18n="nav.news">News</a></li>'+
              '<li><a href="/contatti" data-i18n="f.advertising">Pubblicità</a></li>'+
              '<li><a href="/contatti" data-i18n="f.contact">Contatti</a></li>'+
            '</ul>'+
          '</div>'+
          '<div class="nav-m-sect">'+
            '<p class="nav-m-head" data-i18n="f.account">Account</p>'+
            '<ul>'+
              '<li><a href="/dashboard" data-i18n="m.dashboard">La mia Dashboard</a></li>'+
              '<li><a href="/permesso-tracker" data-i18n="m.tracker">Tracker Permesso</a></li>'+
              '<li><a href="/cv-builder" data-i18n="m.cvbuilder">CV Builder</a></li>'+
              '<li><a href="/documenti" data-i18n="m.docs">Archivio Documenti</a></li>'+
              '<li><a href="/abbonamenti" data-i18n="f.subscriptions">Abbonamenti</a></li>'+
            '</ul>'+
          '</div>'+
        '</div>'+
      '</div></nav>';
  }
  function footHTML(){
    return '<footer><div class="footer-inner">'+
      '<div class="footer-brand"><a href="/" class="nav-logo">Easy <span class="accent">Italia</span> Hub</a><p class="footer-tag" data-i18n="f.tag"></p></div>'+
      '<div class="footer-col"><h4 data-i18n="f.product">Prodotto</h4><ul>'+
        '<li><a href="/guide" data-i18n="nav.guide">Guide</a></li><li><a href="/percorso" data-i18n="f.aiAssistant">Assistente AI</a></li><li><a href="/community" data-i18n="nav.community">Community</a></li><li><a href="/corsi" data-i18n="m.languages">Corsi di Lingue</a></li><li><a href="/opportunita" data-i18n="m.opportunities">Opportunità</a></li><li><a href="/money-transfer">Money Transfer</a></li><li><a href="/cargo" data-i18n="m.cargo">Spedizioni Cargo</a></li><li><a href="/voli" data-i18n="m.flights">Voli Sri Lanka</a></li><li><a href="/travel-sri-lanka">Travel Hub Sri Lanka</a></li><li><a href="/moduli" data-i18n="m.templates">Moduli e Lettere</a></li><li><a href="/guida-conti" data-i18n="m.openaccount">Aprire un Conto</a></li><li><a href="/assegno-unico" data-i18n="m.assegno">Calcolatore Assegno Unico</a></li><li><a href="/diritti-inps" data-i18n="m.inps">Verifica Diritti INPS</a></li><li><a href="/riconoscimento-titoli" data-i18n="m.titles">Riconoscimento Titoli</a></li><li><a href="/dizionario-medico" data-i18n="m.medical">Dizionario Medico IT-SI</a></li><li><a href="/mappa" data-i18n="f.mapServices">Mappa servizi</a></li></ul></div>'+
      '<div class="footer-col"><h4 data-i18n="f.company">Azienda</h4><ul>'+
        '<li><a href="/chi-siamo" data-i18n="f.about">Chi siamo</a></li><li><a href="/news" data-i18n="nav.news">News</a></li><li><a href="/contatti" data-i18n="f.advertising">Pubblicità</a></li><li><a href="/contatti" data-i18n="f.contact">Contatti</a></li></ul></div>'+
      '<div class="footer-col"><h4 data-i18n="f.account">Account</h4><ul>'+
        '<li><a href="/dashboard" data-i18n="m.dashboard">La mia Dashboard</a></li><li><a href="/permesso-tracker" data-i18n="m.tracker">Tracker Permesso</a></li><li><a href="/cv-builder" data-i18n="m.cvbuilder">CV Builder</a></li><li><a href="/documenti" data-i18n="m.docs">Archivio Documenti</a></li><li><a href="/percorso" data-i18n="nav.login">Accedi</a></li><li><a href="/percorso" data-i18n="f.register">Registrati</a></li><li><a href="/abbonamenti" data-i18n="f.subscriptions">Abbonamenti</a></li></ul></div>'+
      '</div><div class="footer-bottom"><p class="footer-copy" data-i18n="f.copy"></p>'+
      '<nav class="footer-legal" aria-label="Note legali"><a href="/privacy" data-i18n="f.privacy">Privacy Policy</a><a href="/cookie" data-i18n="f.cookie">Cookie Policy</a><a href="/termini" data-i18n="f.terms">Termini di Servizio</a><a href="/note-legali" data-i18n="f.legal">Note legali</a></nav></div></footer>';
  }
  function applyLang(l){
    if(!I18N[l])l='it'; lang=l; const d=Object.assign({},I18N[l],(window.EIH_I18N_EXTRA||{})[l]||{});
    document.documentElement.lang=l;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(d[k]!=null)el.textContent=d[k];});
    document.querySelectorAll('[data-i18n-html]').forEach(el=>{const k=el.getAttribute('data-i18n-html');if(d[k]!=null)el.innerHTML=d[k];});
    const lf=document.getElementById('lang-flag'),lc=document.getElementById('lang-code');
    if(lf)lf.textContent=LANG_META[l].flag; if(lc)lc.textContent=LANG_META[l].code;
    document.querySelectorAll('#lang-menu button').forEach(b=>b.setAttribute('aria-current',b.getAttribute('onclick').includes("'"+l+"'")?'true':'false'));
    try{localStorage.setItem('eih-lang',l);}catch(e){}
  }

  // expose API
  const EIH={
    setLang(l){applyLang(l);EIH.closeLang();},
    toggleLang(e){if(e)e.stopPropagation();const m=document.getElementById('lang-menu'),b=document.getElementById('lang-btn');const o=!m.classList.contains('open');m.classList.toggle('open',o);b.setAttribute('aria-expanded',o);},
    closeLang(){const m=document.getElementById('lang-menu');if(m){m.classList.remove('open');document.getElementById('lang-btn').setAttribute('aria-expanded','false');}},
    toggleMenu(){const b=document.getElementById('nav-toggle'),p=document.getElementById('nav-collapse');const o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o);p.classList.toggle('open',o);}
  };
  window.EIH=EIH;

  // inject nav + footer
  const navHost=document.getElementById('site-nav'); if(navHost)navHost.innerHTML=navHTML();
  const footHost=document.getElementById('site-footer'); if(footHost)footHost.innerHTML=footHTML();

  // inject breadcrumbs on secondary pages
  const BREADCRUMBS={
    'guide':[['Guide','/guide','nav.guide']],
    'community':[['Community','/community','nav.community']],
    'percorso':[['Il Mio Percorso','/percorso','nav.journey']],
    'news':[['News','/news','nav.news']],
    'voli':[['Voli Sri Lanka','/voli','m.flights']],
    'mappa':[['Mappa Servizi','/mappa','f.mapServices']],
    'contatti':[['Contatti','/contatti','nav.contact']],
    'chi-siamo':[['Chi Siamo','/chi-siamo','f.about']],
    'dashboard':[['Dashboard','/dashboard','m.dashboard']],
    'documenti':[['Archivio Documenti','/documenti','m.docs']],
    'permesso-tracker':[['Tracker Permesso','/permesso-tracker','m.tracker']],
    'cv-builder':[['CV Builder','/cv-builder','m.cvbuilder']],
    'cargo':[['Spedizioni Cargo','/cargo','m.cargo']],
    'guida-conti':[['Aprire un Conto','/guida-conti','m.openaccount']],
    'dizionario-medico':[['Dizionario Medico','/dizionario-medico','m.medical']],
    'money-transfer':[['Money Transfer','/money-transfer']],
    'opportunita':[['Opportunità','/opportunita','m.opportunities']],
    'corsi':[['Corsi di Lingue','/corsi','m.languages']],
    'abbonamenti':[['Abbonamenti','/abbonamenti','f.subscriptions']],
    'moduli':[['Moduli e Lettere','/moduli','m.templates']],
    'assegno-unico':[['Assegno Unico','/assegno-unico','m.assegno']],
    'diritti-inps':[['Diritti INPS','/diritti-inps','m.inps']],
    'riconoscimento-titoli':[['Riconoscimento Titoli','/riconoscimento-titoli','m.titles']],
    'travel-sri-lanka':[['Travel Hub Sri Lanka','/travel-sri-lanka']],
    'privacy':[['Privacy Policy','/privacy']],
    'cookie':[['Cookie Policy','/cookie']],
    'termini':[['Termini di Servizio','/termini','f.terms']],
    'note-legali':[['Note Legali','/note-legali','f.legal']]
  };
  if(active&&BREADCRUMBS[active]){
    const trail=BREADCRUMBS[active];
    const items=['<li><a href="/">Home</a></li>'];
    trail.forEach(function(step,i){
      const k=step[2]?' data-i18n="'+step[2]+'"':'';
      if(i===trail.length-1){items.push('<li aria-current="page"'+k+'>'+step[0]+'</li>');}
      else{items.push('<li><a href="'+step[1]+'"'+k+'>'+step[0]+'</a></li>');}
    });
    const bc=document.createElement('nav');
    bc.className='breadcrumb';bc.setAttribute('aria-label','Breadcrumb');
    bc.innerHTML='<ol>'+items.join('')+'</ol>';
    const page=document.querySelector('.page');
    if(page)page.insertBefore(bc,page.firstChild);
  }

  // inject auth modal (only when the page doesn't already define its own — index.html does)
  if(!document.getElementById('auth-modal')){
    const _am=document.createElement('div');
    _am.innerHTML=
      '<div class="modal-overlay" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onclick="if(event.target===this)closeAuth()">'+
      '<div class="modal" style="max-width:420px;position:relative">'+
      '<button class="modal-close" onclick="closeAuth()" aria-label="Chiudi"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'+
      '<div class="modal-head" style="margin-bottom:var(--sp-3)"><h2 class="modal-title" id="auth-title" style="font-size:var(--text-xl)">Bentornato</h2>'+
      '<p class="modal-sub" id="auth-sub">Accedi al tuo account Easy Italia Hub</p></div>'+
      '<form onsubmit="event.preventDefault();eihSubmitAuth();return false;" style="display:flex;flex-direction:column;gap:var(--sp-2)">'+
      '<div id="name-field" style="display:none;flex-direction:column;gap:.4rem"><label for="auth-name" style="font-size:.75rem;color:var(--fg-secondary);font-weight:500">Nome completo</label>'+
      '<input id="auth-name" type="text" class="ch-in" placeholder="Mario Rossi" autocomplete="name"/></div>'+
      '<div style="display:flex;flex-direction:column;gap:.4rem"><label for="auth-email" style="font-size:.75rem;color:var(--fg-secondary);font-weight:500">Email</label>'+
      '<input id="auth-email" type="email" class="ch-in" placeholder="nome@email.com" autocomplete="email" required/></div>'+
      '<div style="display:flex;flex-direction:column;gap:.4rem"><label for="auth-pass" style="font-size:.75rem;color:var(--fg-secondary);font-weight:500">Password</label>'+
      '<input id="auth-pass" type="password" class="ch-in" placeholder="••••••••" autocomplete="current-password" required/></div>'+
      '<button type="submit" class="btn-primary" style="justify-content:center;margin-top:.5rem" id="auth-submit">Accedi</button>'+
      '<p id="auth-error-msg" role="alert" style="color:#e53e3e;font-size:.75rem;text-align:center;min-height:1em;margin-top:.25rem"></p>'+
      '<p id="auth-forgot-row" style="text-align:center;font-size:.75rem;color:var(--fg-muted);margin-top:.1rem">'+
      '<button type="button" class="ad-cta" onclick="triggerPasswordReset()" style="color:var(--fg-muted)">Password dimenticata?</button></p>'+
      '</form>'+
      '<p style="text-align:center;font-size:.75rem;color:var(--fg-muted);margin-top:1rem">'+
      '<span id="auth-switch-text">Non hai un account?</span> '+
      '<button class="ad-cta" id="auth-switch" onclick="switchAuth()">Registrati</button></p>'+
      '</div></div>';
    document.body.appendChild(_am.firstChild);
  }

  // Auth modal logic — exposed as window.* so inline onclick handlers can call them.
  // Guard: index.html defines its own openAuth; this block only runs on secondary pages.
  if(!window.openAuth){
    var _authMode='login',_activeModal=null,_lastFocused=null;
    var _FQ='a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    function _lock(){var sw=innerWidth-document.documentElement.clientWidth;document.body.style.overflow='hidden';if(sw>0)document.body.style.paddingRight=sw+'px';}
    function _unlock(){document.body.style.overflow='';document.body.style.paddingRight='';}
    function _vis(m){return[...m.querySelectorAll(_FQ)].filter(function(el){return el.offsetParent!==null||el===document.activeElement;});}
    window.openModal=function(id,fid){var m=document.getElementById(id);if(!m)return;_lastFocused=document.activeElement;m.classList.add('open');_activeModal=m;_lock();setTimeout(function(){var t=fid&&document.getElementById(fid);(t||_vis(m)[0]||m).focus();},300);};
    window.closeModal=function(id){var m=document.getElementById(id);if(!m||!m.classList.contains('open'))return;m.classList.remove('open');if(_activeModal===m)_activeModal=null;if(!_activeModal)_unlock();if(_lastFocused&&_lastFocused.focus)_lastFocused.focus();};
    window.openAuth=function(mode){_authMode=mode||'login';applyAuthMode();openModal('auth-modal',_authMode==='signup'?'auth-name':'auth-email');};
    window.closeAuth=function(){closeModal('auth-modal');};
    window.switchAuth=function(){_authMode=_authMode==='login'?'signup':'login';applyAuthMode();var el=document.getElementById(_authMode==='signup'?'auth-name':'auth-email');if(el)el.focus();};
    window.applyAuthMode=function(){
      var s=_authMode==='signup';
      var get=function(id){return document.getElementById(id);};
      if(get('auth-title'))get('auth-title').textContent=s?'Crea il tuo account':'Bentornato';
      if(get('auth-sub'))get('auth-sub').textContent=s?'Registrati gratis su Easy Italia Hub':'Accedi al tuo account Easy Italia Hub';
      if(get('auth-submit'))get('auth-submit').textContent=s?'Registrati gratis':'Accedi';
      if(get('name-field'))get('name-field').style.display=s?'flex':'none';
      if(get('auth-pass'))get('auth-pass').setAttribute('autocomplete',s?'new-password':'current-password');
      if(get('auth-switch-text'))get('auth-switch-text').textContent=s?'Hai già un account?':'Non hai un account?';
      if(get('auth-switch'))get('auth-switch').textContent=s?'Accedi':'Registrati';
      if(get('auth-forgot-row'))get('auth-forgot-row').style.display=s?'none':'';
    };
    window.eihSubmitAuth=async function(){
      var email=(document.getElementById('auth-email')||{}).value||'';
      var pass=(document.getElementById('auth-pass')||{}).value||'';
      var name=(document.getElementById('auth-name')||{}).value||'';
      var btn=document.getElementById('auth-submit');
      var errEl=document.getElementById('auth-error-msg');
      if(errEl)errEl.textContent='';
      if(btn){btn.disabled=true;btn.textContent=_authMode==='signup'?'Registrazione…':'Accesso…';}
      var authErr=null,needConfirm=false;
      if(window.EIH_AUTH){
        try{
          await window.EIH_AUTH.ready;
          var res=_authMode==='signup'?await window.EIH_AUTH.signUp(email,pass,{name:name}):await window.EIH_AUTH.signIn(email,pass);
          if(res&&res.error){authErr=res.error;}else if(res&&!res.demo&&res.user&&!res.session){needConfirm=true;}
        }catch(e){authErr=e;}
      }else{try{localStorage.setItem('eih-registered','1');}catch(e){}}
      if(btn){btn.disabled=false;btn.textContent=_authMode==='signup'?'Registrati gratis':'Accedi';}
      if(authErr){
        if(errEl){var msg=(authErr.message||'').toLowerCase();errEl.textContent=_authMode==='signup'?(msg.includes('already')||msg.includes('registered')?'Indirizzo già in uso. Prova ad accedere.':'Registrazione non riuscita. Riprova.'):'Email o password non corretti.';}
        return;
      }
      if(needConfirm){
        var mo=document.querySelector('#auth-modal .modal');
        if(mo)mo.innerHTML='<div style="text-align:center;padding:2rem 1.5rem"><div style="font-size:2.5rem;margin-bottom:1rem">📧</div><h2 style="font-size:1.5rem;margin-bottom:1rem">Controlla la tua email</h2><p style="color:var(--fg-secondary);font-size:.875rem">Abbiamo inviato un link a <strong>'+email+'</strong>. Clicca sul link per attivare il tuo account.</p><button class="btn-primary" style="margin-top:1.5rem;width:100%;justify-content:center" onclick="closeAuth()">OK</button></div>';
        return;
      }
      location.href='/dashboard';
    };
    window.triggerPasswordReset=async function(){
      var emailEl=document.getElementById('auth-email');
      var errEl=document.getElementById('auth-error-msg');
      var email=(emailEl&&emailEl.value||'').trim();
      if(!email){if(errEl)errEl.textContent='Inserisci prima la tua email.';return;}
      var mo=document.querySelector('#auth-modal .modal');
      if(mo)mo.innerHTML='<div style="text-align:center;padding:2rem 1.5rem"><div style="font-size:2.5rem;margin-bottom:1rem">📧</div><h2 style="font-size:1.5rem;margin-bottom:1rem">Controlla la tua email</h2><p style="color:var(--fg-secondary);font-size:.875rem">Se l\'indirizzo è registrato riceverai le istruzioni a breve.</p><button class="btn-primary" style="margin-top:1.5rem;width:100%;justify-content:center" onclick="closeAuth()">OK</button></div>';
      if(window.EIH_AUTH)await window.EIH_AUTH.resetPassword(email).catch(function(){});
    };
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&_activeModal)closeModal(_activeModal.id);});
  }

  // PWA bottom nav (visible only in standalone/installed mode)
  (function(){
    function pwaNav(){
      var pg=document.body.getAttribute('data-page')||'home';
      var tabs=[
        {href:'/',label:'Home',page:'home',icon:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'},
        {href:'/guide',label:'Guide',key:'nav.guide',page:'guide',icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'},
        {href:'/percorso',label:'AI',page:'percorso',icon:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'},
        {href:'/voli',label:'Voli',key:'nav.voli',page:'voli',icon:'<path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>'},
        {href:'/mappa',label:'Mappa',key:'nav.map',page:'mappa',icon:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'},
        {href:'/dashboard',label:'Profilo',key:'nav.profile',page:'dashboard',icon:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'},
      ];
      var html='<nav class="pwa-bnav" aria-label="Navigazione app">';
      tabs.forEach(function(t){
        var isActive=pg===t.page||(pg===''&&t.page==='home');
        html+='<a href="'+t.href+'" class="pbn-item'+(isActive?' pbn-active':'')+'" aria-current="'+(isActive?'page':'false')+'">'
          +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+t.icon+'</svg>'
          +'<span'+(t.key?' data-i18n="'+t.key+'"':'')+'>'+t.label+'</span></a>';
      });
      html+='</nav>';
      var el=document.createElement('div');
      el.innerHTML=html;
      document.body.appendChild(el.firstChild);
    }
    if(document.body) pwaNav(); else document.addEventListener('DOMContentLoaded',pwaNav);

    // iOS meta tags
    if(!document.querySelector('meta[name="apple-mobile-web-app-capable"]')){
      [['apple-mobile-web-app-capable','yes'],['apple-mobile-web-app-status-bar-style','default'],['apple-mobile-web-app-title','Easy Italia']].forEach(function(pair){
        var m=document.createElement('meta');m.name=pair[0];m.content=pair[1];document.head.appendChild(m);
      });
    }
  })();

  // Vercel Speed Insights
  if(!document.querySelector('script[src*="speed-insights"]')){
    const si=document.createElement('script');
    si.defer=true;si.src='/_vercel/speed-insights/script.js';
    document.head.appendChild(si);
  }

  // Google Analytics 4 — replace G-XXXXXXXXXX with your Measurement ID
  (function(){
    var GA_ID='G-13TEJWCKZZ';
    if(!GA_ID||GA_ID==='G-XXXXXXXXXX')return;
    if(document.querySelector('script[src*="googletagmanager.com/gtag"]'))return;
    window.dataLayer=window.dataLayer||[];
    function gtag(){dataLayer.push(arguments);}
    window.gtag=gtag;
    gtag('js',new Date());
    gtag('config',GA_ID,{anonymize_ip:true,cookie_flags:'SameSite=None;Secure'});
    var s=document.createElement('script');s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;
    document.head.appendChild(s);
  })();

  // Travelpayouts Drive (publisher verification + widget engine)
  if(!document.querySelector('script[src*="emrldtp.cc"]')){
    (function(){var s=document.createElement('script');s.async=1;s.src='https://emrldtp.cc/NTQyNTg2.js?t=542586';document.head.appendChild(s);})();
  }
  applyLang(lang);
  document.addEventListener('click',e=>{if(!e.target.closest('.lang-switch'))EIH.closeLang();});
  document.getElementById('nav-collapse')&&document.getElementById('nav-collapse').addEventListener('click',e=>{if(e.target.closest('a'))document.getElementById('nav-collapse').classList.remove('open');});

  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

  // scroll reveal
  (function(){
    const els=[...document.querySelectorAll('.reveal')];
    if(reduce){els.forEach(el=>el.classList.add('in'));return;}
    const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    els.forEach(el=>io.observe(el));
  })();

  // custom cursor
  if(matchMedia('(pointer:fine)').matches){
    const dot=document.getElementById('cursor-dot'),ring=document.getElementById('cursor-ring');
    if(dot&&ring){
      document.body.classList.add('has-cursor');
      let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
      addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';if(reduce)ring.style.transform=dot.style.transform;},{passive:true});
      if(!reduce)(function loop(){rx+=(mx-rx)*0.15;ry+=(my-ry)*0.15;ring.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';requestAnimationFrame(loop);})();
      const HOV='a,button,[role="button"],input,textarea,.icard';
      document.addEventListener('mouseover',e=>{if(e.target.closest(HOV))ring.classList.add('hover');});
      document.addEventListener('mouseout',e=>{if(e.target.closest(HOV))ring.classList.remove('hover');});
    }
  }

  // preloader + wipe (page transitions)
  let firstVisit=true;
  try{firstVisit=!sessionStorage.getItem('eih-loaded');sessionStorage.setItem('eih-loaded','1');}catch(e){}
  const pre=document.getElementById('preloader');
  if(pre){ if(firstVisit){setTimeout(()=>pre.classList.add('done'),reduce?0:300);}else{pre.classList.add('done');} }
  const wipe=document.getElementById('wipe');
  if(wipe){
    if(!firstVisit && !reduce){
      wipe.classList.add('cover');
      requestAnimationFrame(()=>requestAnimationFrame(()=>wipe.classList.remove('cover')));
      setTimeout(()=>wipe.classList.remove('cover'),900);
    }
    document.addEventListener('click',e=>{
      const a=e.target.closest('a');if(!a)return;
      const href=a.getAttribute('href')||'';
      if(a.target==='_blank'||a.hasAttribute('download')||href===''||href.startsWith('#')||href.startsWith('http')||href.startsWith('mailto')||href.startsWith('tel'))return;
      if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      e.preventDefault();if(reduce){location.href=href;return;}wipe.classList.add('cover');setTimeout(()=>{location.href=href;},470);
    });
    const _resetWipe=()=>{wipe.style.transition='none';wipe.classList.remove('cover');requestAnimationFrame(()=>{wipe.style.transition='';});};
    addEventListener('pageshow',e=>{
      if(!e.persisted)return;
      if(pre)pre.classList.add('done');
      _resetWipe();
    });
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&wipe.classList.contains('cover'))setTimeout(_resetWipe,80);});
  }
})();
