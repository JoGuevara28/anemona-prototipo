/* =====================================================================
   Visor de renders 360° (SC-02 · RF-21 · CU-21)
   Muestra una imagen equirectangular (proporción 2:1) como si el usuario
   estuviera dentro del espacio. Usa WebGL del navegador, sin librerías.

   Controles: arrastrar (mouse o dedo) · flechas del teclado · rueda o +/−
   para acercar · restablecer · pantalla completa.
   ===================================================================== */
'use strict';
class Visor360{
  constructor(contenedor,url,{alError}={}){
    this.c=contenedor;this.url=url;this.alError=alError||(()=>{});
    this.inicial={yaw:0,pitch:0,fov:75};Object.assign(this,this.inicial);
    this.canvas=document.createElement('canvas');this.canvas.className='visor-canvas';this.canvas.tabIndex=0;
    this.canvas.setAttribute('aria-label','Render 360°: arrastre o use las flechas para mirar alrededor');
    this.c.appendChild(this.canvas);
    const gl=this.canvas.getContext('webgl',{preserveDrawingBuffer:true,antialias:false});
    if(!gl){this.alError('Su navegador no puede mostrar renders 360° (WebGL no disponible). Puede descargar el archivo para verlo en otro programa.');return}
    this.gl=gl;this._programa();this._eventos();this._cargar();
  }
  _programa(){
    const gl=this.gl;
    const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
    /* Para cada píxel: dirección de la mirada → longitud/latitud → coordenada en la imagen equirectangular */
    const fs=`precision highp float;uniform sampler2D tex;uniform vec2 res;uniform float yaw,pitch,fov;
      const float PI=3.14159265359;
      void main(){vec2 q=(gl_FragCoord.xy/res)*2.-1.;float t=tan(fov*.5);
        vec3 d=normalize(vec3(q.x*t*res.x/res.y,q.y*t,-1.));
        float cp=cos(pitch),sp=sin(pitch);d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);
        float cy=cos(yaw),sy=sin(yaw);d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);
        float lon=atan(d.x,-d.z),lat=asin(clamp(d.y,-1.,1.));
        gl_FragColor=texture2D(tex,vec2(fract(lon/(2.*PI)+.5),.5-lat/PI));}`;
    const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
    const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    this.u={res:gl.getUniformLocation(pr,'res'),yaw:gl.getUniformLocation(pr,'yaw'),pitch:gl.getUniformLocation(pr,'pitch'),fov:gl.getUniformLocation(pr,'fov')};
  }
  _cargar(){
    const img=new Image();
    img.onload=()=>{
      const gl=this.gl;if(!gl)return;
      /* RNF-07: si la imagen es más grande de lo que admite el dispositivo, se reduce para poder mostrarla */
      const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);let fuente=img;
      if(img.naturalWidth>max){const k=max/img.naturalWidth;const cv=document.createElement('canvas');cv.width=max;cv.height=Math.round(img.naturalHeight*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);fuente=cv}
      const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,fuente)}catch(e){this.alError('No se pudo cargar la imagen en el visor.');return}
      this.listo=true;this.c.classList.add('listo');this.dibujar();
    };
    img.onerror=()=>this.alError('No se pudo cargar el archivo del render.');
    img.src=this.url;
  }
  _eventos(){
    const cv=this.canvas;let ultimo=null;
    cv.addEventListener('pointerdown',e=>{ultimo=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId);this.c.classList.add('arrastrando');this.c.classList.add('usado')});
    cv.addEventListener('pointermove',e=>{if(!ultimo)return;
      /* "agarrar" la imagen: al arrastrar a la izquierda se mira hacia la derecha, como al voltear la cabeza */
      const k=(this.fov*Math.PI/180)/cv.clientHeight;
      this.mover((e.clientX-ultimo[0])*k*180/Math.PI,(e.clientY-ultimo[1])*k*180/Math.PI);ultimo=[e.clientX,e.clientY]});
    const fin=()=>{ultimo=null;this.c.classList.remove('arrastrando')};
    cv.addEventListener('pointerup',fin);cv.addEventListener('pointercancel',fin);
    cv.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(e.deltaY*0.001))},{passive:false});
    cv.addEventListener('keydown',e=>{const m={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[e.key];
      if(m){e.preventDefault();this.mover(-m[0],-m[1])}else if(e.key==='+'||e.key==='=')this.zoom(0.9);else if(e.key==='-')this.zoom(1.1)});
    this.ro=new ResizeObserver(()=>this.dibujar());this.ro.observe(this.c);
  }
  /* dx, dy en grados de arrastre de pantalla */
  mover(dx,dy){this.yaw=((this.yaw+dx)%360+540)%360-180;this.pitch=Math.max(-85,Math.min(85,this.pitch+dy));this.dibujar()}
  zoom(f){this.fov=Math.max(30,Math.min(100,this.fov*f));this.dibujar()}
  restablecer(){Object.assign(this,this.inicial);this.dibujar()}
  pantallaCompleta(){const el=this.c;try{if(document.fullscreenElement)document.exitFullscreen();else el.requestFullscreen().catch(()=>{})}catch(e){}}
  dibujar(){
    const cv=this.canvas,gl=this.gl;
    cv.dataset.yaw=this.yaw.toFixed(1);cv.dataset.pitch=this.pitch.toFixed(1);cv.dataset.fov=this.fov.toFixed(1);
    if(!gl||!this.listo)return;
    if(this._raf)return;
    this._raf=requestAnimationFrame(()=>{this._raf=0;
      const r=Math.min(window.devicePixelRatio||1,2),w=Math.round(cv.clientWidth*r),h=Math.round(cv.clientHeight*r);
      if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
      gl.viewport(0,0,w,h);gl.uniform2f(this.u.res,w,h);
      gl.uniform1f(this.u.yaw,this.yaw*Math.PI/180);gl.uniform1f(this.u.pitch,this.pitch*Math.PI/180);gl.uniform1f(this.u.fov,this.fov*Math.PI/180);
      gl.drawArrays(gl.TRIANGLES,0,3)});
  }
  destruir(){try{this.ro&&this.ro.disconnect();const x=this.gl&&this.gl.getExtension('WEBGL_lose_context');x&&x.loseContext()}catch(e){}this.gl=null}
}
