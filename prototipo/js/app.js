/* =====================================================================
   Anémona Design Studio · prototipo funcional (interfaz)
   IC5821 Requerimientos de Software · Grupo 01

   Funciona de dos formas:
   · Modo servidor   → abierto desde http://localhost:8000 (servidor/servidor.py).
                       Los datos se guardan en la base SQLite y las reglas de
                       negocio se validan también en el servidor.
   · Modo demostración → abierto como archivo o en un sitio estático (GitHub
                       Pages). Los datos se guardan solo en este navegador.
   ===================================================================== */
'use strict';

/* Fuentes de la marca (Jost y Quicksand). Se cargan sin bloquear la página: si la red bloquea
   o hace lenta la conexión a Google Fonts (redes de universidades, sin internet), el prototipo
   abre igual con las fuentes del sistema. */
(function cargarFuentes(){try{const l=document.createElement('link');l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Quicksand:wght@600;700&display=swap';
  document.head.appendChild(l)}catch(e){}})();

/* ================= Catálogos (en modo servidor se cargan desde la base) ================= */
const LS='anemona-proto-v4';
let TIPOS=['Anteproyecto','Diseño de interiores','Mobiliario a medida','Remodelación','Gestión de construcción'];
let ESTADOS=['Por iniciar','En diseño','En ejecución','En pausa','Finalizado','Cancelado'];
let TRANS={'Por iniciar':['En diseño','Cancelado'],'En diseño':['En ejecución','En pausa','Finalizado','Cancelado'],'En ejecución':['En pausa','Finalizado','Cancelado'],'En pausa':['En diseño','En ejecución','Cancelado'],'Finalizado':[],'Cancelado':[]};
let ACTIVOS=['Por iniciar','En diseño','En ejecución'];
let CATS=['Iluminación','Mobiliario','Ebanistería','Construcción','Acabados','Materiales','Electrodomésticos','Otros servicios'];
let RESP=['Gabriela Núñez','María José','Colaborador externo'];
/* Plan de acción por tipo de servicio (minuta 01, tema 3) — [nombre, días desde el inicio, entregable, responsable] */
let PLAN={
 'Anteproyecto':[['Reunión inicial con el cliente',0],['Levantamiento del sitio',5],['Propuesta conceptual',14,1],['Revisión con el cliente',18],['Ajustes y entrega del anteproyecto',28,1]],
 'Diseño de interiores':[['Reunión inicial con el cliente',0],['Elaboración del mood board',7,1],['Revisión del mood board con el cliente',10],['Registro e incorporación de comentarios',14],['Propuesta de distribución y planos',24,1,'María José'],['Renders',35,1,'María José'],['Selección de materiales y proveedores',40],['Entrega final',50,1]],
 'Mobiliario a medida':[['Reunión y toma de medidas',0],['Diseño del mueble',7,1],['Aprobación del diseño por el cliente',10],['Coordinación con ebanista',12],['Fabricación',30],['Instalación y entrega',35,1]],
 'Remodelación':[['Reunión inicial con el cliente',0],['Levantamiento del sitio',5],['Diseño y planos',20,1,'María José'],['Selección de materiales',25],['Cotización con contratistas',30],['Inicio de obra',40],['Seguimiento de obra',60],['Entrega de la remodelación',75,1]],
 'Gestión de construcción':[['Revisión de planos',0],['Contratación del equipo de construcción',10],['Inicio de obra',20],['Inspección de avance',45],['Entrega de obra',80,1]]
};
const EST_LEAD=['Nuevo','Contactado','Reunión agendada','Cotización enviada','No continuó'];
const EST_ACT=['Pendiente','En proceso','Completada'];
const UNIDADES=['unidad','m²','metro lineal','lámina','galón','juego','servicio'];
const COND=['Considerado','Seleccionado'];
const EST_COT=['Enviada','Aceptada','Rechazada'];
const KIND_PROY={'Por iniciar':'info','En diseño':'sea','En ejecución':'coral','En pausa':'warn','Finalizado':'ok','Cancelado':'mute'};
const KIND_LEAD={'Nuevo':'info','Contactado':'sea','Reunión agendada':'coral','Cotización enviada':'warn','No continuó':'mute','Convertido':'ok'};
const KIND_ACT={'Pendiente':'info','En proceso':'warn','Completada':'ok'};
const KIND_COT={'Enviada':'warn','Aceptada':'ok','Rechazada':'mute'};
/* Roles (RF-17, CU-17 · docs/10-roles-y-permisos.md) — iguales a la tabla `rol` del servidor
   [nombre, ve información comercial, qué edita, administra, alcance de proyectos] */
const ROLES_DEMO={
 propietaria:['Propietaria',1,'todo',1,'todos'],
 arquitecta:['Arquitecta',1,'todo',0,'todos'],
 colaborador:['Personal interno',0,'actividades',0,'participa'],  // ERS §2.9; sin cuenta de ejemplo
 cliente:['Cliente',0,'nada',0,'propios']                          // SC-01: solo consulta sus proyectos
};
const VISTAS_BASE=['inicio','proyectos','calendario','proveedores','materiales','buscar','acerca'],VISTAS_COM=['potenciales','clientes','cotizador','renders'];  // VISTAS_COM: solo del estudio
function permisosDe(c){const [,com,ed,adm,alc]=ROLES_DEMO[c];return {vistas:alc==='propios'?['inicio','proyectos']:VISTAS_BASE.concat(com?VISTAS_COM:[]),comercial:!!com,edita:ed,admin:!!adm,alcance:alc}}
/* Usuarios del modo demostración (en modo servidor se validan contra la base, con contraseña cifrada) */
const USERS_DEMO=[
 {u:'gabriela',p:'anemona2026',nombre:'Gabriela Núñez',ini:'GN',rolCodigo:'propietaria'},
 {u:'mariajose',p:'anemona2026',nombre:'María José',ini:'MJ',rolCodigo:'arquitecta'}
].map(u=>({...u,rol:ROLES_DEMO[u.rolCodigo][0],permisos:permisosDe(u.rolCodigo),edit:ROLES_DEMO[u.rolCodigo][2]==='todo'}));
const MAX_ARCHIVO=10*1024*1024;
const MAX_RENDER=25*1024*1024;  // RN-06
const RENDER_MEM={};           // modo demostración: archivos subidos en esta sesión (no se guardan en el navegador por su tamaño)

/* ================= Utilidades ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Math.random().toString(16).slice(2,8);
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const today=()=>iso(new Date());
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return iso(d)};
const diff=s=>Math.round((parseD(s)-parseD(today()))/864e5);
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESL=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const fd=s=>{if(!s)return '—';const d=parseD(s);return d.getDate()+' '+MES[d.getMonth()]+' '+d.getFullYear()};
const money=n=>(n===''||n==null||isNaN(n))?'—':'₡'+Number(n).toLocaleString('es-CR',{maximumFractionDigits:2});
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const digits=s=>String(s||'').replace(/\D/g,'');
const byFecha=(a,b)=>(a.fecha||'9999').localeCompare(b.fecha||'9999');
const byId=(c,id)=>DB[c].find(x=>x.id===id);
const badge=(t,k)=>`<span class="b ${k||'mute'}">${esc(t)}</span>`;
const opt=(o,sel)=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(l)}</option>`};
const arcos=(w,c)=>`<svg class="arcos" width="${w}" height="${w*.42}" viewBox="0 0 120 50" fill="none" stroke="${c||'currentColor'}" stroke-width="1.6" stroke-linecap="round"><path d="M6 48 V30 a24 24 0 0 1 48 0 V48"/><path d="M66 48 V30 a24 24 0 0 1 48 0 V48"/></svg>`;
const marca=()=>`<div class="marca">${arcos(54,'#1d1c1a')}<span class="wm">anemona</span><span class="ds">design studio</span></div>`;

/* ================= Estado ================= */
let DB=null, DBT=null, USER=null, MODO='demo';  // DBT: todos los datos (modo demostración); DB: lo que el rol puede ver
const ui={tab:'resumen',lastProj:null,leadF:'activos',pf:{tipo:'',estado:'',q:''},provCat:'',matCat:'',cal:null,calResp:'',q:''};

/* ================= Capa de datos =================
   Toda modificación pasa por op(nombre, args). En modo servidor se envía a la
   API REST; en modo demostración se aplica sobre los datos del navegador con
   las mismas reglas de negocio. */
async function http(method,path,body){
  let r;
  try{r=await fetch('/api'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined})}
  catch(e){return {status:0,mensaje:'No hay conexión con el servidor.'}}
  let j={};try{j=await r.json()}catch(e){}
  return {status:r.status,...j};
}
async function detectarModo(){
  if(!/^https?:$/.test(location.protocol))return 'demo';
  try{const r=await fetch('/api/salud',{cache:'no-store'});if(r.ok){const j=await r.json();if(j.ok)return 'api'}}catch(e){}
  return 'demo';
}
function aplicarCatalogos(c){
  if(!c)return;
  TIPOS=c.tipos;ESTADOS=c.estados;TRANS=c.transiciones;ACTIVOS=c.activos;CATS=c.categorias;RESP=c.responsables;PLAN=c.plan;
}
async function recargar(){
  if(MODO!=='api')return;
  const r=await http('GET','/datos');
  if(r.status===401){USER=null;return}
  if(r.status===200){DB=r.datos;aplicarCatalogos(r.catalogos)}
}
function load(){try{const s=localStorage.getItem(LS);if(s){DBT=JSON.parse(s)}}catch(e){}if(!DBT)DBT=seed();if(!DBT.renders)DBT.renders=[];DB=DBT}
function save(){if(MODO!=='demo')return;try{localStorage.setItem(LS,JSON.stringify(DBT))}catch(e){}}
/* Misma regla que logica.filtrar_por_rol en el servidor */
function filtrarPorRol(d,u){
  const p=u.permisos;if(p.alcance==='todos'&&p.comercial)return d;
  if(p.alcance==='propios'){  // SC-01 / RF-19: solo sus proyectos, entregables y cotizaciones
    const mios=new Set(d.proyectos.filter(x=>x.clienteId===u.clienteId).map(x=>x.id));const vacio={};Object.keys(d).forEach(k=>vacio[k]=[]);
    const proy=d.proyectos.filter(x=>mios.has(x.id)).map(x=>{const a=d.actividades.filter(y=>y.proyectoId===x.id);return {...x,avance:{hechas:a.filter(y=>y.estado==='Completada').length,total:a.length}}});
    return {...vacio,proyectos:proy,actividades:d.actividades.filter(a=>mios.has(a.proyectoId)&&a.entregable),cotizaciones:d.cotizaciones.filter(c=>mios.has(c.proyectoId)),clientes:d.clientes.filter(c=>c.id===u.clienteId)};
  }
  const v={...d,accesos:[]};
  if(p.alcance==='participa'){
    const part=new Set(d.actividades.filter(a=>a.responsable===u.nombre).map(a=>a.proyectoId));const en=x=>part.has(x.proyectoId);
    v.proyectos=d.proyectos.filter(x=>part.has(x.id));v.actividades=d.actividades.filter(en);v.provProy=d.provProy.filter(en);v.matProy=d.matProy.filter(en);v.cotizaciones=d.cotizaciones.filter(en);
  }
  if(!p.comercial){const vis=new Set(v.proyectos.map(x=>x.clienteId));
    v.clientes=d.clientes.filter(c=>vis.has(c.id)).map(c=>({id:c.id,nombre:c.nombre}));v.leads=[];v.cotizaciones=[];v.renders=[]}
  return v;
}
/* Usuario de una cuenta de cliente (modo demostración) */
function usuarioCliente(cta){const c=DBT.clientes.find(x=>x.id===cta.clienteId)||{nombre:'Cliente'};const pn=c.nombre.split(' ');
  return {u:cta.usuario,nombre:c.nombre,ini:(pn[0][0]+(pn[1]?pn[1][0]:'')).toUpperCase(),rolCodigo:'cliente',rol:'Cliente',clienteId:cta.clienteId,permisos:permisosDe('cliente'),edit:false}}
function vistaDemo(){if(MODO==='demo')DB=USER?filtrarPorRol(DBT,USER):DBT}

async function op(nombre,a){
  const o=OPS[nombre];
  if(MODO==='api'){
    const [m,p,b]=o.api(a);
    const r=await http(m,p,b);
    if(r.status===401){USER=null;closeModal();render();toast('La sesión expiró. Ingrese de nuevo.','err');return {cancel:true}}
    if(r.status===400&&r.errores&&Object.keys(r.errores).length)return {errors:r.errores};
    if(r.status<200||r.status>=300){toast(r.mensaje||'No se pudo completar la operación.','err');return {cancel:true}}
    await recargar();return r;
  }
  /* modo demostración: mismos permisos que el servidor */
  const req=PERMISO_OP[nombre]||'todo';
  const ok=req==='admin'?esAdmin():req==='actividad'?canAct(a.proyectoId||(byId('actividades',a.id)||{}).proyectoId):can();
  if(!ok){toast('Acción no autorizada para su rol ('+USER.rol+').','err');return {cancel:true}}
  DB=DBT;let r;
  try{r=o.local(a)||{}}finally{DBT=DB;vistaDemo()}
  if(r.errors)return r;
  save();vistaDemo();return r;
}
const PERMISO_OP={crearActividad:'actividad',editarActividad:'actividad',reiniciar:'admin'};

/* Operaciones: ruta de la API + implementación local equivalente */
const err=(k,m)=>({errors:{[k]:m}});
const OPS={
  crearLead:{api:v=>['POST','/potenciales',v],local:v=>{const d=personaDuplicada(v);if(d)return err('nombre',d+' No se creó un registro duplicado.');const id=uid('l');DB.leads.push({id,...pick(v,'nombre telefono correo nacionalidad servicio estado notas'),creado:today(),convertidoA:null});return {id}}},
  editarLead:{api:v=>['PUT','/potenciales/'+v.id,v],local:v=>{const d=personaDuplicada(v,v.id);if(d)return err('nombre',d+' No se creó un registro duplicado.');Object.assign(byId('leads',v.id),pick(v,'nombre telefono correo nacionalidad servicio estado notas'));return {id:v.id}}},
  convertir:{api:v=>['POST','/potenciales/'+v.id+'/convertir',v],local:v=>{const l=byId('leads',v.id);const dup=idDuplicado(v.tipoId,v.numId);if(dup)return err('numId',`Esta identificación ya pertenece al cliente «${dup.nombre}». No se creó un nuevo registro.`);
    const c={id:uid('c'),nombre:l.nombre,tipoId:v.tipoId,numId:v.numId,telefono:l.telefono,correo:l.correo,nacionalidad:l.nacionalidad,origenLead:l.id,creado:today()};DB.clientes.push(c);l.convertidoA=c.id;return {id:c.id}}},
  crearCliente:{api:v=>['POST','/clientes',v],local:v=>{const dup=idDuplicado(v.tipoId,v.numId);if(dup)return err('numId',`Ya existe un cliente con esta identificación: «${dup.nombre}».`);const id=uid('c');DB.clientes.push({id,...pick(v,'nombre tipoId numId telefono correo nacionalidad'),creado:today()});return {id}}},
  editarCliente:{api:v=>['PUT','/clientes/'+v.id,v],local:v=>{const dup=idDuplicado(v.tipoId,v.numId,v.id);if(dup)return err('numId',`Ya existe un cliente con esta identificación: «${dup.nombre}».`);Object.assign(byId('clientes',v.id),pick(v,'nombre tipoId numId telefono correo nacionalidad'));return {id:v.id}}},
  crearProyecto:{api:v=>['POST','/proyectos',v],local:v=>{if(!byId('clientes',v.clienteId))return err('clienteId','El cliente seleccionado no existe.');const id=uid('p');DB.proyectos.push({id,...pick(v,'clienteId nombre tipo descripcion fechaInicio ubicacion area'),estado:'Por iniciar'});if(v.plan)DB.actividades.push(...planActs(id,v.tipo,v.fechaInicio));return {id}}},
  editarProyecto:{api:v=>['PUT','/proyectos/'+v.id,v],local:v=>{if(!byId('clientes',v.clienteId))return err('clienteId','El cliente seleccionado no existe.');Object.assign(byId('proyectos',v.id),pick(v,'clienteId nombre tipo descripcion fechaInicio ubicacion area'));return {id:v.id}}},
  estadoProyecto:{api:v=>['PUT','/proyectos/'+v.id+'/estado',{estado:v.estado}],local:v=>{const p=byId('proyectos',v.id);if(!(TRANS[p.estado]||[]).includes(v.estado))return err('estado',`Transición no permitida: de «${p.estado}» no se puede pasar a «${v.estado}».`);const anterior=p.estado;p.estado=v.estado;return {anterior,estado:v.estado}}},
  cargarPlan:{api:v=>['POST','/proyectos/'+v.id+'/plan',{}],local:v=>{const p=byId('proyectos',v.id);DB.actividades.push(...planActs(p.id,p.tipo,p.fechaInicio));return {}}},
  crearActividad:{api:v=>['POST','/actividades',v],local:v=>{const id=uid('a');DB.actividades.push({id,...pick(v,'proyectoId nombre responsable fecha estado entregable')});return {id}}},
  editarActividad:{api:v=>['PUT','/actividades/'+v.id,v],local:v=>{Object.assign(byId('actividades',v.id),pick(v,'nombre responsable fecha estado entregable'));return {}}},
  crearProveedor:{api:v=>['POST','/proveedores',v],local:v=>{const id=uid('v');DB.proveedores.push({id,...pick(v,'nombre categorias contacto telefono correo ofrece notas')});return {id}}},
  editarProveedor:{api:v=>['PUT','/proveedores/'+v.id,v],local:v=>{Object.assign(byId('proveedores',v.id),pick(v,'nombre categorias contacto telefono correo ofrece notas'));return {}}},
  crearMaterial:{api:v=>['POST','/materiales',v],local:v=>{const id=uid('m');DB.materiales.push({id,...pick(v,'nombre modelo categoria unidad precioRef proveedorIds descripcion')});return {id}}},
  editarMaterial:{api:v=>['PUT','/materiales/'+v.id,v],local:v=>{Object.assign(byId('materiales',v.id),pick(v,'nombre modelo categoria unidad precioRef proveedorIds descripcion'));return {}}},
  asociarProveedores:{api:v=>['POST','/proyectos/'+v.proyectoId+'/proveedores',v],local:v=>{v.ids.forEach(i=>{if(!DB.provProy.some(x=>x.proyectoId===v.proyectoId&&x.proveedorId===i))DB.provProy.push({id:uid('pp'),proyectoId:v.proyectoId,proveedorId:i,condicion:v.condicion})});return {}}},
  condicionProveedor:{api:v=>['PUT','/proyecto-proveedores/'+v.id,{condicion:v.condicion}],local:v=>{byId('provProy',v.id).condicion=v.condicion;return {}}},
  quitarProveedor:{api:v=>['DELETE','/proyecto-proveedores/'+v.id],local:v=>{DB.provProy=DB.provProy.filter(z=>z.id!==v.id);return {}}},
  asociarMaterial:{api:v=>['POST','/proyectos/'+v.proyectoId+'/materiales',v],local:v=>{const m=byId('materiales',v.materialId);DB.matProy.push({id:uid('mp'),proyectoId:v.proyectoId,materialId:v.materialId,cantidad:v.cantidad,precioUnit:v.precioUnit||m.precioRef||'0',nota:v.nota});return {}}},
  editarMatProy:{api:v=>['PUT','/proyecto-materiales/'+v.id,v],local:v=>{const x=byId('matProy',v.id);Object.assign(x,{cantidad:v.cantidad,nota:v.nota},v.precioUnit!==''?{precioUnit:v.precioUnit}:{});return {}}},
  quitarMaterial:{api:v=>['DELETE','/proyecto-materiales/'+v.id],local:v=>{DB.matProy=DB.matProy.filter(z=>z.id!==v.id);return {}}},
  crearCotizacion:{api:v=>['POST','/cotizaciones',v],local:v=>{DB.cotizaciones.push({id:uid('q'),...pick(v,'proyectoId codigo fecha monto estado enlace archivo')});return {}}},
  editarCotizacion:{api:v=>['PUT','/cotizaciones/'+v.id,v],local:v=>{Object.assign(byId('cotizaciones',v.id),pick(v,'codigo fecha monto estado enlace archivo'));return {}}},
  reiniciar:{api:()=>['POST','/reiniciar',{}],local:()=>{DB=seed();return {}}},
  darAcceso:{api:v=>['POST','/clientes/'+v.id+'/acceso',{usuario:v.usuario,clave:v.clave}],local:v=>{const usu=v.usuario.toLowerCase();
    if(DB.accesos.some(x=>x.clienteId===v.id))return err('usuario','Este cliente ya tiene una cuenta. Puede activarla o desactivarla.');
    if(DB.accesos.some(x=>x.usuario===usu)||USERS_DEMO.some(x=>x.u===usu))return err('usuario','Ese nombre de usuario ya está en uso.');
    DB.accesos.push({clienteId:v.id,usuario:usu,clave:v.clave,activo:true});return {}}},
  subirRender:{api:v=>['POST','/proyectos/'+v.proyectoId+'/renders',{titulo:v.titulo,descripcion:v.descripcion,archivo:v.archivo,archivoDatos:v.archivoDatos,miniatura:v.miniatura}],
    local:v=>{const id=uid('r');RENDER_MEM[id]=v.dataUrl;DB.renders.unshift({id,proyectoId:v.proyectoId,titulo:v.titulo,descripcion:v.descripcion,archivo:v.archivo,ancho:v.ancho,alto:v.alto,tamano:v.tamano,subidoPor:USER.nombre,creado:today(),tieneMini:true,miniUrl:'data:image/jpeg;base64,'+v.miniatura});return {id}}},
  editarRender:{api:v=>['PUT','/renders/'+v.id,{titulo:v.titulo,descripcion:v.descripcion}],local:v=>{Object.assign(byId('renders',v.id),{titulo:v.titulo,descripcion:v.descripcion});return {}}},
  eliminarRender:{api:v=>['DELETE','/renders/'+v.id],local:v=>{DB.renders=DB.renders.filter(r=>r.id!==v.id);delete RENDER_MEM[v.id];return {}}},
  cambiarAcceso:{api:v=>['PUT','/clientes/'+v.id+'/acceso',{activo:v.activo}],local:v=>{const x=DB.accesos.find(a=>a.clienteId===v.id);x.activo=v.activo;return {}}}
};
function pick(o,keys){const r={};keys.split(' ').forEach(k=>{if(k in o)r[k]=o[k]});return r}

function planActs(pid,tipo,start){
  return (PLAN[tipo]||[]).map(([n,off,ent,resp])=>({id:uid('a'),proyectoId:pid,nombre:n,responsable:resp||'Gabriela Núñez',fecha:addDays(start,off),estado:'Pendiente',entregable:!!ent}));
}
function seed(){
  const T=today();
  const d={leads:[],clientes:[],proyectos:[],actividades:[],proveedores:[],materiales:[],provProy:[],matProy:[],cotizaciones:[]};
  d.leads=[
   {id:'l1',nombre:'Sofía Rojas Alvarado',telefono:'8890-1122',correo:'sofia.rojas@correo.com',nacionalidad:'Costarricense',servicio:'Diseño de interiores',estado:'Contactado',notas:'Escribió por WhatsApp; apartamento nuevo en Heredia.',creado:addDays(T,-6),convertidoA:null},
   {id:'l2',nombre:'Carlos Vargas Mena',telefono:'7012-4455',correo:'',nacionalidad:'Costarricense',servicio:'Mobiliario a medida',estado:'Nuevo',notas:'Interesado en un escritorio y librero.',creado:addDays(T,-2),convertidoA:null},
   {id:'l3',nombre:'Daniela Jiménez',telefono:'',correo:'dani.jimenez@mail.com',nacionalidad:'Colombiana',servicio:'Remodelación',estado:'Cotización enviada',notas:'Remodelación de baño principal. Cotización enviada por WhatsApp.',creado:addDays(T,-15),convertidoA:null}];
  d.clientes=[
   {id:'c1',nombre:'Laura Méndez Quesada',tipoId:'Cédula',numId:'1-1234-0567',telefono:'8765-4321',correo:'laura.mendez@correo.com',nacionalidad:'Costarricense',creado:addDays(T,-40)},
   {id:'c2',nombre:'Andrew Solís',tipoId:'Pasaporte',numId:'P88123456',telefono:'+1 305 555 0142',correo:'andrew.solis@mail.com',nacionalidad:'Estadounidense',creado:addDays(T,-25)}];
  d.proyectos=[
   {id:'p1',clienteId:'c1',nombre:'Apartamento Escazú',tipo:'Diseño de interiores',descripcion:'Diseño interior completo de apartamento de 2 habitaciones: sala, comedor, cocina y dormitorio principal.',fechaInicio:addDays(T,-20),ubicacion:'Escazú, San José',area:85,estado:'En diseño'},
   {id:'p2',clienteId:'c1',nombre:'Mueble de TV a medida',tipo:'Mobiliario a medida',descripcion:'Mueble flotante de TV con almacenamiento para la sala.',fechaInicio:addDays(T,-15),ubicacion:'Escazú, San José',area:'',estado:'En ejecución'},
   {id:'p3',clienteId:'c2',nombre:'Remodelación de cocina Solís',tipo:'Remodelación',descripcion:'Remodelación de cocina con nueva distribución, muebles y acabados.',fechaInicio:addDays(T,5),ubicacion:'Santa Ana, San José',area:18,estado:'Por iniciar'},
   {id:'p4',clienteId:'c2',nombre:'Anteproyecto casa de playa',tipo:'Anteproyecto',descripcion:'Anteproyecto de vivienda vacacional. Solo trabajo interno del estudio (sin proveedores ni materiales).',fechaInicio:addDays(T,12),ubicacion:'Nosara, Guanacaste',area:160,estado:'Por iniciar'}];
  const a1=planActs('p1','Diseño de interiores',addDays(T,-20)).map(a=>({...a,estado:a.fecha<T?(a.nombre.includes('comentarios')?'Pendiente':'Completada'):(a.nombre.includes('planos')?'En proceso':'Pendiente')}));
  const a2=planActs('p2','Mobiliario a medida',addDays(T,-15)).map(a=>({...a,estado:a.fecha<T?'Completada':(a.nombre==='Fabricación'?'En proceso':'Pendiente')}));
  const a3=planActs('p3','Remodelación',addDays(T,5));
  d.actividades=[...a1,...a2,...a3];
  d.proveedores=[
   {id:'v1',nombre:'Luz & Forma',categorias:['Iluminación'],contacto:'Pamela Ruiz',telefono:'8811-2233',correo:'ventas@luzyforma.cr',ofrece:'Lámparas colgantes, apliques, cintas LED.',notas:'Responde rápido; buena experiencia previa.'},
   {id:'v2',nombre:'Iluminarte',categorias:['Iluminación'],contacto:'Diego Castro',telefono:'2222-3344',correo:'',ofrece:'Iluminación decorativa importada.',notas:'Tiempos de entrega de 3–4 semanas.'},
   {id:'v3',nombre:'Ebanistería Hermanos Mora',categorias:['Mobiliario','Ebanistería'],contacto:'Luis Mora',telefono:'8456-7788',correo:'',ofrece:'Muebles a medida, cocinas, closets.',notas:''},
   {id:'v4',nombre:'Porcelanatos del Valle',categorias:['Acabados','Materiales'],contacto:'Karla Vindas',telefono:'2290-1010',correo:'kvindas@pvalle.cr',ofrece:'Porcelanatos, revestimientos, griferías.',notas:''},
   {id:'v5',nombre:'Constructora Brenes',categorias:['Construcción'],contacto:'Mauricio Brenes',telefono:'8333-9090',correo:'',ofrece:'Obra gris, remodelaciones, demoliciones.',notas:''},
   {id:'v6',nombre:'Casa Mobili',categorias:['Mobiliario'],contacto:'Andrea León',telefono:'4000-1200',correo:'hola@casamobili.cr',ofrece:'Sofás, sillas, mesas de comedor.',notas:''}];
  d.materiales=[
   {id:'m1',nombre:'Lámpara colgante de ratán',modelo:'RT-40',categoria:'Iluminación',unidad:'unidad',precioRef:45000,proveedorIds:['v1','v2'],descripcion:'Diámetro 40 cm.'},
   {id:'m2',nombre:'Porcelanato 60×60 gris cemento',modelo:'PV-6060G',categoria:'Acabados',unidad:'m²',precioRef:12500,proveedorIds:['v4'],descripcion:''},
   {id:'m3',nombre:'Plywood de pino 18 mm',modelo:'',categoria:'Materiales',unidad:'lámina',precioRef:28000,proveedorIds:['v3'],descripcion:''},
   {id:'m4',nombre:'Sofá modular 3 plazas',modelo:'Oslo',categoria:'Mobiliario',unidad:'unidad',precioRef:650000,proveedorIds:['v6'],descripcion:'Tela lino arena.'}];
  d.provProy=[{id:'pp1',proyectoId:'p1',proveedorId:'v1',condicion:'Seleccionado'},{id:'pp2',proyectoId:'p1',proveedorId:'v2',condicion:'Considerado'},{id:'pp3',proyectoId:'p1',proveedorId:'v6',condicion:'Seleccionado'},{id:'pp4',proyectoId:'p2',proveedorId:'v3',condicion:'Seleccionado'},{id:'pp5',proyectoId:'p3',proveedorId:'v4',condicion:'Considerado'},{id:'pp6',proyectoId:'p3',proveedorId:'v5',condicion:'Considerado'}];
  d.matProy=[{id:'mp1',proyectoId:'p1',materialId:'m1',cantidad:3,precioUnit:45000,nota:'Comedor'},{id:'mp2',proyectoId:'p1',materialId:'m4',cantidad:1,precioUnit:650000,nota:''},{id:'mp3',proyectoId:'p2',materialId:'m3',cantidad:4,precioUnit:28000,nota:''}];
  d.cotizaciones=[{id:'q1',proyectoId:'p1',codigo:'COT-2026-014',fecha:addDays(T,-28),monto:1800000,estado:'Aceptada',enlace:'https://www.canva.com/',archivo:''}];
  /* Cuentas de clientes (SC-01). En modo demostración la contraseña se guarda tal cual; en el servidor, cifrada. */
  d.accesos=[{clienteId:'c1',usuario:'cliente',clave:'cliente2026',activo:true}];
  /* Render 360° de ejemplo (SC-02): sala ficticia generada por herramientas/generar_render_ejemplo.py */
  d.renders=[{id:'r1',proyectoId:'p1',titulo:'Sala — propuesta 360°',descripcion:'Render de ejemplo: sala con ventana al jardín y nichos en arco.',archivo:'sala-360.jpg',ancho:2048,alto:1024,tamano:100000,subidoPor:'María José',creado:addDays(T,-3),tieneMini:true,ejemplo:true}];
  return d;
}

/* ================= Acceso ================= */
const P=()=>USER.permisos;
const puedeVer=v=>!!USER&&P().vistas.includes(v);
const can=()=>!!USER&&P().edita==='todo';                       // registrar y modificar todo
const canAct=pid=>can()||(!!USER&&P().edita==='actividades'&&DB.proyectos.some(p=>p.id===pid)); // actividades de sus proyectos
const esAdmin=()=>!!USER&&P().admin;                               // funciones de administración
const esCliente=()=>!!USER&&P().alcance==='propios';               // SC-01: cliente con acceso
function denegar(){toast('Acción no autorizada para su rol ('+USER.rol+').','err');return false}
function needEdit(){return can()||denegar()}
/* Permiso que exige cada botón; aplicarPermisos() quita de la pantalla lo que el rol no puede usar (CU-17) */
const PERMISO_BOTON={reset:'admin',cargarPlan:'todo',nuevaAct:'actProy',verAct:'actAct'};
function permitido(accion,id){
  const req=PERMISO_BOTON[accion]||'todo';
  if(req==='admin')return esAdmin();
  if(req==='actProy')return canAct(id);
  if(req==='actAct')return canAct((byId('actividades',id)||{}).proyectoId);
  return can();
}
const ACCIONES_DE_NAVEGACION=new Set(['tab','leadF','provCat','pfClear','calMove','logout','editLead','verAct','verRender']);
function aplicarPermisos(raiz){
  raiz.querySelectorAll('button[data-act]').forEach(b=>{const a=b.dataset.act;if(!ACCIONES_DE_NAVEGACION.has(a)&&!permitido(a,b.dataset.id))b.remove();else if(a==='verAct'&&!permitido(a,b.dataset.id))b.remove()});
  raiz.querySelectorAll('tr[data-act="editMat"]').forEach(t=>{if(!can()){t.removeAttribute('data-act');t.classList.remove('click')}});
  raiz.querySelectorAll('select[data-chg="estadoProy"]').forEach(x=>{if(!can())x.remove()});
  raiz.querySelectorAll('select[data-chg="condProv"]').forEach(x=>{if(!can())x.disabled=true});
  raiz.querySelectorAll('select[data-chg="estadoAct"]').forEach(x=>{if(!permitido('verAct',x.dataset.id))x.disabled=true});
  raiz.querySelectorAll('[data-cot-material],[data-cot-cantidad]').forEach(x=>{if(!can())x.disabled=true});
}
/* Al ingresar: el calendario muestra primero las actividades propias (salvo la propietaria) */
function alIngresar(){ui.calResp=USER.rolCodigo==='propietaria'?'':USER.nombre;vistaDemo()}

/* ================= Modal, formularios y mensajes ================= */
function toast(msg,kind){const t=document.createElement('div');t.className='toast '+(kind||'ok');t.textContent=msg;$('#toasts').appendChild(t);setTimeout(()=>t.classList.add('out'),3400);setTimeout(()=>t.remove(),3900)}
function modal(html,wide){$('#modal-root').innerHTML=`<div class="overlay"><div class="dialog ${wide?'wide':''}" role="dialog" aria-modal="true"><button class="x" data-close aria-label="Cerrar">×</button>${html}</div></div>`;return $('#modal-root .dialog')}
function closeModal(){if(typeof VISOR!=='undefined'&&VISOR){VISOR.destruir();VISOR=null}$('#modal-root').innerHTML=''}
function confirmBox(title,msg,yes,onYes){const d=modal(`<h2>${esc(title)}</h2><p>${msg}</p><div class="actions"><button class="btn ghost" data-close>Cancelar</button><button class="btn danger" id="cy">${esc(yes)}</button></div>`);d.querySelector('#cy').onclick=async e=>{e.target.disabled=true;await onYes();closeModal()}}
function infoBox(title,msg,btns){modal(`<h2>${esc(title)}</h2><p>${msg}</p><div class="actions">${btns||'<button class="btn" data-close>Entendido</button>'}</div>`)}

const ov=o=>Array.isArray(o)?o:[o,o];
function fieldHtml(f){
  const req=f.req?' <i>*</i>':'';
  const help=f.help?`<small class="help">${f.help}</small>`:'';
  const cls='field'+(f.full?' full':'');
  if(f.type==='checkbox') return `<div class="${cls} full" data-k="${f.k}"><label class="chk"><input type="checkbox" name="${f.k}"> <span>${esc(f.label)}${req}</span></label>${help}<small class="ferr"></small></div>`;
  let inp;
  switch(f.type){
    case 'select':inp=`<select name="${f.k}"><option value="">Seleccione…</option>${(f.options||[]).map(o=>opt(o)).join('')}</select>`;break;
    case 'textarea':inp=`<textarea name="${f.k}" rows="3" placeholder="${esc(f.ph||'')}"></textarea>`;break;
    case 'multi':inp=(f.options||[]).length?`<div class="checks">${f.options.map(o=>{const [v,l]=ov(o);return `<label class="chk"><input type="checkbox" name="${f.k}" value="${esc(v)}"> <span>${esc(l)}</span></label>`}).join('')}</div>`:`<div class="empty" style="padding:12px">${f.empty||'No hay opciones disponibles.'}</div>`;break;
    case 'file':inp=`<input type="file" name="${f.k}" accept="${esc(f.accept||'')}">${f.current?`<small class="help">Archivo actual: ${esc(f.current)}</small>`:''}`;break;
    default:inp=`<input type="${f.type||'text'}" name="${f.k}" ${f.type==='number'?'step="any" min="0"':''} placeholder="${esc(f.ph||'')}">`;
  }
  return `<div class="${cls}" data-k="${f.k}"><label>${esc(f.label)}${req}</label>${inp}${help}<small class="ferr"></small></div>`;
}
function setVals(form,fields,vals){fields.forEach(f=>{const v=vals[f.k];if(v==null)return;const els=form.querySelectorAll(`[name="${f.k}"]`);
  if(f.type==='multi')els.forEach(e=>e.checked=(v||[]).includes(e.value));
  else if(f.type==='checkbox'){if(els[0])els[0].checked=!!v}
  else if(f.type!=='file'&&els[0])els[0].value=v})}
function readForm(form,fields){const v={};fields.forEach(f=>{const els=form.querySelectorAll(`[name="${f.k}"]`);
  if(f.type==='multi')v[f.k]=[...els].filter(e=>e.checked).map(e=>e.value);
  else if(f.type==='checkbox')v[f.k]=!!(els[0]&&els[0].checked);
  else if(f.type==='file'){const fi=els[0]&&els[0].files&&els[0].files[0];v[f.k]=fi?fi.name:(f.current||'');v[f.k+'__file']=fi||null}
  else v[f.k]=(els[0]?els[0].value:'').trim()});return v}
function validate(fields,v){const e={};fields.forEach(f=>{const val=v[f.k];
  const empty=f.type==='multi'?!(val&&val.length):f.type==='checkbox'?!val:val==='';
  if(f.req&&empty){e[f.k]=f.type==='checkbox'?'Debe confirmarse para continuar.':f.type==='multi'?'Seleccione al menos una opción.':'Este campo es obligatorio.';return}
  if(!empty){
    if(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val))e[f.k]='Formato de correo inválido (ej. nombre@dominio.com).';
    else if(f.type==='tel'&&!(/^\+?[\d\s()-]+$/.test(val)&&digits(val).length>=8&&digits(val).length<=15))e[f.k]='Teléfono inválido: use al menos 8 dígitos (ej. 8421-1692).';
    else if(f.type==='number'&&(isNaN(+val)||+val<0))e[f.k]='Debe ser un número mayor o igual a 0.';
    else if(f.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(val)||isNaN(parseD(val))))e[f.k]='Fecha inválida.';
  }
  if(!e[f.k]&&f.check){const m=f.check(val,v);if(m)e[f.k]=m}
});return e}
function showErrs(form,errs){
  form.querySelectorAll('.field').forEach(el=>{el.classList.remove('bad');const s=el.querySelector('.ferr');if(s)s.textContent=''});
  const ks=Object.keys(errs);let first=null;const sueltos=[];
  ks.forEach(k=>{const el=form.querySelector(`.field[data-k="${k}"]`);if(!el){sueltos.push(errs[k]);return}el.classList.add('bad');el.querySelector('.ferr').textContent=errs[k];if(!first)first=el});
  const sum=form.querySelector('.errsum');sum.hidden=false;
  sum.textContent=`No se pudo guardar: revise ${ks.length===1?'el campo marcado':'los '+ks.length+' campos marcados'}. Los demás datos ingresados se conservaron.`+(sueltos.length?' '+sueltos.join(' '):'');
  if(first){const i=first.querySelector('input,select,textarea');if(i)i.focus()}
}
/* cfg: {title,intro,fields,values,submit,extra,wide,onSubmit(v) => Promise<{errors}|{msg,go}|{cancel}>} */
function openForm(cfg){
  const d=modal(`<h2>${esc(cfg.title)}</h2>${cfg.intro?`<p class="intro">${cfg.intro}</p>`:''}
   <form class="fm" novalidate>${cfg.fields.map(fieldHtml).join('')}<div class="errsum" hidden></div>
   <div class="actions">${cfg.extra?`<span class="left">${cfg.extra}</span>`:''}<button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn" type="submit">${esc(cfg.submit||'Guardar')}</button></div></form>`,cfg.wide);
  const form=d.querySelector('form');const btn=form.querySelector('button[type=submit]');
  setVals(form,cfg.fields,cfg.values||{});
  form.addEventListener('submit',async e=>{e.preventDefault();if(btn.disabled)return;
    const v=readForm(form,cfg.fields);const errs=validate(cfg.fields,v);
    if(Object.keys(errs).length){showErrs(form,errs);return}
    btn.disabled=true;let r;
    try{r=await cfg.onSubmit(v)}finally{btn.disabled=false}
    if(r&&r.errors){showErrs(form,r.errors);return}
    closeModal();if(r&&r.cancel){render();return}
    if(r&&r.msg)toast(r.msg);
    if(r&&r.go&&location.hash!==r.go)location.hash=r.go;else render();
  });
  const first=form.querySelector('input:not([type=checkbox]):not([type=file]),select,textarea');if(first)first.focus();
}

/* ================= Validaciones de dominio (mismas reglas que servidor/logica.py) ================= */
function idCheck(tipoKey){return (val,v)=>{const t=v[tipoKey];if(!val||!t)return '';
  if(t==='Cédula'&&digits(val).length!==9)return 'La cédula debe tener 9 dígitos (ej. 1-1234-0567).';
  if(t==='Pasaporte'&&!/^[A-Za-z0-9]{6,20}$/.test(val.replace(/[\s-]/g,'')))return 'El pasaporte debe tener entre 6 y 20 letras o números.';
  return ''}}
const normId=(t,n)=>t+':'+(t==='Cédula'?digits(n):String(n).replace(/[\s-]/g,'').toUpperCase());
function idDuplicado(t,n,exceptId){const k=normId(t,n);return DB.clientes.find(c=>c.id!==exceptId&&normId(c.tipoId,c.numId)===k)}
const contactoCheck=(val,v)=>(!v.telefono&&!v.correo)?'Indique al menos un medio de contacto: teléfono o correo.':'';
function personaDuplicada(v,exceptLead,exceptCli){
  const n=norm(v.nombre),t=digits(v.telefono),c=norm(v.correo);
  const same=p=>(n&&norm(p.nombre)===n)||(t&&t.length>=8&&digits(p.telefono)===t)||(c&&norm(p.correo)===c);
  const l=DB.leads.find(p=>p.id!==exceptLead&&!p.convertidoA&&same(p));if(l)return `Ya existe como potencial cliente: «${l.nombre}».`;
  const k=DB.clientes.find(p=>p.id!==exceptCli&&same(p));if(k)return `Ya existe como cliente: «${k.nombre}».`;
  return ''}
function leerBase64(file){return new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]||'');r.onerror=()=>ko(r.error);r.readAsDataURL(file)})}

/* ================= Helpers de vista ================= */
const cliName=id=>(byId('clientes',id)||{}).nombre||'—';
const projActs=pid=>DB.actividades.filter(a=>a.proyectoId===pid).sort(byFecha);
function prog(pid){const p=byId('proyectos',pid)||{};if(p.avance){const {hechas:d,total:t}=p.avance;return t?{d,t,pct:Math.round(d*100/t)}:null}  // vista del cliente: avance calculado con todas las actividades
  const a=projActs(pid);if(!a.length)return null;const d=a.filter(x=>x.estado==='Completada').length;return {d,t:a.length,pct:Math.round(d*100/a.length)}}
function progHtml(pid){const p=prog(pid);return p?`<div class="prog"><div style="width:${p.pct}%"></div></div><small class="muted">${p.d}/${p.t} actividades · ${p.pct}%</small>`:'<small class="muted">Sin actividades</small>'}
function whenB(a){if(a.estado==='Completada'||!a.fecha)return '';const d=diff(a.fecha);
  if(d<0)return badge('Atrasada '+(-d)+' d','err');if(d===0)return badge('Hoy','coral');if(d===1)return badge('Mañana','warn');if(d<=7)return badge('En '+d+' días','warn');return ''}
function actRow(a,showProj){const p=byId('proyectos',a.proyectoId)||{};const dt=parseD(a.fecha);const late=a.estado!=='Completada'&&a.fecha<today();
  return `<div class="arow ${late?'late':''}" data-act="verAct" data-id="${a.id}"><div class="dpill"><b>${dt.getDate()}</b><small>${MES[dt.getMonth()]}</small></div>
  <div class="grow"><b>${esc(a.nombre)}</b><small>${showProj?esc(p.nombre)+' · ':''}${esc(a.responsable)}${a.entregable?' · <span class="ent">entregable</span>':''}</small></div>${whenB(a)} ${badge(a.estado,KIND_ACT[a.estado])}</div>`}
function ph(title,sub,acts,crumb){return `<div class="ph"><div>${crumb?`<div class="crumb">${crumb}</div>`:''}<h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="acts">${acts||''}</div></div>`}
const emptyBox=t=>`<div class="empty">${t}</div>`;

/* ================= Vistas ================= */
function vLogin(){
  return `<div class="login"><div class="art"><div class="sello">${marca()}</div>
  <div><div class="eyebrow">arquitectura + diseño interior</div><h1>clientes, proyectos y proveedores en <b>un solo lugar</b>.</h1><p>Prototipo funcional basado en el ERS v1.0 — IC5821 Requerimientos de Software, TEC · Grupo 01.</p></div>
  <small class="muted">${MODO==='api'?'Conectado a la base de datos del prototipo.':'Modo demostración: los datos se guardan solo en este navegador.'} Datos de ejemplo ficticios.</small>
  <div class="arcos-fondo">${arcos(380,'#b49372')}</div></div>
  <div class="frm"><form class="box" id="loginf" novalidate><div class="eyebrow">bienvenida</div><h2>Ingresar</h2><p class="muted" style="margin:0">Acceso exclusivo para el personal del estudio.</p>
   <div class="field"><label>Usuario</label><input name="u" autocomplete="username"></div>
   <div class="field"><label>Contraseña</label><input name="p" type="password" autocomplete="current-password"></div>
   <div class="msg"></div>
   <button class="btn" style="width:100%;margin-top:16px;padding:11px;justify-content:center">Ingresar</button>
   <div class="demo"><b style="font-weight:500">Usuarios de demostración</b> <span class="muted">(clic para completar)</span><table>
   ${USERS_DEMO.map(u=>`<tr data-fill="${u.u}|${u.p}"><td>${esc(u.nombre)}<br><small class="muted">${esc(u.rol)}</small></td><td><code>${u.u}</code></td><td><code>${u.p}</code></td></tr>`).join('')}
   <tr data-fill="cliente|cliente2026"><td>Laura Méndez Quesada<br><small class="muted">Cliente (cuenta de ejemplo)</small></td><td><code>cliente</code></td><td><code>cliente2026</code></td></tr></table>
   <small class="muted">Cada rol ve una aplicación distinta: la propietaria administra todo, la arquitecta trabaja sobre todos los proyectos y el cliente solo consulta el avance de sus propios proyectos.</small></div>
  </form></div></div>`}

const NAV=[['inicio','Inicio'],['potenciales','Potenciales clientes'],['clientes','Clientes'],['proyectos','Proyectos'],['calendario','Calendario'],['renders','Renders 360°'],['proveedores','Proveedores'],['materiales','Materiales'],['acerca','Acerca del prototipo']];
const PARENT={cliente:'clientes',proyecto:'proyectos',proveedor:'proveedores',buscar:''};
function shell(view,content){
  const act=PARENT[view]!==undefined?PARENT[view]:view;
  return `<div class="layout"><aside class="side"><div class="sello">${marca()}</div>
  <nav>${NAV.filter(([k])=>puedeVer(k)).map(([k,l])=>`<a href="#${k}" class="${act===k?'on':''}"><span>${esCliente()&&k==='proyectos'?'Mis proyectos':l}</span></a>`).join('')}</nav>
  <div class="side-foot"><div class="modo ${MODO}"><i></i><span>${MODO==='api'?'Base de datos SQLite conectada':'Modo demostración (datos en este navegador)'}</span></div>
  <button class="linkbtn" data-act="reset">Restablecer datos de ejemplo</button></div></aside>
  <div class="main"><header class="top"><form class="search" data-search ${puedeVer('buscar')?'':'style="visibility:hidden"'}><input name="q" placeholder="${P().comercial?'Buscar clientes, proyectos, proveedores, materiales…':'Buscar proyectos, proveedores, materiales…'}" value="${esc(ui.q)}" aria-label="Búsqueda general"></form>
  <div class="user"><span class="avatar">${USER.ini}</span><div><b>${esc(USER.nombre)}</b><small>${esc(USER.rol)}</small></div><button class="btn ghost sm" data-act="logout">Salir</button></div></header>
  <main id="view">${content}</main></div></div>`}

function vInicio(){
  /* Cada rol ve su propio inicio (CU-17: cada usuario accede a lo que corresponde a su rol) */
  if(esCliente())return vInicioCliente();
  const T=today(),yo=USER.nombre,rol=USER.rolCodigo;
  const abiertos=DB.proyectos.filter(p=>!['Finalizado','Cancelado'].includes(p.estado)).map(p=>p.id);
  const pend=DB.actividades.filter(a=>a.estado!=='Completada'&&abiertos.includes(a.proyectoId));
  const mias=pend.filter(a=>a.responsable===yo);
  const base=rol==='propietaria'?pend:mias;
  const atras=base.filter(a=>a.fecha<T).sort(byFecha);
  const prox=base.filter(a=>a.fecha>=T&&diff(a.fecha)<=(rol==='propietaria'?14:30)).sort(byFecha);
  const entProx=prox.filter(a=>a.entregable&&diff(a.fecha)<=14);
  const activos=DB.proyectos.filter(p=>ACTIVOS.includes(p.estado));
  const leads=DB.leads.filter(l=>!l.convertidoA&&l.estado!=='No continuó');
  const h=new Date().getHours();const sal=h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';
  const fecha=new Date().toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const kpi=(n,l,href,c)=>`<a class="kpi ${c||''}" href="${href}"><div class="n">${n}</div><span>${l}</span></a>`;
  const urg=[...atras,...prox].slice(0,9);
  const listaProy=ps=>ps.length?`<div class="plist">${ps.map(p=>{const nx=projActs(p.id).find(a=>a.estado!=='Completada'&&(rol==='propietaria'||a.responsable===yo))||projActs(p.id).find(a=>a.estado!=='Completada');
    return `<a class="pitem" href="#proyecto-${p.id}"><div><b>${esc(p.nombre)}</b><small>${esc(cliName(p.clienteId))} · ${esc(p.tipo)}</small><br>${badge(p.estado,KIND_PROY[p.estado])} ${nx?`<small>Siguiente: ${esc(nx.nombre)} (${fd(nx.fecha)})</small>`:''}</div><div>${progHtml(p.id)}</div></a>`}).join('')}</div>`:emptyBox('No hay proyectos activos.');
  const acciones=`<button class="btn ghost" data-act="nuevoLead">+ Potencial cliente</button><button class="btn" data-act="nuevoProyecto">+ Nuevo proyecto</button>`;
  const cab=sub=>ph(`${sal}, <b>${esc(yo.split(' ')[0])}</b>`,fecha.charAt(0).toUpperCase()+fecha.slice(1)+(sub?' · '+sub:''),acciones);
  if(rol==='propietaria')return cab('vista general del estudio')+
  `<div class="kpis">${kpi(activos.length,'Proyectos activos','#proyectos')}${kpi(pend.length,'Tareas pendientes del estudio','#calendario')}${kpi(entProx.length,'Entregables en los próximos 14 días','#calendario','madera')}${kpi(atras.length,'Actividades atrasadas','#calendario',atras.length?'alerta':'')}${kpi(leads.length,'Potenciales clientes en seguimiento','#potenciales')}</div>
  <div class="grid2"><section class="card"><h3>Urgente y próximo en el estudio</h3>${urg.length?`<div class="alist">${urg.map(a=>actRow(a,true)).join('')}</div>`:emptyBox('No hay actividades pendientes en los próximos 14 días.')}</section>
  <section class="card"><h3>Proyectos activos</h3>${listaProy(activos)}</section></div>
  <p class="note"><b>Su vista:</b> como propietaria ve todo el estudio: proyectos, tareas de todo el equipo, entregables próximos, urgencias y potenciales clientes. También administra el sistema.</p>`;
  if(rol==='arquitecta')return cab('sus actividades primero')+
  `<div class="kpis">${kpi(mias.length,'Mis actividades pendientes','#calendario')}${kpi(entProx.length,'Mis entregables en los próximos 14 días','#calendario','madera')}${kpi(atras.length,'Mis actividades atrasadas','#calendario',atras.length?'alerta':'')}${kpi(activos.length,'Proyectos activos del estudio','#proyectos')}${kpi(leads.length,'Potenciales clientes en seguimiento','#potenciales')}</div>
  <div class="grid2"><section class="card"><h3>Mis actividades</h3>${urg.length?`<div class="alist">${urg.map(a=>actRow(a,true)).join('')}</div>`:emptyBox('No tiene actividades pendientes en los próximos 30 días.')}</section>
  <section class="card"><h3>Proyectos activos del estudio</h3>${listaProy(activos)}</section></div>
  <p class="note"><b>Su vista:</b> como arquitecta ve primero las actividades que tiene asignadas, como planos y renders. Puede consultar y modificar toda la información del estudio.</p>`;
  const misProy=DB.proyectos.filter(p=>!['Finalizado','Cancelado'].includes(p.estado));
  return ph(`${sal}, <b>${esc(yo.split(' ')[0])}</b>`,fecha.charAt(0).toUpperCase()+fecha.slice(1)+' · sus proyectos y actividades','')+
  `<div class="kpis">${kpi(misProy.length,'Proyectos en los que participo','#proyectos')}${kpi(mias.length,'Mis actividades pendientes','#calendario')}${kpi(entProx.length,'Mis entregables en los próximos 14 días','#calendario','madera')}${kpi(atras.length,'Mis actividades atrasadas','#calendario',atras.length?'alerta':'')}</div>
  <div class="grid2"><section class="card"><h3>Mis actividades</h3>${urg.length?`<div class="alist">${urg.map(a=>actRow(a,true)).join('')}</div>`:emptyBox('No tiene actividades pendientes en los próximos 30 días.')}</section>
  <section class="card"><h3>Mis proyectos</h3>${listaProy(misProy)}</section></div>
  <p class="note"><b>Su vista:</b> como personal interno ve solo los proyectos en los que participa y puede registrar o actualizar sus actividades. La información de clientes, potenciales clientes y cotizaciones no está disponible para su rol.</p>`}

/* ---------- Portal del cliente (SC-01 · RF-19 · CU-19) ---------- */
function vInicioCliente(){
  const h=new Date().getHours();const sal=h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';
  const ps=DB.proyectos;const T=today();
  const prox=DB.actividades.filter(a=>a.estado!=='Completada').sort(byFecha);
  return ph(`${sal}, <b>${esc(USER.nombre.split(' ')[0])}</b>`,'Aquí puede seguir el avance de sus proyectos con Anémona Design Studio.','')+
  (ps.length?`<div class="pcards">${ps.map(p=>{const nx=prox.find(a=>a.proyectoId===p.id);
    return `<a class="pcard" href="#proyecto-${p.id}"><div class="tags">${badge(p.estado,KIND_PROY[p.estado])}${badge(p.tipo,'mute')}</div><b>${esc(p.nombre)}</b><small class="muted">${esc(p.ubicacion||'')} · inicio ${fd(p.fechaInicio)}</small>${progHtml(p.id)}
    ${nx?`<small>Próximo entregable: <b>${esc(nx.nombre)}</b> · ${fd(nx.fecha)}${nx.fecha<T?' '+badge('En revisión','warn'):''}</small>`:'<small class="muted">Sin entregables pendientes</small>'}</a>`}).join('')}</div>`
  :emptyBox('Aún no hay proyectos para mostrar.'))+
  `<p class="note"><b>Su acceso:</b> puede consultar el estado, el avance, los entregables y las cotizaciones de sus proyectos. Para cualquier cambio, comuníquese con el estudio.</p>`}
function vProyectoCliente(p){
  const ents=projActs(p.id);const cots=DB.cotizaciones.filter(c=>c.proyectoId===p.id);const T=today();
  return ph(esc(p.nombre),esc(p.tipo),badge(p.estado,KIND_PROY[p.estado]),`<a href="#proyectos">mis proyectos</a> / detalle`)+
  `<div class="stack"><section class="card"><h3>Avance del proyecto</h3><div class="dgrid">
   <div><small>Estado</small><span>${badge(p.estado,KIND_PROY[p.estado])}</span></div><div><small>Fecha de inicio</small><span>${fd(p.fechaInicio)}</span></div><div><small>Avance</small><span>${progHtml(p.id)}</span></div>
   <div><small>Ubicación</small><span>${esc(p.ubicacion||'—')}</span></div><div><small>Área</small><span>${p.area!==''&&p.area!=null?esc(p.area)+' m²':'—'}</span></div>
   <div class="full"><small>Descripción</small><span>${esc(p.descripcion)}</span></div></div></section>
  <section class="card"><h3>Entregables</h3>${ents.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Entregable</th><th>Fecha prevista</th><th>Estado</th></tr></thead><tbody>
   ${ents.map(a=>`<tr><td><b>${esc(a.nombre)}</b></td><td>${fd(a.fecha)}</td><td>${a.estado==='Completada'?badge('Entregado','ok'):a.fecha<T?badge('En revisión','warn'):badge(a.estado==='En proceso'?'En proceso':'Programado',a.estado==='En proceso'?'warn':'info')}</td></tr>`).join('')}</tbody></table></div>`:emptyBox('Este proyecto aún no tiene entregables programados.')}</section>
  <section class="card"><h3>Cotizaciones</h3>${cots.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Código</th><th>Fecha</th><th class="num">Monto</th><th>Estado</th><th>Documento</th></tr></thead><tbody>
   ${cots.map(c=>`<tr><td><b>${esc(c.codigo)}</b></td><td>${fd(c.fecha)}</td><td class="num">${money(c.monto)}</td><td>${badge(c.estado,KIND_COT[c.estado])}</td>
    <td>${c.tieneArchivo&&MODO==='api'?`<a href="/api/cotizaciones/${c.id}/archivo" target="_blank" rel="noopener"><small>Abrir documento</small></a> `:''}${c.enlace?`<a href="${esc(c.enlace)}" target="_blank" rel="noopener"><small>Ver cotización</small></a>`:''}</td></tr>`).join('')}</tbody></table></div>`:emptyBox('No hay cotizaciones registradas para este proyecto.')}</section></div>`}

/* ---------- Potenciales clientes RF-01, RF-02, RF-03 ---------- */
function vPotenciales(){
  const f=ui.leadF;
  let rows=DB.leads.slice().sort((a,b)=>(b.creado||'').localeCompare(a.creado||''));
  if(f==='activos')rows=rows.filter(l=>!l.convertidoA&&l.estado!=='No continuó');
  else if(f==='convertidos')rows=rows.filter(l=>l.convertidoA);
  else if(f!=='todos')rows=rows.filter(l=>!l.convertidoA&&l.estado===f);
  const chips=[['activos','En seguimiento'],...EST_LEAD.map(e=>[e,e]),['convertidos','Convertidos'],['todos','Todos']];
  return ph('Potenciales <b>clientes</b>','Personas interesadas que aún no han firmado contrato ni realizado el primer depósito.',`<button class="btn" data-act="nuevoLead">+ Registrar potencial cliente</button>`)+
  `<div class="filters"><div class="chips">${chips.map(([k,l])=>`<button class="chip ${f===k?'on':''}" data-act="leadF" data-id="${esc(k)}">${esc(l)}</button>`).join('')}</div></div>
  <div class="card tblwrap">${rows.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Contacto</th><th>Nacionalidad</th><th>Servicio de interés</th><th>Estado</th><th>Registro</th><th></th></tr></thead><tbody>
  ${rows.map(l=>`<tr class="click" data-act="editLead" data-id="${l.id}"><td><b>${esc(l.nombre)}</b>${l.notas?`<br><small class="muted">${esc(l.notas.slice(0,70))}${l.notas.length>70?'…':''}</small>`:''}</td>
   <td>${esc(l.telefono||'')}${l.telefono&&l.correo?'<br>':''}<small>${esc(l.correo||'')}</small></td><td>${esc(l.nacionalidad||'—')}</td><td>${esc(l.servicio)}</td>
   <td>${l.convertidoA?badge('Convertido','ok'):badge(l.estado,KIND_LEAD[l.estado])}</td><td><small>${fd(l.creado)}</small></td>
   <td class="num">${l.convertidoA?`<a class="btn ghost sm" href="#cliente-${l.convertidoA}">Ver cliente</a>`:`<button class="btn sm madera" data-act="convertir" data-id="${l.id}">Convertir a cliente</button>`}</td></tr>`).join('')}
  </tbody></table>`:emptyBox('No hay potenciales clientes con este filtro.')}</div>
  <p class="note"><b>Regla de negocio (minuta 01):</b> una persona pasa a ser cliente cuando firma el contrato y realiza el primer depósito. Al convertirla se conservan sus datos de contacto y no se crea un registro duplicado.</p>`}
const leadFields=()=>[
 {k:'nombre',label:'Nombre completo',req:true,full:true},
 {k:'telefono',label:'Teléfono',type:'tel',ph:'8421-1692',check:contactoCheck,help:'Al menos un medio de contacto.'},
 {k:'correo',label:'Correo electrónico',type:'email',ph:'nombre@correo.com'},
 {k:'nacionalidad',label:'Nacionalidad',ph:'Costarricense'},
 {k:'servicio',label:'Servicio de interés',type:'select',options:TIPOS,req:true},
 {k:'estado',label:'Estado de seguimiento',type:'select',options:EST_LEAD,req:true},
 {k:'notas',label:'Notas',type:'textarea',full:true,ph:'Canal de contacto, necesidades iniciales…'}];
function formLead(l){
  if(!needEdit())return;
  openForm({title:l?'Potencial cliente':'Registrar potencial cliente',fields:leadFields(),values:l||{estado:'Nuevo'},submit:l?'Guardar cambios':'Registrar',
   extra:l&&!l.convertidoA?`<button type="button" class="btn madera" data-act="convertir" data-id="${l.id}">Convertir a cliente</button>`:'',
   onSubmit:async v=>{
    if(l){const r=await op('editarLead',{...v,id:l.id});return r.errors||r.cancel?r:{msg:'Cambios guardados.'}}
    const r=await op('crearLead',v);if(r.errors||r.cancel)return r;ui.leadF='activos';return {msg:'Potencial cliente registrado.',go:'#potenciales'}}});
}
function formConvertir(l){
  if(!needEdit())return;
  const f=[
   {k:'tipoId',label:'Tipo de identificación',type:'select',options:['Cédula','Pasaporte'],req:true},
   {k:'numId',label:'Número de identificación',req:true,check:idCheck('tipoId'),ph:'1-1234-0567'},
   {k:'contrato',label:'Confirmo que firmó el contrato y realizó el primer depósito',type:'checkbox',req:true,help:'Condición para considerar a la persona como cliente (minuta 01, tema 2).'}];
  openForm({title:'Convertir en cliente',intro:`Se conservarán los datos de <b>${esc(l.nombre)}</b>: ${esc([l.telefono,l.correo].filter(Boolean).join(' · '))}${l.nacionalidad?' · '+esc(l.nacionalidad):''}.`,fields:f,submit:'Convertir',
   onSubmit:async v=>{const r=await op('convertir',{...v,id:l.id});if(r.errors||r.cancel)return r;return {msg:`${l.nombre} ahora es cliente.`,go:'#cliente-'+r.id}}});
}

/* ---------- Clientes RF-04 ---------- */
function vClientes(){
  const rows=DB.clientes.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return ph('<b>Clientes</b>','Personas con contrato firmado. Cada cliente puede tener varios proyectos.',`<button class="btn" data-act="nuevoCliente">+ Registrar cliente</button>`)+
  `<div class="card tblwrap">${rows.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Identificación</th><th>Contacto</th><th>Nacionalidad</th><th class="num">Proyectos</th></tr></thead><tbody>
  ${rows.map(c=>{const n=DB.proyectos.filter(p=>p.clienteId===c.id).length;return `<tr class="click" data-goto="#cliente-${c.id}"><td><b>${esc(c.nombre)}</b></td><td>${esc(c.tipoId)} ${esc(c.numId)}</td><td>${esc(c.telefono||'')}<br><small>${esc(c.correo||'')}</small></td><td>${esc(c.nacionalidad||'—')}</td><td class="num">${n}</td></tr>`}).join('')}
  </tbody></table>`:emptyBox('Aún no hay clientes registrados.')}</div>
  <p class="note">La eliminación de clientes queda fuera del alcance de esta versión.</p>`}
const clienteFields=()=>[
 {k:'nombre',label:'Nombre completo',req:true,full:true},
 {k:'tipoId',label:'Tipo de identificación',type:'select',options:['Cédula','Pasaporte'],req:true},
 {k:'numId',label:'Número de identificación',req:true,check:idCheck('tipoId'),ph:'1-1234-0567'},
 {k:'telefono',label:'Teléfono',type:'tel',check:contactoCheck,help:'Al menos un medio de contacto.'},
 {k:'correo',label:'Correo electrónico',type:'email'},
 {k:'nacionalidad',label:'Nacionalidad'}];
function formCliente(c){
  if(!needEdit())return;
  openForm({title:c?'Editar cliente':'Registrar cliente',fields:clienteFields(),values:c||{},submit:c?'Guardar cambios':'Registrar',
   onSubmit:async v=>{
    if(c){const r=await op('editarCliente',{...v,id:c.id});return r.errors||r.cancel?r:{msg:'Cliente actualizado.'}}
    const r=await op('crearCliente',v);if(r.errors||r.cancel)return r;return {msg:'Cliente registrado.',go:'#cliente-'+r.id}}});
}
function vCliente(id){
  const c=byId('clientes',id);if(!c)return notFound('cliente');
  const ps=DB.proyectos.filter(p=>p.clienteId===id);
  const lead=c.origenLead&&byId('leads',c.origenLead);
  return ph(esc(c.nombre),`${esc(c.tipoId)} ${esc(c.numId)}`,`<button class="btn ghost" data-act="editCliente" data-id="${id}">Editar</button><button class="btn" data-act="nuevoProyecto" data-id="${id}">+ Nuevo proyecto</button>`,`<a href="#clientes">clientes</a> / ficha`)+
  `<div class="stack"><section class="card"><h3>Datos del cliente</h3><div class="dgrid">
   <div><small>Teléfono</small><span>${esc(c.telefono||'—')}</span></div><div><small>Correo</small><span>${esc(c.correo||'—')}</span></div><div><small>Nacionalidad</small><span>${esc(c.nacionalidad||'—')}</span></div>
   <div><small>Cliente desde</small><span>${fd(c.creado)}</span></div><div class="full"><small>Origen</small><span>${lead?`Convertido desde potencial cliente (registrado el ${fd(lead.creado)}, interés: ${esc(lead.servicio)})`:'Registro directo'}</span></div></div></section>
  <section class="card"><h3>Proyectos del cliente</h3>${ps.length?projTable(ps,false):emptyBox('Este cliente aún no tiene proyectos.')}</section>
  ${tarjetaAcceso(c)}</div>`}
/* SC-01 / RF-18: cuenta con la que el cliente consulta el avance de sus proyectos */
function tarjetaAcceso(c){
  const a=(DB.accesos||[]).find(x=>x.clienteId===c.id);
  const estado=!a?`<p style="margin:0 0 12px">${badge('Sin acceso','mute')} Este cliente todavía no tiene cuenta para consultar sus proyectos.</p><button class="btn madera" data-act="darAcceso" data-id="${c.id}">Dar acceso</button>`
   :a.activo?`<p style="margin:0 0 12px">${badge('Acceso activo','ok')} Usuario: <code>${esc(a.usuario)}</code>. Ve el estado, el avance, los entregables y las cotizaciones de sus proyectos.</p><button class="btn ghost" data-act="cambiarAcceso" data-id="${c.id}">Desactivar acceso</button>`
   :`<p style="margin:0 0 12px">${badge('Acceso desactivado','err')} Usuario: <code>${esc(a.usuario)}</code>. No puede ingresar.</p><button class="btn ghost" data-act="cambiarAcceso" data-id="${c.id}">Reactivar acceso</button>`;
  return `<section class="card"><h3>Acceso del cliente</h3>${estado}<p class="note" style="margin-bottom:0">El cliente no ve proveedores, materiales, costos ni actividades internas del estudio.</p></section>`}
function formAcceso(c){
  if(!needEdit())return;
  openForm({title:'Dar acceso a '+c.nombre,intro:'El cliente podrá ingresar para consultar el estado, el avance, los entregables y las cotizaciones de sus proyectos. No podrá modificar nada.',
   fields:[{k:'usuario',label:'Nombre de usuario',req:true,ph:'laura.mendez',help:'De 3 a 30 letras minúsculas, números, punto o guion.',check:v=>/^[a-z0-9._-]{3,30}$/.test(v.toLowerCase())?'':'Use de 3 a 30 letras minúsculas, números, punto, guion o guion bajo.'},
     {k:'clave',label:'Contraseña inicial',type:'password',req:true,help:'Al menos 8 caracteres. Entréguela al cliente por un medio privado.',check:v=>v.length<8?'La contraseña debe tener al menos 8 caracteres.':''}],
   submit:'Crear acceso',
   onSubmit:async v=>{const r=await op('darAcceso',{...v,id:c.id});return r.errors||r.cancel?r:{msg:'Acceso creado para '+c.nombre+'.'}}});
}
function projTable(ps,showCli){return `<div class="tblwrap"><table class="tbl"><thead><tr><th>Proyecto</th>${showCli?'<th>Cliente</th>':''}<th>Tipo</th><th>Inicio</th><th>Estado</th><th>Avance</th></tr></thead><tbody>
 ${ps.map(p=>`<tr class="click" data-goto="#proyecto-${p.id}"><td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(p.ubicacion||'')}</small></td>${showCli?`<td>${esc(cliName(p.clienteId))}</td>`:''}<td>${esc(p.tipo)}</td><td>${fd(p.fechaInicio)}</td><td>${badge(p.estado,KIND_PROY[p.estado])}</td><td style="min-width:150px">${progHtml(p.id)}</td></tr>`).join('')}</tbody></table></div>`}

/* ---------- Proyectos RF-05..RF-08 ---------- */
function vProyectos(){
  const f=ui.pf;const q=norm(f.q);
  const rows=DB.proyectos.filter(p=>(!f.tipo||p.tipo===f.tipo)&&(!f.estado||p.estado===f.estado)&&(!q||norm(p.nombre+' '+cliName(p.clienteId)+' '+p.ubicacion).includes(q)));
  return ph('<b>Proyectos</b>',(esCliente()?'Sus proyectos con Anémona Design Studio.':P().alcance==='participa'?'Los proyectos en los que usted participa, clasificados por tipo de servicio y estado.':'Todos los proyectos del estudio, clasificados por tipo de servicio y estado.'),`<button class="btn" data-act="nuevoProyecto">+ Nuevo proyecto</button>`)+
  `<div class="filters"><select data-chg="pfTipo" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>${TIPOS.map(t=>opt(t,f.tipo)).join('')}</select>
   <select data-chg="pfEstado" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${ESTADOS.map(t=>opt(t,f.estado)).join('')}</select>
   <input data-chg="pfQ" placeholder="Nombre, cliente o ubicación…" value="${esc(f.q)}">
   ${(f.tipo||f.estado||f.q)?`<button class="btn ghost sm" data-act="pfClear">Limpiar filtros</button>`:''}<span class="muted" style="margin-left:auto">${rows.length} de ${DB.proyectos.length}</span></div>
  ${rows.length?`<div class="pcards">${rows.map(p=>`<a class="pcard" href="#proyecto-${p.id}"><div class="tags">${badge(p.estado,KIND_PROY[p.estado])}${badge(p.tipo,'mute')}</div><b>${esc(p.nombre)}</b><small class="muted">${esc(cliName(p.clienteId))} · inicio ${fd(p.fechaInicio)}</small>${progHtml(p.id)}</a>`).join('')}</div>`:emptyBox('No se encontraron proyectos con estos filtros.')}`}
const proyFields=(isNew)=>[
 {k:'clienteId',label:'Cliente',type:'select',req:true,options:DB.clientes.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(c=>[c.id,c.nombre]),full:true},
 {k:'nombre',label:'Nombre del proyecto',req:true,full:true},
 {k:'tipo',label:'Tipo de servicio',type:'select',options:TIPOS,req:true,help:'Catálogo del estudio.'},
 {k:'fechaInicio',label:'Fecha de inicio',type:'date',req:true},
 {k:'descripcion',label:'Descripción',type:'textarea',req:true,full:true},
 {k:'ubicacion',label:'Ubicación'},
 {k:'area',label:'Área (m²)',type:'number',help:'Opcional; solo si aplica.'},
 ...(isNew?[{k:'plan',label:'Cargar el plan de acción sugerido para este tipo de servicio (actividades y entregables con fechas)',type:'checkbox',help:'Se pueden editar después. Plan propuesto a partir de la minuta 01 — pendiente de validar con Anémona.'}]:[])];
function formProyecto(p,preCliente){
  if(!needEdit())return;
  if(!p&&!DB.clientes.length){infoBox('Primero registre el cliente','Todo proyecto debe estar vinculado con un cliente registrado. Registre el cliente antes de continuar.',`<button class="btn ghost" data-close>Cancelar</button><button class="btn" data-act="nuevoCliente">Registrar cliente</button>`);return}
  openForm({title:p?'Editar proyecto':'Nuevo proyecto',fields:proyFields(!p),values:p||{clienteId:preCliente||'',fechaInicio:today(),plan:true},submit:p?'Guardar cambios':'Registrar proyecto',
   intro:p?'':'Solo se piden los datos comunes a todo proyecto. Proveedores, materiales y actividades se agregan únicamente si el servicio los requiere.',
   onSubmit:async v=>{
    if(p){const r=await op('editarProyecto',{...v,id:p.id});return r.errors||r.cancel?r:{msg:'Proyecto actualizado.'}}
    const r=await op('crearProyecto',v);if(r.errors||r.cancel)return r;
    ui.tab=v.plan?'actividades':'resumen';ui.lastProj=r.id;
    return {msg:'Proyecto registrado'+(v.plan?' con su plan de acción.':'.'),go:'#proyecto-'+r.id}}});
}
function vProyecto(id){
  const p=byId('proyectos',id);if(!p)return notFound('proyecto');
  if(esCliente())return vProyectoCliente(p);
  if(ui.lastProj!==id){ui.tab='resumen';ui.lastProj=id}
  const acts=projActs(id),provs=DB.provProy.filter(x=>x.proyectoId===id),mats=DB.matProy.filter(x=>x.proyectoId===id),cots=DB.cotizaciones.filter(x=>x.proyectoId===id);
  const rends=(DB.renders||[]).filter(r=>r.proyectoId===id);
  const tabs=[['resumen','Resumen',null],['actividades','Actividades',acts.length],['proveedores','Proveedores',provs.length],['materiales','Materiales y productos',mats.length],['cotizaciones','Cotizaciones',cots.length],['renders','Renders 360°',rends.length]].filter(([k])=>(k!=='cotizaciones'||P().comercial)&&(k!=='renders'||puedeVer('renders')));
  if((ui.tab==='cotizaciones'&&!P().comercial)||(ui.tab==='renders'&&!puedeVer('renders')))ui.tab='resumen';
  const cliLink=puedeVer('clientes')?`<a href="#cliente-${p.clienteId}">${esc(cliName(p.clienteId))}</a>`:esc(cliName(p.clienteId));
  const permit=TRANS[p.estado]||[];
  const estadoSel=permit.length?`<select data-chg="estadoProy" data-id="${id}" aria-label="Cambiar estado"><option value="">Cambiar estado…</option>${ESTADOS.filter(e=>e!==p.estado).map(e=>`<option value="${e}" ${permit.includes(e)?'':'disabled'}>${e}${permit.includes(e)?'':' (no permitido)'}</option>`).join('')}</select>`:`<small class="muted">Estado final: no admite más cambios.</small>`;
  const totalMat=mats.reduce((s,m)=>s+(+m.cantidad||0)*(+m.precioUnit||0),0);
  let body='';
  if(ui.tab==='resumen')body=`<section class="card"><div class="headrow"><h3 style="margin:0">Datos del proyecto</h3><button class="btn ghost sm" data-act="editProyecto" data-id="${id}">Editar</button></div>
   <div class="dgrid"><div><small>Cliente</small><span>${cliLink}</span></div><div><small>Tipo de servicio</small><span>${esc(p.tipo)}</span></div><div><small>Fecha de inicio</small><span>${fd(p.fechaInicio)}</span></div>
   <div><small>Ubicación</small><span>${esc(p.ubicacion||'—')}</span></div><div><small>Área</small><span>${p.area!==''&&p.area!=null?esc(p.area)+' m²':'—'}</span></div><div><small>Avance</small><span>${progHtml(id)}</span></div>
   <div class="full"><small>Descripción</small><span>${esc(p.descripcion)}</span></div></div></section>
   <div class="grid2" style="margin-top:20px"><section class="card"><h3>Próximas actividades</h3>${acts.filter(a=>a.estado!=='Completada').slice(0,4).map(a=>actRow(a,false)).join('')||emptyBox('Sin actividades pendientes.')}</section>
   <section class="card"><h3>Relaciones</h3><div class="dgrid" style="grid-template-columns:1fr 1fr">
    <div><small>Proveedores</small><span>${provs.length?provs.map(x=>esc((byId('proveedores',x.proveedorId)||{}).nombre)+' '+badge(x.condicion,x.condicion==='Seleccionado'?'ok':'mute')).join('<br>'):'Ninguno'}</span></div>
    <div><small>Materiales y productos</small><span>${mats.length?mats.length+' elementos · '+money(totalMat):'Ninguno'}</span></div>
    ${P().comercial?'':'<!--'}<div><small>Cotizaciones</small><span>${cots.length?cots.map(c=>esc(c.codigo)+' '+badge(c.estado,KIND_COT[c.estado])).join('<br>'):'Ninguna'}</span></div>${P().comercial?'':'-->'}</div>
    ${!provs.length&&!mats.length?`<p class="note" style="margin-top:12px">Este proyecto no tiene proveedores ni materiales asociados y sigue siendo válido.</p>`:''}</section></div>`;
  else if(ui.tab==='actividades')body=`<section class="card"><div class="headrow"><h3 style="margin:0">Actividades y entregables</h3><div style="display:flex;gap:8px;flex-wrap:wrap">
   ${PLAN[p.tipo]?`<button class="btn ghost sm" data-act="cargarPlan" data-id="${id}">Cargar plan de acción «${esc(p.tipo)}»</button>`:''}<button class="btn sm" data-act="nuevaAct" data-id="${id}">+ Nueva actividad</button></div></div>
   ${acts.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Actividad</th><th>Responsable</th><th>Fecha prevista</th><th>Estado</th><th></th></tr></thead><tbody>
   ${acts.map(a=>`<tr><td><b>${esc(a.nombre)}</b>${a.entregable?' <span class="ent">· entregable</span>':''}</td><td>${esc(a.responsable)}</td><td>${fd(a.fecha)} ${whenB(a)}</td>
    <td><select class="inline-sel" data-chg="estadoAct" data-id="${a.id}" aria-label="Estado de la actividad">${EST_ACT.map(e=>opt(e,a.estado)).join('')}</select></td><td class="num"><button class="btn ghost sm" data-act="verAct" data-id="${a.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>`
   :emptyBox('Sin actividades. Puede crear una o cargar el plan de acción del tipo de servicio.')}</section>`;
  else if(ui.tab==='proveedores')body=`<section class="card"><div class="headrow"><h3 style="margin:0">Proveedores del proyecto</h3><button class="btn sm" data-act="asocProv" data-id="${id}">+ Asociar proveedor</button></div>
   ${provs.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Proveedor</th><th>Categorías</th><th>Contacto</th><th>Condición</th><th></th></tr></thead><tbody>
   ${provs.map(x=>{const v=byId('proveedores',x.proveedorId)||{};return `<tr><td><a href="#proveedor-${v.id}"><b>${esc(v.nombre)}</b></a></td><td>${(v.categorias||[]).map(c=>badge(c,'sea')).join(' ')}</td><td>${esc(v.contacto||'')}<br><small>${esc(v.telefono||'')}</small></td>
    <td><select class="inline-sel" data-chg="condProv" data-id="${x.id}" aria-label="Condición">${COND.map(c=>opt(c,x.condicion)).join('')}</select></td><td class="num"><button class="btn ghost sm" data-act="quitarProv" data-id="${x.id}">Quitar</button></td></tr>`}).join('')}</tbody></table></div>`
   :emptyBox('Sin proveedores asociados. Un proyecto puede no requerir proveedores externos.')}</section>`;
  else if(ui.tab==='materiales')body=`<section class="card"><div class="headrow"><h3 style="margin:0">Materiales y productos</h3><button class="btn sm" data-act="asocMat" data-id="${id}">+ Asociar material o producto</button></div>
   ${mats.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Material / producto</th><th>Proveedor(es)</th><th class="num">Cantidad</th><th class="num">Precio unitario</th><th class="num">Costo total</th><th></th></tr></thead><tbody>
   ${mats.map(x=>{const m=byId('materiales',x.materialId)||{};return `<tr><td><b>${esc(m.nombre)}</b>${m.modelo?` <small class="muted">${esc(m.modelo)}</small>`:''}${x.nota?`<br><small class="muted">${esc(x.nota)}</small>`:''}</td><td><small>${(m.proveedorIds||[]).map(pid=>esc((byId('proveedores',pid)||{}).nombre)).join(', ')||'—'}</small></td>
    <td class="num">${esc(x.cantidad)} ${esc(m.unidad||'')}</td><td class="num">${money(x.precioUnit)}</td><td class="num">${money((+x.cantidad||0)*(+x.precioUnit||0))}</td>
    <td class="num"><button class="btn ghost sm" data-act="editMatProy" data-id="${x.id}">Editar</button> <button class="btn ghost sm" data-act="quitarMat" data-id="${x.id}">Quitar</button></td></tr>`}).join('')}</tbody>
    <tfoot><tr><td colspan="4">Total registrado</td><td class="num">${money(totalMat)}</td><td></td></tr></tfoot></table></div>`
   :emptyBox('Sin materiales asociados. No todos los servicios los requieren.')}</section>`;
  else if(ui.tab==='renders')body=`<section class="card"><div class="headrow"><h3 style="margin:0">Renders 360°</h3><button class="btn sm" data-act="subirRender" data-id="${id}">+ Subir render 360°</button></div>
   ${galeriaRenders(rends,false)}<p class="note">Suba renders exportados como <b>panorama 360°</b> (imagen el doble de ancha que de alta) desde Enscape, V-Ray, Lumion o SketchUp. Abra uno para mirar alrededor.</p></section>`;
  else body=`<section class="card"><div class="headrow"><h3 style="margin:0">Referencias de cotización</h3><button class="btn sm" data-act="nuevaCot" data-id="${id}">+ Registrar referencia</button></div>
   ${cots.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Código</th><th>Fecha</th><th class="num">Monto</th><th>Estado</th><th>Documento / enlace</th><th></th></tr></thead><tbody>
   ${cots.map(c=>`<tr><td><b>${esc(c.codigo)}</b></td><td>${fd(c.fecha)}</td><td class="num">${money(c.monto)}</td><td>${badge(c.estado,KIND_COT[c.estado])}</td>
    <td>${c.archivo?(c.tieneArchivo&&MODO==='api'?`<a href="/api/cotizaciones/${c.id}/archivo" target="_blank" rel="noopener"><small>Abrir documento: ${esc(c.archivo)}</small></a><br>`:`<small>Documento: ${esc(c.archivo)}</small><br>`):''}${c.enlace?`<a href="${esc(c.enlace)}" target="_blank" rel="noopener"><small>${esc(c.enlace)}</small></a>`:''}</td><td class="num"><button class="btn ghost sm" data-act="editCot" data-id="${c.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>`
   :emptyBox('Sin cotizaciones registradas.')}
   <p class="note">El sistema solo guarda la referencia: la cotización se sigue elaborando en Canva. No calcula ni emite cotizaciones en esta versión.${MODO==='api'?' Los documentos adjuntos se guardan en la base de datos.':' En modo demostración solo se registra el nombre del archivo.'}</p></section>`;
  return ph(esc(p.nombre),`${cliLink} · ${esc(p.tipo)}`,
   `<div class="estado-box">${badge(p.estado,KIND_PROY[p.estado])} ${estadoSel}</div>`,`<a href="#proyectos">proyectos</a> / ficha`)+
  `<div class="tabs" role="tablist">${tabs.map(([k,l,n])=>`<button class="tab ${ui.tab===k?'on':''}" data-act="tab" data-id="${k}" role="tab">${l}${n!=null?`<span class="cnt">${n}</span>`:''}</button>`).join('')}</div>${body}`}

/* Actividades RF-13, RF-14 */
const actFields=()=>[
 {k:'nombre',label:'Nombre de la actividad',req:true,full:true},
 {k:'responsable',label:'Responsable',type:'select',options:RESP,req:true},
 {k:'fecha',label:'Fecha prevista',type:'date',req:true},
 {k:'estado',label:'Estado',type:'select',options:EST_ACT,req:true},
 {k:'entregable',label:'Es un entregable para el cliente',type:'checkbox'}];
function formAct(a,pid){
  const p=byId('proyectos',a?a.proyectoId:pid);
  if(!canAct(p.id)){if(a&&puedeVer('proyectos')&&DB.proyectos.some(x=>x.id===p.id)){ui.lastProj=a.proyectoId;ui.tab='actividades';location.hash='#proyecto-'+a.proyectoId}else denegar();return}
  openForm({title:a?'Actividad':'Nueva actividad',intro:`Proyecto: <b>${esc(p.nombre)}</b> · ${esc(cliName(p.clienteId))}`,fields:actFields(),values:a||{estado:'Pendiente',responsable:'Gabriela Núñez'},submit:a?'Guardar cambios':'Registrar actividad',
   extra:a?`<button type="button" class="btn ghost" data-goto="#proyecto-${p.id}" data-tab="actividades">Abrir proyecto →</button>`:'',
   onSubmit:async v=>{
    if(a){const r=await op('editarActividad',{...v,id:a.id});return r.errors||r.cancel?r:{msg:'Actividad actualizada; el calendario refleja el cambio.'}}
    const r=await op('crearActividad',{...v,proyectoId:pid});return r.errors||r.cancel?r:{msg:'Actividad registrada.'}}});
}

/* Proveedores en proyecto RF-11 */
function formAsocProv(pid){
  if(!needEdit())return;
  const ya=DB.provProy.filter(x=>x.proyectoId===pid).map(x=>x.proveedorId);
  const opts=DB.proveedores.filter(v=>!ya.includes(v.id)).sort((a,b)=>(a.categorias[0]||'').localeCompare(b.categorias[0]||'')||a.nombre.localeCompare(b.nombre)).map(v=>[v.id,v.nombre+' — '+v.categorias.join(', ')]);
  openForm({title:'Asociar proveedores',wide:true,intro:'Seleccione uno o varios proveedores e indique si están considerados (alternativa evaluada) o seleccionados (elegidos para participar).',
   fields:[{k:'ids',label:'Proveedores disponibles',type:'multi',options:opts,req:true,full:true,empty:'Todos los proveedores ya están asociados o no hay proveedores registrados. Regístrelos en «Proveedores».'},{k:'condicion',label:'Condición',type:'select',options:COND,req:true}],
   values:{condicion:'Considerado'},submit:'Asociar',
   onSubmit:async v=>{const r=await op('asociarProveedores',{...v,proyectoId:pid});return r.errors||r.cancel?r:{msg:v.ids.length+' proveedor(es) asociado(s).'}}});
}
/* Materiales en proyecto RF-12 */
function formMatProy(pid,x){
  if(!needEdit())return;
  if(!x&&!DB.materiales.length){infoBox('Catálogo vacío','Registre primero el material o producto en el catálogo.',`<button class="btn ghost" data-close>Cancelar</button><a class="btn" href="#materiales" data-close>Ir a materiales</a>`);return}
  const f=[...(x?[]:[{k:'materialId',label:'Material o producto',type:'select',req:true,full:true,options:DB.materiales.map(m=>[m.id,m.nombre+(m.modelo?' ('+m.modelo+')':'')+' — ref. '+money(m.precioRef)+' / '+m.unidad])}]),
   {k:'cantidad',label:'Cantidad',type:'number',req:true,check:v=>+v<=0?'La cantidad debe ser mayor que 0.':''},
   {k:'precioUnit',label:'Precio unitario (₡)',type:'number',help:x?'':'Si se deja vacío se usa el precio de referencia del catálogo.'},
   {k:'nota',label:'Nota / ubicación en el proyecto',full:true}];
  openForm({title:x?'Editar material del proyecto':'Asociar material o producto',fields:f,values:x||{cantidad:'1'},submit:x?'Guardar':'Asociar',
   onSubmit:async v=>{
    if(x){const r=await op('editarMatProy',{...v,id:x.id});return r.errors||r.cancel?r:{msg:'Material actualizado.'}}
    const r=await op('asociarMaterial',{...v,proyectoId:pid});return r.errors||r.cancel?r:{msg:'Material asociado al proyecto.'}}});
}
/* Cotizaciones RF-16 */
function formCot(pid,c){
  if(!needEdit())return;
  const f=[{k:'codigo',label:'Código o referencia',req:true,ph:'COT-2026-015'},{k:'fecha',label:'Fecha de envío',type:'date',req:true},
   {k:'monto',label:'Monto (₡)',type:'number',help:'Opcional; dato informativo.'},{k:'estado',label:'Estado',type:'select',options:EST_COT,req:true},
   {k:'enlace',label:'Enlace al documento (Canva, Drive…)',type:'url',full:true,ph:'https://…',check:(val,v)=>{if(val&&!/^https?:\/\/\S+\.\S+/.test(val))return 'El enlace debe iniciar con http:// o https://';if(!val&&!v.archivo)return 'Indique un enlace o adjunte el documento.';return ''}},
   {k:'archivo',label:'Documento adjunto',type:'file',full:true,accept:'.pdf,.png,.jpg,.jpeg,.docx',current:c&&c.archivo,help:'PDF, PNG, JPG o DOCX, máximo 10 MB.',check:(val,v)=>{if(val&&!/\.(pdf|png|jpe?g|docx)$/i.test(val))return 'Formato no permitido. Use PDF, PNG, JPG o DOCX.';if(v.archivo__file&&v.archivo__file.size>MAX_ARCHIVO)return 'El archivo supera el máximo de 10 MB.';return ''}}];
  openForm({title:c?'Editar referencia de cotización':'Registrar referencia de cotización',fields:f,values:c||{fecha:today(),estado:'Enviada'},submit:'Guardar',
   onSubmit:async v=>{const file=v.archivo__file;delete v.archivo__file;
    if(file&&MODO==='api'){v.archivoDatos=await leerBase64(file);v.archivoTipo=file.type||''}
    const r=c?await op('editarCotizacion',{...v,id:c.id}):await op('crearCotizacion',{...v,proyectoId:pid});
    return r.errors||r.cancel?r:{msg:c?'Referencia actualizada.':'Referencia de cotización registrada.'}}});
}

/* ---------- Renders 360° (SC-02 · RF-20, RF-21) ---------- */
function urlRender(r,mini){
  if(MODO==='api')return `/api/renders/${r.id}/${mini?'miniatura':'archivo'}`;
  if(r.ejemplo)return mini?RENDER_EJEMPLO_MINI:RENDER_EJEMPLO_360;
  return mini?(r.miniUrl||null):(RENDER_MEM[r.id]||null);
}
const tamanoMB=b=>b>=1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
function galeriaRenders(lista,conProyecto){
  if(!lista.length)return emptyBox('Todavía no hay renders 360°.');
  return `<div class="rgal">${lista.map(r=>{const p=byId('proyectos',r.proyectoId)||{};const mini=urlRender(r,true);
    return `<button class="rcard" data-act="verRender" data-id="${r.id}" aria-label="Abrir ${esc(r.titulo)}">
      <span class="rthumb">${mini?`<img src="${mini}" alt="" loading="lazy">`:''}<span class="r360">360°</span></span>
      <span class="rinfo"><b>${esc(r.titulo)}</b>${conProyecto?`<small>${esc(p.nombre||'')}</small>`:''}<small class="muted">${esc(r.subidoPor)} · ${fd(r.creado)}</small></span></button>`}).join('')}</div>`}
function vRenders(){
  const f=ui.rendProy||'';const lista=(DB.renders||[]).filter(r=>!f||r.proyectoId===f);
  return ph('Renders <b>360°</b>','Renders panorámicos de los proyectos. Ábralos para mirar alrededor como si estuviera dentro del espacio.',`<button class="btn" data-act="subirRender">+ Subir render 360°</button>`)+
  `<div class="filters"><select data-chg="rendProy" aria-label="Filtrar por proyecto"><option value="">Todos los proyectos</option>${DB.proyectos.map(p=>opt([p.id,p.nombre],f)).join('')}</select><span class="muted" style="margin-left:auto">${lista.length} render(s)</span></div>
  ${galeriaRenders(lista,true)}
  <p class="note"><b>Formato:</b> imagen JPG o PNG exportada como <b>panorama 360°</b> (el doble de ancha que de alta, por ejemplo 4096 × 2048), de hasta 25 MB. El sistema no crea renders: guarda y muestra los que se hacen en Enscape, V-Ray, Lumion o SketchUp.</p>`}
function leerImagen(file){return new Promise((ok,ko)=>{const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>ok({im,u});im.onerror=()=>{URL.revokeObjectURL(u);ko(new Error('imagen'))};im.src=u})}
function formRender(pid){
  if(!needEdit())return;
  if(!DB.proyectos.length){infoBox('No hay proyectos','Registre primero un proyecto para asociarle renders.');return}
  const f=[...(pid?[]:[{k:'proyectoId',label:'Proyecto',type:'select',req:true,full:true,options:DB.proyectos.map(p=>[p.id,p.nombre])}]),
   {k:'titulo',label:'Título',req:true,full:true,ph:'Sala — propuesta 1'},
   {k:'descripcion',label:'Descripción',type:'textarea',full:true},
   {k:'archivo',label:'Render 360° (JPG o PNG)',type:'file',req:true,full:true,accept:'.jpg,.jpeg,.png',help:'Exportado como panorama 360°: el doble de ancho que de alto (por ejemplo 4096 × 2048). Máximo 25 MB.',
    check:(val,v)=>{if(val&&!/\.(jpe?g|png)$/i.test(val))return 'Formato no permitido. Use una imagen JPG o PNG.';if(v.archivo__file&&v.archivo__file.size>MAX_RENDER)return 'El archivo supera el máximo de 25 MB.';return ''}}];
  openForm({title:'Subir render 360°',intro:pid?`Proyecto: <b>${esc(byId('proyectos',pid).nombre)}</b>`:'',fields:f,values:{proyectoId:pid||ui.rendProy||''},submit:'Subir render',wide:true,
   onSubmit:async v=>{const file=v.archivo__file;delete v.archivo__file;
    let lectura;try{lectura=await leerImagen(file)}catch(e){return {errors:{archivo:'El archivo no es una imagen JPG o PNG válida.'}}}
    const {im,u}=lectura;const w=im.naturalWidth,h=im.naturalHeight;
    if(Math.abs(w/h-2)>0.04){URL.revokeObjectURL(u);return {errors:{archivo:`El render debe ser 360° (proporción 2:1, por ejemplo 4096 × 2048). Esta imagen mide ${w} × ${h}. Expórtelo como «panorama 360°» desde su programa de render.`}}}
    const cv=document.createElement('canvas');cv.width=512;cv.height=256;cv.getContext('2d').drawImage(im,0,0,512,256);URL.revokeObjectURL(u);
    const datos={...v,proyectoId:pid||v.proyectoId,ancho:w,alto:h,tamano:file.size,miniatura:cv.toDataURL('image/jpeg',0.78).split(',')[1]};
    if(MODO==='api')datos.archivoDatos=await leerBase64(file);else datos.dataUrl=await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(file)});
    const r=await op('subirRender',datos);if(r.errors||r.cancel)return r;
    ui.ultimoRender=r.id;return {msg:'Render subido. Ábralo para mirar alrededor.'}}});
}
let VISOR=null;
function verRender(id){
  const r=byId('renders',id);if(!r)return;const p=byId('proyectos',r.proyectoId)||{};const url=urlRender(r,false);
  const d=modal(`<h2>${esc(r.titulo)}</h2><p class="intro">${esc(p.nombre||'')} · subido por ${esc(r.subidoPor)} el ${fd(r.creado)} · ${r.ancho} × ${r.alto} px${r.tamano?' · '+tamanoMB(r.tamano):''}</p>
   <div class="visor" id="visor"><div class="visor-ayuda">Arrastre para mirar alrededor · rueda o +/− para acercar · flechas del teclado</div>
    <div class="visor-ctrl"><button class="vbtn" data-v="menos" aria-label="Alejar">−</button><button class="vbtn" data-v="mas" aria-label="Acercar">+</button><button class="vbtn txt" data-v="reset">Restablecer</button><button class="vbtn txt" data-v="full">Pantalla completa</button></div>
    <div class="visor-msg" hidden></div></div>
   ${r.descripcion?`<p style="margin:14px 0 0">${esc(r.descripcion)}</p>`:''}
   <div class="actions" style="margin-top:14px"><span class="left">${url&&MODO==='api'?`<a class="btn ghost sm" href="${url}" target="_blank" rel="noopener">Abrir imagen original</a>`:''}</span>
    ${can()?`<button class="btn ghost sm" data-act="editarRender" data-id="${r.id}">Editar</button><button class="btn ghost sm" data-act="eliminarRender" data-id="${r.id}">Eliminar</button>`:''}<button class="btn sm" data-close>Cerrar</button></div>`,true);
  d.classList.add('dialog-visor');
  const cont=d.querySelector('#visor');const msg=t=>{const m=cont.querySelector('.visor-msg');m.hidden=false;m.textContent=t};
  if(!url){msg('En modo demostración, los renders subidos solo se pueden ver hasta que se recarga la página. Con el servidor quedan guardados en la base de datos.');return}
  VISOR=new Visor360(cont,url,{alError:msg});
  cont.querySelector('.visor-ctrl').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b||!VISOR)return;
    ({menos:()=>VISOR.zoom(1.15),mas:()=>VISOR.zoom(0.87),reset:()=>VISOR.restablecer(),full:()=>VISOR.pantallaCompleta()})[b.dataset.v]()});
  if(VISOR.canvas)VISOR.canvas.focus();
}
function formEditarRender(r){
  if(!needEdit())return;
  openForm({title:'Editar render',fields:[{k:'titulo',label:'Título',req:true,full:true},{k:'descripcion',label:'Descripción',type:'textarea',full:true}],values:r,
   onSubmit:async v=>{const x=await op('editarRender',{...v,id:r.id});return x.errors||x.cancel?x:{msg:'Render actualizado.'}}});
}

/* ---------- Proveedores RF-09 ---------- */
function vProveedores(){
  const cat=ui.provCat;
  const rows=DB.proveedores.filter(v=>!cat||v.categorias.includes(cat)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return ph('<b>Proveedores</b>','Directorio clasificado por tipo de producto o servicio. Para una misma categoría puede haber varias alternativas.',`<button class="btn" data-act="nuevoProv">+ Registrar proveedor</button>`)+
  `<div class="filters"><div class="chips"><button class="chip ${!cat?'on':''}" data-act="provCat" data-id="">Todas (${DB.proveedores.length})</button>${CATS.map(c=>{const n=DB.proveedores.filter(v=>v.categorias.includes(c)).length;return `<button class="chip ${cat===c?'on':''}" data-act="provCat" data-id="${c}">${c} (${n})</button>`}).join('')}</div></div>
  ${rows.length?`<div class="pcards">${rows.map(v=>{const n=DB.provProy.filter(x=>x.proveedorId===v.id).length;return `<a class="pcard" href="#proveedor-${v.id}"><div class="tags">${v.categorias.map(c=>badge(c,'sea')).join('')}</div><b>${esc(v.nombre)}</b>
   <small>${esc(v.contacto||'Sin contacto')} · ${esc(v.telefono)}</small><small class="muted">${esc(v.ofrece)}</small><small class="muted">${n} proyecto(s)</small></a>`}).join('')}</div>`:emptyBox('No hay proveedores en esta categoría.')}`}
const provFields=()=>[
 {k:'nombre',label:'Nombre del proveedor o tienda',req:true,full:true},
 {k:'categorias',label:'Categorías de productos o servicios',type:'multi',options:CATS,req:true,full:true},
 {k:'contacto',label:'Persona vendedora o contacto'},
 {k:'telefono',label:'Teléfono',type:'tel',req:true},
 {k:'correo',label:'Correo electrónico',type:'email'},
 {k:'ofrece',label:'Productos o servicios que ofrece',type:'textarea',req:true,full:true},
 {k:'notas',label:'Observaciones (tiempos de entrega, experiencia previa…)',type:'textarea',full:true}];
function formProv(v){
  if(!needEdit())return;
  openForm({title:v?'Editar proveedor':'Registrar proveedor',wide:true,fields:provFields(),values:v||{},submit:v?'Guardar cambios':'Registrar',
   onSubmit:async x=>{
    if(v){const r=await op('editarProveedor',{...x,id:v.id});return r.errors||r.cancel?r:{msg:'Proveedor actualizado.'}}
    const r=await op('crearProveedor',x);return r.errors||r.cancel?r:{msg:'Proveedor registrado.',go:'#proveedor-'+r.id}}});
}
function vProveedor(id){
  const v=byId('proveedores',id);if(!v)return notFound('proveedor');
  const pps=DB.provProy.filter(x=>x.proveedorId===id);const mats=DB.materiales.filter(m=>(m.proveedorIds||[]).includes(id));
  const alt=DB.proveedores.filter(o=>o.id!==id&&o.categorias.some(c=>v.categorias.includes(c)));
  return ph(esc(v.nombre),v.categorias.map(c=>badge(c,'sea')).join(' '),`<button class="btn ghost" data-act="editProv" data-id="${id}">Editar</button>`,`<a href="#proveedores">proveedores</a> / ficha`)+
  `<div class="stack"><section class="card"><h3>Datos</h3><div class="dgrid"><div><small>Contacto</small><span>${esc(v.contacto||'—')}</span></div><div><small>Teléfono</small><span>${esc(v.telefono)}</span></div><div><small>Correo</small><span>${esc(v.correo||'—')}</span></div>
   <div class="full"><small>Ofrece</small><span>${esc(v.ofrece)}</span></div>${v.notas?`<div class="full"><small>Observaciones</small><span>${esc(v.notas)}</span></div>`:''}</div></section>
  <div class="grid2"><section class="card"><h3>Proyectos</h3>${pps.length?`<table class="tbl"><tbody>${pps.map(x=>{const p=byId('proyectos',x.proyectoId)||{};return `<tr class="click" data-goto="#proyecto-${p.id}"><td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(cliName(p.clienteId))}</small></td><td class="num">${badge(x.condicion,x.condicion==='Seleccionado'?'ok':'mute')}</td></tr>`}).join('')}</tbody></table>`:emptyBox('Aún no participa en proyectos.')}</section>
  <section class="card"><h3>Materiales y productos que ofrece</h3>${mats.length?`<table class="tbl"><tbody>${mats.map(m=>`<tr><td>${esc(m.nombre)}</td><td class="num">${money(m.precioRef)} / ${esc(m.unidad)}</td></tr>`).join('')}</tbody></table>`:emptyBox('Sin materiales registrados.')}</section></div>
  <section class="card"><h3>Otras alternativas en la misma categoría</h3>${alt.length?`<div class="chips">${alt.map(o=>`<a class="chip" href="#proveedor-${o.id}">${esc(o.nombre)}</a>`).join('')}</div>`:'<small class="muted">No hay otras alternativas registradas.</small>'}</section></div>`}

/* ---------- Materiales RF-10 ---------- */
function vMateriales(){
  const cat=ui.matCat;const rows=DB.materiales.filter(m=>!cat||m.categoria===cat).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return ph('Materiales y <b>productos</b>','Catálogo de materiales y productos usados o considerados en proyectos, con los proveedores que los ofrecen.',`<button class="btn" data-act="nuevoMat">+ Registrar material o producto</button>`)+
  `<div class="filters"><select data-chg="matCat" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>${CATS.map(c=>opt(c,cat)).join('')}</select></div>
  <div class="card tblwrap">${rows.length?`<table class="tbl"><thead><tr><th>Material / producto</th><th>Categoría</th><th>Proveedores</th><th class="num">Precio ref.</th><th class="num">Proyectos</th></tr></thead><tbody>
  ${rows.map(m=>`<tr class="click" data-act="editMat" data-id="${m.id}"><td><b>${esc(m.nombre)}</b>${m.modelo?`<br><small class="muted">Modelo ${esc(m.modelo)}</small>`:''}</td><td>${badge(m.categoria,'sea')}</td>
   <td>${(m.proveedorIds||[]).map(pid=>{const v=byId('proveedores',pid);return v?`<a href="#proveedor-${v.id}">${esc(v.nombre)}</a>`:''}).join(', ')||'—'}</td><td class="num">${money(m.precioRef)}<br><small class="muted">por ${esc(m.unidad)}</small></td><td class="num">${DB.matProy.filter(x=>x.materialId===m.id).length}</td></tr>`).join('')}
  </tbody></table>`:emptyBox('No hay materiales en esta categoría.')}</div>`}
function formMat(m){
  if(!needEdit())return;
  const f=[{k:'nombre',label:'Nombre del material o producto',req:true,full:true},{k:'modelo',label:'Modelo'},{k:'categoria',label:'Categoría',type:'select',options:CATS,req:true},
   {k:'unidad',label:'Unidad de medida',type:'select',options:UNIDADES,req:true},{k:'precioRef',label:'Precio de referencia (₡)',type:'number'},
   {k:'proveedorIds',label:'Proveedores que lo ofrecen',type:'multi',full:true,options:DB.proveedores.map(v=>[v.id,v.nombre]),empty:'No hay proveedores registrados. Regístrelos antes de establecer la relación.'},
   {k:'descripcion',label:'Descripción u observaciones',type:'textarea',full:true}];
  openForm({title:m?'Editar material o producto':'Registrar material o producto',wide:true,fields:f,values:m||{unidad:'unidad'},submit:'Guardar',
   onSubmit:async v=>{const r=m?await op('editarMaterial',{...v,id:m.id}):await op('crearMaterial',v);return r.errors||r.cancel?r:{msg:m?'Material actualizado.':'Material registrado en el catálogo.'}}});
}

/* ---------- Calendario RF-14 ---------- */
function vCalendario(){
  if(!ui.cal)ui.cal=today().slice(0,7);
  const [y,m]=ui.cal.split('-').map(Number);const first=new Date(y,m-1,1);const startDow=(first.getDay()+6)%7;
  const start=new Date(y,m-1,1-startDow);const T=today();
  const acts=DB.actividades.filter(a=>a.fecha&&(!ui.calResp||a.responsable===ui.calResp));
  const cells=[];for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);cells.push(d)}
  const rows=cells[35].getMonth()!==m-1?35:42;
  const evCls=a=>a.estado==='Completada'?'ok':a.fecha<T?'err':a.estado==='En proceso'?'warn':'';
  return ph('<b>Calendario</b>','Actividades y entregables con fecha prevista. Haga clic en una actividad para actualizarla o abrir su proyecto.','')+
  `<div class="calhead"><button class="btn ghost sm" data-act="calMove" data-id="-1" aria-label="Mes anterior">←</button><h2>${MESL[m-1]} ${y}</h2><button class="btn ghost sm" data-act="calMove" data-id="1" aria-label="Mes siguiente">→</button><button class="btn ghost sm" data-act="calMove" data-id="0">Hoy</button>
  <select class="inline-sel" data-chg="calResp" aria-label="Responsable"><option value="">Todos los responsables</option>${RESP.map(r=>opt(r,ui.calResp)).join('')}</select>
  <div class="legend"><span><i style="background:var(--pizarra)"></i>Pendiente</span><span><i style="background:var(--ocre)"></i>En proceso</span><span><i style="background:var(--ladrillo)"></i>Atrasada</span><span><i style="background:var(--salvia)"></i>Completada</span><span><b>Negrita</b> = entregable</span></div></div>
  <div class="cal">${['lun','mar','mié','jue','vie','sáb','dom'].map(d=>`<div class="dow">${d}</div>`).join('')}
  ${cells.slice(0,rows).map(d=>{const s=iso(d);const evs=acts.filter(a=>a.fecha===s);
   return `<div class="day ${d.getMonth()!==m-1?'out':''} ${s===T?'today':''}"><span class="dn">${d.getDate()}</span>${evs.map(a=>{const p=byId('proyectos',a.proyectoId)||{};return `<div class="ev ${evCls(a)} ${a.entregable?'deliv':''}" data-act="verAct" data-id="${a.id}" title="${esc(a.nombre+' — '+p.nombre+' ('+a.responsable+')')}">${esc(a.nombre)}</div>`}).join('')}</div>`}).join('')}</div>`}

/* ---------- Búsqueda RF-15 ---------- */
function vBuscar(){
  const q=norm(ui.q);
  if(!q)return ph('Búsqueda','Escriba un término en la barra superior.','');
  const has=(...xs)=>norm(xs.join(' ')).includes(q);
  const L=!puedeVer('potenciales')?[]:DB.leads.filter(l=>!l.convertidoA&&has(l.nombre,l.telefono,l.correo,l.servicio,l.nacionalidad));
  const C=!puedeVer('clientes')?[]:DB.clientes.filter(c=>has(c.nombre,c.numId,c.telefono,c.correo,c.nacionalidad));
  const P=DB.proyectos.filter(p=>has(p.nombre,p.tipo,p.ubicacion,p.descripcion,cliName(p.clienteId),p.estado));
  const V=DB.proveedores.filter(v=>has(v.nombre,v.contacto,v.categorias.join(' '),v.ofrece));
  const M=DB.materiales.filter(m=>has(m.nombre,m.modelo,m.categoria));
  const tot=L.length+C.length+P.length+V.length+M.length;
  const sec=(t,arr,fn)=>arr.length?`<section class="card"><h3>${t} <span class="b mute">${arr.length}</span></h3><table class="tbl"><tbody>${arr.map(fn).join('')}</tbody></table></section>`:'';
  return ph('Resultados para «'+esc(ui.q)+'»',tot?tot+' coincidencia(s)':'','')+
  (tot?`<div class="stack">
   ${sec('Proyectos',P,p=>`<tr class="click" data-goto="#proyecto-${p.id}"><td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(cliName(p.clienteId))} · ${esc(p.tipo)}</small></td><td class="num">${badge(p.estado,KIND_PROY[p.estado])}</td></tr>`)}
   ${sec('Clientes',C,c=>`<tr class="click" data-goto="#cliente-${c.id}"><td><b>${esc(c.nombre)}</b><br><small class="muted">${esc(c.tipoId)} ${esc(c.numId)}</small></td><td class="num"><small>${DB.proyectos.filter(p=>p.clienteId===c.id).length} proyecto(s)</small></td></tr>`)}
   ${sec('Potenciales clientes',L,l=>`<tr class="click" data-act="editLead" data-id="${l.id}"><td><b>${esc(l.nombre)}</b><br><small class="muted">${esc(l.servicio)}</small></td><td class="num">${badge(l.estado,KIND_LEAD[l.estado])}</td></tr>`)}
   ${sec('Proveedores',V,v=>`<tr class="click" data-goto="#proveedor-${v.id}"><td><b>${esc(v.nombre)}</b><br><small class="muted">${esc(v.ofrece)}</small></td><td class="num">${v.categorias.map(c=>badge(c,'sea')).join(' ')}</td></tr>`)}
   ${sec('Materiales y productos',M,m=>`<tr class="click" data-act="editMat" data-id="${m.id}"><td><b>${esc(m.nombre)}</b></td><td class="num">${badge(m.categoria,'sea')}</td></tr>`)}
  </div>`:emptyBox('No se encontraron resultados para el criterio ingresado.'))}

/* ---------- Acerca ---------- */
function vAcerca(){
  return ph('Acerca del <b>prototipo</b>','Prototipo funcional del ERS v1.0 de Anémona Design Studio — IC5821, Grupo 01.','')+
  `<div class="stack"><section class="card"><h3>Tecnología</h3><div class="dgrid">
   <div><small>Interfaz</small><span>HTML5, CSS3 y JavaScript</span></div><div><small>Servidor</small><span>Python 3 (biblioteca estándar), API REST</span></div><div><small>Base de datos</small><span>SQLite</span></div>
   <div class="full"><small>Modo actual</small><span>${MODO==='api'?'Servidor con base de datos SQLite: los datos se comparten entre quienes usen este servidor.':'Demostración: los datos se guardan solo en este navegador. Para usar la base de datos, ejecute <code>python servidor/servidor.py</code> y abra http://localhost:8000.'}</span></div></div></section>
  <section class="card"><h3>Documentación</h3><p style="margin:0">La relación entre cada requisito del ERS, la pantalla donde se implementa y la prueba que lo verifica está en el repositorio, en <code>docs/02-matriz-de-trazabilidad.md</code>.</p></section>
  <section class="card"><h3>Supuestos del prototipo (validar con Anémona)</h3><ul>
   <li><b>Estados de proyecto:</b> ${ESTADOS.join(' → ')}. Transiciones: ${Object.entries(TRANS).filter(([k,v])=>v.length).map(([k,v])=>`${k} → ${v.join(' / ')}`).join('; ')}. Finalizado y Cancelado son estados finales.</li>
   <li><b>Estados de seguimiento de potenciales clientes:</b> ${EST_LEAD.join(', ')}.</li>
   <li><b>Plan de acción por tipo de servicio:</b> actividades y plazos sugeridos a partir de la minuta 01 (tema 3); son editables y deben validarse.</li>
   <li><b>Cédula</b> de 9 dígitos; <b>pasaporte</b> de 6 a 20 caracteres alfanuméricos.</li>
   <li><b>Duplicados:</b> se considera la misma persona si coincide el nombre, el teléfono o el correo.</li>
   <li><b>Roles:</b> la propietaria administra todo; la arquitecta consulta y modifica toda la información, como indicó Gabriela; el cliente con acceso (solicitud de cambio SC-01) solo consulta el avance de sus propios proyectos.</li></ul></section>
  <section class="card"><h3>Fuera del alcance (ERS 2.11)</h3><ul><li>Generación de cotizaciones, notificaciones automáticas, archivo de fotos y renders, historial de cambios, eliminación de clientes.</li></ul></section></div>`}
const notFound=t=>ph('No encontrado','El '+t+' solicitado no existe.','')+`<a class="btn ghost" href="#inicio">Volver al inicio</a>`;

/* ================= Router ================= */
function render(){
  const app=$('#app');
  if(!USER){app.innerHTML=vLogin();return}
  const h=(location.hash||'#inicio').slice(1);const i=h.indexOf('-');const view=i<0?h:h.slice(0,i),id=i<0?'':h.slice(i+1);
  const V={renders:vRenders,inicio:vInicio,potenciales:vPotenciales,clientes:vClientes,cliente:()=>vCliente(id),proyectos:vProyectos,proyecto:()=>vProyecto(id),calendario:vCalendario,proveedores:vProveedores,proveedor:()=>vProveedor(id),materiales:vMateriales,buscar:vBuscar,acerca:vAcerca};
  const seccion={cliente:'clientes',proyecto:'proyectos',proveedor:'proveedores'}[view]||view;
  const contenido=!puedeVer(seccion)&&(V[view]||VISTAS_COM.includes(view))?vNoAutorizado():V[view]?V[view]():vInicio();
  app.innerHTML=shell(view,contenido);
  aplicarPermisos(app);
}
/* CU-17, flujo alternativo 2: la sección no corresponde al rol */
const vNoAutorizado=()=>ph('Acceso <b>no autorizado</b>',`Su rol (${esc(USER.rol)}) no tiene permiso para ver esta sección.`,'')+`<a class="btn ghost" href="#inicio">Volver al inicio</a>`;

/* ================= Acciones ================= */
async function simple(nombre,args,msg){const r=await op(nombre,args);if(r.errors){toast(Object.values(r.errors)[0],'err')}else if(!r.cancel&&msg)toast(typeof msg==='function'?msg(r):msg);render();return r}
const ACT={
  async logout(){if(MODO==='api')await http('DELETE','/sesion');USER=null;if(MODO==='demo')DB=DBT;try{sessionStorage.removeItem(LS+'-u')}catch(e){}closeModal();render()},
  reset(){if(!esAdmin()){denegar();return}confirmBox('Restablecer datos','Se borrarán los cambios y se cargarán de nuevo los datos de ejemplo'+(MODO==='api'?' en la base de datos.':' en este navegador.'),'Restablecer',async()=>{await simple('reiniciar',{},'Datos de ejemplo restablecidos.');ui.tab='resumen';location.hash='#inicio'})},
  tab(id){ui.tab=id;render()},
  leadF(id){ui.leadF=id;render()},
  provCat(id){ui.provCat=id;render()},
  pfClear(){ui.pf={tipo:'',estado:'',q:''};render()},
  calMove(n){n=+n;if(!n){ui.cal=today().slice(0,7)}else{const [y,m]=ui.cal.split('-').map(Number);const d=new Date(y,m-1+n,1);ui.cal=d.getFullYear()+'-'+pad(d.getMonth()+1)}render()},
  nuevoLead(){formLead(null)},
  editLead(id){const l=byId('leads',id);if(l.convertidoA){location.hash='#cliente-'+l.convertidoA;return}if(!can()){infoBox(l.nombre,`${esc(l.servicio)} · ${badge(l.estado,KIND_LEAD[l.estado])}<br>${esc(l.telefono||'')} ${esc(l.correo||'')}<br><small class="muted">${esc(l.notas||'')}</small>`);return}formLead(l)},
  convertir(id){formConvertir(byId('leads',id))},
  nuevoCliente(){formCliente(null)},
  subirRender(id){formRender(id||null)},
  verRender(id){verRender(id)},
  editarRender(id){formEditarRender(byId('renders',id))},
  eliminarRender(id){if(!needEdit())return;const r=byId('renders',id);confirmBox('Eliminar render',`¿Eliminar «${esc(r.titulo)}»? Esta acción no se puede deshacer.`,'Eliminar',()=>simple('eliminarRender',{id},'Render eliminado.'))},
  darAcceso(id){formAcceso(byId('clientes',id))},
  cambiarAcceso(id){if(!needEdit())return;const a=DB.accesos.find(x=>x.clienteId===id);const c=byId('clientes',id);
    if(a.activo)confirmBox('Desactivar acceso',`${esc(c.nombre)} ya no podrá ingresar y se cerrará su sesión si está abierta.`,'Desactivar',()=>simple('cambiarAcceso',{id,activo:false},'Acceso desactivado.'));
    else simple('cambiarAcceso',{id,activo:true},'Acceso reactivado.')},
  editCliente(id){formCliente(byId('clientes',id))},
  nuevoProyecto(id){formProyecto(null,id)},
  editProyecto(id){formProyecto(byId('proyectos',id))},
  nuevaAct(id){if(!canAct(id)){denegar();return}formAct(null,id)},
  verAct(id){formAct(byId('actividades',id))},
  cargarPlan(id){if(!needEdit())return;const p=byId('proyectos',id);const n=(PLAN[p.tipo]||[]).length;
    confirmBox('Cargar plan de acción',`Se agregarán ${n} actividades sugeridas para «${esc(p.tipo)}», con fechas calculadas desde el inicio del proyecto (${fd(p.fechaInicio)}). Podrá editarlas después.`,'Cargar plan',()=>simple('cargarPlan',{id},'Plan de acción cargado.'))},
  asocProv(id){formAsocProv(id)},
  quitarProv(id){if(!needEdit())return;const x=byId('provProy',id);const v=byId('proveedores',x.proveedorId);confirmBox('Quitar proveedor',`¿Quitar a «${esc(v.nombre)}» de este proyecto? El proveedor seguirá en el directorio.`,'Quitar',()=>simple('quitarProveedor',{id},'Asociación eliminada.'))},
  asocMat(id){formMatProy(id,null)},
  editMatProy(id){const x=byId('matProy',id);formMatProy(x.proyectoId,x)},
  quitarMat(id){if(!needEdit())return;confirmBox('Quitar material','¿Quitar este material del proyecto? Seguirá en el catálogo.','Quitar',()=>simple('quitarMaterial',{id},'Material quitado del proyecto.'))},
  nuevaCot(id){formCot(id,null)},
  editCot(id){const c=byId('cotizaciones',id);formCot(c.proyectoId,c)},
  nuevoProv(){formProv(null)},
  editProv(id){formProv(byId('proveedores',id))},
  nuevoMat(){formMat(null)},
  editMat(id){if(!can()){location.hash='#materiales';needEdit();return}formMat(byId('materiales',id))}
};
const CHG={
  pfTipo(el){ui.pf.tipo=el.value;render()},pfEstado(el){ui.pf.estado=el.value;render()},pfQ(el){ui.pf.q=el.value;render()},
  matCat(el){ui.matCat=el.value;render()},rendProy(el){ui.rendProy=el.value;render()},calResp(el){ui.calResp=el.value;render()},
  estadoProy(el){const nv=el.value;if(!nv)return;if(!needEdit()){render();return}
    simple('estadoProyecto',{id:el.dataset.id,estado:nv},r=>`Estado actualizado: ${r.anterior} → ${r.estado}.`)},
  estadoAct(el){const a=byId('actividades',el.dataset.id);if(!canAct(a.proyectoId)){denegar();render();return}simple('editarActividad',{...a,estado:el.value},'Estado de la actividad actualizado.')},
  condProv(el){if(!needEdit()){render();return}simple('condicionProveedor',{id:el.dataset.id,condicion:el.value},'Condición actualizada: '+el.value+'.')}
};

/* ================= Eventos ================= */
document.addEventListener('click',e=>{
  const fill=e.target.closest('[data-fill]');if(fill){const [u,p]=fill.dataset.fill.split('|');const f=$('#loginf');f.u.value=u;f.p.value=p;return}
  const t=e.target.closest('[data-act],[data-goto],[data-close]');if(!t)return;
  const link=e.target.closest('a[href]');if(link&&link!==t&&t.contains(link))return;
  if(t.matches('[data-act]')){e.preventDefault();const fn=ACT[t.dataset.act];if(fn){if(t.closest('.overlay'))closeModal();fn(t.dataset.id,t)}return}
  if(t.matches('[data-goto]')){e.preventDefault();closeModal();if(t.dataset.tab){ui.lastProj=t.dataset.goto.split('-').slice(1).join('-');ui.tab=t.dataset.tab}if(location.hash===t.dataset.goto)render();else location.hash=t.dataset.goto;return}
  if(t.matches('[data-close]')){closeModal()}
});
document.addEventListener('change',e=>{const t=e.target.closest('[data-chg]');if(t&&CHG[t.dataset.chg])CHG[t.dataset.chg](t)});
document.addEventListener('submit',async e=>{
  if(e.target.id==='loginf'){e.preventDefault();const f=e.target;const btn=f.querySelector('button');btn.disabled=true;
    const fallo=m=>{f.querySelector('.msg').innerHTML=`<div class="errsum">${esc(m)}</div>`;btn.disabled=false};
    if(MODO==='api'){const r=await http('POST','/sesion',{usuario:f.u.value.trim(),clave:f.p.value});
      if(r.status!==200)return fallo(r.mensaje||'Usuario o contraseña incorrectos. Acceso rechazado.');
      USER=r.usuario;alIngresar();await recargar();
    }else{const nombre=f.u.value.trim().toLowerCase();const cta=(DBT.accesos||[]).find(x=>x.usuario===nombre&&x.clave===f.p.value);
      if(cta&&!cta.activo)return fallo('Su acceso está desactivado. Comuníquese con Anémona Design Studio.');
      const u=USERS_DEMO.find(x=>x.u===nombre&&x.p===f.p.value)||(cta?usuarioCliente(cta):null);
      if(!u)return fallo('Usuario o contraseña incorrectos. Acceso rechazado.');
      USER=u;alIngresar();try{sessionStorage.setItem(LS+'-u',u.u)}catch(er){}}
    if(!location.hash)location.hash='#inicio';render();toast('Bienvenida, '+USER.nombre.split(' ')[0]+'.');return}
  if(e.target.matches('[data-search]')){e.preventDefault();ui.q=e.target.q.value.trim();if(location.hash==='#buscar')render();else location.hash='#buscar'}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
window.addEventListener('hashchange',()=>{closeModal();render();window.scrollTo(0,0)});

/* ================= Arranque ================= */
(async function iniciar(){
  MODO=await detectarModo();
  if(MODO==='api'){
    const r=await http('GET','/sesion');
    if(r.status===200){USER=r.usuario;alIngresar();await recargar()}
  }else{
    load();
    try{const su=sessionStorage.getItem(LS+'-u');if(su){const cta=(DBT.accesos||[]).find(x=>x.usuario===su&&x.activo);USER=USERS_DEMO.find(u=>u.u===su)||(cta?usuarioCliente(cta):null)}}catch(e){}
    if(USER)alIngresar();
  }
  render();
})();

/* ================= COTIZADOR DE MATERIALES ================= */
/* Pegar al final de app.js; no modifica otras funciones. */

const COT_BORRADOR = LS + '-cot-borrador';
let cotFilas = [];

try {
  const datos = JSON.parse(
    localStorage.getItem(COT_BORRADOR) || '[]'
  );
  if (Array.isArray(datos)) cotFilas = datos;
} catch (e) {}

function cotGuardar() {
  try {
    localStorage.setItem(
      COT_BORRADOR,
      JSON.stringify(cotFilas)
    );
  } catch (e) {}
}

function cotCantidad(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0
    ? numero : 0;
}

function cotPrecio(material) {
  if (!material ||
      material.precioRef === '' ||
      material.precioRef == null) return null;

  const precio = Number(material.precioRef);

  return Number.isFinite(precio) && precio >= 0
    ? precio : null;
}

function cotTotal() {
  return cotFilas.reduce((total, fila) => {
    const precio = cotPrecio(
      byId('materiales', fila.materialId)
    );
    return total +
      cotCantidad(fila.cantidad) * (precio ?? 0);
  }, 0);
}

function vCotizador() {
  const materiales = DB.materiales.slice().sort(
    (a, b) => a.nombre.localeCompare(b.nombre, 'es')
  );

  const filas = cotFilas.map((fila, i) => {
    const material = byId('materiales', fila.materialId);
    const precio = cotPrecio(material);

    const proveedores = material
      ? (material.proveedorIds || [])
          .map(id => byId('proveedores', id)?.nombre)
          .filter(Boolean)
          .join(', ')
      : '';

    return `<tr>
      <td>
        <select data-cot-material="${i}"
          ${can() ? '' : 'disabled'}>
          <option value="">Seleccioná un material...</option>
          ${materiales.map(m =>
            opt([m.id, m.nombre], fila.materialId)
          ).join('')}
        </select>

        <small class="muted cot-prov">
          ${material
            ? 'Proveedor: ' +
              esc(proveedores || 'No asignado')
            : 'Elegí un material del catálogo'}
        </small>
      </td>

      <td>
        <input type="number"
          min="0.01"
          step="any"
          value="${esc(fila.cantidad)}"
          data-cot-cantidad="${i}"
          ${can() ? '' : 'disabled'}>
      </td>

      <td>${esc(material?.unidad || '—')}</td>

      <td>
        ${precio === null
          ? 'Sin precio'
          : money(precio)}
      </td>

      <td class="num" data-cot-subtotal="${i}">
        ${precio === null
          ? '—'
          : money(precio * cotCantidad(fila.cantidad))}
      </td>

      <td>
        ${can()
          ? `<button class="btn ghost sm"
               data-act="cotQuitar"
               data-id="${i}">Quitar</button>`
          : ''}
      </td>
    </tr>`;
  }).join('');

  return ph(
    'Cotizador de <b>materiales</b>',
    'Elegí los materiales y sus cantidades para calcular el presupuesto.',
    ''
  ) + `
    <section class="card cot-card">

      <p class="cot-hint">
        El precio se configura en
        <a href="#materiales">Materiales</a>
        → Precio de referencia (₡).
        Se utilizan tus proveedores registrados.
      </p>

      <div class="cot-gridwrap">
        <table class="tbl cot-table">
          <thead>
            <tr>
              <th>Material / proveedor</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio unitario</th>
              <th class="num">Subtotal</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${filas || `<tr>
              <td colspan="6">
                Todavía no agregaste materiales.
              </td>
            </tr>`}
          </tbody>
        </table>
      </div>

      <div class="cot-actions">
        ${can() ? `
          <button class="btn" data-act="cotAgregar">
            + Agregar material
          </button>

          <button class="btn ghost" data-act="cotLimpiar">
            Limpiar
          </button>
        ` : ''}
      </div>

      <div class="cot-total">
        <div class="grand">
          <span>Total</span>
          <strong data-cot-total>
            ${money(cotTotal())}
          </strong>
        </div>
      </div>

      <small class="muted">
        Este presupuesto es un borrador guardado
        en este navegador. Los materiales sin
        precio no se suman al total.
      </small>

    </section>`;
}

/* Agregar Cotizador al menú */

if (!NAV.some(([clave]) => clave === 'cotizador')) {
  const posicion = NAV.findIndex(
    ([clave]) => clave === 'acerca'
  );

  NAV.splice(
    posicion < 0 ? NAV.length : posicion,
    0,
    ['cotizador', 'Cotizador']
  );
}

/* Mostrar el cotizador sin alterar las otras pantallas */

const renderAnterior = render;

render = function () {
  if (USER && location.hash === '#cotizador' && puedeVer('cotizador')) {
    $('#app').innerHTML = shell(
      'cotizador',
      vCotizador()
    );
    aplicarPermisos($('#app'));
  } else {
    renderAnterior();
  }
};

/* Botones del cotizador */

ACT.cotAgregar = function () {
  if (!needEdit()) return;

  cotFilas.push({
    materialId: '',
    cantidad: 1
  });

  cotGuardar();
  render();
};

ACT.cotQuitar = function (indice) {
  if (!needEdit()) return;

  cotFilas.splice(Number(indice), 1);

  cotGuardar();
  render();
};

ACT.cotLimpiar = function () {
  if (!needEdit()) return;

  cotFilas = [];

  cotGuardar();
  render();
};

/* Actualización automática de los cálculos */

function cotActualizarSubtotales() {
  cotFilas.forEach((fila, i) => {
    const celda = document.querySelector(
      `[data-cot-subtotal="${i}"]`
    );

    const precio = cotPrecio(
      byId('materiales', fila.materialId)
    );

    if (celda) {
      celda.textContent = precio === null
        ? '—'
        : money(precio * cotCantidad(fila.cantidad));
    }
  });

  const total = document.querySelector(
    '[data-cot-total]'
  );

  if (total) {
    total.textContent = money(cotTotal());
  }
}

/* Detectar cambios de cantidad */

document.addEventListener('input', e => {
  const elemento = e.target.closest(
    '[data-cot-cantidad]'
  );

  if (!elemento || !can()) return;

  const fila = cotFilas[
    Number(elemento.dataset.cotCantidad)
  ];

  if (!fila) return;

  fila.cantidad = elemento.value;

  cotGuardar();
  cotActualizarSubtotales();
});

/* Detectar selección de materiales */

document.addEventListener('change', e => {
  const elemento = e.target.closest(
    '[data-cot-material]'
  );

  if (!elemento || !can()) return;

  const fila = cotFilas[
    Number(elemento.dataset.cotMaterial)
  ];

  if (!fila) return;

  fila.materialId = elemento.value;

  cotGuardar();
  render();
});
