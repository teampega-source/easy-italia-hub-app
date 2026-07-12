/* Easy Italia Hub — Intro cinematografica a immagini reali (Sri Lanka → Italia).
   Montaggio auto-play: dissolvenze incrociate + Ken Burns. Leggerissimo (solo
   immagini + transizioni CSS), nessuna dipendenza. Una volta per scheda del
   browser; salta con prefers-reduced-motion. */
(function(){
  if(window.__eihIntro)return;window.__eihIntro=1;
  var root=document.getElementById('eih-intro');
  if(!root)return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){root.remove();return;}

  // Una sola volta per scheda (riparte solo chiudendo e riaprendo la pagina).
  try{if(sessionStorage.getItem('eih-intro-seen')){root.remove();return;}}catch(e){}
  try{sessionStorage.setItem('eih-intro-seen','1');}catch(e){}

  document.documentElement.classList.add('eih-intro-on');
  var _h=document.documentElement.style.overflow,_b=document.body.style.overflow;
  document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';

  var stage=root.querySelector('.ei-stage');
  var capBox=root.querySelector('.ei-caption');
  var capT=capBox.querySelector('.t'),capS=capBox.querySelector('.s');
  var fadeEl=root.querySelector('.ei-fade'),skipEl=root.querySelector('.ei-skip');
  var B='/assets/intro/';

  var SLIDES=[
    {img:'1-sigiriya.jpg',t:'Dallo Sri Lanka',s:'Dove comincia ogni viaggio'},
    {img:'2-beach.jpg',t:'La tua terra',s:'I ricordi che porti con te'},
    {img:'3-flight.jpg',t:'Ottomila chilometri',s:'Verso una nuova vita'},
    {img:'4-rome.jpg',t:'All’Italia',s:'La tua nuova casa'},
    {img:'5-venice.jpg',t:'Easy Italia Hub',s:'Ti accompagniamo, passo dopo passo'}
  ];
  var HOLD=2000,CROSS=1100,STEP=HOLD+CROSS; // ms

  // Costruisci gli slide (dietro a didascalia/fade/skip)
  var els=SLIDES.map(function(sl,i){
    var d=document.createElement('div');d.className='ei-slide'+(i%2?' alt':'');
    var k=document.createElement('div');k.className='ei-kb';
    k.style.backgroundImage='url('+B+sl.img+')';
    d.appendChild(k);stage.insertBefore(d,stage.firstChild);return d;
  });

  var timers=[],idx=-1,ended=false;
  function setCap(i){capBox.classList.remove('show');void capBox.offsetWidth;
    capT.textContent=SLIDES[i].t;capS.textContent=SLIDES[i].s;capBox.classList.add('show');}
  function show(i){if(ended)return;
    if(idx>=0)els[idx].classList.remove('front');
    idx=i;els[i].classList.add('on','front');setCap(i);}
  function endIntro(){if(ended)return;ended=true;timers.forEach(clearTimeout);
    document.documentElement.classList.remove('eih-intro-on');
    document.documentElement.style.overflow=_h;document.body.style.overflow=_b;
    root.remove();}
  window.__eihIntroEnd=endIntro; // bottone "Salta"

  // Precarica le immagini, poi parti (con safety se la rete è lenta)
  var loaded=0,started=false;
  SLIDES.forEach(function(sl){var im=new Image();im.onload=im.onerror=function(){if(++loaded===SLIDES.length)run();};im.src=B+sl.img;});
  var safety=setTimeout(run,2600);
  function run(){if(started)return;started=true;clearTimeout(safety);
    show(0);
    for(var i=1;i<SLIDES.length;i++)(function(i){timers.push(setTimeout(function(){show(i);},i*STEP));})(i);
    // Dissolvenza finale calda verso la landing, poi rimuove l'overlay
    timers.push(setTimeout(function(){if(fadeEl)fadeEl.style.opacity='1';if(skipEl)skipEl.style.opacity='0';},SLIDES.length*STEP-100));
    timers.push(setTimeout(endIntro,SLIDES.length*STEP+CROSS));
  }
  root.classList.add('ready');
})();
