/* Easy Italia Hub — 3D runtime (Three.js, lazy CDN ESM)
   PDF #1 scroll camera-spline 3D (hero) + #7 mappa Italia 3D interattiva.
   Progressive enhancement: no-op sotto prefers-reduced-motion.
   Import lazy via IntersectionObserver: zero costo finché fuori viewport. */
(function(){
  if(window.__eih3d)return;window.__eih3d=1;
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce)return;
  var coarse=matchMedia('(hover:none),(pointer:coarse)').matches;
  var CDN='/assets/vendor/three.module.min.js';
  var GEO='/assets/geo/italy-regions.geojson';
  var CORAL=0xe63946,ORANGE=0xf77f00,GOLD=0xffb703,INK=0x14101f;
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
    if(coarse)return; // scena pesante: solo desktop/pointer fine
    three().then(function(T){
      var W=host.clientWidth,H=host.clientHeight;
      var sc=new T.Scene();sc.fog=new T.FogExp2(INK,0.03);
      var cam=new T.PerspectiveCamera(60,W/H,0.1,100);
      var rnd=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
      rnd.setPixelRatio(Math.min(devicePixelRatio,2));rnd.setSize(W,H);
      rnd.domElement.className='eih-3d-canvas';host.appendChild(rnd.domElement);

      // Spline: percorso curvo lungo cui viaggia la camera (scroll-driven)
      var curve=new T.CatmullRomCurve3([
        new T.Vector3(0,0,18),new T.Vector3(3,1.5,10),new T.Vector3(-3,-1,2),
        new T.Vector3(2,2,-6),new T.Vector3(-2,-2,-14),new T.Vector3(0,0,-22)]);

      // Campo di frammenti fluttuanti nei colori del tricolore
      var grp=new T.Group();sc.add(grp);
      var geos=[new T.IcosahedronGeometry(0.5,0),new T.TetrahedronGeometry(0.55),new T.OctahedronGeometry(0.5)];
      var cols=[CORAL,ORANGE,GOLD,0x2a9d72,0x4f76c7];
      for(var i=0;i<46;i++){
        var m=new T.Mesh(geos[i%geos.length],
          new T.MeshStandardMaterial({color:cols[i%cols.length],roughness:.35,metalness:.5,
            transparent:true,opacity:.85,flatShading:true}));
        m.position.set((Math.random()-.5)*22,(Math.random()-.5)*14,4-Math.random()*30);
        var s=.5+Math.random()*1.1;m.scale.setScalar(s);
        m.userData.rs=(Math.random()-.5)*.01;m.userData.f=Math.random()*6;
        grp.add(m);
      }
      sc.add(new T.AmbientLight(0xffffff,.6));
      var key=new T.DirectionalLight(0xffffff,1.1);key.position.set(4,6,8);sc.add(key);
      var rim=new T.PointLight(ORANGE,2,40);rim.position.set(-6,-4,6);sc.add(rim);

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
        for(var i=0;i<grp.children.length;i++){var o=grp.children[i];
          o.rotation.x+=o.userData.rs;o.rotation.y+=o.userData.rs*1.3;
          o.position.y+=Math.sin(t*0.0006+o.userData.f)*0.004;}
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

  // ══════════════ #7 MAPPA ITALIA 3D interattiva ══════════════
  var CITIES=[ // community srilankese — coord lon/lat
    {n:'Roma',lon:12.4964,lat:41.9028},{n:'Milano',lon:9.1900,lat:45.4642},
    {n:'Torino',lon:7.6869,lat:45.0703},{n:'Firenze',lon:11.2558,lat:43.7696},
    {n:'Bologna',lon:11.3426,lat:44.4949},{n:'Napoli',lon:14.2681,lat:40.8518}];

  function mapScene(host){
    var tip=host.querySelector('[data-eih-tip]')||(function(){var d=document.createElement('div');
      d.className='eih-3d-tip';d.setAttribute('data-eih-tip','');host.appendChild(d);return d;})();
    Promise.all([three(),fetch(GEO).then(function(r){return r.json();})]).then(function(res){
      var T=res[0],gj=res[1];
      var W=host.clientWidth,H=host.clientHeight;
      var sc=new T.Scene();
      var cam=new T.PerspectiveCamera(45,W/H,0.1,1000);cam.position.set(0,0,units());
      function units(){return coarse?165:150;}
      var rnd=new T.WebGLRenderer({alpha:true,antialias:true});
      rnd.setPixelRatio(Math.min(devicePixelRatio,2));rnd.setSize(W,H);
      rnd.domElement.className='eih-3d-canvas';host.appendChild(rnd.domElement);

      // Proiezione lon/lat → piano (centro Italia ~ 12.5, 42)
      var CX=12.5,CY=42,K=9;
      function proj(lon,lat){return[(lon-CX)*K*Math.cos(CY*Math.PI/180),(lat-CY)*K];}

      var root=new T.Group();sc.add(root);
      var regions=new T.Group();root.add(regions);
      var mat=new T.MeshStandardMaterial({color:0x3a3358,emissive:0x12101f,roughness:.55,metalness:.25,
        transparent:true,opacity:.97});
      var edgeMat=new T.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.55});
      var DEPTH=3;

      function addPoly(rings){
        if(!rings.length)return;
        var shp=new T.Shape();
        ring(shp,rings[0]);
        for(var h=1;h<rings.length;h++){var hole=new T.Path();ring(hole,rings[h]);shp.holes.push(hole);}
        var g=new T.ExtrudeGeometry(shp,{depth:DEPTH,bevelEnabled:false});
        var mesh=new T.Mesh(g,mat.clone());regions.add(mesh);
        var eg=new T.EdgesGeometry(g);regions.add(new T.LineSegments(eg,edgeMat));
      }
      function ring(path,coords){
        coords.forEach(function(c,i){var p=proj(c[0],c[1]);
          i?path.lineTo(p[0],p[1]):path.moveTo(p[0],p[1]);});
      }
      (gj.features||[]).forEach(function(f){
        var g=f.geometry;if(!g)return;
        if(g.type==='Polygon')addPoly(g.coordinates);
        else if(g.type==='MultiPolygon')g.coordinates.forEach(addPoly);
      });
      // Mappa frontale (nord in alto): centra sul piano XY, rilievo verso la camera
      var box=new T.Box3().setFromObject(regions),ctr=box.getCenter(new T.Vector3());
      regions.position.set(-ctr.x,-ctr.y,-ctr.z);
      var faceZ=box.max.z-ctr.z; // superficie del rilievo rivolta alla camera

      // Marker città community
      var mk=new T.Group();root.add(mk);
      var pins=[];
      CITIES.forEach(function(c){
        var p=proj(c.lon,c.lat);
        var pin=new T.Mesh(new T.SphereGeometry(1.5,16,16),
          new T.MeshStandardMaterial({color:CORAL,emissive:CORAL,emissiveIntensity:.6}));
        pin.position.set(p[0]-ctr.x,p[1]-ctr.y,faceZ+1.2);
        pin.userData=c;mk.add(pin);pins.push(pin);
        var halo=new T.Mesh(new T.RingGeometry(2,2.6,24),
          new T.MeshBasicMaterial({color:ORANGE,transparent:true,opacity:.5,side:T.DoubleSide}));
        halo.position.set(pin.position.x,pin.position.y,faceZ+.15);mk.add(halo);
        pin.userData.halo=halo;
      });

      sc.add(new T.AmbientLight(0xffffff,.7));
      var d1=new T.DirectionalLight(0xffffff,1.1);d1.position.set(20,40,30);sc.add(d1);
      var d2=new T.DirectionalLight(ORANGE,.6);d2.position.set(-30,10,-20);sc.add(d2);

      // Interazione: drag rotazione + hover pin. Default: nord in alto, lieve inclinazione 3D
      var baseX=-0.32,ry=0,rx=baseX,tgy=0,tgx=baseX,drag=false,px=0,py=0,auto=true;
      var el=rnd.domElement;
      function down(x,y){drag=true;auto=false;px=x;py=y;el.classList.add('grabbing');}
      function move(x,y){if(!drag)return;tgy+=(x-px)*.006;tgx+=(y-py)*.006;
        tgx=Math.max(-1.0,Math.min(0.35,tgx));px=x;py=y;}
      function up(){drag=false;el.classList.remove('grabbing');}
      el.addEventListener('mousedown',function(e){down(e.clientX,e.clientY);});
      addEventListener('mousemove',function(e){move(e.clientX,e.clientY);});
      addEventListener('mouseup',up);
      el.addEventListener('touchstart',function(e){var t=e.touches[0];down(t.clientX,t.clientY);},{passive:true});
      el.addEventListener('touchmove',function(e){var t=e.touches[0];move(t.clientX,t.clientY);e.preventDefault();},{passive:false});
      el.addEventListener('touchend',up);

      var ray=new T.Raycaster(),mv=new T.Vector2(),hovered=null;
      el.addEventListener('mousemove',function(e){
        var r=el.getBoundingClientRect();mv.x=(e.clientX-r.left)/r.width*2-1;mv.y=-((e.clientY-r.top)/r.height)*2+1;
        ray.setFromCamera(mv,cam);var hit=ray.intersectObjects(pins)[0];
        if(hit){var c=hit.object.userData;tip.textContent='📍 '+c.n;tip.style.left=(e.clientX-r.left)+'px';
          tip.style.top=(e.clientY-r.top)+'px';tip.classList.add('on');el.style.cursor='pointer';
          if(hovered!==hit.object){hovered=hit.object;}
        }else{tip.classList.remove('on');el.style.cursor=drag?'grabbing':'grab';hovered=null;}
      });
      el.addEventListener('mouseleave',function(){tip.classList.remove('on');hovered=null;});

      function resize(){W=host.clientWidth;H=host.clientHeight;cam.aspect=W/H;cam.updateProjectionMatrix();
        rnd.setSize(W,H);cam.position.z=units();}
      addEventListener('resize',resize);

      var run=true,raf,t0=performance.now();
      function loop(t){
        if(!run)return;raf=requestAnimationFrame(loop);
        // idle: oscillazione lenta finché l'utente non trascina
        var swayY=auto?Math.sin(t*0.00028)*0.26:0,swayX=auto?Math.sin(t*0.0004)*0.04:0;
        ry+=((tgy+swayY)-ry)*.06;rx+=((tgx+swayX)-rx)*.06;
        root.rotation.y=ry;root.rotation.x=rx;
        var pulse=1+Math.sin(t*0.004)*0.15;
        pins.forEach(function(p){p.scale.setScalar(p===hovered?pulse*1.6:pulse);
          if(p.userData.halo){var s=p===hovered?1.4:1;p.userData.halo.scale.setScalar(s*(1+Math.sin(t*0.004)*0.12));}});
        rnd.render(sc,cam);
      }
      raf=requestAnimationFrame(loop);
      new IntersectionObserver(function(es){run=es[0].isIntersecting;
        if(run){cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}},{threshold:0}).observe(host);
      host.classList.add('ready');
      var ld=host.querySelector('[data-eih-loading]');if(ld)ld.remove();
    }).catch(function(){
      host.classList.add('failed');
      var ld=host.querySelector('[data-eih-loading]');if(ld)ld.textContent='Mappa 3D non disponibile.';
    });
  }

  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn);}
  ready(function(){
    var hero=document.querySelector('[data-eih-hero3d]');
    if(hero)whenNear(hero,function(){heroScene(hero);},'0px');
    var map=document.querySelector('[data-eih-map3d]');
    if(map)whenNear(map,function(){mapScene(map);},'300px');
  });
})();
