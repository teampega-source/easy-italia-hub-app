/* Easy Italia Hub — standalone AI chat widget.
   Injected by eih.js on all pages (guard: checks #chat-btn first). */
(function(){
  if(document.getElementById('chat-btn'))return;

  var CHAT_I18N={
    it:{name:'Assistente Easy Italia',status:'Online ora',ainote:'🤖 Stai parlando con un\'intelligenza artificiale. Le risposte possono contenere errori: verifica sempre le fonti ufficiali.',welcome1:'Ciao! Sono l\'assistente di Easy Italia Hub. Come posso aiutarti oggi?',welcome2:'Posso risponderti in italiano, inglese, <span lang="si">සිංහල</span> o <span lang="ta">தமிழ்</span>.',now:'Ora',sug1:'Permesso di soggiorno',sug2:'SPID',sug3:'Money transfer',sug4:'Codice fiscale',q1:'Come si rinnova il permesso di soggiorno?',q2:'Come si ottiene lo SPID?',q3:'Come funziona il money transfer verso lo Sri Lanka?',q4:'Come si richiede il codice fiscale?',placeholder:'Scrivi un messaggio…',offline:'Al momento non riesco a contattare l\'assistente. Riprova tra poco — intanto puoi esplorare le guide del sito.',m1:'Ciao! 👋',m2:'Posso aiutarti?',mAria:'Apri l\'assistente AI'},
    en:{name:'Easy Italia Assistant',status:'Online now',ainote:'🤖 You are chatting with an artificial intelligence. Answers may contain errors: always check official sources.',welcome1:'Hi! I\'m the Easy Italia Hub assistant. How can I help you today?',welcome2:'I can reply in Italian, English, <span lang="si">සිංහල</span> or <span lang="ta">தமிழ்</span>.',now:'Now',sug1:'Residence permit',sug2:'SPID',sug3:'Money transfer',sug4:'Tax code',q1:'How do I renew the residence permit?',q2:'How do I get a SPID?',q3:'How does money transfer to Sri Lanka work?',q4:'How do I get a tax code (codice fiscale)?',placeholder:'Type a message…',offline:'I can\'t reach the assistant right now. Please try again shortly — meanwhile you can explore the site guides.',m1:'Hi! 👋',m2:'Need a hand?',mAria:'Open the AI assistant'},
    si:{name:'Easy Italia සහායක',status:'දැන් සබැඳිව',ainote:'🤖 ඔබ කතා කරන්නේ කෘත්‍රිම බුද්ධියක් සමඟයි. පිළිතුරුවල දෝෂ තිබිය හැක: නිල මූලාශ්‍ර පරීක්ෂා කරන්න.',welcome1:'ආයුබෝවන්! මම Easy Italia Hub සහායකයා. අද මට ඔබට කෙසේ උදව් කළ හැකිද?',welcome2:'මට ඉතාලි, ඉංග්‍රීසි, <span lang="si">සිංහල</span> හෝ <span lang="ta">தமிழ்</span> භාෂාවෙන් පිළිතුරු දිය හැක.',now:'දැන්',sug1:'පදිංචි බලපත්‍රය',sug2:'SPID',sug3:'මුදල් හුවමාරුව',sug4:'බදු කේතය',q1:'පදිංචි බලපත්‍රය අලුත් කරන්නේ කෙසේද?',q2:'SPID ලබා ගන්නේ කෙසේද?',q3:'ශ්‍රී ලංකාවට මුදල් යැවීම ක්‍රියා කරන්නේ කෙසේද?',q4:'බදු කේතය (codice fiscale) ලබා ගන්නේ කෙසේද?',placeholder:'පණිවිඩයක් ටයිප් කරන්න…',offline:'මට මේ මොහොතේ සහායකයා වෙත සම්බන්ධ විය නොහැක. මඳ වේලාවකින් නැවත උත්සාහ කරන්න.',m1:'ආයුබෝවන්! 👋',m2:'උදව් කරන්නද?',mAria:'AI සහායකයා විවෘත කරන්න'},
    ta:{name:'Easy Italia உதவியாளர்',status:'இப்போது ஆன்லைனில்',ainote:'🤖 நீங்கள் செயற்கை நுண்ணறிவுடன் உரையாடுகிறீர்கள். பதில்களில் பிழைகள் இருக்கலாம்: அதிகாரப்பூர்வ ஆதாரங்களைச் சரிபார்க்கவும்.',welcome1:'வணக்கம்! நான் Easy Italia Hub உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்?',welcome2:'என்னால் இத்தாலியன், ஆங்கிலம், <span lang="si">සිංහල</span> அல்லது <span lang="ta">தமிழ்</span> மொழியில் பதிலளிக்க முடியும்.',now:'இப்போது',sug1:'குடியிருப்பு அனுமதி',sug2:'SPID',sug3:'பண பரிமாற்றம்',sug4:'வரி குறியீடு',q1:'குடியிருப்பு அனுமதியை எவ்வாறு புதுப்பிப்பது?',q2:'SPID எவ்வாறு பெறுவது?',q3:'இலங்கைக்கு பண பரிமாற்றம் எவ்வாறு செயல்படுகிறது?',q4:'வரி குறியீடு (codice fiscale) எவ்வாறு பெறுவது?',placeholder:'ஒரு செய்தி தட்டச்சு செய்யுங்கள்…',offline:'இப்போது உதவியாளரை அணுக முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',m1:'வணக்கம்! 👋',m2:'உதவி வேண்டுமா?',mAria:'AI உதவியாளரைத் திறக்கவும்'}
  };

  var lang=(function(){try{return localStorage.getItem('eih-lang')}catch(e){return null}})()||'it';
  function t(k){return(CHAT_I18N[lang]||CHAT_I18N.it)[k]||(CHAT_I18N.it)[k]||'';}

  var style=document.createElement('style');
  style.textContent='#chat-btn{position:fixed;bottom:1.75rem;right:1.75rem;z-index:400;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,var(--blue-deep),var(--blue));display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px var(--blue-glow);transition:transform var(--dur-std) var(--ease-spring),box-shadow var(--dur-std) var(--ease-spring)}#chat-btn:hover{transform:scale(1.08);box-shadow:0 16px 44px rgba(58,123,213,.4)}#chat-btn:active{transform:scale(0.97);transition-duration:var(--dur-micro)}#chat-btn:focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:50%}#chat-btn svg{width:24px;height:24px;fill:#fff;flex-shrink:0}.chat-dot{position:absolute;top:1px;right:1px;width:13px;height:13px;border-radius:50%;background:#3fcf7c;border:2px solid var(--bg-base)}.chat-badge{position:absolute;top:-4px;right:-4px;min-width:19px;height:19px;padding:0 4px;border-radius:var(--radius-full);background:var(--coral);color:#fff;border:2px solid var(--bg-base);font-size:.62rem;font-weight:700;line-height:1;display:none;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}.chat-badge.show{display:flex}#chat-panel{position:fixed;bottom:calc(52px + 1.75rem + .75rem);right:1.75rem;z-index:400;width:356px;height:min(510px,calc(100vh - 3rem));border-radius:22px;overflow:hidden;display:flex;flex-direction:column;background:rgba(255,255,255,0.97);backdrop-filter:blur(32px) saturate(1.6);-webkit-backdrop-filter:blur(32px) saturate(1.6);border:1px solid var(--border-bright);box-shadow:0 32px 80px rgba(20,30,48,.22),0 0 0 1px rgba(255,255,255,.04),inset 0 1px 0 rgba(255,255,255,.07);transform-origin:bottom right;transform:scale(0.88) translateY(14px);opacity:0;pointer-events:none;transition:transform var(--dur-std) var(--ease-spring),opacity var(--dur-micro) var(--ease-enter)}#chat-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}.ch-hdr{flex-shrink:0;padding:var(--sp-2) var(--sp-2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.75rem;background:rgba(255,255,255,.025)}.ch-av{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--blue-deep),var(--blue));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px var(--blue-glow)}.ch-av svg{width:18px;height:18px;fill:#fff}.ch-name{font-family:"Clash Grotesk",sans-serif;font-size:var(--text-base);font-weight:500;color:var(--ink)}.ch-status{font-size:var(--text-xs);color:#1f9d55;display:flex;align-items:center;gap:.3rem;margin-top:.1rem;letter-spacing:.04em}.ch-status::before{content:"";width:5px;height:5px;border-radius:50%;background:#1f9d55;flex-shrink:0}.ch-x{margin-left:auto;background:none;border:none;cursor:pointer;width:30px;height:30px;border-radius:8px;min-height:30px;display:flex;align-items:center;justify-content:center;color:var(--fg-muted);transition:background var(--dur-micro),color var(--dur-micro)}.ch-x:hover{background:var(--surface-hover);color:var(--ink)}.ch-x:focus-visible{outline:2px solid var(--blue);outline-offset:2px}.ch-x svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}.ch-ai-note{flex-shrink:0;padding:.4rem var(--sp-2);font-size:.62rem;line-height:1.45;color:var(--fg-muted);background:var(--surface);border-bottom:1px solid var(--border)}.ch-msgs{flex:1;overflow-y:auto;padding:var(--sp-2) var(--sp-2);display:flex;flex-direction:column;gap:.7rem;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.06) transparent}.ch-msgs::-webkit-scrollbar{width:3px}.ch-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.07);border-radius:3px}.msg{display:flex;flex-direction:column;max-width:87%}.msg.bot{align-self:flex-start}.msg.usr{align-self:flex-end;align-items:flex-end}.bubble{padding:.65rem .95rem;border-radius:14px;font-size:var(--text-sm);line-height:1.55;font-weight:300;animation:bubbleIn var(--dur-std) var(--ease-spring) both}.msg.bot .bubble{background:var(--surface-hover);border:1px solid var(--border);color:var(--fg);border-bottom-left-radius:4px}.msg.usr .bubble{background:linear-gradient(135deg,var(--blue-deep),var(--blue));color:#fff;border-bottom-right-radius:4px}.ts{font-size:.58rem;color:var(--fg-muted);margin-top:.25rem;padding:0 .15rem}.bubble.typing{display:inline-flex;gap:4px;align-items:center;padding:.7rem .9rem}.bubble.typing span{width:6px;height:6px;border-radius:50%;background:var(--fg-muted);animation:typingDot 1.2s ease-in-out infinite}.bubble.typing span:nth-child(2){animation-delay:.18s}.bubble.typing span:nth-child(3){animation-delay:.36s}@keyframes typingDot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}@keyframes bubbleIn{from{opacity:0;transform:translateY(6px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}.ch-sugs{flex-shrink:0;padding:.45rem var(--sp-2) .6rem;display:flex;flex-wrap:wrap;gap:.4rem}.sug{padding:.32rem .75rem;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:400;color:var(--fg);background:var(--surface);border:1px solid var(--border);cursor:pointer;white-space:nowrap;min-height:30px;transition:background var(--dur-micro) var(--ease-enter),border-color var(--dur-micro),transform var(--dur-std) var(--ease-spring)}.sug:hover{background:rgba(58,123,213,.18);border-color:rgba(58,123,213,.4);transform:translateY(-1px)}.sug:active{transform:scale(0.97);transition-duration:var(--dur-micro)}.sug:focus-visible{outline:2px solid var(--blue);outline-offset:2px;border-radius:var(--radius-full)}.ch-row{flex-shrink:0;padding:.85rem var(--sp-2);border-top:1px solid var(--border);display:flex;gap:.55rem;align-items:center;background:rgba(255,255,255,.015)}.ch-in{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:.58rem .9rem;font-size:var(--text-sm);color:var(--ink);font-family:"Satoshi",sans-serif;outline:none;min-height:36px;transition:border-color var(--dur-micro) var(--ease-enter)}.ch-in::placeholder{color:var(--fg-muted)}.ch-in:focus{border-color:rgba(58,123,213,.5)}.ch-send{width:36px;height:36px;border-radius:9px;flex-shrink:0;border:none;cursor:pointer;background:linear-gradient(135deg,var(--blue-deep),var(--blue));display:flex;align-items:center;justify-content:center;transition:opacity var(--dur-micro) var(--ease-enter),transform var(--dur-std) var(--ease-spring);min-height:36px}.ch-send:hover{opacity:.85;transform:scale(1.07)}.ch-send:active{transform:scale(0.97);transition-duration:var(--dur-micro)}.ch-send:focus-visible{outline:2px solid var(--blue);outline-offset:2px}.ch-send svg{width:14px;height:14px;fill:#fff}#eih-mascot{position:fixed;left:1.75rem;bottom:1.75rem;z-index:399;width:62px;height:80px;padding:0;border:none;background:none;cursor:pointer;filter:drop-shadow(0 10px 22px rgba(20,30,48,.28));animation:eihMascotFloat 4.5s ease-in-out infinite;transition:transform var(--dur-std) var(--ease-spring)}#eih-mascot:hover{transform:scale(1.06)}#eih-mascot:active{transform:scale(.95)}#eih-mascot:focus-visible{outline:2px solid var(--blue);outline-offset:4px;border-radius:18px}#eih-mascot svg{width:100%;height:100%;display:block;overflow:visible}.eih-m-eye{transform-box:fill-box;transform-origin:50% 50%;animation:eihMascotBlink 5.5s ease-in-out infinite}.eih-m-arm{transform-box:fill-box;transform-origin:50% 100%;animation:eihMascotWave 3.2s ease-in-out infinite}#eih-mascot.cheer{animation:eihMascotCheer .6s var(--ease-spring)}@keyframes eihMascotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes eihMascotBlink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}@keyframes eihMascotWave{0%,68%,100%{transform:rotate(0)}80%{transform:rotate(-24deg)}90%{transform:rotate(8deg)}}@keyframes eihMascotCheer{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-14px) scale(1.08)}100%{transform:translateY(0) scale(1)}}#eih-mascot-bubble{position:fixed;left:calc(1.75rem + 70px);bottom:calc(1.75rem + 34px);z-index:399;max-width:172px;padding:.55rem .8rem;border-radius:14px;border-bottom-left-radius:4px;background:rgba(255,255,255,.97);backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);border:1px solid var(--border-bright);box-shadow:0 14px 36px rgba(20,30,48,.18);font-size:var(--text-sm);font-weight:300;color:var(--ink);line-height:1.4;opacity:0;transform:translateY(8px) scale(.9);transform-origin:bottom left;pointer-events:none;transition:opacity var(--dur-std) var(--ease-enter),transform var(--dur-std) var(--ease-spring)}#eih-mascot-bubble.show{opacity:1;transform:translateY(0) scale(1)}#eih-mascot-bubble strong{display:block;font-family:"Clash Grotesk",sans-serif;font-weight:500;color:var(--blue-deep)}#eih-mascot-bubble::after{content:"";position:absolute;left:-6px;bottom:10px;width:12px;height:12px;background:rgba(255,255,255,.97);border-left:1px solid var(--border-bright);border-bottom:1px solid var(--border-bright);transform:rotate(45deg)}@media(max-width:640px){#eih-mascot{width:46px;height:60px;left:.85rem;bottom:.85rem}#eih-mascot-bubble{display:none}}@media(prefers-reduced-motion:reduce){#eih-mascot,.eih-m-eye,.eih-m-arm,#eih-mascot.cheer{animation:none}}';
  document.head.appendChild(style);

  var btn=document.createElement('button');
  btn.id='chat-btn';
  btn.title='Apri assistente AI (Ctrl/⌘+J)';
  btn.setAttribute('aria-label','Apri assistente AI — scorciatoia Ctrl/⌘+J');
  btn.setAttribute('aria-expanded','false');
  btn.setAttribute('aria-controls','chat-panel');
  btn.innerHTML='<div class="chat-dot" aria-hidden="true"></div><span class="chat-badge" id="chat-badge" aria-hidden="true"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

  var panel=document.createElement('aside');
  panel.id='chat-panel';
  panel.setAttribute('role','complementary');
  panel.setAttribute('aria-label','Assistente AI Easy Italia');
  panel.setAttribute('aria-live','polite');
  panel.innerHTML='<div class="ch-hdr"><div class="ch-av" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14H11v-2h2zm0-4H11V7h2z"/></svg></div><div><div class="ch-name" id="ch-name"></div><div class="ch-status" role="status" id="ch-status"></div></div><button class="ch-x" id="ch-x" aria-label="Chiudi assistente"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div class="ch-ai-note" id="ch-ainote"></div><div class="ch-msgs" id="ch-msgs" role="log" aria-label="Messaggi"><div class="msg bot"><div class="bubble" id="ch-w1"></div><div class="ts" id="ch-ts1"></div></div><div class="msg bot"><div class="bubble" id="ch-w2"></div><div class="ts" id="ch-ts2"></div></div></div><div class="ch-sugs" role="group" aria-label="Domande suggerite"><button class="sug" data-qi="0" id="sug0"></button><button class="sug" data-qi="1" id="sug1"></button><button class="sug" data-qi="2" id="sug2"></button><button class="sug" data-qi="3" id="sug3"></button></div><div class="ch-row"><label for="ch-in" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Messaggio</label><input class="ch-in" id="ch-in" type="text" autocomplete="off"/><button class="ch-send" id="ch-send" aria-label="Invia"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div>';

  var mascot=document.createElement('button');
  mascot.id='eih-mascot';
  mascot.type='button';
  mascot.setAttribute('aria-controls','chat-panel');
  mascot.innerHTML='<svg viewBox="0 0 62 80" aria-hidden="true"><defs><linearGradient id="eihMg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue)"/><stop offset="1" stop-color="var(--blue-deep)"/></linearGradient></defs><line x1="31" y1="15" x2="31" y2="6" stroke="var(--taupe)" stroke-width="2" stroke-linecap="round"/><circle cx="31" cy="5" r="3.2" fill="var(--gold)"/><rect x="13" y="14" width="36" height="30" rx="12" fill="url(#eihMg)"/><rect x="17" y="19" width="28" height="20" rx="8" fill="#0e2746"/><ellipse class="eih-m-eye" cx="26" cy="29" rx="3" ry="4" fill="#bfe0ff"/><ellipse class="eih-m-eye" cx="36" cy="29" rx="3" ry="4" fill="#bfe0ff"/><path d="M25 34q6 4 12 0" stroke="#7fc6ff" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="20" y="44" width="7.3" height="5" rx="1" fill="#2e9e5b"/><rect x="27.3" y="44" width="7.4" height="5" rx="1" fill="#f4f4f0"/><rect x="34.7" y="44" width="7.3" height="5" rx="1" fill="#d64550"/><rect x="18" y="48" width="26" height="24" rx="10" fill="url(#eihMg)"/><rect x="24" y="55" width="14" height="9" rx="4" fill="#0e2746" opacity=".5"/><g class="eih-m-arm"><rect x="42" y="50" width="6" height="15" rx="3" fill="var(--blue-deep)"/><circle cx="45" cy="50" r="4" fill="var(--gold)"/></g></svg>';

  var bubble=document.createElement('div');
  bubble.id='eih-mascot-bubble';
  bubble.setAttribute('aria-hidden','true');

  document.body.appendChild(btn);
  document.body.appendChild(panel);
  document.body.appendChild(mascot);
  document.body.appendChild(bubble);

  var SUGS=['sug1','sug2','sug3','sug4'];
  var QS=['q1','q2','q3','q4'];
  function applyLang(){
    var d=CHAT_I18N[lang]||CHAT_I18N.it;
    document.getElementById('ch-name').textContent=d.name;
    document.getElementById('ch-status').textContent=d.status;
    document.getElementById('ch-ainote').textContent=d.ainote;
    document.getElementById('ch-w1').textContent=d.welcome1;
    document.getElementById('ch-w2').innerHTML=d.welcome2;
    document.getElementById('ch-ts1').textContent=d.now;
    document.getElementById('ch-ts2').textContent=d.now;
    document.getElementById('ch-in').placeholder=d.placeholder;
    SUGS.forEach(function(k,i){document.getElementById('sug'+i).textContent=d[k];});
    mascot.setAttribute('aria-label',d.mAria);
    bubble.innerHTML='<strong></strong><span></span>';
    bubble.querySelector('strong').textContent=d.m1;
    bubble.querySelector('span').textContent=d.m2;
  }
  applyLang();

  var open=false,chatHistory=[],chatBusy=false,chatUnread=0;
  function setChatUnread(n){
    chatUnread=Math.max(0,n);
    var badge=document.getElementById('chat-badge');
    if(!badge)return;
    badge.textContent=chatUnread>0?String(chatUnread):'';
    badge.classList.toggle('show',chatUnread>0);
  }
  function cheerMascot(){
    mascot.classList.remove('cheer');void mascot.offsetWidth;mascot.classList.add('cheer');
    setTimeout(function(){mascot.classList.remove('cheer');},640);
  }
  function toggleChat(){
    lang=(function(){try{return localStorage.getItem('eih-lang')}catch(e){return null}})()||'it';
    applyLang();
    open=!open;
    panel.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',open);
    bubble.classList.remove('show');
    if(open){setChatUnread(0);cheerMascot();setTimeout(function(){var i=document.getElementById('ch-in');if(i)i.focus();},300);}
  }
  btn.addEventListener('click',toggleChat);
  document.getElementById('ch-x').addEventListener('click',toggleChat);
  mascot.addEventListener('click',toggleChat);
  mascot.addEventListener('mouseenter',function(){if(!open)bubble.classList.add('show');});
  setChatUnread(1);
  setTimeout(function(){if(!open)bubble.classList.add('show');},1400);
  setTimeout(function(){bubble.classList.remove('show');},7200);

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function nowLabel(){return(CHAT_I18N[lang]||CHAT_I18N.it).now||'Ora';}
  function appendMsg(text,type){
    var log=document.getElementById('ch-msgs');
    var d=document.createElement('div');
    d.className='msg '+type;
    var safe=escapeHtml(text).replace(/\n/g,'<br>');
    d.innerHTML='<div class="bubble"></div><div class="ts"></div>';
    d.querySelector('.bubble').innerHTML=safe;
    d.querySelector('.ts').textContent=nowLabel();
    log.appendChild(d);log.scrollTop=log.scrollHeight;
    return d;
  }
  function showTyping(){
    var log=document.getElementById('ch-msgs');
    var d=document.createElement('div');
    d.className='msg bot';d.id='ch-typing';
    d.innerHTML='<div class="bubble typing" aria-label="Sta scrivendo"><span></span><span></span><span></span></div>';
    log.appendChild(d);log.scrollTop=log.scrollHeight;
  }
  function hideTyping(){var t=document.getElementById('ch-typing');if(t)t.remove();}
  async function sendToAgent(text){
    text=(text||'').trim();if(chatBusy||!text)return;
    chatBusy=true;
    appendMsg(text,'usr');
    chatHistory.push({role:'user',content:text});
    showTyping();
    try{
      var r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:chatHistory,lang:lang})});
      if(!r.ok)throw new Error('http '+r.status);
      var data=await r.json();
      hideTyping();
      var reply=(data&&data.reply)?data.reply:'…';
      appendMsg(reply,'bot');
      chatHistory.push({role:'assistant',content:reply});
    }catch(err){
      hideTyping();
      appendMsg((CHAT_I18N[lang]||CHAT_I18N.it).offline,'bot');
    }finally{chatBusy=false;}
  }
  function sendMsg(){var i=document.getElementById('ch-in');var v=i.value;i.value='';sendToAgent(v);}
  document.getElementById('ch-in').addEventListener('keydown',function(e){if(e.key==='Enter')sendMsg();});
  document.getElementById('ch-send').addEventListener('click',sendMsg);
  document.querySelectorAll('.sug[data-qi]').forEach(function(el,i){
    el.addEventListener('click',function(){sendToAgent((CHAT_I18N[lang]||CHAT_I18N.it)[QS[i]]);});
  });
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&!e.altKey&&e.key.toLowerCase()==='j'){e.preventDefault();toggleChat();}
  });

  window.EIH_CHAT={toggle:toggleChat,send:sendToAgent,sendSug:function(idx){sendToAgent((CHAT_I18N[lang]||CHAT_I18N.it)[QS[idx]]);}};
})();
