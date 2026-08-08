/* Easy Italia Hub — VFX runtime
   Cinematic layer: scroll progress, film grain/vignette,
   3D tilt cards, magnetic CTA, click ripple, kinetic typography.
   Progressive enhancement: no-op sotto prefers-reduced-motion o su touch. */
(function(){
  if(window.__eihVfx)return;window.__eihVfx=1;
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},
          set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

  // CSS
  if(!document.querySelector('link[href*="eih-vfx.css"]')){
    var l=document.createElement('link');l.rel='stylesheet';l.href='/assets/eih-vfx.css';document.head.appendChild(l);}

  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn);}

  ready(function(){
    // ---- Scroll progress (site-wide, dedup con eih-motion) ----
    if(!reduce && !document.getElementById('eih-progress')){
      var bar=document.createElement('div');bar.id='eih-vfx-progress';document.body.appendChild(bar);
      var tick=false;
      addEventListener('scroll',function(){if(tick)return;tick=true;requestAnimationFrame(function(){
        var h=document.documentElement,max=h.scrollHeight-h.clientHeight;
        bar.style.width=(max>0?(h.scrollTop/max*100):0)+'%';tick=false;});},{passive:true});
    }

    // ---- Post-processing: grana + vignetta (film look) ----
    var grain,vig;
    if(!reduce){
      grain=document.createElement('div');grain.id='eih-vfx-grain';
      vig=document.createElement('div');vig.id='eih-vfx-vignette';
      document.body.appendChild(grain);document.body.appendChild(vig);
      grain.classList.add('on');vig.classList.add('on');
    }

    // I due interruttori flottanti (effetto pellicola e audio interfaccia) sono
    // stati rimossi: la grana resta attiva di default, l'audio non c'è più.
    function beep(){}

    /* Il tilt 3D sulle card e' stato tolto. Ruotava la card in prospettiva
       sotto il mouse, con un alone arancione al seguito: i bordi finivano
       storti rispetto al testo e ai riquadri dentro (le risposte dell'esame,
       per dire), e su schermo vero sembrava un difetto, non un effetto. */

    // ---- Magnetic CTA ----
    if(fine && !reduce){
      document.querySelectorAll('.btn-primary,.cta,[data-magnetic]').forEach(function(b){
        if(b.hasAttribute('data-no-magnetic'))return;b.classList.add('eih-mag');
        b.addEventListener('mousemove',function(e){
          var r=b.getBoundingClientRect();
          b.style.transform='translate('+(e.clientX-r.left-r.width/2)*.25+'px,'+(e.clientY-r.top-r.height/2)*.35+'px)';});
        b.addEventListener('mouseleave',function(){b.style.transform='';});
        b.addEventListener('mouseenter',function(){beep(720,.05);});
      });
    }

    // ---- Click ripple ----
    if(!reduce){
      document.addEventListener('pointerdown',function(e){
        var t=e.target.closest('.btn,.cta,[data-magnetic],button');if(!t)return;
        var cs=getComputedStyle(t);if(cs.position==='static')t.style.position='relative';
        t.classList.add('eih-ripple-host');
        var r=t.getBoundingClientRect(),d=Math.max(r.width,r.height)*2;
        var rp=document.createElement('span');rp.className='eih-ripple';
        rp.style.width=rp.style.height=d+'px';rp.style.left=(e.clientX-r.left)+'px';rp.style.top=(e.clientY-r.top)+'px';
        t.appendChild(rp);setTimeout(function(){rp.remove();},650);beep(500,.05);
      },{passive:true});
    }

    // ---- Kinetic typography (SplitText-style, opt-in [data-vfx-split]) ----
    document.querySelectorAll('[data-vfx-split]').forEach(function(el){
      if(el.querySelector('.eih-word'))return;
      var words=el.textContent.trim().split(/\s+/);
      el.textContent='';
      words.forEach(function(w,i){
        var wrap=document.createElement('span');wrap.className='eih-word';
        var inner=document.createElement('span');inner.textContent=w;
        inner.style.transitionDelay=(reduce?0:i*0.05)+'s';
        wrap.appendChild(inner);el.appendChild(wrap);
        if(i<words.length-1)el.appendChild(document.createTextNode(' '));
      });
      requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('eih-split-in');});});
    });

  });
})();
