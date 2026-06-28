/* Hero 3D — monta un visual 3D (CSS/SVG, nessuna dipendenza) a destra del titolo, solo desktop. */
(function(){
  if(window.__eihHero3d)return;window.__eihHero3d=1;
  var mq=matchMedia('(min-width:1024px)');
  if(!mq.matches)return;
  var page=(document.body&&document.body.dataset.page)||'';

  var G={
    plane:'<path d="M2 16l28-10-7 26-7-9-7 5z"/>',
    coins:'<ellipse cx="12" cy="9" rx="9" ry="4"/><path d="M3 9v6c0 2.2 4 4 9 4s9-1.8 9-4V9"/><path d="M3 13c0 2.2 4 4 9 4s9-1.8 9-4"/>',
    passport:'<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>',
    shield:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    cap:'<path d="M2 9l10-4 10 4-10 4z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v5"/>',
    briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    book:'<path d="M4 4h7a2 2 0 0 1 2 2v14a3 3 0 0 0-3-2H4z"/><path d="M20 4h-7a2 2 0 0 0-2 2v14a3 3 0 0 1 3-2h6z"/>',
    cross:'<rect x="4" y="9" width="16" height="6" rx="1.5"/><rect x="9" y="4" width="6" height="16" rx="1.5"/>',
    people:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15.5 14c2.5 0 4.5 2 4.5 5"/>',
    chat:'<path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4V7a2 2 0 0 1 2-2z"/><path d="M8 10h8M8 13h5"/>',
    megaphone:'<path d="M3 11v2a2 2 0 0 0 2 2h2l9 5V4l-9 5H5a2 2 0 0 0-2 2z"/><path d="M20 9c1.5 1.5 1.5 4.5 0 6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><rect x="7" y="13" width="4" height="4" rx="1"/>',
    home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    search:'<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>',
    box:'<path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/>',
    map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    spark:'<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>'
  };

  var REG={
    voli:['globe',null,'blue'],'travel-sri-lanka':['globe',null,'blue'],cargo:['globe',null,'blue'],mappa:['globe',null,'blue'],
    fisco:['card','coins','gold'],'money-transfer':['card','coins','gold'],'guida-conti':['card','coins','gold'],abbonamenti:['card','coins','gold'],'assegno-unico':['card','coins','gold'],'diritti-inps':['card','coins','gold'],mercatino:['card','coins','gold'],
    documenti:['card','passport','taupe'],moduli:['card','passport','taupe'],'permesso-tracker':['card','passport','taupe'],certificazioni:['card','passport','taupe'],'riconoscimento-titoli':['card','passport','taupe'],ricongiungimento:['card','passport','taupe'],patente:['card','passport','taupe'],
    privacy:['card','shield','blue'],termini:['card','shield','blue'],'note-legali':['card','shield','blue'],cookie:['card','shield','blue'],
    academy:['card','cap','blue'],corsi:['card','cap','blue'],scuola:['card','cap','blue'],'ai-teacher':['card','cap','blue'],
    'cv-builder':['card','briefcase','gold'],opportunita:['card','briefcase','gold'],
    traduci:['card','book','green'],'dizionario-medico':['card','book','green'],guide:['card','book','green'],
    'guida-ssn':['card','cross','coral'],emergenze:['card','cross','coral'],
    community:['card','people','coral'],forum:['card','people','coral'],profili:['card','people','coral'],associazioni:['card','people','coral'],'chi-siamo':['card','people','coral'],benvenuta:['card','people','coral'],
    contatti:['card','chat','blue'],
    news:['card','megaphone','gold'],podcast:['card','megaphone','gold'],
    calendario:['card','calendar','green'],
    housing:['card','home','taupe'],
    cerca:['card','search','blue']
  };

  var cfg=REG[page]||['card','spark','gold'];
  var scene=cfg[0],glyph=cfg[1],accent=cfg[2];

  var h1=document.querySelector('.page h1, .page-wide h1, .page-hero h1, main h1, header.page-hero h1');
  if(!h1)return;
  var host=h1.closest('.page, .page-wide, .page-hero, section')||h1.parentElement;
  if(getComputedStyle(host).position==='static')host.style.position='relative';

  var html;
  if(scene==='globe'){
    html='<span class="h3d-glow"></span>'+
      '<div class="h3d-globe"><span class="g-ocean"></span><span class="g-strip"></span><span class="g-shade"></span><span class="g-atmo"></span></div>'+
      '<div class="h3d-orbit"><span class="g-arc"></span><span class="h3d-plane"><svg viewBox="0 0 32 32" aria-hidden="true">'+G.plane+'</svg></span></div>'+
      '<span class="h3d-pin s"></span><span class="h3d-pin e"></span>';
  }else{
    html='<span class="h3d-glow"></span>'+
      '<div class="h3d-card"><svg viewBox="0 0 24 24" aria-hidden="true">'+(G[glyph]||G.spark)+'</svg></div>'+
      '<span class="h3d-ring"></span>';
  }

  var stage=document.createElement('div');
  stage.className='eih-h3d eih-h3d--'+scene;
  stage.setAttribute('aria-hidden','true');
  stage.style.setProperty('--h3d-accent','var(--'+accent+')');
  stage.innerHTML=html;
  host.appendChild(stage);

  function place(){
    if(!mq.matches){stage.style.display='none';return;}
    stage.style.display='';
    var hr=host.getBoundingClientRect(),hir=h1.getBoundingClientRect();
    var lead=host.querySelector('.lead, p');
    var bottom=lead?lead.getBoundingClientRect().bottom:hir.bottom;
    var center=(hir.top+bottom)/2-hr.top;
    stage.style.top=Math.max(0,center-stage.offsetHeight/2)+'px';
  }
  function reveal(){
    var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(window.gsap&&!rm){
      var g=window.gsap;
      g.timeline({delay:.15})
        .fromTo(stage,{opacity:0,scale:.84,filter:'blur(12px)'},{opacity:1,scale:1,filter:'blur(0px)',duration:1,ease:'expo.out',onComplete:function(){stage.classList.add('in');stage.style.removeProperty('transform');stage.style.removeProperty('filter');}})
        .from(stage.querySelectorAll('.h3d-glow,.h3d-ring,.h3d-orbit,.h3d-pin,.h3d-plane'),{opacity:0,duration:.5,stagger:.05,ease:'power2.out'},'-=.6');
    }else stage.classList.add('in');
  }
  place();
  requestAnimationFrame(function(){place();reveal();});
  addEventListener('resize',place,{passive:true});
})();
