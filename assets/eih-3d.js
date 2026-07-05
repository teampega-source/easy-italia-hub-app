/* Easy Italia Hub — 3D runtime (Three.js, lazy CDN ESM)
   PDF #1 scroll camera-spline 3D (hero).
   Progressive enhancement: no-op sotto prefers-reduced-motion.
   Import lazy via IntersectionObserver: zero costo finché fuori viewport. */
(function(){
  if(window.__eih3d)return;window.__eih3d=1;
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce)return;
  var coarse=matchMedia('(hover:none),(pointer:coarse)').matches;
  var CDN='/assets/vendor/three.module.min.js';
  var ORANGE=0xf77f00,INK=0x14101f;
  var _three=null;
  function three(){return _three||(_three=import(CDN));}

  if(!document.querySelector('link[href*="eih-3d.css"]')){
    var l=document.createElement('link');l.rel='stylesheet';l.href='/assets/eih-3d.css';document.head.appendChild(l);}

  function whenNear(el,cb,margin){
    if(!('IntersectionObserver'in window)){cb();return;}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){io.disconnect();cb();}});},{rootMargin:margin||'200px'});
    io.observe(el);
  }

  // ══════════════ #1 HERO — scroll camera-spline 3D ══════════════
  function heroScene(host){
    three().then(function(T){
      var W=host.clientWidth,H=host.clientHeight;
      var sc=new T.Scene();sc.fog=new T.FogExp2(INK,0.03);
      var cam=new T.PerspectiveCamera(60,W/H,0.1,100);
      var rnd=new T.WebGLRenderer({alpha:true,antialias:!coarse,powerPreference:'low-power'});
      rnd.setPixelRatio(Math.min(devicePixelRatio,coarse?1.5:2));rnd.setSize(W,H);
      rnd.domElement.className='eih-3d-canvas';host.appendChild(rnd.domElement);

      // Spline: percorso curvo lungo cui viaggia la camera (scroll-driven)
      var curve=new T.CatmullRomCurve3([
        new T.Vector3(0,0,18),new T.Vector3(3,1.5,10),new T.Vector3(-3,-1,2),
        new T.Vector3(2,2,-6),new T.Vector3(-2,-2,-14),new T.Vector3(0,0,-22)]);

      // Sprite morbido (gradiente radiale) per particelle bokeh
      function dot(){var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');
        var g=x.createRadialGradient(32,32,0,32,32,32);
        g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.85)');
        g.addColorStop(.55,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');
        x.fillStyle=g;x.fillRect(0,0,64,64);var t=new T.CanvasTexture(c);return t;}
      // Campo di polvere luminosa: palette calda armonica (tricolore + bianco caldo)
      var N=coarse?260:520,pos=new Float32Array(N*3),col=new Float32Array(N*3),spd=new Float32Array(N);
      var pal=[[.902,.224,.275],[.969,.498,0],[1,.718,.012],[1,.93,.82]]; // CORAL,ORANGE,GOLD,warm
      var c3=new T.Color();
      for(var i=0;i<N;i++){
        pos[i*3]=(Math.random()-.5)*30;pos[i*3+1]=(Math.random()-.5)*20;pos[i*3+2]=6-Math.random()*34;
        var p=pal[i%pal.length];col[i*3]=p[0];col[i*3+1]=p[1];col[i*3+2]=p[2];
        spd[i]=.0002+Math.random()*.0004;
      }
      var pg=new T.BufferGeometry();
      pg.setAttribute('position',new T.BufferAttribute(pos,3));
      pg.setAttribute('color',new T.BufferAttribute(col,3));
      var grp=new T.Points(pg,new T.PointsMaterial({size:.42,map:dot(),vertexColors:true,
        transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true}));
      sc.add(grp);
      // Alone diffuso al centro per profondità cinematografica
      var glow=new T.Mesh(new T.PlaneGeometry(60,40),new T.MeshBasicMaterial({map:dot(),color:ORANGE,
        transparent:true,opacity:.14,depthWrite:false,blending:T.AdditiveBlending}));
      glow.position.set(0,0,-16);sc.add(glow);

      var prog=0,tgt=0,mx=0,my=0;
      function scrollP(){
        var r=host.getBoundingClientRect(),vh=innerHeight;
        // 0 quando l'hero entra, 1 quando esce dal viewport
        tgt=Math.min(1,Math.max(0,(vh-r.top)/(vh+r.height)));
      }
      addEventListener('scroll',scrollP,{passive:true});scrollP();
      addEventListener('mousemove',function(e){mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5);},{passive:true});
      var tmp=new T.Vector3();
      function resize(){W=host.clientWidth;H=host.clientHeight;cam.aspect=W/H;cam.updateProjectionMatrix();rnd.setSize(W,H);}
      addEventListener('resize',resize);

      var run=true,raf;
      function loop(t){
        if(!run)return;raf=requestAnimationFrame(loop);
        prog+=(tgt-prog)*.06;
        var p=curve.getPointAt(prog*0.96);
        cam.position.set(p.x+mx*2,p.y-my*2,p.z);
        curve.getPointAt(Math.min(1,prog*0.96+0.04),tmp);cam.lookAt(tmp);
        // drift lento verso l'alto + rientro; lieve rotazione parallasse
        var a=pg.attributes.position.array;
        for(var i=0;i<N;i++){var y=a[i*3+1]+spd[i];if(y>10)y=-10;a[i*3+1]=y;}
        pg.attributes.position.needsUpdate=true;
        grp.rotation.y=Math.sin(t*0.00008)*0.15+mx*0.3;
        glow.position.x=mx*4;glow.position.y=-my*3;
        rnd.render(sc,cam);
      }
      raf=requestAnimationFrame(loop);
      // Pausa fuori viewport per risparmiare GPU
      new IntersectionObserver(function(es){run=es[0].isIntersecting;
        if(run){cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
      },{threshold:0}).observe(host);
      host.classList.add('ready');
    }).catch(function(){/* CDN off: hero resta statico */});
  }

  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn);}
  ready(function(){
    var hero=document.querySelector('[data-eih-hero3d]');
    if(hero)whenNear(hero,function(){heroScene(hero);},'0px');
  });
})();
