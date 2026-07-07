/* Easy Italia Hub — Intro cinematografica 3D scroll-driven (Sri Lanka → Italia)
   Three.js r160 (vendorizzato). Scroll = timeline. Progressive enhancement:
   no-op sotto prefers-reduced-motion o senza WebGL. Zero dipendenze extra. */
(function(){
  if(window.__eihIntro)return;window.__eihIntro=1;
  var root=document.getElementById('eih-intro');
  if(!root)return;
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function webgl(){try{var c=document.createElement('canvas');return!!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')));}catch(e){return false;}}
  if(reduce||!webgl()){root.remove();return;} // niente intro: la landing parte diretta

  // Nascondi subito i controlli flottanti/pop-up della home finché l'intro è attiva
  document.documentElement.classList.add('eih-intro-on');

  var stage=root.querySelector('.ei-stage');
  var fadeEl=root.querySelector('.ei-fade');
  var barEl=root.querySelector('.ei-bar');
  var winEl=root.querySelector('.ei-window');
  var capT=root.querySelector('.ei-caption .t');
  var capS=root.querySelector('.ei-caption .s');
  var capBox=root.querySelector('.ei-caption');
  var hintEl=root.querySelector('.ei-hint');
  var skipEl=root.querySelector('.ei-skip');
  var coarse=matchMedia('(hover:none),(pointer:coarse)').matches;
  var TEX='/assets/vendor/planets/';

  var CAPS=[ // [soglia, titolo, sottotitolo]
    [0.00,'Dallo Sri Lanka','Dove comincia ogni viaggio'],
    [0.22,'Il decollo','Si sale sopra l’oceano'],
    [0.44,'Ottomila chilometri','Una rotta verso Nord-Ovest'],
    [0.62,'La rotta si disegna','Dallo Sri Lanka all’Italia'],
    [0.80,'L’arrivo','La nuova casa si avvicina'],
    [0.92,'Benvenuto in Italia','Easy Italia Hub']
  ];

  import('/assets/vendor/three.module.min.js').then(function(T){
    var W=stage.clientWidth,H=stage.clientHeight;
    var scene=new T.Scene();
    var cam=new T.PerspectiveCamera(46,W/H,0.01,300);
    cam.position.set(0,0,1.9);

    var rnd=new T.WebGLRenderer({antialias:!coarse,alpha:false,powerPreference:'high-performance'});
    rnd.setPixelRatio(Math.min(devicePixelRatio,coarse?1.5:2));
    rnd.setSize(W,H);
    rnd.toneMapping=T.ACESFilmicToneMapping;rnd.toneMappingExposure=1.02;
    rnd.outputColorSpace=T.SRGBColorSpace;
    rnd.setClearColor(0x03060f,1);
    stage.insertBefore(rnd.domElement,stage.firstChild);

    // ── Luci: key calda quasi frontale (disco visibile ben illuminato) + fill freddo + rim ──
    var sunDir=new T.Vector3(-0.55,0.4,0.78).normalize();
    var sun=new T.DirectionalLight(0xfff1dc,3.1);sun.position.copy(sunDir);scene.add(sun);
    scene.add(new T.HemisphereLight(0x9fc0ff,0x1a2336,0.55));
    scene.add(new T.AmbientLight(0x2a3a5c,0.25));
    var rim=new T.DirectionalLight(0x6ea8ff,0.6);rim.position.set(0.6,-0.2,-0.9);scene.add(rim);

    // ── Campo stellare (profondità, colori tenui) ──
    (function(){
      var N=coarse?1100:2200,p=new Float32Array(N*3),c=new Float32Array(N*3),sz=new Float32Array(N),col=new T.Color();
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
    tex('earth_atmos_2048.jpg',function(t){earthMat.map=t;earthMat.color.set(0xffffff);earthMat.needsUpdate=true;});
    // Luci notturne discrete: solo un lieve scintillio sul lato in ombra
    var lights=loader.load(TEX+'earth_lights_2048.png',function(t){t.colorSpace=T.SRGBColorSpace;},undefined,function(){});
    earthMat.emissive=new T.Color(0xffca7a);earthMat.emissiveMap=lights;earthMat.emissiveIntensity=0.32;
    var earth=new T.Mesh(new T.SphereGeometry(1,96,96),earthMat);globe.add(earth);

    // Atmosfera (Fresnel rim, blu pulito)
    var atmo=new T.Mesh(new T.SphereGeometry(1.055,64,64),new T.ShaderMaterial({
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
    var cometTex=glowTex('rgba(255,246,220,1)','rgba(255,196,110,.7)');

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
    // Cometa che percorre l'arco
    var comet=new T.Sprite(new T.SpriteMaterial({map:cometTex,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));
    comet.scale.setScalar(0.2);globe.add(comet);

    // Quaternion per portare un punto verso la camera (+Z), con inclinazione naturale
    function faceQ(v){var q=new T.Quaternion();q.setFromUnitVectors(v.clone().normalize(),new T.Vector3(0,0,1));return q;}
    var tilt=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),0.14);
    var qSL=faceQ(pSL).premultiply(tilt),qIT=faceQ(pIT).premultiply(tilt);
    globe.quaternion.copy(qSL);

    // ── Helpers timeline ──
    function clamp(v,a,b){return v<a?a:v>b?b:v;}
    function smooth(a,b,t){t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);}
    function easeInOut(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
    function lerp(a,b,t){return a+(b-a)*t;}

    var progress=0;
    function readProgress(){
      var r=root.getBoundingClientRect();
      var span=root.offsetHeight-innerHeight;
      progress=clamp(-r.top/(span||1),0,1);
    }
    addEventListener('scroll',readProgress,{passive:true});readProgress();

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

    var running=true,raf,smoothP=0;
    function frame(t){
      if(!running)return;raf=requestAnimationFrame(frame);
      smoothP+=(progress-smoothP)*0.12; // scrubbing morbido
      var p=smoothP;

      // Camera: finestrino (vicino) → orbita che rivela l'arco → discesa su Italia
      var dist;
      if(p<0.62)dist=lerp(1.9,3.25,easeInOut(smooth(0.04,0.62,p)));
      else dist=lerp(3.25,1.86,easeInOut(smooth(0.62,1.0,p)));
      var vib=(p<0.22)?Math.sin(t*0.05)*0.004*(1-smooth(0.10,0.22,p)):0; // micro-tremolio al decollo
      var drift=Math.sin(t*0.00016)*0.05*smooth(0.2,0.6,p)*(1-smooth(0.78,1,p)); // parallasse lenta
      cam.position.set(vib+drift,vib*0.6,dist);
      cam.lookAt(0,0,0);

      // Rotazione globo: Sri Lanka → Italia (0.46–0.82)
      var rot=easeInOut(smooth(0.46,0.82,p));
      globe.quaternion.slerpQuaternions(qSL,qIT,rot);

      // Arco disegnato progressivamente + cometa in testa
      var da=smooth(0.48,0.82,p);
      var drawCount=Math.floor(da*(ARC_SEG+1));
      arc.geometry.setDrawRange(0,drawCount);
      arc.material.opacity=0.55+0.4*smooth(0.46,0.6,p);
      if(da>0.001&&da<0.999){
        comet.position.copy(curve.getPoint(clamp(da,0,1)));
        comet.material.opacity=0.9;comet.scale.setScalar(0.16+Math.sin(t*0.01)*0.02);
      }else{comet.material.opacity=0;}

      var pulse=0.7+Math.sin(t*0.005)*0.3;
      haloSL.material.opacity=pulse*smooth(0.02,0.14,p)*(1-smooth(0.5,0.7,p))*0.9+0.15*(1-smooth(0.5,0.7,p));
      haloSL.scale.setScalar(0.12+0.03*pulse);
      haloIT.material.opacity=pulse*smooth(0.62,0.84,p);
      haloIT.scale.setScalar(0.13+0.035*pulse);

      // Finestrino aereo: si dissolve dopo il decollo
      if(winEl)winEl.style.opacity=(1-smooth(0.08,0.24,p)).toFixed(3);
      if(hintEl)hintEl.style.opacity=(1-smooth(0.02,0.12,p)).toFixed(3);

      // Fade finale caldo verso la landing (su progress grezza: copre il globo in tempo)
      var fade=smooth(0.88,0.995,progress);
      if(fadeEl)fadeEl.style.opacity=fade.toFixed(3);
      if(skipEl)skipEl.style.opacity=(1-smooth(0.86,0.96,progress)).toFixed(3);
      if(barEl)barEl.style.transform='scaleX('+progress.toFixed(4)+')';

      // Home/chrome nascosti finché il fade non copre il globo (evita sovrapposizioni)
      document.documentElement.classList.toggle('eih-intro-on',fade<0.6);

      setCap(progress);
      rnd.render(scene,cam);
    }
    raf=requestAnimationFrame(frame);

    // Pausa GPU quando l'intro è fuori viewport
    new IntersectionObserver(function(es){
      running=es[0].isIntersecting;
      if(running){cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
    },{threshold:0}).observe(stage);

    root.classList.add('ready');
  }).catch(function(){root.remove();}); // fallback totale: landing diretta
})();
