/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — shared runtime (eih.js)
   Injects nav + footer, handles i18n, lang switch, mobile menu,
   custom cursor, preloader, page-transition wipe, scroll reveal.
   Each page: <body data-page="guide"> + <div id="site-nav"></div>
   + content + <div id="site-footer"></div> + <script src="eih.js">.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const I18N={
    it:{ "nav.guide":"Guide","nav.community":"Community","nav.courses":"Corsi","nav.journey":"Il Mio Percorso","nav.news":"News","nav.map":"Mappa","nav.contact":"Contattaci","nav.login":"Accedi","nav.signup":"Registrati gratis",
      "nav.voli":"Soldi & Viaggi","nav.profile":"Profilo",
      "wa.title":"Uniti anche su WhatsApp","wa.sub":"Scadenze, novità e opportunità per la comunità srilankese, direttamente dove passi il tuo tempo. Niente spam.","wa.btn":"Unisciti al canale",
      "m.quicknav":"Navigazione rapida","m.flights":"Voli Sri Lanka","m.languages":"Corsi di Lingue","m.esame":"Esame & Badge","m.opportunities":"Opportunità","m.cargo":"Spedizioni Cargo","m.templates":"Moduli e Lettere","m.openaccount":"Aprire un Conto","m.assegno":"Calcol. Assegno Unico","m.inps":"Verifica Diritti INPS","m.titles":"Riconosc. Titoli","m.medical":"Dizionario Medico","m.dashboard":"La mia Dashboard","m.tracker":"Tracker Permesso","m.docs":"Archivio Documenti","m.cvbuilder":"CV Builder",
      "f.tag":"Il punto di riferimento della comunità srilankese in Italia. Guide, AI multilingua, community e servizi — tutto in un unico posto.",
      "f.product":"Prodotto","f.aiAssistant":"Assistente AI","f.mapServices":"Mappa servizi","f.company":"Azienda","f.about":"Chi siamo","f.rete":"Rete & Affiliazioni","f.whatsapp":"Canale WhatsApp","f.advertising":"Sponsorizza","f.contact":"Contatti","f.account":"Account","f.register":"Registrati","f.subscriptions":"Abbonamenti","f.copy":"© 2026 Easy Italia Hub. Tutti i diritti riservati.","f.privacy":"Privacy Policy","f.cookie":"Cookie Policy","f.terms":"Termini di Servizio","f.legal":"Note legali" },
    en:{ "nav.guide":"Guides","nav.community":"Community","nav.courses":"Courses","nav.journey":"My Journey","nav.news":"News","nav.map":"Map","nav.contact":"Contact us","nav.login":"Log in","nav.signup":"Sign up free",
      "nav.voli":"Money & Travel","nav.profile":"Profile",
      "wa.title":"Together on WhatsApp too","wa.sub":"Deadlines, news and opportunities for the Sri Lankan community, right where you spend your time. No spam.","wa.btn":"Join the channel",
      "m.quicknav":"Quick navigation","m.flights":"Sri Lanka Flights","m.languages":"Language Courses","m.esame":"Exam & Badge","m.opportunities":"Opportunities","m.cargo":"Cargo Shipping","m.templates":"Forms & Letters","m.openaccount":"Open a Bank Account","m.assegno":"Assegno Unico Calc.","m.inps":"INPS Rights Check","m.titles":"Qual. Recognition","m.medical":"Medical Dictionary","m.dashboard":"My Dashboard","m.tracker":"Permit Tracker","m.docs":"Document Archive","m.cvbuilder":"CV Builder",
      "f.tag":"The reference point for the Sri Lankan community in Italy. Guides, multilingual AI, community and services — all in one place.",
      "f.product":"Product","f.aiAssistant":"AI Assistant","f.mapServices":"Services map","f.company":"Company","f.about":"About us","f.rete":"Network & Partners","f.whatsapp":"WhatsApp channel","f.advertising":"Sponsor us","f.contact":"Contact","f.account":"Account","f.register":"Register","f.subscriptions":"Subscriptions","f.copy":"© 2026 Easy Italia Hub. All rights reserved.","f.privacy":"Privacy Policy","f.cookie":"Cookie Policy","f.terms":"Terms of Service","f.legal":"Legal notice" },
    si:{ "nav.guide":"මාර්ගෝපදේශ","nav.community":"ප්‍රජාව","nav.courses":"පාඨමාලා","nav.journey":"මගේ ගමන","nav.news":"පුවත්","nav.map":"සිතියම","nav.contact":"අපව අමතන්න","nav.login":"පිවිසෙන්න","nav.signup":"නොමිලේ ලියාපදිංචි වන්න",
      "nav.voli":"මුදල් සහ ගමන්","nav.profile":"පැතිකඩ",
      "wa.title":"WhatsApp හරහාද එකට","wa.sub":"ශ්‍රී ලාංකික ප්‍රජාව සඳහා නියමිත දින, පුවත් සහ අවස්ථා — ඔබ සිටින තැනම. spam නැත.","wa.btn":"නාලිකාවට එක්වන්න",
      "m.quicknav":"ඉක්මන් සොයන","m.flights":"ශ්‍රී ලංකා ගුවන් ගමන්","m.languages":"භාෂා පාඨමාලා","m.esame":"විභාගය සහ බැජ්","m.opportunities":"අවස්ථා","m.cargo":"ගෙවල් ගෙනයාම","m.templates":"ෆෝරම් සහ ලිපි","m.openaccount":"බැංකු ගිණුමක්","m.assegno":"Assegno Unico ගණකය","m.inps":"INPS අයිතිවාසිකම්","m.titles":"සුදුස්සකම් හඳුනාගැනීම","m.medical":"වෛද්‍ය ශබ්දකෝෂය","m.dashboard":"මගේ ඩෑෂ්බෝඩ්","m.tracker":"බලපත්‍ර ලුහුබැඳීම","m.docs":"ලේඛනාගාරය","m.cvbuilder":"CV Builder",
      "f.tag":"ඉතාලියේ ශ්‍රී ලාංකික ප්‍රජාවේ විශ්වාසනීය මධ්‍යස්ථානය. මාර්ගෝපදේශ, බහුභාෂා AI, ප්‍රජාව සහ සේවා — සියල්ල එක තැනක.",
      "f.product":"නිෂ්පාදනය","f.aiAssistant":"AI සහායක","f.mapServices":"සේවා සිතියම","f.company":"සමාගම","f.about":"අප ගැන","f.rete":"ජාලය සහ හවුල්කරුවන්","f.whatsapp":"WhatsApp නාලිකාව","f.advertising":"දැන්වීම්","f.contact":"සම්බන්ධ වන්න","f.account":"ගිණුම","f.register":"ලියාපදිංචි වන්න","f.subscriptions":"දායකත්ව","f.copy":"© 2026 Easy Italia Hub. සියලු හිමිකම් ඇවිරිණි.","f.privacy":"පෞද්ගලිකත්ව ප්‍රතිපත්තිය","f.cookie":"කුකී ප්‍රතිපත්තිය","f.terms":"සේවා කොන්දේසි","f.legal":"නෛතික දැන්වීම" },
    ta:{ "nav.guide":"வழிகாட்டிகள்","nav.community":"சமூகம்","nav.courses":"படிப்புகள்","nav.journey":"என் பயணம்","nav.news":"செய்திகள்","nav.map":"வரைபடம்","nav.contact":"தொடர்பு கொள்ளுங்கள்","nav.login":"உள்நுழைய","nav.signup":"இலவசமாக பதிவு",
      "nav.voli":"பணம் & பயணம்","nav.profile":"சுயவிவரம்",
      "wa.title":"WhatsApp-இலும் இணைந்து","wa.sub":"இலங்கை சமூகத்திற்கான காலக்கெடுக்கள், செய்திகள் மற்றும் வாய்ப்புகள் — நீங்கள் நேரம் செலவிடும் இடத்திலேயே. ஸ்பேம் இல்லை.","wa.btn":"சேனலில் சேருங்கள்",
      "m.quicknav":"விரைவு வழிசெலுத்தல்","m.flights":"இலங்கை விமானங்கள்","m.languages":"மொழி வகுப்புகள்","m.esame":"தேர்வு & பேட்ஜ்","m.opportunities":"வாய்ப்புகள்","m.cargo":"சரக்கு அனுப்புதல்","m.templates":"படிவங்கள் & கடிதங்கள்","m.openaccount":"வங்கி கணக்கு திறக்க","m.assegno":"Assegno Unico கணக்கு","m.inps":"INPS உரிமைகள்","m.titles":"தகுதி அங்கீகாரம்","m.medical":"மருத்துவ அகராதி","m.dashboard":"என் டாஷ்போர்டு","m.tracker":"அனுமதி கண்காணிப்பு","m.docs":"ஆவண காப்பகம்","m.cvbuilder":"CV Builder",
      "f.tag":"இத்தாலியில் இலங்கை சமூகத்தின் நம்பகமான மையம். வழிகாட்டிகள், பன்மொழி AI, சமூகம் மற்றும் சேவைகள் — அனைத்தும் ஒரே இடத்தில்.",
      "f.product":"தயாரிப்பு","f.aiAssistant":"AI உதவியாளர்","f.mapServices":"சேவை வரைபடம்","f.company":"நிறுவனம்","f.about":"எங்களைப் பற்றி","f.rete":"வலையமைப்பு & பங்குதாரர்கள்","f.whatsapp":"WhatsApp சேனல்","f.advertising":"விளம்பரம்","f.contact":"தொடர்பு","f.account":"கணக்கு","f.register":"பதிவு செய்ய","f.subscriptions":"சந்தாக்கள்","f.copy":"© 2026 Easy Italia Hub. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.","f.privacy":"தனியுரிமைக் கொள்கை","f.cookie":"குக்கீ கொள்கை","f.terms":"சேவை விதிமுறைகள்","f.legal":"சட்டக் குறிப்பு" }
  };
  const LANG_META={it:{flag:"🇮🇹",code:"IT"},en:{flag:"🇬🇧",code:"EN"},si:{flag:"🇱🇰",code:"SI"},ta:{flag:"🇱🇰",code:"TA"}};
  let lang=(function(){try{return localStorage.getItem('eih-lang')}catch(e){return null}})()||'it';
  if(!I18N[lang])lang='it';
  const active=document.body.getAttribute('data-page')||'';

  function navSub(items){
    return '<button type="button" class="nav-sub-btn" aria-expanded="false" aria-label="Sottomenu" tabindex="-1"><svg class="nav-chevron" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>'+
      '<div class="nav-sub" role="menu">'+items.map(function(it){
        return '<a role="menuitem" href="'+it[0]+'"'+(it[1]?' data-i18n="'+it[1]+'"':'')+'>'+it[2]+'</a>';
      }).join('')+'</div>';
  }
  function navLink(key,href,i18n,label,sub){
    return '<li class="nav-item'+(sub?' nav-has-sub':'')+'"><a href="'+href+'" data-i18n="'+i18n+'"'+(active===key?' class="active"':'')+'>'+label+'</a>'+(sub?navSub(sub):'')+'</li>';
  }
  function navHTML(){
    return '<nav class="site-nav" aria-label="Navigazione principale">'+
      '<a href="/" class="nav-logo"><img src="/assets/img/logo-symbol.jpg" alt="" class="nav-logo-img" style="height:36px;width:auto;display:block;flex-shrink:0"><span class="nav-logo-txt">Easy <span class="accent">Italia</span> Hub</span></a>'+
      '<button class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false" onclick="EIH.toggleMenu()"><span></span><span></span><span></span></button>'+
      '<div class="nav-collapse" id="nav-collapse">'+
        '<ul class="nav-links">'+
          navLink('guide','/guide','nav.guide','Guide',[['/guide','','Guide burocratiche'],['/moduli','m.templates','Moduli e Lettere'],['/guida-conti','m.openaccount','Aprire un Conto'],['/assegno-unico','m.assegno','Calcol. Assegno Unico'],['/diritti-inps','m.inps','Verifica Diritti INPS'],['/riconoscimento-titoli','m.titles','Riconosc. Titoli'],['/dizionario-medico','m.medical','Dizionario Medico']])+
          navLink('community','/community','nav.community','Community',[['/community','nav.community','Community'],['/esame','m.esame','Esame & Badge'],['/opportunita','m.opportunities','Opportunità'],['/rete','f.rete','Rete & Affiliazioni'],['/chi-siamo','f.about','Chi siamo']])+
          navLink('corsi','/corsi','nav.courses','Corsi')+
          navLink('percorso','/percorso','nav.journey','Il Mio Percorso',[['/percorso','nav.journey','Il Mio Percorso'],['/dashboard','m.dashboard','La mia Dashboard'],['/permesso-tracker','m.tracker','Tracker Permesso'],['/cv-builder','m.cvbuilder','CV Builder'],['/documenti','m.docs','Archivio Documenti']])+
          navLink('news','/news','nav.news','News',[['/news','','Tutte le news'],['/news?cat=leggi','','Leggi e decreti'],['/news?cat=scadenze','','Scadenze'],['/news?cat=opportunita','','Opportunità'],['/news?cat=lavoro','','Lavoro'],['/news?cat=casa','','Casa']])+
          navLink('voli','/voli','nav.voli','Voli',[['/voli','m.flights','Voli Sri Lanka'],['/cargo','m.cargo','Spedizioni Cargo'],['/travel-sri-lanka','','Travel Hub Sri Lanka'],['/money-transfer','','Money Transfer']])+
          navLink('mappa','/mappa','nav.map','Mappa')+
          navLink('contatti','/contatti','nav.contact','Contattaci')+
        '</ul>'+
        '<div class="nav-right">'+
          '<a href="/cerca" class="nav-search-btn" aria-label="Cerca" title="Cerca"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></a>'+
          '<div class="lang-switch"><button class="lang-btn" id="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Lingua" onclick="EIH.toggleLang(event)"><span class="lang-flag" id="lang-flag">🇮🇹</span><span class="lang-code" id="lang-code">IT</span><svg class="lang-chevron" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>'+
            '<ul class="lang-menu" id="lang-menu" role="menu"><li><button role="menuitem" onclick="EIH.setLang(\'it\')"><span>🇮🇹</span> Italiano</button></li><li><button role="menuitem" onclick="EIH.setLang(\'en\')"><span>🇬🇧</span> English</button></li><li><button role="menuitem" onclick="EIH.setLang(\'si\')"><span>🇱🇰</span> සිංහල</button></li><li><button role="menuitem" onclick="EIH.setLang(\'ta\')"><span>🇱🇰</span> தமிழ்</button></li></ul></div>'+
          '<button class="nav-login" data-i18n="nav.login" onclick="location.href=\'/registrati?mode=login\'">Accedi</button>'+
          '<button class="nav-cta" data-i18n="nav.signup" onclick="location.href=\'/registrati\'">Registrati gratis</button>'+
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
              '<li><a href="/esame" data-i18n="m.esame">Esame &amp; Badge</a></li>'+
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
              '<li><a href="/rete" data-i18n="f.rete">Rete &amp; Affiliazioni</a></li>'+
              '<li><a href="/news" data-i18n="nav.news">News</a></li>'+
              '<li><a href="/sponsorizza" data-i18n="f.advertising">Sponsorizza</a></li>'+
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
              
            '</ul>'+
          '</div>'+
        '</div>'+
      '</div></nav>';
  }
  function footHTML(){
    return '<footer><div class="footer-inner">'+
      '<div class="footer-brand"><a href="/" style="text-decoration:none;display:inline-block"><img src="/assets/img/logo-symbol.jpg" alt="" style="height:80px;width:auto;display:block;margin-bottom:6px"><span style="display:block;font-family:\'Clash Grotesk\',\'Arial Black\',Impact,sans-serif;font-size:13px;font-weight:900;color:#1a2744;letter-spacing:3px">EASY ITALIA HUB</span><span style="display:block;font-size:9px;color:#4a5a72;letter-spacing:5px;margin-top:3px">GUIDES · AI · COMMUNITY</span></a><p class="footer-tag" data-i18n="f.tag"></p><a data-eih-wa class="footer-wa" style="display:inline-flex;align-items:center;gap:8px;margin-top:10px;padding:9px 15px;border-radius:99px;background:#25D366;color:#08351c;font-weight:700;font-size:13px;text-decoration:none"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.32-1.95 1.36-.5.05-.97.24-3.28-.68-2.77-1.09-4.55-3.9-4.69-4.08-.14-.19-1.13-1.5-1.13-2.86 0-1.36.71-2.03.97-2.31.24-.26.53-.32.71-.32.18 0 .36 0 .51.01.16.01.39-.06.6.46.24.55.82 1.91.89 2.05.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.37-.42.49-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.19-.21.71-.83.9-1.11.19-.28.37-.23.62-.14.26.09 1.64.77 1.92.91.28.14.47.21.53.32.07.12.07.66-.17 1.34Z"/></svg><span data-i18n="f.whatsapp">Canale WhatsApp</span></a></div>'+
      '<div class="footer-col"><h4 data-i18n="f.product">Prodotto</h4><ul>'+
        '<li><a href="/guide" data-i18n="nav.guide">Guide</a></li><li><a href="/percorso" data-i18n="f.aiAssistant">Assistente AI</a></li><li><a href="/community" data-i18n="nav.community">Community</a></li><li><a href="/corsi" data-i18n="m.languages">Corsi di Lingue</a></li><li><a href="/opportunita" data-i18n="m.opportunities">Opportunità</a></li><li><a href="/money-transfer">Money Transfer</a></li><li><a href="/cargo" data-i18n="m.cargo">Spedizioni Cargo</a></li><li><a href="/voli" data-i18n="m.flights">Voli Sri Lanka</a></li><li><a href="/travel-sri-lanka">Travel Hub Sri Lanka</a></li><li><a href="/moduli" data-i18n="m.templates">Moduli e Lettere</a></li><li><a href="/guida-conti" data-i18n="m.openaccount">Aprire un Conto</a></li><li><a href="/assegno-unico" data-i18n="m.assegno">Calcolatore Assegno Unico</a></li><li><a href="/diritti-inps" data-i18n="m.inps">Verifica Diritti INPS</a></li><li><a href="/riconoscimento-titoli" data-i18n="m.titles">Riconoscimento Titoli</a></li><li><a href="/dizionario-medico" data-i18n="m.medical">Dizionario Medico IT-SI</a></li><li><a href="/mappa" data-i18n="f.mapServices">Mappa servizi</a></li></ul></div>'+
      '<div class="footer-col"><h4 data-i18n="f.company">Azienda</h4><ul>'+
        '<li><a href="/chi-siamo" data-i18n="f.about">Chi siamo</a></li><li><a href="/rete" data-i18n="f.rete">Rete &amp; Affiliazioni</a></li><li><a href="/news" data-i18n="nav.news">News</a></li><li><a href="/sponsorizza" data-i18n="f.advertising">Sponsorizza</a></li><li><a href="/contatti" data-i18n="f.contact">Contatti</a></li></ul></div>'+
      '<div class="footer-col"><h4 data-i18n="f.account">Account</h4><ul>'+
        '<li><a href="/dashboard" data-i18n="m.dashboard">La mia Dashboard</a></li><li><a href="/permesso-tracker" data-i18n="m.tracker">Tracker Permesso</a></li><li><a href="/cv-builder" data-i18n="m.cvbuilder">CV Builder</a></li><li><a href="/documenti" data-i18n="m.docs">Archivio Documenti</a></li><li><a href="/percorso" data-i18n="nav.login">Accedi</a></li><li><a href="/percorso" data-i18n="f.register">Registrati</a></li></ul></div>'+
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
  if(navHost){
    function closeSubs(except){navHost.querySelectorAll('.nav-has-sub.sub-open').forEach(function(x){if(x===except)return;x.classList.remove('sub-open');var b=x.querySelector('.nav-sub-btn');if(b)b.setAttribute('aria-expanded','false');});}
    navHost.addEventListener('click',function(e){var b=e.target.closest('.nav-sub-btn');if(!b)return;e.preventDefault();var li=b.closest('.nav-has-sub'),o=!li.classList.contains('sub-open');closeSubs(li);li.classList.toggle('sub-open',o);b.setAttribute('aria-expanded',o);});
    document.addEventListener('click',function(e){if(!e.target.closest('.nav-has-sub'))closeSubs();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSubs();});
  }
  const footHost=document.getElementById('site-footer'); if(footHost)footHost.innerHTML=footHTML();

  // WhatsApp: link unico per tutto il sito. Imposta window.EIH_WHATSAPP_URL
  // con il link reale del canale (es. https://whatsapp.com/channel/XXXX) per
  // attivarlo ovunque; finché non è impostato, i pulsanti rimandano ai Contatti.
  (function(){
    var WA=(window.EIH_WHATSAPP_URL||'').trim()||'https://whatsapp.com/channel/0029VbDGIikE50Uc7ehitN38';
    var ext=/^https?:/i.test(WA);
    document.querySelectorAll('[data-eih-wa]').forEach(function(a){
      a.setAttribute('href',WA);
      if(ext){a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');}
    });
  })();

  // stato auth nella nav (Accedi/Registrati → Dashboard/Esci se loggato)
  if(!window.__eihNavAuth&&!document.querySelector('script[src*="eih-navauth"]')){
    var _na=document.createElement('script');_na.src='/assets/eih-navauth.js';_na.defer=true;document.body.appendChild(_na);}

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
    'rete':[['Rete & Affiliazioni','/rete','f.rete']],
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
    'note-legali':[['Note Legali','/note-legali','f.legal']],
    'fisco':[['Fisco e Tasse','/fisco']],
    'scuola':[['Scuola Italiana','/scuola']],
    'emergenze':[['Numeri di Emergenza','/emergenze']]
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
      '<div id="auth-turnstile" style="display:none;margin-top:.2rem"></div>'+
      '<button type="submit" class="btn-primary" style="justify-content:center;margin-top:.5rem" id="auth-submit">Accedi</button>'+
      '<p id="auth-error-msg" role="alert" style="color:#e53e3e;font-size:.75rem;text-align:center;min-height:1em;margin-top:.25rem"></p>'+
      '<p id="auth-forgot-row" style="text-align:center;font-size:.75rem;color:var(--fg-muted);margin-top:.1rem">'+
      '<button type="button" class="ad-cta" onclick="triggerPasswordReset()" style="color:var(--fg-muted)">Password dimenticata?</button></p>'+
      '</form>'+
      '<div style="display:flex;align-items:center;gap:.6rem;margin:1rem 0;color:var(--fg-muted);font-size:.75rem">'+
      '<span style="flex:1;height:1px;background:var(--border,#e2e8f0)"></span>oppure<span style="flex:1;height:1px;background:var(--border,#e2e8f0)"></span></div>'+
      '<button type="button" id="auth-google" onclick="eihGoogleAuth()" style="display:flex;align-items:center;justify-content:center;gap:.6rem;width:100%;min-height:44px;border:1px solid var(--border,#e2e8f0);border-radius:12px;background:var(--bg,#fff);color:var(--fg-primary,#1a202c);font-weight:600;font-size:.85rem;cursor:pointer">'+
      '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>'+
      '<span>Continua con Google</span></button>'+
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
      var tsBox=get('auth-turnstile');
      if(tsBox&&window.EIH_AUTH&&window.EIH_AUTH.captchaEnabled&&window.EIH_AUTH.captchaEnabled()){
        tsBox.style.display=s?'block':'none';
        if(s)window.EIH_AUTH.renderCaptcha(tsBox);
      }else if(tsBox){tsBox.style.display='none';}
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
          var res;
          if(_authMode==='signup'){
            var captchaToken='';
            if(window.EIH_AUTH.captchaEnabled&&window.EIH_AUTH.captchaEnabled()){
              captchaToken=window.EIH_AUTH.getCaptchaToken();
              if(!captchaToken){if(errEl)errEl.textContent='Completa la verifica anti-bot.';if(btn){btn.disabled=false;btn.textContent='Registrati gratis';}return;}
            }
            res=await window.EIH_AUTH.signUp(email,pass,{name:name},captchaToken);
          }else{res=await window.EIH_AUTH.signIn(email,pass);}
          if(res&&res.error){authErr=res.error;}else if(res&&!res.demo&&res.user&&!res.session){needConfirm=true;}
        }catch(e){authErr=e;}
        if(authErr&&window.EIH_AUTH.resetCaptcha)window.EIH_AUTH.resetCaptcha();
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
    window.eihGoogleAuth=async function(){
      var btn=document.getElementById('auth-google');
      var errEl=document.getElementById('auth-error-msg');
      if(errEl)errEl.textContent='';
      if(btn){btn.disabled=true;btn.style.opacity='.6';}
      try{
        if(window.EIH_AUTH){
          await window.EIH_AUTH.ready;
          var res=await window.EIH_AUTH.signInWithGoogle(location.origin+'/dashboard');
          if(res&&res.demo){if(errEl)errEl.textContent='Accesso Google non disponibile in modalità demo.';}
          else if(res&&res.error){if(errEl)errEl.textContent='Accesso con Google non riuscito. Riprova.';}
          else return;
        }
      }catch(e){if(errEl)errEl.textContent='Accesso con Google non riuscito. Riprova.';}
      if(btn){btn.disabled=false;btn.style.opacity='';}
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

  // Google Analytics 4
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
  if(!document.getElementById('chat-btn')){var _cw=document.createElement('script');_cw.src='/eih-chat-widget.js';document.head.appendChild(_cw);}
  if(!window.__eihSearch){var _se=document.createElement('script');_se.src='/eih-search.js';document.head.appendChild(_se);}
  if(!window.__eihVfx){var _vf=document.createElement('script');_vf.src='/assets/eih-vfx.js';_vf.defer=true;document.head.appendChild(_vf);}
})();
/* ── PWA: pulsante "Installa l'app" quando il browser lo consente ── */
(function(){
  var deferred=null;
  addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();deferred=e;
    if(document.getElementById('eih-install'))return;
    var b=document.createElement('button');
    b.id='eih-install';b.textContent='📲 Installa l\'app';
    b.style.cssText='position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);z-index:398;padding:.6rem 1.3rem;border-radius:999px;border:1px solid var(--border-bright);background:var(--bg-elevated);color:var(--ink);font-family:inherit;font-size:.85rem;font-weight:600;cursor:pointer;box-shadow:0 10px 30px rgba(20,17,14,.18)';
    b.onclick=function(){if(!deferred)return;deferred.prompt();deferred.userChoice.then(function(){b.remove();deferred=null;});};
    document.body.appendChild(b);
    setTimeout(function(){if(b.parentNode)b.remove();},20000);
  });
})();

