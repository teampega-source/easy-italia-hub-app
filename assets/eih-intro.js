/* Easy Italia Hub — Intro cinematografica 3D auto-play (Sri Lanka → Italia)
   Three.js r160 (vendorizzato). Timeline a tempo (parte e finisce da sola, come
   un video): closeup Sri Lanka → zoom-out lento poi veloce → stop sul globo →
   l'aereo percorre la rotta → arrivo in Italia. Progressive enhancement:
   no-op sotto prefers-reduced-motion o senza WebGL. Zero dipendenze extra. */
(function(){
  if(window.__eihIntro)return;window.__eihIntro=1;
  var root=document.getElementById('eih-intro');
  if(!root)return;
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function webgl(){try{var c=document.createElement('canvas');return!!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')));}catch(e){return false;}}
  if(reduce||!webgl()){root.remove();return;} // niente intro: la landing parte diretta

  // Una sola volta per scheda del browser: se già vista in questa sessione, salta.
  // sessionStorage persiste a reload/navigazione ma si azzera chiudendo la scheda,
  // quindi l'intro riparte solo chiudendo e riaprendo la pagina.
  try{if(sessionStorage.getItem('eih-intro-seen')){root.remove();return;}}catch(e){}
  try{sessionStorage.setItem('eih-intro-seen','1');}catch(e){}

  // Intro attiva: nascondi chrome della home e blocca lo scroll (è un video)
  document.documentElement.classList.add('eih-intro-on');
  var _prevHtmlOv=document.documentElement.style.overflow,_prevBodyOv=document.body.style.overflow;
  document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';

  var stage=root.querySelector('.ei-stage');
  var fadeEl=root.querySelector('.ei-fade');
  var capT=root.querySelector('.ei-caption .t');
  var capS=root.querySelector('.ei-caption .s');
  var capBox=root.querySelector('.ei-caption');
  var skipEl=root.querySelector('.ei-skip');
  var coarse=matchMedia('(hover:none),(pointer:coarse)').matches;
  var TEX='/assets/vendor/planets/';

  var DUR=coarse?14.5:16.0;        // durata totale intro (s)
  var START_DIST=coarse?1.5:1.2;   // mobile: closeup meno spinto (2K più nitida) · desktop: ravvicinato (4K)
  var GLOBE_DIST=3.0;              // globo intero visibile
  var ARRIVE_DIST=2.4;            // leggero avvicinamento all'arrivo

  var CAPS=[ // [soglia, titolo, sottotitolo]
    [0.00,'Dallo Sri Lanka','Dove comincia ogni viaggio'],
    [0.12,'Si prende quota','Sopra l’oceano Indiano'],
    [0.36,'Ottomila chilometri','Una rotta verso Nord-Ovest'],
    [0.55,'La rotta si disegna','Dallo Sri Lanka all’Italia'],
    [0.82,'L’arrivo','La nuova casa si avvicina'],
    [0.93,'Benvenuto in Italia','Easy Italia Hub']
  ];

  import('/assets/vendor/three.module.min.js').then(function(T){
    var W=stage.clientWidth,H=stage.clientHeight;
    var scene=new T.Scene();
    var cam=new T.PerspectiveCamera(46,W/H,0.01,300);
    cam.position.set(0,0,START_DIST);

    var rnd=new T.WebGLRenderer({antialias:!coarse,alpha:false,powerPreference:'high-performance'});
    rnd.setPixelRatio(Math.min(devicePixelRatio,coarse?1.25:2));
    rnd.setSize(W,H);
    rnd.toneMapping=T.ACESFilmicToneMapping;rnd.toneMappingExposure=1.02;
    rnd.outputColorSpace=T.SRGBColorSpace;
    rnd.setClearColor(0x03060f,1);
    stage.insertBefore(rnd.domElement,stage.firstChild);

    // ── Luci: key calda quasi frontale (fronte del globo ben illuminato = geografia visibile) ──
    var sunDir=new T.Vector3(-0.24,0.26,0.93).normalize();
    var sun=new T.DirectionalLight(0xfff1dc,3.1);sun.position.copy(sunDir);scene.add(sun);
    scene.add(new T.HemisphereLight(0x9fc0ff,0x1a2336,0.55));
    scene.add(new T.AmbientLight(0x2a3a5c,0.25));
    var rim=new T.DirectionalLight(0x6ea8ff,0.6);rim.position.set(0.6,-0.2,-0.9);scene.add(rim);

    // ── Campo stellare (profondità, colori tenui) ──
    (function(){
      var N=coarse?700:2200,p=new Float32Array(N*3),c=new Float32Array(N*3),sz=new Float32Array(N),col=new T.Color();
      for(var i=0;i<N;i++){
        var v=new T.Vector3((Math.random()-.5),(Math.random()-.5),(Math.random()-.5)).normalize().multiplyScalar(70+Math.random()*60);
        p[i*3]=v.x;p[i*3+1]=v.y;p[i*3+2]=v.z;
        col.setHSL(0.56+Math.random()*0.12,0.35,0.72+Math.random()*0.28);
        c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;sz[i]=Math.random();
      }
      var g=new T.BufferGeometry();
      g.setAttribute('position',new T.BufferAttribute(p,3));
      g.setAttribute('color',new T.BufferAttribute(c,3));
      scene.add(new T.Points(g,new T.PointsMaterial({size:0.14,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,sizeAttenuation:true})));
    })();

    // ── Terra (gruppo ruotabile) ──
    var globe=new T.Group();scene.add(globe);
    var loader=new T.TextureLoader();
    function tex(f,cb){return loader.load(TEX+f,function(t){t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,rnd.capabilities.getMaxAnisotropy());if(cb)cb(t);},undefined,function(){});}
    var earthMat=new T.MeshStandardMaterial({color:0x6f86ad,roughness:0.86,metalness:0.0});
    var texReady=false; // la timeline parte solo a texture pronta (upload GPU mascherato sul fermo iniziale)
    // Texture Terra 4K (closeup nitido su Sri Lanka) con fallback al 2K se non carica
    function loadEarth(file,fallback){
      loader.load(TEX+file,function(t){t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,rnd.capabilities.getMaxAnisotropy());
        earthMat.map=t;earthMat.color.set(0xffffff);earthMat.needsUpdate=true;texReady=true;},undefined,
        function(){if(fallback)loadEarth(fallback,null);else texReady=true;});
    }
    setTimeout(function(){texReady=true;},3000); // safety: parti comunque
    // Su mobile: texture 2K (decode/upload molto più leggero → niente stall durante lo
    // zoom) e nessuna mappa luci notturne. Desktop: 4K con fallback al 2K.
    if(coarse){loadEarth('earth_atmos_2048.jpg',null);}
    else{
      loadEarth('earth_atmos_4096.jpg','earth_atmos_2048.jpg');
      // Luci notturne discrete: solo un lieve scintillio sul lato in ombra
      var lights=loader.load(TEX+'earth_lights_2048.png',function(t){t.colorSpace=T.SRGBColorSpace;},undefined,function(){});
      earthMat.emissive=new T.Color(0xffca7a);earthMat.emissiveMap=lights;earthMat.emissiveIntensity=0.32;
    }
    var earth=new T.Mesh(new T.SphereGeometry(1,coarse?64:96,coarse?64:96),earthMat);globe.add(earth);

    // Atmosfera (Fresnel rim, blu pulito)
    var atmo=new T.Mesh(new T.SphereGeometry(1.055,coarse?40:64,coarse?40:64),new T.ShaderMaterial({
      transparent:true,side:T.BackSide,blending:T.AdditiveBlending,depthWrite:false,
      vertexShader:'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec3 vN;void main(){float i=pow(0.68-dot(vN,vec3(0.0,0.0,1.0)),2.6);i=clamp(i,0.0,1.0);gl_FragColor=vec4(0.30,0.56,1.0,1.0)*i*1.15;}'
    }));globe.add(atmo);

    // ── Marker + arco Sri Lanka → Italia ──
    function ll(lat,lon,r){var phi=(90-lat)*Math.PI/180,th=(lon+180)*Math.PI/180;
      return new T.Vector3(-r*Math.sin(phi)*Math.cos(th),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(th));}
    var pSL=ll(7.5,80.7,1),pIT=ll(41.9,12.5,1);

    // texture radiale riutilizzabile (glow morbido)
    function glowTex(inner,mid){
      var cv=document.createElement('canvas');cv.width=cv.height=128;var x=cv.getContext('2d');
      var g=x.createRadialGradient(64,64,0,64,64,64);
      g.addColorStop(0,inner);g.addColorStop(.35,mid);g.addColorStop(1,'rgba(0,0,0,0)');
      x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(cv);
    }
    var haloTexOrange=glowTex('rgba(255,190,120,1)','rgba(255,120,60,.55)');
    var haloTexGreen=glowTex('rgba(150,255,200,1)','rgba(40,200,120,.5)');
    // Piccolo aereo (vista dall'alto, muso verso l'alto) con lieve alone caldo
    function planeTexture(){
      var cv=document.createElement('canvas');cv.width=cv.height=128;var x=cv.getContext('2d');
      x.translate(64,64);x.shadowColor='rgba(255,232,185,.85)';x.shadowBlur=6;x.fillStyle='#fdf7ea';
      x.beginPath();x.moveTo(0,-42);x.quadraticCurveTo(7,-30,7,2);x.lineTo(6,34);
        x.quadraticCurveTo(0,44,-6,34);x.lineTo(-7,2);x.quadraticCurveTo(-7,-30,0,-42);x.closePath();x.fill(); // fusoliera
      x.beginPath();x.moveTo(0,-8);x.lineTo(44,20);x.lineTo(44,29);x.lineTo(0,11);
        x.lineTo(-44,29);x.lineTo(-44,20);x.closePath();x.fill(); // ali principali
      x.beginPath();x.moveTo(0,26);x.lineTo(19,41);x.lineTo(19,46);x.lineTo(0,37);
        x.lineTo(-19,46);x.lineTo(-19,41);x.closePath();x.fill(); // piani di coda
      return new T.CanvasTexture(cv);
    }
    var planeTex=planeTexture();

    function pin(pos,tx){
      var s=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));
      s.scale.setScalar(0.14);s.position.copy(pos.clone().multiplyScalar(1.012));globe.add(s);return s;
    }
    var haloSL=pin(pSL,haloTexOrange),haloIT=pin(pIT,haloTexGreen);

    // Arco: curva bézier che si stacca dalla superficie
    var mid=pSL.clone().add(pIT).multiplyScalar(0.5).normalize().multiplyScalar(1.32);
    var curve=new T.QuadraticBezierCurve3(pSL.clone().multiplyScalar(1.01),mid,pIT.clone().multiplyScalar(1.01));
    var ARC_SEG=96;
    var pts=curve.getPoints(ARC_SEG);
    var arcGeo=new T.BufferGeometry().setFromPoints(pts);
    var arc=new T.Line(arcGeo,new T.LineBasicMaterial({color:0xffc247,transparent:true,opacity:0.95,blending:T.AdditiveBlending,depthWrite:false}));
    arc.geometry.setDrawRange(0,0);globe.add(arc);
    // Aereo che percorre l'arco (orientato lungo la rotta)
    var comet=new T.Sprite(new T.SpriteMaterial({map:planeTex,transparent:true,opacity:0,depthWrite:false,depthTest:false}));
    comet.scale.setScalar(0.16);comet.renderOrder=10;globe.add(comet);

    // Quaternion per portare un punto verso la camera (+Z), con inclinazione naturale
    function faceQ(v){var q=new T.Quaternion();q.setFromUnitVectors(v.clone().normalize(),new T.Vector3(0,0,1));return q;}
    var tilt=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-0.02);
    // Roll di 45° a destra (attorno all'asse di vista): orienta i paesi in modo naturale
    var roll=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-Math.PI/4);
    var qSL=faceQ(pSL).premultiply(tilt).premultiply(roll),qIT=faceQ(pIT).premultiply(tilt).premultiply(roll);
    globe.quaternion.copy(qSL);

    // ── Helpers timeline ──
    function clamp(v,a,b){return v<a?a:v>b?b:v;}
    function smooth(a,b,t){t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);}
    function easeInOut(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
    function lerp(a,b,t){return a+(b-a)*t;}

    function resize(){W=stage.clientWidth;H=stage.clientHeight;cam.aspect=W/H;cam.updateProjectionMatrix();rnd.setSize(W,H);}
    addEventListener('resize',resize);

    // Didascalie con transizione morbida (fade+rise)
    var curCap=-1;
    function setCap(p){
      var idx=0;for(var i=0;i<CAPS.length;i++){if(p>=CAPS[i][0])idx=i;}
      if(idx!==curCap){curCap=idx;
        capBox.style.transition='none';capBox.style.opacity=0;capBox.style.transform='translateY(14px)';
        capT.textContent=CAPS[idx][1];capS.textContent=CAPS[idx][2];
        requestAnimationFrame(function(){capBox.style.transition='opacity .7s ease,transform .7s cubic-bezier(.16,1,.3,1)';capBox.style.opacity=1;capBox.style.transform='translateY(0)';});
      }
    }

    // ── Cleanup (fine intro o skip): ripristina scroll e chrome, rimuove overlay ──
    var ended=false,endTimer=null;
    function endIntro(){
      if(ended)return;ended=true;running=false;cancelAnimationFrame(raf);
      document.documentElement.classList.remove('eih-intro-on');
      document.documentElement.style.overflow=_prevHtmlOv;document.body.style.overflow=_prevBodyOv;
      try{rnd.dispose();}catch(e){}
      root.remove();
    }
    window.__eihIntroEnd=endIntro; // il bottone "Salta" lo chiama

    var running=true,raf,elapsed=0,last=0;
    function frame(t){
      if(!running)return;raf=requestAnimationFrame(frame);
      var dt=last?Math.min((t-last)/1000,0.05):0.016;last=t;
      if(texReady)elapsed+=dt; // non avanzare finché la texture non è pronta
      var p=clamp(elapsed/DUR,0,1);

      // ── Camera timeline ──
      // 0.00–0.10 closeup Sri Lanka (lievissimo push-in) · 0.10–0.34 zoom-out
      // lento→veloce con atterraggio morbido · 0.34–0.46 stop · 0.46–1.0 rotta+arrivo
      var dist;
      if(p<0.10){dist=lerp(START_DIST+0.04,START_DIST,smooth(0,0.10,p));}
      else if(p<0.34){dist=lerp(START_DIST,GLOBE_DIST,smooth(0.10,0.34,p));} // ease morbido: niente stacco meccanico
      else if(p<0.46){dist=GLOBE_DIST;}                                       // stop sul globo
      else dist=lerp(GLOBE_DIST,ARRIVE_DIST,easeInOut(smooth(0.80,1.0,p)));  // rotta a distanza globo, poi avvicina
      var drift=Math.sin(t*0.00016)*0.05*smooth(0.34,0.6,p)*(1-smooth(0.9,1,p));
      cam.position.set(drift,0,dist);
      cam.lookAt(0,0,0);

      // Rotazione globo: Sri Lanka → Italia durante la rotta
      var rot=easeInOut(smooth(0.50,0.90,p));
      globe.quaternion.slerpQuaternions(qSL,qIT,rot);

      // Arco disegnato progressivamente + aereo in testa (orientato lungo la rotta)
      var da=smooth(0.52,0.90,p);
      var drawCount=Math.floor(da*(ARC_SEG+1));
      arc.geometry.setDrawRange(0,drawCount);
      arc.material.opacity=0.55+0.4*smooth(0.50,0.64,p);
      if(da>0.001&&da<0.997){
        var pa=curve.getPoint(clamp(da,0,1)),pb=curve.getPoint(clamp(da+0.012,0,1));
        comet.position.copy(pa);
        globe.updateMatrixWorld();
        var wa=pa.clone().applyMatrix4(globe.matrixWorld).project(cam);
        var wb=pb.clone().applyMatrix4(globe.matrixWorld).project(cam);
        comet.material.rotation=Math.atan2((wb.y-wa.y)*H,(wb.x-wa.x)*W)-Math.PI/2;
        comet.material.opacity=1;comet.scale.setScalar(0.2);
      }else{comet.material.opacity=0;}

      var pulse=0.7+Math.sin(t*0.005)*0.3;
      haloSL.material.opacity=(0.16+0.14*pulse)*smooth(0.08,0.14,p)*(1-smooth(0.24,0.34,p));
      haloSL.scale.setScalar(0.085+0.02*pulse);
      haloIT.material.opacity=pulse*smooth(0.80,0.92,p);
      haloIT.scale.setScalar(0.13+0.035*pulse);

      // Fade finale caldo verso la landing
      var fade=smooth(0.90,1.0,p);
      if(fadeEl)fadeEl.style.opacity=fade.toFixed(3);
      if(skipEl)skipEl.style.opacity=(1-smooth(0.86,0.96,p)).toFixed(3);
      document.documentElement.classList.toggle('eih-intro-on',fade<0.6);

      setCap(p);
      rnd.render(scene,cam);

      if(p>=1&&!endTimer)endTimer=setTimeout(endIntro,220);
    }
    raf=requestAnimationFrame(frame);

    // Pausa GPU quando l'intro è fuori viewport (es. tab in background)
    new IntersectionObserver(function(es){
      if(ended)return;running=es[0].isIntersecting;
      if(running){last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
    },{threshold:0}).observe(stage);

    root.classList.add('ready');
  }).catch(function(){ // fallback totale: ripristina scroll/chrome e vai diretto alla landing
    document.documentElement.classList.remove('eih-intro-on');
    document.documentElement.style.overflow=_prevHtmlOv;document.body.style.overflow=_prevBodyOv;
    root.remove();
  });
})();
