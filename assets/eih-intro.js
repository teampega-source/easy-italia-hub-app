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

  var stage=root.querySelector('.ei-stage');
  var fadeEl=root.querySelector('.ei-fade');
  var barEl=root.querySelector('.ei-bar');
  var winEl=root.querySelector('.ei-window');
  var capT=root.querySelector('.ei-caption .t');
  var capS=root.querySelector('.ei-caption .s');
  var capBox=root.querySelector('.ei-caption');
  var hintEl=root.querySelector('.ei-hint');
  var coarse=matchMedia('(hover:none),(pointer:coarse)').matches;
  var TEX='/assets/vendor/planets/';

  var CAPS=[ // [soglia, titolo, sottotitolo]
    [0.00,'Dallo Sri Lanka','Il viaggio comincia dal finestrino'],
    [0.20,'Il decollo','Si sale sopra l’oceano'],
    [0.40,'Vista dall’alto','Rotta verso Nord-Ovest'],
    [0.58,'Il pianeta intero','Ottomila chilometri in pochi istanti'],
    [0.74,'Verso l’Italia','La nuova casa si avvicina'],
    [0.90,'Benvenuto in Italia','Easy Italia Hub']
  ];

  import('/assets/vendor/three.module.min.js').then(function(T){
    var W=stage.clientWidth,H=stage.clientHeight;
    var scene=new T.Scene();
    scene.fog=new T.FogExp2(0x05070f,0.045);
    var cam=new T.PerspectiveCamera(52,W/H,0.01,200);
    cam.position.set(0,0,1.32);

    var rnd=new T.WebGLRenderer({antialias:!coarse,alpha:false,powerPreference:'high-performance'});
    rnd.setPixelRatio(Math.min(devicePixelRatio,coarse?1.5:2));
    rnd.setSize(W,H);
    rnd.toneMapping=T.ACESFilmicToneMapping;rnd.toneMappingExposure=1.12;
    rnd.outputColorSpace=T.SRGBColorSpace;
    rnd.setClearColor(0x05070f,1);
    stage.insertBefore(rnd.domElement,stage.firstChild);

    // ── Luci ──
    var sunDir=new T.Vector3(5,2.2,3.2).normalize();
    var sun=new T.DirectionalLight(0xfff2df,2.1);sun.position.copy(sunDir);scene.add(sun);
    scene.add(new T.AmbientLight(0x33405f,0.55));

    // ── Stelle ──
    (function(){
      var N=coarse?900:1800,p=new Float32Array(N*3),c=new Float32Array(N*3),col=new T.Color();
      for(var i=0;i<N;i++){
        var v=new T.Vector3((Math.random()-.5),(Math.random()-.5),(Math.random()-.5)).normalize().multiplyScalar(60+Math.random()*40);
        p[i*3]=v.x;p[i*3+1]=v.y;p[i*3+2]=v.z;
        col.setHSL(0.55+Math.random()*0.12,0.4,0.7+Math.random()*0.3);
        c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;
      }
      var g=new T.BufferGeometry();
      g.setAttribute('position',new T.BufferAttribute(p,3));
      g.setAttribute('color',new T.BufferAttribute(c,3));
      scene.add(new T.Points(g,new T.PointsMaterial({size:0.13,vertexColors:true,transparent:true,opacity:.9,depthWrite:false})));
    })();

    // ── Terra (gruppo ruotabile) ──
    var globe=new T.Group();scene.add(globe);
    var loader=new T.TextureLoader();
    function tex(f,cb){return loader.load(TEX+f,function(t){t.colorSpace=T.SRGBColorSpace;if(cb)cb(t);},undefined,function(){});}
    var earthMat=new T.MeshStandardMaterial({color:0x8aa2c8,roughness:1,metalness:0});
    tex('earth_atmos_2048.jpg',function(t){earthMat.map=t;earthMat.color.set(0xffffff);earthMat.needsUpdate=true;});
    var lights=loader.load(TEX+'earth_lights_2048.png',function(){},undefined,function(){});
    earthMat.emissive=new T.Color(0xffd27f);earthMat.emissiveMap=lights;earthMat.emissiveIntensity=1.1;
    var earth=new T.Mesh(new T.SphereGeometry(1,64,64),earthMat);globe.add(earth);

    // Nuvole
    var cloudMat=new T.MeshLambertMaterial({transparent:true,opacity:.55,depthWrite:false});
    tex('earth_clouds_1024.png',function(t){cloudMat.map=t;cloudMat.alphaMap=t;cloudMat.needsUpdate=true;});
    var clouds=new T.Mesh(new T.SphereGeometry(1.012,48,48),cloudMat);globe.add(clouds);

    // Atmosfera (Fresnel rim)
    var atmo=new T.Mesh(new T.SphereGeometry(1.09,48,48),new T.ShaderMaterial({
      transparent:true,side:T.BackSide,blending:T.AdditiveBlending,depthWrite:false,
      vertexShader:'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec3 vN;void main(){float i=pow(0.72-dot(vN,vec3(0.0,0.0,1.0)),3.0);i=clamp(i,0.0,1.0);gl_FragColor=vec4(0.35,0.6,1.0,1.0)*i;}'
    }));globe.add(atmo);

    // ── Marker + arco Sri Lanka → Italia ──
    function ll(lat,lon,r){var phi=(90-lat)*Math.PI/180,th=(lon+180)*Math.PI/180;
      return new T.Vector3(-r*Math.sin(phi)*Math.cos(th),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(th));}
    var pSL=ll(7.5,80.7,1),pIT=ll(41.9,12.5,1);
    function pin(pos,color){
      var m=new T.Mesh(new T.SphereGeometry(0.014,16,16),new T.MeshBasicMaterial({color:color}));
      m.position.copy(pos.clone().multiplyScalar(1.01));globe.add(m);
      var halo=new T.Mesh(new T.SphereGeometry(0.03,16,16),new T.MeshBasicMaterial({color:color,transparent:true,opacity:.35,blending:T.AdditiveBlending,depthWrite:false}));
      halo.position.copy(m.position);globe.add(halo);return halo;
    }
    var haloSL=pin(pSL,0xff5a3c),haloIT=pin(pIT,0x35c07a);
    // Arco
    var mid=pSL.clone().add(pIT).multiplyScalar(0.5).normalize().multiplyScalar(1.28);
    var curve=new T.QuadraticBezierCurve3(pSL.clone().multiplyScalar(1.01),mid,pIT.clone().multiplyScalar(1.01));
    var pts=curve.getPoints(80);
    var arcGeo=new T.BufferGeometry().setFromPoints(pts);
    var arc=new T.Line(arcGeo,new T.LineBasicMaterial({color:0xffb703,transparent:true,opacity:.9}));
    arc.geometry.setDrawRange(0,0);globe.add(arc);

    // Quaternion per portare un punto verso la camera (+Z)
    function faceQ(v){var q=new T.Quaternion();q.setFromUnitVectors(v.clone().normalize(),new T.Vector3(0,0,1));return q;}
    var qSL=faceQ(pSL),qIT=faceQ(pIT);
    globe.quaternion.copy(qSL);

    // ── Nuvole volumetriche per l'attraversamento ──
    var flak=[];
    (function(){
      var cv=document.createElement('canvas');cv.width=cv.height=128;var x=cv.getContext('2d');
      var g=x.createRadialGradient(64,64,4,64,64,64);
      g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.5,'rgba(240,244,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=g;x.fillRect(0,0,128,128);
      var ct=new T.CanvasTexture(cv);
      for(var i=0;i<7;i++){
        var s=new T.Sprite(new T.SpriteMaterial({map:ct,transparent:true,opacity:0,depthWrite:false,blending:T.NormalBlending}));
        s.scale.setScalar(0.8+Math.random()*0.9);
        s.position.set((Math.random()-.5)*1.6,(Math.random()-.5)*1.0,0.6+Math.random()*0.6);
        s.userData.z0=s.position.z;scene.add(s);flak.push(s);
      }
    })();

    // Sole / lens-flare fittizio
    var flare;(function(){
      var cv=document.createElement('canvas');cv.width=cv.height=128;var x=cv.getContext('2d');
      var g=x.createRadialGradient(64,64,0,64,64,64);
      g.addColorStop(0,'rgba(255,244,214,1)');g.addColorStop(.3,'rgba(255,214,140,.6)');g.addColorStop(1,'rgba(255,200,120,0)');
      x.fillStyle=g;x.fillRect(0,0,128,128);
      flare=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending}));
      flare.scale.setScalar(1.4);flare.position.copy(sunDir.clone().multiplyScalar(6));scene.add(flare);
    })();

    // ── Helpers timeline ──
    function clamp(v,a,b){return v<a?a:v>b?b:v;}
    function smooth(a,b,t){t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);}
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

    // Didascalie
    var curCap=-1;
    function setCap(p){
      var idx=0;for(var i=0;i<CAPS.length;i++){if(p>=CAPS[i][0])idx=i;}
      if(idx!==curCap){curCap=idx;capT.textContent=CAPS[idx][1];capS.textContent=CAPS[idx][2];
        capBox.style.opacity=0;requestAnimationFrame(function(){capBox.style.transition='opacity .6s ease';capBox.style.opacity=1;});}
    }

    var running=true,raf;
    function frame(t){
      if(!running)return;raf=requestAnimationFrame(frame);
      var p=progress;

      // Camera: grazing → orbitale → grazing su Italia
      var dist;
      if(p<0.58)dist=lerp(1.32,3.25,smooth(0.05,0.58,p));
      else dist=lerp(3.25,1.30,smooth(0.74,1.0,p));
      var vib=(p<0.28)?Math.sin(t*0.05)*0.006*(1-smooth(0.12,0.28,p)):0; // vibrazioni al decollo
      cam.position.set(vib,vib*0.6,dist);
      cam.lookAt(0,0,0);

      // Rotazione globo: Sri Lanka → Italia (0.55–0.80)
      globe.quaternion.slerpQuaternions(qSL,qIT,smooth(0.55,0.80,p));
      clouds.rotation.y+=0.0006; // drift indipendente

      // Arco disegnato progressivamente durante la rotta
      var da=smooth(0.55,0.80,p);
      arc.geometry.setDrawRange(0,Math.floor(da*81));
      var pulse=0.35+Math.sin(t*0.004)*0.2;
      haloSL.material.opacity=pulse*(1-smooth(0.55,0.72,p));
      haloIT.material.opacity=pulse*smooth(0.6,0.82,p);

      // Finestrino: sparisce dopo il decollo
      if(winEl)winEl.style.opacity=(1-smooth(0.10,0.26,p)).toFixed(3);
      if(hintEl)hintEl.style.opacity=(1-smooth(0.02,0.12,p)).toFixed(3);

      // Nuvole volumetriche 0.80–0.94
      var cf=smooth(0.80,0.90,p)*(1-smooth(0.90,0.98,p));
      for(var i=0;i<flak.length;i++){var s=flak[i];
        s.material.opacity=cf*0.8;
        s.position.z=lerp(s.userData.z0,1.25,smooth(0.80,0.98,p));}

      // Fade finale verso la landing
      if(fadeEl)fadeEl.style.opacity=smooth(0.93,1.0,p).toFixed(3);
      if(barEl)barEl.style.transform='scaleX('+p.toFixed(4)+')';

      setCap(p);
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
