/* Parallax intro WebGL — 3 scene con depth-map, cross-fade su scroll + parallax mouse. Fallback CSS. */
(function(){
  var root=document.getElementById('eih-intro');
  if(!root)return;
  var base='/intro-app/public/parallax/';
  var S=[
    {c:base+'scene1_srilanka.jpg',    d:base+'scene1_srilanka_depth.png'},
    {c:base+'scene2_clouds_italy.jpg',d:base+'scene2_clouds_italy_depth.png'},
    {c:base+'scene3_italy_descent.jpg',d:base+'scene3_italy_descent_depth.png'}
  ];
  var pin=root.querySelector('.intro-pin');
  var caps=root.querySelectorAll('.intro-cap .cap');
  var scrollHint=root.querySelector('.intro-scroll');
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

  // progresso scroll 0..1 sull'altezza della sezione
  var prog=0,target=0;
  function computeProg(){
    var r=root.getBoundingClientRect();
    var span=root.offsetHeight-window.innerHeight;
    target=span>0?Math.min(1,Math.max(0,-r.top/span)):0;
  }
  function setCaps(){
    var i=target<.4?0:target<.72?1:2;
    for(var k=0;k<caps.length;k++)caps[k].classList.toggle('on',k===i);
    if(scrollHint)scrollHint.classList.toggle('hide',target>.06);
  }

  var gl=null,canvas=root.querySelector('canvas');
  try{gl=canvas.getContext('webgl',{antialias:true,premultipliedAlpha:false});}catch(e){}

  if(!gl){ fallback(); return; }

  // ── WebGL setup ──
  var vs='attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var fs=[
    'precision mediump float;varying vec2 uv;',
    'uniform sampler2D cA,dA,cB,dB;uniform float mixv;uniform vec2 mo;uniform float amp;uniform float zoom;',
    'vec3 samp(sampler2D c,sampler2D d,vec2 u){',
    ' float dp=texture2D(d,u).r;',
    ' vec2 off=mo*amp*(0.25+dp);',           // near (bianco) si muove di più
    ' return texture2D(c,u+off).rgb;}',
    'void main(){',
    ' vec2 u=(uv-0.5)/zoom+0.5;',
    ' vec3 a=samp(cA,dA,u);vec3 b=samp(cB,dB,u);',
    ' gl_FragColor=vec4(mix(a,b,mixv),1.);}'
  ].join('\n');
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
  var prog_gl=gl.createProgram();
  gl.attachShader(prog_gl,sh(gl.VERTEX_SHADER,vs));
  gl.attachShader(prog_gl,sh(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(prog_gl);gl.useProgram(prog_gl);
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var pl=gl.getAttribLocation(prog_gl,'p');gl.enableVertexAttribArray(pl);
  gl.vertexAttribPointer(pl,2,gl.FLOAT,false,0,0);
  var U={};['cA','dA','cB','dB','mixv','mo','amp','zoom'].forEach(function(n){U[n]=gl.getUniformLocation(prog_gl,n);});
  gl.uniform1i(U.cA,0);gl.uniform1i(U.dA,1);gl.uniform1i(U.cB,2);gl.uniform1i(U.dB,3);

  function tex(img,unit){
    var t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    return t;
  }
  var texs=[];// [{c,d}]
  var loaded=0,total=S.length*2;
  function load(src,cb){var i=new Image();i.crossOrigin='anonymous';i.onload=function(){cb(i);};i.onerror=function(){cb(null);};i.src=src;}
  S.forEach(function(s,idx){
    texs[idx]={};
    load(s.c,function(im){texs[idx].cImg=im;done();});
    load(s.d,function(im){texs[idx].dImg=im;done();});
  });
  var ready=false;
  function done(){ if(++loaded>=total){ if(!S.every(function(_,i){return texs[i].cImg&&texs[i].dImg;})){fallback();return;} start(); } }

  function resize(){
    var w=pin.clientWidth,h=pin.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=w*dpr;canvas.height=h*dpr;gl.viewport(0,0,canvas.width,canvas.height);
  }

  var mx=0,my=0,tmx=0,tmy=0;
  function onMove(e){var w=window.innerWidth,h=window.innerHeight;tmx=(e.clientX/w-.5)*2;tmy=(e.clientY/h-.5)*2;}
  if(!reduce)window.addEventListener('pointermove',onMove,{passive:true});

  function start(){
    ready=true;
    // crea texture una volta
    S.forEach(function(_,i){texs[i].cTex=tex(texs[i].cImg,0);texs[i].dTex=tex(texs[i].dImg,1);});
    resize();window.addEventListener('resize',resize,{passive:true});
    requestAnimationFrame(frame);
  }
  function frame(){
    prog+=(target-prog)*0.08;
    mx+=(tmx-mx)*0.06;my+=(tmy-my)*0.06;
    var seg=prog*2;              // 0..2
    var a=Math.min(1,Math.floor(seg)),b=Math.min(2,a+1),f=Math.min(1,Math.max(0,seg-a));
    f=f*f*(3-2*f);              // smoothstep
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texs[a].cTex);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texs[a].dTex);
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,texs[b].cTex);
    gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,texs[b].dTex);
    gl.uniform1i(U.cB,2);gl.uniform1i(U.dB,3);
    gl.uniform1f(U.mixv,f);
    gl.uniform2f(U.mo,mx,my);
    gl.uniform1f(U.amp,reduce?0:0.028);
    gl.uniform1f(U.zoom,1.0+prog*0.10);
    gl.drawArrays(gl.TRIANGLES,0,3);
    requestAnimationFrame(frame);
  }

  // ── Fallback CSS cross-fade ──
  function fallback(){
    if(gl){/* nascondi canvas */ if(canvas)canvas.style.display='none'; }
    var layers=S.map(function(s,i){
      var d=document.createElement('div');d.className='intro-fallback';d.style.backgroundImage='url('+s.c+')';
      pin.insertBefore(d,pin.firstChild);return d;
    });
    function upd(){var i=target<.4?0:target<.72?1:2;layers.forEach(function(l,k){l.classList.toggle('in',k===i);});}
    scrollLoop(upd);upd();
  }

  // scroll driver
  function scrollLoop(extra){
    function tick(){computeProg();setCaps();if(extra)extra();requestAnimationFrame(tick);}
    requestAnimationFrame(tick);
  }
  scrollLoop();
})();
