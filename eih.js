/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — shared runtime (eih.js)
   Injects nav + footer, handles i18n, lang switch, mobile menu,
   custom cursor, preloader, page-transition wipe, scroll reveal.
   Each page: <body data-page="guide"> + <div id="site-nav"></div>
   + content + <div id="site-footer"></div> + <script src="eih.js">.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const I18N={
    it:{ "nav.guide":"Guide","nav.community":"Community","nav.journey":"Il Mio Percorso","nav.news":"News","nav.map":"Mappa","nav.login":"Accedi","nav.signup":"Registrati gratis",
      "f.tag":"Il punto di riferimento della comunità srilankese in Italia. Guide, AI multilingua, community e servizi — tutto in un unico posto.",
      "f.product":"Prodotto","f.aiAssistant":"Assistente AI","f.mapServices":"Mappa servizi","f.company":"Azienda","f.about":"Chi siamo","f.advertising":"Pubblicità","f.contact":"Contatti","f.account":"Account","f.register":"Registrati","f.subscriptions":"Abbonamenti","f.copy":"© 2026 Easy Italia Hub. Tutti i diritti riservati.","f.privacy":"Privacy Policy","f.cookie":"Cookie Policy","f.terms":"Termini di Servizio","f.legal":"Note legali" },
    en:{ "nav.guide":"Guides","nav.community":"Community","nav.journey":"My Journey","nav.news":"News","nav.map":"Map","nav.login":"Log in","nav.signup":"Sign up free",
      "f.tag":"The reference point for the Sri Lankan community in Italy. Guides, multilingual AI, community and services — all in one place.",
      "f.product":"Product","f.aiAssistant":"AI Assistant","f.mapServices":"Services map","f.company":"Company","f.about":"About us","f.advertising":"Advertising","f.contact":"Contact","f.account":"Account","f.register":"Register","f.subscriptions":"Subscriptions","f.copy":"© 2026 Easy Italia Hub. All rights reserved.","f.privacy":"Privacy Policy","f.cookie":"Cookie Policy","f.terms":"Terms of Service","f.legal":"Legal notice" },
    si:{ "nav.guide":"මාර්ගෝපදේශ","nav.community":"ප්‍රජාව","nav.journey":"මගේ ගමන","nav.news":"පුවත්","nav.map":"සිතියම","nav.login":"පිවිසෙන්න","nav.signup":"නොමිලේ ලියාපදිංචි වන්න",
      "f.tag":"ඉතාලියේ ශ්‍රී ලාංකික ප්‍රජාවේ විශ්වාසනීය මධ්‍යස්ථානය. මාර්ගෝපදේශ, බහුභාෂා AI, ප්‍රජාව සහ සේවා — සියල්ල එක තැනක.",
      "f.product":"නිෂ්පාදනය","f.aiAssistant":"AI සහායක","f.mapServices":"සේවා සිතියම","f.company":"සමාගම","f.about":"අප ගැන","f.advertising":"දැන්වීම්","f.contact":"සම්බන්ධ වන්න","f.account":"ගිණුම","f.register":"ලියාපදිංචි වන්න","f.subscriptions":"දායකත්ව","f.copy":"© 2026 Easy Italia Hub. සියලු හිමිකම් ඇවිරිණි.","f.privacy":"පෞද්ගලිකත්ව ප්‍රතිපත්තිය","f.cookie":"කුකී ප්‍රතිපත්තිය","f.terms":"සේවා කොන්දේසි","f.legal":"නෛතික දැන්වීම" }
  };
  const LANG_META={it:{flag:"🇮🇹",code:"IT"},en:{flag:"🇬🇧",code:"EN"},si:{flag:"🇱🇰",code:"SI"}};
  let lang=(function(){try{return localStorage.getItem('eih-lang')}catch(e){return null}})()||'it';
  if(!I18N[lang])lang='it';
  const active=document.body.getAttribute('data-page')||'';

  function navHTML(){
    return '<nav class="site-nav" aria-label="Navigazione principale">'+
      '<a href="index.html" class="nav-logo">Easy <span class="accent">Italia</span> Hub</a>'+
      '<button class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false" onclick="EIH.toggleMenu()"><span></span><span></span><span></span></button>'+
      '<div class="nav-collapse" id="nav-collapse">'+
        '<ul class="nav-links">'+
          '<li><a href="guide.html" data-i18n="nav.guide"'+(active==='guide'?' class="active"':'')+'>Guide</a></li>'+
          '<li><a href="community.html" data-i18n="nav.community"'+(active==='community'?' class="active"':'')+'>Community</a></li>'+
          '<li><a href="percorso.html" data-i18n="nav.journey"'+(active==='percorso'?' class="active"':'')+'>Il Mio Percorso</a></li>'+
          '<li><a href="news.html" data-i18n="nav.news"'+(active==='news'?' class="active"':'')+'>News</a></li>'+
          '<li><a href="mappa.html" data-i18n="nav.map"'+(active==='mappa'?' class="active"':'')+'>Mappa</a></li>'+
        '</ul>'+
        '<div class="nav-right">'+
          '<div class="lang-switch"><button class="lang-btn" id="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Lingua" onclick="EIH.toggleLang(event)"><span class="lang-flag" id="lang-flag">🇮🇹</span><span class="lang-code" id="lang-code">IT</span><svg class="lang-chevron" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>'+
            '<ul class="lang-menu" id="lang-menu" role="menu"><li><button role="menuitem" onclick="EIH.setLang(\'it\')"><span>🇮🇹</span> Italiano</button></li><li><button role="menuitem" onclick="EIH.setLang(\'en\')"><span>🇬🇧</span> English</button></li><li><button role="menuitem" onclick="EIH.setLang(\'si\')"><span>🇱🇰</span> සිංහල</button></li></ul></div>'+
          '<a href="percorso.html" class="nav-login" data-i18n="nav.login">Accedi</a>'+
          '<a href="percorso.html" class="nav-cta" data-i18n="nav.signup">Registrati gratis</a>'+
        '</div>'+
      '</div></nav>';
  }
  function footHTML(){
    return '<footer><div class="footer-inner">'+
      '<div class="footer-brand"><a href="index.html" class="nav-logo">Easy <span class="accent">Italia</span> Hub</a><p class="footer-tag" data-i18n="f.tag"></p></div>'+
      '<div class="footer-col"><h4 data-i18n="f.product">Prodotto</h4><ul>'+
        '<li><a href="guide.html" data-i18n="nav.guide">Guide</a></li><li><a href="percorso.html" data-i18n="f.aiAssistant">Assistente AI</a></li><li><a href="community.html" data-i18n="nav.community">Community</a></li><li><a href="opportunita.html">Opportunità</a></li><li><a href="money-transfer.html">Money Transfer</a></li><li><a href="mappa.html" data-i18n="f.mapServices">Mappa servizi</a></li></ul></div>'+
      '<div class="footer-col"><h4 data-i18n="f.company">Azienda</h4><ul>'+
        '<li><a href="chi-siamo.html" data-i18n="f.about">Chi siamo</a></li><li><a href="news.html" data-i18n="nav.news">News</a></li><li><a href="contatti.html" data-i18n="f.advertising">Pubblicità</a></li><li><a href="contatti.html" data-i18n="f.contact">Contatti</a></li></ul></div>'+
      '<div class="footer-col"><h4 data-i18n="f.account">Account</h4><ul>'+
        '<li><a href="dashboard.html">La mia Dashboard</a></li><li><a href="permesso-tracker.html">Tracker Permesso</a></li><li><a href="cv-builder.html">CV Builder</a></li><li><a href="documenti.html">Archivio Documenti</a></li><li><a href="percorso.html" data-i18n="nav.login">Accedi</a></li><li><a href="percorso.html" data-i18n="f.register">Registrati</a></li><li><a href="abbonamenti.html" data-i18n="f.subscriptions">Abbonamenti</a></li></ul></div>'+
      '</div><div class="footer-bottom"><p class="footer-copy" data-i18n="f.copy"></p>'+
      '<nav class="footer-legal" aria-label="Note legali"><a href="privacy.html" data-i18n="f.privacy">Privacy Policy</a><a href="cookie.html" data-i18n="f.cookie">Cookie Policy</a><a href="termini.html" data-i18n="f.terms">Termini di Servizio</a><a href="note-legali.html" data-i18n="f.legal">Note legali</a></nav></div></footer>';
  }
  function applyLang(l){
    if(!I18N[l])l='it'; lang=l; const d=I18N[l];
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
  applyLang(lang);
  document.addEventListener('click',e=>{if(!e.target.closest('.lang-switch'))EIH.closeLang();});
  document.getElementById('nav-collapse')&&document.getElementById('nav-collapse').addEventListener('click',e=>{if(e.target.closest('a'))document.getElementById('nav-collapse').classList.remove('open');});

  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

  // scroll reveal
  document.querySelectorAll('.reveal').forEach(()=>{});
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
  if(pre){ if(firstVisit){setTimeout(()=>pre.classList.add('done'),reduce?150:1450);}else{pre.classList.add('done');} }
  const wipe=document.getElementById('wipe');
  if(wipe){
    if(!firstVisit && !reduce){wipe.classList.add('cover');requestAnimationFrame(()=>requestAnimationFrame(()=>wipe.classList.remove('cover')));}
    document.addEventListener('click',e=>{
      const a=e.target.closest('a');if(!a)return;
      const href=a.getAttribute('href')||'';
      if(a.target==='_blank'||a.hasAttribute('download')||href===''||href.startsWith('#')||href.startsWith('http')||href.startsWith('mailto')||href.startsWith('tel'))return;
      if(/\.html(\?|#|$)/.test(href)){e.preventDefault();if(reduce){location.href=href;return;}wipe.classList.add('cover');setTimeout(()=>{location.href=href;},470);}
    });
  }
})();
