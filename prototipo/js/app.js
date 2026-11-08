'use strict';
/* ================= Catálogos y reglas de negocio ================= */
const LS='anemona-proto-v1';
const TIPOS=['Anteproyecto','Diseño de interiores','Mobiliario a medida','Remodelación','Gestión de construcción'];
const ESTADOS=['Por iniciar','En diseño','En ejecución','En pausa','Finalizado','Cancelado'];
const TRANS={'Por iniciar':['En diseño','Cancelado'],'En diseño':['En ejecución','En pausa','Finalizado','Cancelado'],'En ejecución':['En pausa','Finalizado','Cancelado'],'En pausa':['En diseño','En ejecución','Cancelado'],'Finalizado':[],'Cancelado':[]};
const ACTIVOS=['Por iniciar','En diseño','En ejecución'];
const EST_LEAD=['Nuevo','Contactado','Reunión agendada','Cotización enviada','No continuó'];
const EST_ACT=['Pendiente','En proceso','Completada'];
const CATS=['Iluminación','Mobiliario','Ebanistería','Construcción','Acabados','Materiales','Electrodomésticos','Otros servicios'];
const UNIDADES=['unidad','m²','metro lineal','lámina','galón','juego','servicio'];
const COND=['Considerado','Seleccionado'];
const EST_COT=['Enviada','Aceptada','Rechazada'];
const RESP=['Gabriela Núñez','María José','Colaborador externo'];
const KIND_PROY={'Por iniciar':'info','En diseño':'sea','En ejecución':'coral','En pausa':'warn','Finalizado':'ok','Cancelado':'mute'};
const KIND_LEAD={'Nuevo':'info','Contactado':'sea','Reunión agendada':'coral','Cotización enviada':'warn','No continuó':'mute','Convertido':'ok'};
const KIND_ACT={'Pendiente':'info','En proceso':'warn','Completada':'ok'};
const KIND_COT={'Enviada':'warn','Aceptada':'ok','Rechazada':'mute'};
/* Plan de acción por tipo de servicio (minuta 01, tema 3) — propuesta, pendiente de validar con la empresa */
const PLAN={
 'Anteproyecto':[['Reunión inicial con el cliente',0],['Levantamiento del sitio',5],['Propuesta conceptual',14,1],['Revisión con el cliente',18],['Ajustes y entrega del anteproyecto',28,1]],
 'Diseño de interiores':[['Reunión inicial con el cliente',0],['Elaboración del mood board',7,1],['Revisión del mood board con el cliente',10],['Registro e incorporación de comentarios',14],['Propuesta de distribución y planos',24,1,'María José'],['Renders',35,1,'María José'],['Selección de materiales y proveedores',40],['Entrega final',50,1]],
 'Mobiliario a medida':[['Reunión y toma de medidas',0],['Diseño del mueble',7,1],['Aprobación del diseño por el cliente',10],['Coordinación con ebanista',12],['Fabricación',30],['Instalación y entrega',35,1]],
 'Remodelación':[['Reunión inicial con el cliente',0],['Levantamiento del sitio',5],['Diseño y planos',20,1,'María José'],['Selección de materiales',25],['Cotización con contratistas',30],['Inicio de obra',40],['Seguimiento de obra',60],['Entrega de la remodelación',75,1]],
 'Gestión de construcción':[['Revisión de planos',0],['Contratación del equipo de construcción',10],['Inicio de obra',20],['Inspección de avance',45],['Entrega de obra',80,1]]
};
const USERS=[
 {u:'gabriela',p:'anemona2026',nombre:'Gabriela Núñez',ini:'GN',rol:'Propietaria',edit:true},
 {u:'mariajose',p:'anemona2026',nombre:'María José',ini:'MJ',rol:'Arquitecta',edit:true},
 {u:'consulta',p:'consulta',nombre:'Usuario de consulta',ini:'UC',rol:'Solo consulta (demo)',edit:false}
];

/* ================= Utilidades ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Math.random().toString(36).slice(2,8);
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const today=()=>iso(new Date());
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return iso(d)};
const diff=s=>Math.round((parseD(s)-parseD(today()))/864e5);
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESL=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const fd=s=>{if(!s)return '—';const d=parseD(s);return d.getDate()+' '+MES[d.getMonth()]+' '+d.getFullYear()};
const money=n=>(n===''||n==null||isNaN(n))?'—':'₡'+Number(n).toLocaleString('es-CR',{maximumFractionDigits:2});
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const digits=s=>String(s||'').replace(/\D/g,'');
const byFecha=(a,b)=>(a.fecha||'9999').localeCompare(b.fecha||'9999');
const byId=(c,id)=>DB[c].find(x=>x.id===id);
const rf=t=>`<span class="rf">${t}</span>`;
const badge=(t,k)=>`<span class="b ${k||'mute'}">${esc(t)}</span>`;
const opt=(o,sel)=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(l)}</option>`};

/* ================= Datos ================= */
let DB, USER=null;
const ui={tab:'resumen',lastProj:null,leadF:'activos',pf:{tipo:'',estado:'',q:''},provCat:'',matCat:'',cal:null,calResp:'',q:''};

function planActs(pid,tipo,start){
  return (PLAN[tipo]||[]).map(([n,off,ent,resp])=>({id:uid('a'),proyectoId:pid,nombre:n,responsable:resp||'Gabriela Núñez',fecha:addDays(start,off),estado:'Pendiente',entregable:!!ent}));
}
function seed(){
  const T=today();
  const d={leads:[],clientes:[],proyectos:[],actividades:[],proveedores:[],materiales:[],provProy:[],matProy:[],cotizaciones:[]};
  d.leads=[
   {id:'l1',nombre:'Sofía Rojas Alvarado',telefono:'8890-1122',correo:'sofia.rojas@correo.com',nacionalidad:'Costarricense',servicio:'Diseño de interiores',estado:'Contactado',notas:'Escribió por WhatsApp; apartamento nuevo en Heredia.',creado:addDays(T,-6)},
   {id:'l2',nombre:'Carlos Vargas Mena',telefono:'7012-4455',correo:'',nacionalidad:'Costarricense',servicio:'Mobiliario a medida',estado:'Nuevo',notas:'Interesado en un escritorio y librero.',creado:addDays(T,-2)},
   {id:'l3',nombre:'Daniela Jiménez',telefono:'',correo:'dani.jimenez@mail.com',nacionalidad:'Colombiana',servicio:'Remodelación',estado:'Cotización enviada',notas:'Remodelación de baño principal. Cotización enviada por WhatsApp.',creado:addDays(T,-15)}
  ];
  d.clientes=[
   {id:'c1',nombre:'Laura Méndez Quesada',tipoId:'Cédula',numId:'1-1234-0567',telefono:'8765-4321',correo:'laura.mendez@correo.com',nacionalidad:'Costarricense',creado:addDays(T,-40)},
   {id:'c2',nombre:'Andrew Solís',tipoId:'Pasaporte',numId:'P88123456',telefono:'+1 305 555 0142',correo:'andrew.solis@mail.com',nacionalidad:'Estadounidense',creado:addDays(T,-25)}
  ];
  d.proyectos=[
   {id:'p1',clienteId:'c1',nombre:'Apartamento Escazú',tipo:'Diseño de interiores',descripcion:'Diseño interior completo de apartamento de 2 habitaciones: sala, comedor, cocina y dormitorio principal.',fechaInicio:addDays(T,-20),ubicacion:'Escazú, San José',area:'85',estado:'En diseño'},
   {id:'p2',clienteId:'c1',nombre:'Mueble de TV a medida',tipo:'Mobiliario a medida',descripcion:'Mueble flotante de TV con almacenamiento para la sala.',fechaInicio:addDays(T,-15),ubicacion:'Escazú, San José',area:'',estado:'En ejecución'},
   {id:'p3',clienteId:'c2',nombre:'Remodelación de cocina Solís',tipo:'Remodelación',descripcion:'Remodelación de cocina con nueva distribución, muebles y acabados.',fechaInicio:addDays(T,5),ubicacion:'Santa Ana, San José',area:'18',estado:'Por iniciar'},
   {id:'p4',clienteId:'c2',nombre:'Anteproyecto casa de playa',tipo:'Anteproyecto',descripcion:'Anteproyecto de vivienda vacacional. Solo trabajo interno del estudio (sin proveedores ni materiales).',fechaInicio:addDays(T,12),ubicacion:'Nosara, Guanacaste',area:'160',estado:'Por iniciar'}
  ];
  const a1=planActs('p1','Diseño de interiores',addDays(T,-20)).map(a=>({...a,estado:a.fecha<T?(a.nombre.includes('comentarios')?'Pendiente':'Completada'):(a.nombre.includes('planos')?'En proceso':'Pendiente')}));
  const a2=planActs('p2','Mobiliario a medida',addDays(T,-15)).map(a=>({...a,estado:a.fecha<T?'Completada':(a.nombre==='Fabricación'?'En proceso':'Pendiente')}));
  const a3=planActs('p3','Remodelación',addDays(T,5));
  d.actividades=[...a1,...a2,...a3];
  d.proveedores=[
   {id:'v1',nombre:'Luz & Forma',categorias:['Iluminación'],contacto:'Pamela Ruiz',telefono:'8811-2233',correo:'ventas@luzyforma.cr',ofrece:'Lámparas colgantes, apliques, cintas LED.',notas:'Responde rápido; buena experiencia previa.'},
   {id:'v2',nombre:'Iluminarte',categorias:['Iluminación'],contacto:'Diego Castro',telefono:'2222-3344',correo:'',ofrece:'Iluminación decorativa importada.',notas:'Tiempos de entrega de 3–4 semanas.'},
   {id:'v3',nombre:'Ebanistería Hermanos Mora',categorias:['Ebanistería','Mobiliario'],contacto:'Luis Mora',telefono:'8456-7788',correo:'',ofrece:'Muebles a medida, cocinas, closets.',notas:''},
   {id:'v4',nombre:'Porcelanatos del Valle',categorias:['Acabados','Materiales'],contacto:'Karla Vindas',telefono:'2290-1010',correo:'kvindas@pvalle.cr',ofrece:'Porcelanatos, revestimientos, griferías.',notas:''},
   {id:'v5',nombre:'Constructora Brenes',categorias:['Construcción'],contacto:'Mauricio Brenes',telefono:'8333-9090',correo:'',ofrece:'Obra gris, remodelaciones, demoliciones.',notas:''},
   {id:'v6',nombre:'Casa Mobili',categorias:['Mobiliario'],contacto:'Andrea León',telefono:'4000-1200',correo:'hola@casamobili.cr',ofrece:'Sofás, sillas, mesas de comedor.',notas:''}
  ];
  d.materiales=[
   {id:'m1',nombre:'Lámpara colgante de ratán',modelo:'RT-40',categoria:'Iluminación',unidad:'unidad',precioRef:'45000',proveedorIds:['v1','v2'],descripcion:'Diámetro 40 cm.'},
   {id:'m2',nombre:'Porcelanato 60×60 gris cemento',modelo:'PV-6060G',categoria:'Acabados',unidad:'m²',precioRef:'12500',proveedorIds:['v4'],descripcion:''},
   {id:'m3',nombre:'Plywood de pino 18 mm',modelo:'',categoria:'Materiales',unidad:'lámina',precioRef:'28000',proveedorIds:['v3'],descripcion:''},
   {id:'m4',nombre:'Sofá modular 3 plazas',modelo:'Oslo',categoria:'Mobiliario',unidad:'unidad',precioRef:'650000',proveedorIds:['v6'],descripcion:'Tela lino arena.'}
  ];
  d.provProy=[
   {id:'pp1',proyectoId:'p1',proveedorId:'v1',condicion:'Seleccionado'},
   {id:'pp2',proyectoId:'p1',proveedorId:'v2',condicion:'Considerado'},
   {id:'pp3',proyectoId:'p1',proveedorId:'v6',condicion:'Seleccionado'},
   {id:'pp4',proyectoId:'p2',proveedorId:'v3',condicion:'Seleccionado'},
   {id:'pp5',proyectoId:'p3',proveedorId:'v4',condicion:'Considerado'},
   {id:'pp6',proyectoId:'p3',proveedorId:'v5',condicion:'Considerado'}
  ];
  d.matProy=[
   {id:'mp1',proyectoId:'p1',materialId:'m1',cantidad:'3',precioUnit:'45000',nota:'Comedor'},
   {id:'mp2',proyectoId:'p1',materialId:'m4',cantidad:'1',precioUnit:'650000',nota:''},
   {id:'mp3',proyectoId:'p2',materialId:'m3',cantidad:'4',precioUnit:'28000',nota:''}
  ];
  d.cotizaciones=[
   {id:'q1',proyectoId:'p1',codigo:'COT-2026-014',fecha:addDays(T,-28),monto:'1800000',estado:'Aceptada',enlace:'https://www.canva.com/',archivo:'COT-2026-014_Apartamento_Escazu.pdf'}
  ];
  return d;
}
function load(){try{const s=localStorage.getItem(LS);if(s){DB=JSON.parse(s);return}}catch(e){}DB=seed()}
function save(){try{localStorage.setItem(LS,JSON.stringify(DB))}catch(e){}}

/* ================= Acceso (RF-17) ================= */
const can=()=>!!(USER&&USER.edit);
function needEdit(){if(can())return true;toast('Acción no autorizada para el rol «'+USER.rol+'». Este usuario solo puede consultar.','err');return false}

/* ================= Modal, formularios y mensajes ================= */
function toast(msg,kind){const t=document.createElement('div');t.className='toast '+(kind||'ok');t.textContent=msg;$('#toasts').appendChild(t);setTimeout(()=>t.classList.add('out'),3400);setTimeout(()=>t.remove(),3900)}
function modal(html,wide){$('#modal-root').innerHTML=`<div class="overlay"><div class="dialog ${wide?'wide':''}" role="dialog" aria-modal="true"><button class="x" data-close aria-label="Cerrar">×</button>${html}</div></div>`;return $('#modal-root .dialog')}
function closeModal(){$('#modal-root').innerHTML=''}
function confirmBox(title,msg,yes,onYes){const d=modal(`<h2>${esc(title)}</h2><p>${msg}</p><div class="actions"><button class="btn ghost" data-close>Cancelar</button><button class="btn danger" id="cy">${esc(yes)}</button></div>`);d.querySelector('#cy').onclick=()=>{closeModal();onYes()}}
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
  else if(f.type==='file'){const fi=els[0]&&els[0].files&&els[0].files[0];v[f.k]=fi?fi.name:(f.current||'')}
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
  const ks=Object.keys(errs);let first=null;
  ks.forEach(k=>{const el=form.querySelector(`.field[data-k="${k}"]`);if(!el)return;el.classList.add('bad');el.querySelector('.ferr').textContent=errs[k];if(!first)first=el});
  const sum=form.querySelector('.errsum');sum.hidden=false;
  sum.textContent=`No se pudo guardar: revise ${ks.length===1?'el campo marcado':'los '+ks.length+' campos marcados'}. Los demás datos ingresados se conservaron.`;
  if(first){const i=first.querySelector('input,select,textarea');if(i)i.focus()}
}
/* cfg: {title,intro,fields,values,submit,extra,wide,onSubmit(v)=>({errors}|{msg,go})} */
function openForm(cfg){
  const d=modal(`<h2>${esc(cfg.title)} ${cfg.rf?rf(cfg.rf):''}</h2>${cfg.intro?`<p class="intro">${cfg.intro}</p>`:''}
   <form class="fm" novalidate>${cfg.fields.map(fieldHtml).join('')}<div class="errsum" hidden></div>
   <div class="actions">${cfg.extra?`<span class="left">${cfg.extra}</span>`:''}<button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn" type="submit">${esc(cfg.submit||'Guardar')}</button></div></form>`,cfg.wide);
  const form=d.querySelector('form');
  setVals(form,cfg.fields,cfg.values||{});
  form.addEventListener('submit',e=>{e.preventDefault();
    const v=readForm(form,cfg.fields);let errs=validate(cfg.fields,v);
    let r=Object.keys(errs).length?{errors:errs}:cfg.onSubmit(v);
    if(r&&r.errors){showErrs(form,r.errors);return}
    save();closeModal();if(r&&r.msg)toast(r.msg);
    if(r&&r.go&&location.hash!==r.go)location.hash=r.go;else render();
  });
  const first=form.querySelector('input:not([type=checkbox]),select,textarea');if(first)first.focus();
}

/* ================= Validaciones de dominio ================= */
function idCheck(tipoKey){return (val,v)=>{const t=v[tipoKey];if(!val||!t)return '';
  if(t==='Cédula'&&digits(val).length!==9)return 'La cédula debe tener 9 dígitos (ej. 1-1234-0567).';
  if(t==='Pasaporte'&&!/^[A-Za-z0-9]{6,20}$/.test(val.replace(/[\s-]/g,'')))return 'El pasaporte debe tener entre 6 y 20 letras o números.';
  return ''}}
const normId=(t,n)=>t+':'+(t==='Cédula'?digits(n):String(n).replace(/[\s-]/g,'').toUpperCase());
function idDuplicado(t,n,exceptId){const k=normId(t,n);return DB.clientes.find(c=>c.id!==exceptId&&normId(c.tipoId,c.numId)===k)}
const contactoCheck=(val,v)=>(!v.telefono&&!v.correo)?'Indique al menos un medio de contacto: teléfono o correo.':'';
/* Detección de duplicados de personas (CU-01 flujo alternativo) */
function personaDuplicada(v,exceptLead,exceptCli){
  const n=norm(v.nombre),t=digits(v.telefono),c=norm(v.correo);
  const same=p=>(n&&norm(p.nombre)===n)||(t&&t.length>=8&&digits(p.telefono)===t)||(c&&norm(p.correo)===c);
  const l=DB.leads.find(p=>p.id!==exceptLead&&!p.convertidoA&&same(p));if(l)return `Ya existe como potencial cliente: «${l.nombre}».`;
  const k=DB.clientes.find(p=>p.id!==exceptCli&&same(p));if(k)return `Ya existe como cliente: «${k.nombre}».`;
  return ''}

/* ================= Helpers de vista ================= */
const cliName=id=>(byId('clientes',id)||{}).nombre||'—';
const projActs=pid=>DB.actividades.filter(a=>a.proyectoId===pid).sort(byFecha);
function prog(pid){const a=projActs(pid);if(!a.length)return null;const d=a.filter(x=>x.estado==='Completada').length;return {d,t:a.length,pct:Math.round(d*100/a.length)}}
function progHtml(pid){const p=prog(pid);return p?`<div class="prog"><div style="width:${p.pct}%"></div></div><small class="muted">${p.d}/${p.t} actividades · ${p.pct}%</small>`:'<small class="muted">Sin actividades</small>'}
function whenB(a){if(a.estado==='Completada'||!a.fecha)return '';const d=diff(a.fecha);
  if(d<0)return badge('Atrasada '+(-d)+' d','err');if(d===0)return badge('Hoy','coral');if(d===1)return badge('Mañana','warn');if(d<=7)return badge('En '+d+' días','warn');return ''}
function actRow(a,showProj){const p=byId('proyectos',a.proyectoId)||{};const dt=parseD(a.fecha);const late=a.estado!=='Completada'&&a.fecha<today();
  return `<div class="arow ${late?'late':''}" data-act="verAct" data-id="${a.id}"><div class="dpill"><b>${dt.getDate()}</b><small>${MES[dt.getMonth()]}</small></div>
  <div class="grow"><b>${esc(a.nombre)}</b><small>${showProj?esc(p.nombre)+' · ':''}${esc(a.responsable)}${a.entregable?' · <span class="ent">Entregable</span>':''}</small></div>${whenB(a)} ${badge(a.estado,KIND_ACT[a.estado])}</div>`}
function ph(title,sub,acts,crumb){return `<div class="ph"><div>${crumb?`<div class="crumb">${crumb}</div>`:''}<h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="acts">${acts||''}</div></div>`}
const emptyBox=t=>`<div class="empty">${t}</div>`;

/* ================= Vistas ================= */
function vLogin(){
  return `<div class="login"><div class="art"><div class="brand" style="border:0">${logo(38)}<div><b style="color:#fff">Anémona</b><small>Design Studio</small></div></div>
  <div><h1>Clientes, proyectos y proveedores en un solo lugar.</h1><p>Prototipo funcional basado en el ERS v1.0 — IC5821 Requerimientos de Software, Grupo 01.</p></div>
  <small style="opacity:.6">Datos de ejemplo ficticios. La información se guarda solo en este navegador.</small>${logo(420,'big')}</div>
  <div class="frm"><form class="box" id="loginf" novalidate><h2>Ingresar ${rf('RF-17')}</h2><p class="muted" style="margin:0">Acceso exclusivo para el personal del estudio.</p>
   <div class="field"><label>Usuario</label><input name="u" autocomplete="username"></div>
   <div class="field"><label>Contraseña</label><input name="p" type="password" autocomplete="current-password"></div>
   <div class="msg"></div>
   <button class="btn" style="width:100%;margin-top:14px;padding:10px">Ingresar</button>
   <div class="demo"><b>Usuarios de demostración</b> <span class="muted">(clic para completar)</span><table>
   ${USERS.map(u=>`<tr data-fill="${u.u}|${u.p}"><td>${esc(u.nombre)}<br><small class="muted">${esc(u.rol)}</small></td><td><code>${u.u}</code></td><td><code>${u.p}</code></td></tr>`).join('')}</table></div>
  </form></div></div>`}
function logo(s,cls){return `<svg class="${cls||''}" width="${s}" height="${s}" viewBox="0 0 100 100" fill="none" stroke="${cls?'#fff':'#f3c9bc'}" stroke-width="5" stroke-linecap="round">${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<path d="M50 50 Q${50+28*Math.cos(a+.35)} ${50+28*Math.sin(a+.35)} ${50+44*Math.cos(a)} ${50+44*Math.sin(a)}"/>`}).join('')}<circle cx="50" cy="50" r="11" fill="${cls?'#fff':'#c95f45'}" stroke="none"/></svg>`}

const NAV=[['inicio','Inicio',''],['potenciales','Potenciales clientes','RF-01·03'],['clientes','Clientes','RF-04'],['proyectos','Proyectos','RF-05·08'],['calendario','Calendario','RF-13·14'],['proveedores','Proveedores','RF-09'],['materiales','Materiales','RF-10'],['acerca','Acerca del prototipo','']];
const PARENT={cliente:'clientes',proyecto:'proyectos',proveedor:'proveedores',buscar:''};
function shell(view,content){
  const act=PARENT[view]!==undefined?PARENT[view]:view;
  return `<div class="layout"><aside class="side"><div class="brand">${logo(34)}<div><b>Anémona</b><small>Design Studio</small></div></div>
  <nav>${NAV.map(([k,l,r])=>`<a href="#${k}" class="${act===k?'on':''}"><span>${l}</span>${r?rf(r):''}</a>`).join('')}</nav>
  <div class="side-foot"><label><input type="checkbox" data-chg="toggleRF" ${document.body.classList.contains('show-rf')?'checked':''}> Mostrar trazabilidad (RF)</label>
  <button class="linkbtn" data-act="reset">Restablecer datos de ejemplo</button></div></aside>
  <div class="main"><header class="top"><form class="search" data-search><input name="q" placeholder="Buscar clientes, proyectos, proveedores, materiales…" value="${esc(ui.q)}" aria-label="Búsqueda general"></form>
  <div class="user"><span class="avatar">${USER.ini}</span><div><b>${esc(USER.nombre)}</b><small>${esc(USER.rol)}</small></div><button class="btn ghost sm" data-act="logout">Salir</button></div></header>
  <main id="view">${content}</main></div></div>`}

function vInicio(){
  const T=today();
  const abiertos=DB.proyectos.filter(p=>!['Finalizado','Cancelado'].includes(p.estado)).map(p=>p.id);
  const pend=DB.actividades.filter(a=>a.estado!=='Completada'&&abiertos.includes(a.proyectoId));
  const atras=pend.filter(a=>a.fecha<T).sort(byFecha);
  const prox=pend.filter(a=>a.fecha>=T&&diff(a.fecha)<=14).sort(byFecha);
  const entProx=prox.filter(a=>a.entregable);
  const activos=DB.proyectos.filter(p=>ACTIVOS.includes(p.estado));
  const leads=DB.leads.filter(l=>!l.convertidoA&&l.estado!=='No continuó');
  const h=new Date().getHours();const sal=h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';
  const fecha=new Date().toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const kpi=(n,l,href,c)=>`<a class="kpi ${c||''}" href="${href}"><b>${n}</b><span>${l}</span></a>`;
  const urg=[...atras,...prox].slice(0,9);
  return ph(`${sal}, ${esc(USER.nombre.split(' ')[0])}`,fecha.charAt(0).toUpperCase()+fecha.slice(1),
    `<button class="btn ghost" data-act="nuevoLead">+ Potencial cliente</button><button class="btn" data-act="nuevoProyecto">+ Nuevo proyecto</button>`)+
  `<div class="kpis">${kpi(activos.length,'Proyectos activos','#proyectos')}${kpi(pend.length,'Tareas pendientes','#calendario')}${kpi(entProx.length,'Entregables en los próximos 14 días','#calendario','coral')}${kpi(atras.length,'Actividades atrasadas','#calendario',atras.length?'danger':'')}${kpi(leads.length,'Potenciales clientes en seguimiento','#potenciales')}</div>
  <div class="grid2"><section class="card"><h3>Urgente y próximo ${rf('RF-13·14')}</h3>${urg.length?`<div class="alist">${urg.map(a=>actRow(a,true)).join('')}</div>`:emptyBox('No hay actividades pendientes en los próximos 14 días.')}</section>
  <section class="card"><h3>Proyectos activos ${rf('RF-06·08')}</h3>${activos.length?`<div class="plist">${activos.map(p=>{const nx=projActs(p.id).find(a=>a.estado!=='Completada');
    return `<a class="pitem" href="#proyecto-${p.id}"><div><b>${esc(p.nombre)}</b><small>${esc(cliName(p.clienteId))} · ${esc(p.tipo)}</small><br>${badge(p.estado,KIND_PROY[p.estado])} ${nx?`<small>Siguiente: ${esc(nx.nombre)} (${fd(nx.fecha)})</small>`:''}</div><div>${progHtml(p.id)}</div></a>`}).join('')}</div>`:emptyBox('No hay proyectos activos.')}</section></div>
  <p class="note"><b>Origen:</b> esta pantalla responde a lo que Gabriela pidió ver al iniciar el día (minuta 01, tema 6): proyectos activos, tareas pendientes, entregables próximos y actividades urgentes.</p>`}

/* ---------- Potenciales clientes RF-01, RF-02, RF-03 ---------- */
function vPotenciales(){
  const f=ui.leadF;
  let rows=DB.leads.slice().sort((a,b)=>(b.creado||'').localeCompare(a.creado||''));
  if(f==='activos')rows=rows.filter(l=>!l.convertidoA&&l.estado!=='No continuó');
  else if(f==='convertidos')rows=rows.filter(l=>l.convertidoA);
  else if(f!=='todos')rows=rows.filter(l=>!l.convertidoA&&l.estado===f);
  const chips=[['activos','En seguimiento'],...EST_LEAD.map(e=>[e,e]),['convertidos','Convertidos'],['todos','Todos']];
  return ph('Potenciales clientes '+rf('RF-01 RF-02 RF-03'),'Personas interesadas que aún no han firmado contrato ni realizado el primer depósito.',`<button class="btn" data-act="nuevoLead">+ Registrar potencial cliente</button>`)+
  `<div class="filters"><div class="chips">${chips.map(([k,l])=>`<button class="chip ${f===k?'on':''}" data-act="leadF" data-id="${esc(k)}">${esc(l)}</button>`).join('')}</div></div>
  <div class="card tblwrap">${rows.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Contacto</th><th>Nacionalidad</th><th>Servicio de interés</th><th>Estado</th><th>Registro</th><th></th></tr></thead><tbody>
  ${rows.map(l=>`<tr class="click" data-act="editLead" data-id="${l.id}"><td><b>${esc(l.nombre)}</b>${l.notas?`<br><small class="muted">${esc(l.notas.slice(0,70))}${l.notas.length>70?'…':''}</small>`:''}</td>
   <td>${esc(l.telefono||'')}${l.telefono&&l.correo?'<br>':''}<small>${esc(l.correo||'')}</small></td><td>${esc(l.nacionalidad||'—')}</td><td>${esc(l.servicio)}</td>
   <td>${l.convertidoA?badge('Convertido','ok'):badge(l.estado,KIND_LEAD[l.estado])}</td><td><small>${fd(l.creado)}</small></td>
   <td class="num">${l.convertidoA?`<a class="btn ghost sm" href="#cliente-${l.convertidoA}">Ver cliente</a>`:`<button class="btn sm coral" data-act="convertir" data-id="${l.id}">Convertir a cliente</button>`}</td></tr>`).join('')}
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
  openForm({title:l?'Potencial cliente':'Registrar potencial cliente',rf:l?'RF-02':'RF-01',fields:leadFields(),values:l||{estado:'Nuevo'},submit:l?'Guardar cambios':'Registrar',
   extra:l&&!l.convertidoA?`<button type="button" class="btn coral" data-act="convertir" data-id="${l.id}">Convertir a cliente</button>`:'',
   onSubmit:v=>{const dup=personaDuplicada(v,l&&l.id,null);if(dup)return {errors:{nombre:dup+' No se creó un registro duplicado.'}};
    if(l){Object.assign(l,v);return {msg:'Cambios guardados.'}}
    DB.leads.push({id:uid('l'),...v,creado:today()});ui.leadF='activos';return {msg:'Potencial cliente registrado.',go:'#potenciales'}}});
}
function formConvertir(l){
  if(!needEdit())return;
  const f=[
   {k:'tipoId',label:'Tipo de identificación',type:'select',options:['Cédula','Pasaporte'],req:true},
   {k:'numId',label:'Número de identificación',req:true,check:idCheck('tipoId'),ph:'1-1234-0567'},
   {k:'contrato',label:'Confirmo que firmó el contrato y realizó el primer depósito',type:'checkbox',req:true,help:'Condición para considerar a la persona como cliente (minuta 01, tema 2).'}];
  openForm({title:'Convertir en cliente',rf:'RF-03',intro:`Se conservarán los datos de <b>${esc(l.nombre)}</b>: ${esc([l.telefono,l.correo].filter(Boolean).join(' · '))}${l.nacionalidad?' · '+esc(l.nacionalidad):''}.`,fields:f,submit:'Convertir',
   onSubmit:v=>{const dup=idDuplicado(v.tipoId,v.numId);if(dup)return {errors:{numId:`Esta identificación ya pertenece al cliente «${dup.nombre}». No se creó un nuevo registro.`}};
    const c={id:uid('c'),nombre:l.nombre,tipoId:v.tipoId,numId:v.numId,telefono:l.telefono,correo:l.correo,nacionalidad:l.nacionalidad,origenLead:l.id,creado:today()};
    DB.clientes.push(c);l.convertidoA=c.id;return {msg:`${l.nombre} ahora es cliente.`,go:'#cliente-'+c.id}}});
}

/* ---------- Clientes RF-04 ---------- */
function vClientes(){
  const rows=DB.clientes.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return ph('Clientes '+rf('RF-04'),'Personas con contrato firmado. Cada cliente puede tener varios proyectos (RN-01).',`<button class="btn" data-act="nuevoCliente">+ Registrar cliente</button>`)+
  `<div class="card tblwrap">${rows.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Identificación</th><th>Contacto</th><th>Nacionalidad</th><th class="num">Proyectos</th></tr></thead><tbody>
  ${rows.map(c=>{const n=DB.proyectos.filter(p=>p.clienteId===c.id).length;return `<tr class="click" data-goto="#cliente-${c.id}"><td><b>${esc(c.nombre)}</b></td><td>${esc(c.tipoId)} ${esc(c.numId)}</td><td>${esc(c.telefono||'')}<br><small>${esc(c.correo||'')}</small></td><td>${esc(c.nacionalidad||'—')}</td><td class="num">${n}</td></tr>`}).join('')}
  </tbody></table>`:emptyBox('Aún no hay clientes registrados.')}</div>
  <p class="note">La eliminación de clientes queda fuera del alcance de esta versión (CU-04, restricción 4).</p>`}
const clienteFields=()=>[
 {k:'nombre',label:'Nombre completo',req:true,full:true},
 {k:'tipoId',label:'Tipo de identificación',type:'select',options:['Cédula','Pasaporte'],req:true},
 {k:'numId',label:'Número de identificación',req:true,check:idCheck('tipoId'),ph:'1-1234-0567'},
 {k:'telefono',label:'Teléfono',type:'tel',check:contactoCheck,help:'Al menos un medio de contacto.'},
 {k:'correo',label:'Correo electrónico',type:'email'},
 {k:'nacionalidad',label:'Nacionalidad'}];
function formCliente(c){
  if(!needEdit())return;
  openForm({title:c?'Editar cliente':'Registrar cliente',rf:'RF-04',fields:clienteFields(),values:c||{},submit:c?'Guardar cambios':'Registrar',
   onSubmit:v=>{const dup=idDuplicado(v.tipoId,v.numId,c&&c.id);if(dup)return {errors:{numId:`Ya existe un cliente con esta identificación: «${dup.nombre}».`}};
    if(c){Object.assign(c,v);return {msg:'Cliente actualizado.'}}
    const n={id:uid('c'),...v,creado:today()};DB.clientes.push(n);return {msg:'Cliente registrado.',go:'#cliente-'+n.id}}});
}
function vCliente(id){
  const c=byId('clientes',id);if(!c)return notFound('cliente');
  const ps=DB.proyectos.filter(p=>p.clienteId===id);
  const lead=c.origenLead&&byId('leads',c.origenLead);
  return ph(esc(c.nombre),`${esc(c.tipoId)} ${esc(c.numId)}`,`<button class="btn ghost" data-act="editCliente" data-id="${id}">Editar</button><button class="btn" data-act="nuevoProyecto" data-id="${id}">+ Nuevo proyecto</button>`,`<a href="#clientes">Clientes</a> / ficha`)+
  `<div class="stack"><section class="card"><h3>Datos del cliente ${rf('RF-04')}</h3><div class="dgrid">
   <div><small>Teléfono</small><span>${esc(c.telefono||'—')}</span></div><div><small>Correo</small><span>${esc(c.correo||'—')}</span></div><div><small>Nacionalidad</small><span>${esc(c.nacionalidad||'—')}</span></div>
   <div><small>Cliente desde</small><span>${fd(c.creado)}</span></div><div class="full"><small>Origen</small><span>${lead?`Convertido desde potencial cliente (registrado el ${fd(lead.creado)}, interés: ${esc(lead.servicio)})`:'Registro directo'}</span></div></div></section>
  <section class="card"><h3>Proyectos del cliente ${rf('RF-04 RF-15')}</h3>${ps.length?projTable(ps,false):emptyBox('Este cliente aún no tiene proyectos.')}</section></div>`}
function projTable(ps,showCli){return `<div class="tblwrap"><table class="tbl"><thead><tr><th>Proyecto</th>${showCli?'<th>Cliente</th>':''}<th>Tipo</th><th>Inicio</th><th>Estado</th><th>Avance</th></tr></thead><tbody>
 ${ps.map(p=>`<tr class="click" data-goto="#proyecto-${p.id}"><td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(p.ubicacion||'')}</small></td>${showCli?`<td>${esc(cliName(p.clienteId))}</td>`:''}<td>${esc(p.tipo)}</td><td>${fd(p.fechaInicio)}</td><td>${badge(p.estado,KIND_PROY[p.estado])}</td><td style="min-width:150px">${progHtml(p.id)}</td></tr>`).join('')}</tbody></table></div>`}

/* ---------- Proyectos RF-05..RF-08 ---------- */
function vProyectos(){
  const f=ui.pf;const q=norm(f.q);
  const rows=DB.proyectos.filter(p=>(!f.tipo||p.tipo===f.tipo)&&(!f.estado||p.estado===f.estado)&&(!q||norm(p.nombre+' '+cliName(p.clienteId)+' '+p.ubicacion).includes(q)));
  return ph('Proyectos '+rf('RF-05 RF-07 RF-08 RF-15'),'Todos los proyectos del estudio, clasificados por tipo de servicio y estado.',`<button class="btn" data-act="nuevoProyecto">+ Nuevo proyecto</button>`)+
  `<div class="filters"><select data-chg="pfTipo" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>${TIPOS.map(t=>opt(t,f.tipo)).join('')}</select>
   <select data-chg="pfEstado" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${ESTADOS.map(t=>opt(t,f.estado)).join('')}</select>
   <input data-chg="pfQ" placeholder="Nombre, cliente o ubicación…" value="${esc(f.q)}">
   ${(f.tipo||f.estado||f.q)?`<button class="btn ghost sm" data-act="pfClear">Limpiar filtros</button>`:''}<span class="muted" style="margin-left:auto">${rows.length} de ${DB.proyectos.length}</span></div>
  ${rows.length?`<div class="pcards">${rows.map(p=>`<a class="pcard" href="#proyecto-${p.id}"><div class="tags">${badge(p.estado,KIND_PROY[p.estado])}${badge(p.tipo,'mute')}</div><b>${esc(p.nombre)}</b><small class="muted">${esc(cliName(p.clienteId))} · inicio ${fd(p.fechaInicio)}</small>${progHtml(p.id)}</a>`).join('')}</div>`:emptyBox('No se encontraron proyectos con estos filtros.')}`}
const proyFields=(isNew)=>[
 {k:'clienteId',label:'Cliente',type:'select',req:true,options:DB.clientes.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(c=>[c.id,c.nombre]),full:true,check:v=>v&&!byId('clientes',v)?'El cliente seleccionado no existe.':''},
 {k:'nombre',label:'Nombre del proyecto',req:true,full:true},
 {k:'tipo',label:'Tipo de servicio',type:'select',options:TIPOS,req:true,help:'Catálogo del estudio (RF-07, RN-03).'},
 {k:'fechaInicio',label:'Fecha de inicio',type:'date',req:true},
 {k:'descripcion',label:'Descripción',type:'textarea',req:true,full:true},
 {k:'ubicacion',label:'Ubicación'},
 {k:'area',label:'Área (m²)',type:'number',help:'Opcional; solo si aplica.'},
 ...(isNew?[{k:'plan',label:'Cargar el plan de acción sugerido para este tipo de servicio (actividades y entregables con fechas)',type:'checkbox',help:'Se pueden editar después. Plan propuesto a partir de la minuta 01 — pendiente de validar con Anémona.'}]:[])];
function formProyecto(p,preCliente){
  if(!needEdit())return;
  if(!p&&!DB.clientes.length){infoBox('Primero registre el cliente','Todo proyecto debe estar vinculado con un cliente registrado (RN-01, RNF-02). Registre el cliente antes de continuar.',`<button class="btn ghost" data-close>Cancelar</button><button class="btn" data-act="nuevoCliente">Registrar cliente</button>`);return}
  openForm({title:p?'Editar proyecto':'Nuevo proyecto',rf:p?'RF-06 RF-07':'RF-05 RF-07',fields:proyFields(!p),values:p||{clienteId:preCliente||'',fechaInicio:today(),plan:true},submit:p?'Guardar cambios':'Registrar proyecto',
   intro:p?'':'Solo se piden los datos comunes a todo proyecto. Proveedores, materiales y actividades se agregan únicamente si el servicio los requiere (RNF-05).',
   onSubmit:v=>{const {plan,...data}=v;
    if(p){Object.assign(p,data);return {msg:'Proyecto actualizado.'}}
    const n={id:uid('p'),...data,estado:'Por iniciar'};DB.proyectos.push(n);
    if(plan)DB.actividades.push(...planActs(n.id,n.tipo,n.fechaInicio));
    ui.tab=plan?'actividades':'resumen';ui.lastProj=n.id;
    return {msg:'Proyecto registrado'+(plan?' con su plan de acción.':'.'),go:'#proyecto-'+n.id}}});
}
function vProyecto(id){
  const p=byId('proyectos',id);if(!p)return notFound('proyecto');
  if(ui.lastProj!==id){ui.tab='resumen';ui.lastProj=id}
  const acts=projActs(id),provs=DB.provProy.filter(x=>x.proyectoId===id),mats=DB.matProy.filter(x=>x.proyectoId===id),cots=DB.cotizaciones.filter(x=>x.proyectoId===id);
  const tabs=[['resumen','Resumen',null],['actividades','Actividades',acts.length],['proveedores','Proveedores',provs.length],['materiales','Materiales y productos',mats.length],['cotizaciones','Cotizaciones',cots.length]];
  const permit=TRANS[p.estado];
  const estadoSel=permit.length?`<select data-chg="estadoProy" data-id="${id}" aria-label="Cambiar estado"><option value="">Cambiar estado…</option>${ESTADOS.filter(e=>e!==p.estado).map(e=>`<option value="${e}" ${permit.includes(e)?'':'disabled'}>${e}${permit.includes(e)?'':' (no permitido)'}</option>`).join('')}</select>`:`<small class="muted">Estado final: no admite más cambios.</small>`;
  let body='';
  if(ui.tab==='resumen')body=`<section class="card"><div class="headrow"><h3 style="margin:0">Datos del proyecto ${rf('RF-06')}</h3><button class="btn ghost sm" data-act="editProyecto" data-id="${id}">Editar</button></div>
   <div class="dgrid"><div><small>Cliente</small><span><a href="#cliente-${p.clienteId}">${esc(cliName(p.clienteId))}</a></span></div><div><small>Tipo de servicio</small><span>${esc(p.tipo)}</span></div><div><small>Fecha de inicio</small><span>${fd(p.fechaInicio)}</span></div>
   <div><small>Ubicación</small><span>${esc(p.ubicacion||'—')}</span></div><div><small>Área</small><span>${p.area?esc(p.area)+' m²':'—'}</span></div><div><small>Avance</small><span>${progHtml(id)}</span></div>
   <div class="full"><small>Descripción</small><span>${esc(p.descripcion)}</span></div></div></section>
   <div class="grid2" style="margin-top:18px"><section class="card"><h3>Próximas actividades</h3>${acts.filter(a=>a.estado!=='Completada').slice(0,4).map(a=>actRow(a,false)).join('')||emptyBox('Sin actividades pendientes.')}</section>
   <section class="card"><h3>Relaciones ${rf('RF-15')}</h3><div class="dgrid" style="grid-template-columns:1fr 1fr">
    <div><small>Proveedores</small><span>${provs.length?provs.map(x=>esc((byId('proveedores',x.proveedorId)||{}).nombre)+' '+badge(x.condicion,x.condicion==='Seleccionado'?'ok':'mute')).join('<br>'):'Ninguno'}</span></div>
    <div><small>Materiales y productos</small><span>${mats.length?mats.length+' elementos · '+money(mats.reduce((s,m)=>s+(+m.cantidad||0)*(+m.precioUnit||0),0)):'Ninguno'}</span></div>
    <div><small>Cotizaciones</small><span>${cots.length?cots.map(c=>esc(c.codigo)+' '+badge(c.estado,KIND_COT[c.estado])).join('<br>'):'Ninguna'}</span></div></div>
    ${!provs.length&&!mats.length?`<p class="note" style="margin-top:12px">Este proyecto no tiene proveedores ni materiales asociados y sigue siendo válido (RN-02, RNF-05).</p>`:''}</section></div>`;
  else if(ui.tab==='actividades')body=`<section class="card"><div class="headrow"><h3 style="margin:0">Actividades y entregables ${rf('RF-13 RF-14')}</h3><div style="display:flex;gap:8px;flex-wrap:wrap">
   ${PLAN[p.tipo]?`<button class="btn ghost sm" data-act="cargarPlan" data-id="${id}">Cargar plan de acción «${esc(p.tipo)}»</button>`:''}<button class="btn sm" data-act="nuevaAct" data-id="${id}">+ Nueva actividad</button></div></div>
   ${acts.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Actividad</th><th>Responsable</th><th>Fecha prevista</th><th>Estado</th><th></th></tr></thead><tbody>
   ${acts.map(a=>`<tr><td><b>${esc(a.nombre)}</b>${a.entregable?' <span class="ent">· Entregable</span>':''}</td><td>${esc(a.responsable)}</td><td>${fd(a.fecha)} ${whenB(a)}</td>
    <td><select class="inline-sel" data-chg="estadoAct" data-id="${a.id}" aria-label="Estado de la actividad">${EST_ACT.map(e=>opt(e,a.estado)).join('')}</select></td><td class="num"><button class="btn ghost sm" data-act="verAct" data-id="${a.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>`
   :emptyBox('Sin actividades. Puede crear una o cargar el plan de acción del tipo de servicio.')}</section>`;
  else if(ui.tab==='proveedores')body=`<section class="card"><div class="headrow"><h3 style="margin:0">Proveedores del proyecto ${rf('RF-11')}</h3><button class="btn sm" data-act="asocProv" data-id="${id}">+ Asociar proveedor</button></div>
   ${provs.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Proveedor</th><th>Categorías</th><th>Contacto</th><th>Condición</th><th></th></tr></thead><tbody>
   ${provs.map(x=>{const v=byId('proveedores',x.proveedorId)||{};return `<tr><td><a href="#proveedor-${v.id}"><b>${esc(v.nombre)}</b></a></td><td>${(v.categorias||[]).map(c=>badge(c,'sea')).join(' ')}</td><td>${esc(v.contacto||'')}<br><small>${esc(v.telefono||'')}</small></td>
    <td><select class="inline-sel" data-chg="condProv" data-id="${x.id}" aria-label="Condición">${COND.map(c=>opt(c,x.condicion)).join('')}</select></td><td class="num"><button class="btn ghost sm" data-act="quitarProv" data-id="${x.id}">Quitar</button></td></tr>`}).join('')}</tbody></table></div>`
   :emptyBox('Sin proveedores asociados. Un proyecto puede no requerir proveedores externos (RN-02).')}</section>`;
  else if(ui.tab==='materiales'){const tot=mats.reduce((s,m)=>s+(+m.cantidad||0)*(+m.precioUnit||0),0);
   body=`<section class="card"><div class="headrow"><h3 style="margin:0">Materiales y productos ${rf('RF-12')}</h3><button class="btn sm" data-act="asocMat" data-id="${id}">+ Asociar material o producto</button></div>
   ${mats.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Material / producto</th><th>Proveedor(es)</th><th class="num">Cantidad</th><th class="num">Precio unitario</th><th class="num">Costo total</th><th></th></tr></thead><tbody>
   ${mats.map(x=>{const m=byId('materiales',x.materialId)||{};return `<tr><td><b>${esc(m.nombre)}</b>${m.modelo?` <small class="muted">${esc(m.modelo)}</small>`:''}${x.nota?`<br><small class="muted">${esc(x.nota)}</small>`:''}</td><td><small>${(m.proveedorIds||[]).map(pid=>esc((byId('proveedores',pid)||{}).nombre)).join(', ')||'—'}</small></td>
    <td class="num">${esc(x.cantidad)} ${esc(m.unidad||'')}</td><td class="num">${money(x.precioUnit)}</td><td class="num">${money((+x.cantidad||0)*(+x.precioUnit||0))}</td>
    <td class="num"><button class="btn ghost sm" data-act="editMatProy" data-id="${x.id}">Editar</button> <button class="btn ghost sm" data-act="quitarMat" data-id="${x.id}">Quitar</button></td></tr>`}).join('')}</tbody>
    <tfoot><tr><td colspan="4">Total registrado</td><td class="num">${money(tot)}</td><td></td></tr></tfoot></table></div>`
   :emptyBox('Sin materiales asociados. No todos los servicios los requieren (RNF-05).')}</section>`}
  else body=`<section class="card"><div class="headrow"><h3 style="margin:0">Referencias de cotización ${rf('RF-16')}</h3><button class="btn sm" data-act="nuevaCot" data-id="${id}">+ Registrar referencia</button></div>
   ${cots.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Código</th><th>Fecha</th><th class="num">Monto</th><th>Estado</th><th>Documento / enlace</th><th></th></tr></thead><tbody>
   ${cots.map(c=>`<tr><td><b>${esc(c.codigo)}</b></td><td>${fd(c.fecha)}</td><td class="num">${money(c.monto)}</td><td>${badge(c.estado,KIND_COT[c.estado])}</td>
    <td>${c.archivo?`<small>📎 ${esc(c.archivo)}</small><br>`:''}${c.enlace?`<a href="${esc(c.enlace)}" target="_blank" rel="noopener"><small>${esc(c.enlace)}</small></a>`:''}</td><td class="num"><button class="btn ghost sm" data-act="editCot" data-id="${c.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>`
   :emptyBox('Sin cotizaciones registradas.')}
   <p class="note">El sistema solo guarda la referencia: la cotización se sigue elaborando en Canva (IE-01). No calcula ni emite cotizaciones en esta versión.</p></section>`;
  return ph(esc(p.nombre),`<a href="#cliente-${p.clienteId}">${esc(cliName(p.clienteId))}</a> · ${esc(p.tipo)}`,
   `<div class="estado-box">${rf('RF-08')} ${badge(p.estado,KIND_PROY[p.estado])} ${estadoSel}</div>`,`<a href="#proyectos">Proyectos</a> / ficha`)+
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
  if(!can()){if(a){ui.lastProj=a.proyectoId;ui.tab='actividades';location.hash='#proyecto-'+a.proyectoId}needEdit();return}
  openForm({title:a?'Actividad':'Nueva actividad',rf:a?'RF-14':'RF-13',intro:`Proyecto: <b>${esc(p.nombre)}</b> · ${esc(cliName(p.clienteId))}`,fields:actFields(),values:a||{estado:'Pendiente',responsable:'Gabriela Núñez'},submit:a?'Guardar cambios':'Registrar actividad',
   extra:a?`<button type="button" class="btn ghost" data-goto="#proyecto-${p.id}" data-tab="actividades">Abrir proyecto →</button>`:'',
   onSubmit:v=>{if(a){Object.assign(a,v);return {msg:'Actividad actualizada; el calendario refleja el cambio.'}}
    DB.actividades.push({id:uid('a'),proyectoId:pid,...v});return {msg:'Actividad registrada.'}}});
}

/* Proveedores en proyecto RF-11 */
function formAsocProv(pid){
  if(!needEdit())return;
  const ya=DB.provProy.filter(x=>x.proyectoId===pid).map(x=>x.proveedorId);
  const opts=DB.proveedores.filter(v=>!ya.includes(v.id)).sort((a,b)=>(a.categorias[0]||'').localeCompare(b.categorias[0]||'')||a.nombre.localeCompare(b.nombre)).map(v=>[v.id,v.nombre+' — '+v.categorias.join(', ')]);
  openForm({title:'Asociar proveedores',rf:'RF-11',wide:true,intro:'Seleccione uno o varios proveedores e indique si están considerados (alternativa evaluada) o seleccionados (elegidos para participar).',
   fields:[{k:'ids',label:'Proveedores disponibles',type:'multi',options:opts,req:true,full:true,empty:'Todos los proveedores ya están asociados o no hay proveedores registrados. Regístrelos en «Proveedores».'},{k:'condicion',label:'Condición',type:'select',options:COND,req:true}],
   values:{condicion:'Considerado'},submit:'Asociar',
   onSubmit:v=>{v.ids.forEach(i=>{if(byId('proveedores',i))DB.provProy.push({id:uid('pp'),proyectoId:pid,proveedorId:i,condicion:v.condicion})});return {msg:v.ids.length+' proveedor(es) asociado(s).'}}});
}
/* Materiales en proyecto RF-12 */
function formMatProy(pid,x){
  if(!needEdit())return;
  if(!x&&!DB.materiales.length){infoBox('Catálogo vacío','Registre primero el material o producto en el catálogo (CU-12, flujo alternativo).',`<button class="btn ghost" data-close>Cancelar</button><a class="btn" href="#materiales" data-close>Ir a materiales</a>`);return}
  const f=[...(x?[]:[{k:'materialId',label:'Material o producto',type:'select',req:true,full:true,options:DB.materiales.map(m=>[m.id,m.nombre+(m.modelo?' ('+m.modelo+')':'')+' — ref. '+money(m.precioRef)+' / '+m.unidad])}]),
   {k:'cantidad',label:'Cantidad',type:'number',req:true,check:v=>+v<=0?'La cantidad debe ser mayor que 0.':''},
   {k:'precioUnit',label:'Precio unitario (₡)',type:'number',help:x?'':'Si se deja vacío se usa el precio de referencia del catálogo.'},
   {k:'nota',label:'Nota / ubicación en el proyecto',full:true}];
  openForm({title:x?'Editar material del proyecto':'Asociar material o producto',rf:'RF-12',fields:f,values:x||{cantidad:'1'},submit:x?'Guardar':'Asociar',
   onSubmit:v=>{if(x){Object.assign(x,v);return {msg:'Material actualizado.'}}
    const m=byId('materiales',v.materialId);DB.matProy.push({id:uid('mp'),proyectoId:pid,materialId:v.materialId,cantidad:v.cantidad,precioUnit:v.precioUnit||m.precioRef||'0',nota:v.nota});return {msg:'Material asociado al proyecto.'}}});
}
/* Cotizaciones RF-16 */
function formCot(pid,c){
  if(!needEdit())return;
  const f=[{k:'codigo',label:'Código o referencia',req:true,ph:'COT-2026-015'},{k:'fecha',label:'Fecha de envío',type:'date',req:true},
   {k:'monto',label:'Monto (₡)',type:'number',help:'Opcional; dato informativo.'},{k:'estado',label:'Estado',type:'select',options:EST_COT,req:true},
   {k:'enlace',label:'Enlace al documento (Canva, Drive…)',type:'url',full:true,ph:'https://…',check:(val,v)=>{if(val&&!/^https?:\/\/\S+\.\S+/.test(val))return 'El enlace debe iniciar con http:// o https://';if(!val&&!v.archivo)return 'Indique un enlace o adjunte el documento.';return ''}},
   {k:'archivo',label:'Documento adjunto',type:'file',full:true,accept:'.pdf,.png,.jpg,.jpeg,.docx',current:c&&c.archivo,help:'Formatos permitidos: PDF, PNG, JPG o DOCX. En el prototipo solo se registra el nombre del archivo.',check:val=>val&&!/\.(pdf|png|jpe?g|docx)$/i.test(val)?'Formato no permitido. Use PDF, PNG, JPG o DOCX.':''}];
  openForm({title:c?'Editar referencia de cotización':'Registrar referencia de cotización',rf:'RF-16',fields:f,values:c||{fecha:today(),estado:'Enviada'},submit:'Guardar',
   onSubmit:v=>{if(c){Object.assign(c,v);return {msg:'Referencia actualizada.'}}DB.cotizaciones.push({id:uid('q'),proyectoId:pid,...v});return {msg:'Referencia de cotización registrada.'}}});
}

/* ---------- Proveedores RF-09 ---------- */
function vProveedores(){
  const cat=ui.provCat;
  const rows=DB.proveedores.filter(v=>!cat||v.categorias.includes(cat)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return ph('Proveedores '+rf('RF-09'),'Directorio clasificado por tipo de producto o servicio. Para una misma categoría puede haber varias alternativas.',`<button class="btn" data-act="nuevoProv">+ Registrar proveedor</button>`)+
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
  openForm({title:v?'Editar proveedor':'Registrar proveedor',rf:'RF-09',wide:true,fields:provFields(),values:v||{},submit:v?'Guardar cambios':'Registrar',
   onSubmit:x=>{if(v){Object.assign(v,x);return {msg:'Proveedor actualizado.'}}const n={id:uid('v'),...x};DB.proveedores.push(n);return {msg:'Proveedor registrado.',go:'#proveedor-'+n.id}}});
}
function vProveedor(id){
  const v=byId('proveedores',id);if(!v)return notFound('proveedor');
  const pps=DB.provProy.filter(x=>x.proveedorId===id);const mats=DB.materiales.filter(m=>(m.proveedorIds||[]).includes(id));
  const alt=DB.proveedores.filter(o=>o.id!==id&&o.categorias.some(c=>v.categorias.includes(c)));
  return ph(esc(v.nombre),v.categorias.map(c=>badge(c,'sea')).join(' '),`<button class="btn ghost" data-act="editProv" data-id="${id}">Editar</button>`,`<a href="#proveedores">Proveedores</a> / ficha`)+
  `<div class="stack"><section class="card"><h3>Datos ${rf('RF-09')}</h3><div class="dgrid"><div><small>Contacto</small><span>${esc(v.contacto||'—')}</span></div><div><small>Teléfono</small><span>${esc(v.telefono)}</span></div><div><small>Correo</small><span>${esc(v.correo||'—')}</span></div>
   <div class="full"><small>Ofrece</small><span>${esc(v.ofrece)}</span></div>${v.notas?`<div class="full"><small>Observaciones</small><span>${esc(v.notas)}</span></div>`:''}</div></section>
  <div class="grid2"><section class="card"><h3>Proyectos ${rf('RF-11 RF-15')}</h3>${pps.length?`<table class="tbl"><tbody>${pps.map(x=>{const p=byId('proyectos',x.proyectoId)||{};return `<tr class="click" data-goto="#proyecto-${p.id}"><td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(cliName(p.clienteId))}</small></td><td class="num">${badge(x.condicion,x.condicion==='Seleccionado'?'ok':'mute')}</td></tr>`}).join('')}</tbody></table>`:emptyBox('Aún no participa en proyectos.')}</section>
  <section class="card"><h3>Materiales y productos que ofrece ${rf('RF-10')}</h3>${mats.length?`<table class="tbl"><tbody>${mats.map(m=>`<tr><td>${esc(m.nombre)}</td><td class="num">${money(m.precioRef)} / ${esc(m.unidad)}</td></tr>`).join('')}</tbody></table>`:emptyBox('Sin materiales registrados.')}</section></div>
  <section class="card"><h3>Otras alternativas en la misma categoría</h3>${alt.length?`<div class="chips">${alt.map(o=>`<a class="chip" href="#proveedor-${o.id}" style="text-decoration:none">${esc(o.nombre)}</a>`).join('')}</div>`:'<small class="muted">No hay otras alternativas registradas.</small>'}</section></div>`}

/* ---------- Materiales RF-10 ---------- */
function vMateriales(){
  const cat=ui.matCat;const rows=DB.materiales.filter(m=>!cat||m.categoria===cat).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return ph('Materiales y productos '+rf('RF-10'),'Catálogo de materiales y productos usados o considerados en proyectos, con los proveedores que los ofrecen.',`<button class="btn" data-act="nuevoMat">+ Registrar material o producto</button>`)+
  `<div class="filters"><select data-chg="matCat" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>${CATS.map(c=>opt(c,cat)).join('')}</select></div>
  <div class="card tblwrap">${rows.length?`<table class="tbl"><thead><tr><th>Material / producto</th><th>Categoría</th><th>Proveedores</th><th class="num">Precio ref.</th><th class="num">Proyectos</th></tr></thead><tbody>
  ${rows.map(m=>`<tr class="click" data-act="editMat" data-id="${m.id}"><td><b>${esc(m.nombre)}</b>${m.modelo?`<br><small class="muted">Modelo ${esc(m.modelo)}</small>`:''}</td><td>${badge(m.categoria,'sea')}</td>
   <td>${(m.proveedorIds||[]).map(pid=>{const v=byId('proveedores',pid);return v?`<a href="#proveedor-${v.id}">${esc(v.nombre)}</a>`:''}).join(', ')||'—'}</td><td class="num">${money(m.precioRef)}<br><small class="muted">por ${esc(m.unidad)}</small></td><td class="num">${DB.matProy.filter(x=>x.materialId===m.id).length}</td></tr>`).join('')}
  </tbody></table>`:emptyBox('No hay materiales en esta categoría.')}</div>`}
function formMat(m){
  if(!needEdit())return;
  const f=[{k:'nombre',label:'Nombre del material o producto',req:true,full:true},{k:'modelo',label:'Modelo'},{k:'categoria',label:'Categoría',type:'select',options:CATS,req:true},
   {k:'unidad',label:'Unidad de medida',type:'select',options:UNIDADES,req:true},{k:'precioRef',label:'Precio de referencia (₡)',type:'number'},
   {k:'proveedorIds',label:'Proveedores que lo ofrecen',type:'multi',full:true,options:DB.proveedores.map(v=>[v.id,v.nombre]),empty:'No hay proveedores registrados. Regístrelos antes de establecer la relación (CU-10).'},
   {k:'descripcion',label:'Descripción u observaciones',type:'textarea',full:true}];
  openForm({title:m?'Editar material o producto':'Registrar material o producto',rf:'RF-10',wide:true,fields:f,values:m||{unidad:'unidad'},submit:'Guardar',
   onSubmit:v=>{if(m){Object.assign(m,v);return {msg:'Material actualizado.'}}DB.materiales.push({id:uid('m'),...v});return {msg:'Material registrado en el catálogo.'}}});
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
  return ph('Calendario '+rf('RF-14'),'Actividades y entregables con fecha prevista. Haga clic en una actividad para actualizarla o abrir su proyecto.','')+
  `<div class="calhead"><button class="btn ghost sm" data-act="calMove" data-id="-1" aria-label="Mes anterior">←</button><h2>${MESL[m-1]} ${y}</h2><button class="btn ghost sm" data-act="calMove" data-id="1" aria-label="Mes siguiente">→</button><button class="btn ghost sm" data-act="calMove" data-id="0">Hoy</button>
  <select class="inline-sel" data-chg="calResp" aria-label="Responsable"><option value="">Todos los responsables</option>${RESP.map(r=>opt(r,ui.calResp)).join('')}</select>
  <div class="legend"><span><i style="background:var(--info)"></i>Pendiente</span><span><i style="background:var(--warn)"></i>En proceso</span><span><i style="background:var(--err)"></i>Atrasada</span><span><i style="background:var(--ok)"></i>Completada</span><span><b>Negrita</b> = entregable</span></div></div>
  <div class="cal">${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>`<div class="dow">${d}</div>`).join('')}
  ${cells.slice(0,rows).map(d=>{const s=iso(d);const evs=acts.filter(a=>a.fecha===s);
   return `<div class="day ${d.getMonth()!==m-1?'out':''} ${s===T?'today':''}"><span class="dn">${d.getDate()}</span>${evs.map(a=>{const p=byId('proyectos',a.proyectoId)||{};return `<div class="ev ${evCls(a)} ${a.entregable?'deliv':''}" data-act="verAct" data-id="${a.id}" title="${esc(a.nombre+' — '+p.nombre+' ('+a.responsable+')')}">${esc(a.nombre)}</div>`}).join('')}</div>`}).join('')}</div>`}

/* ---------- Búsqueda RF-15 ---------- */
function vBuscar(){
  const q=norm(ui.q);
  if(!q)return ph('Búsqueda '+rf('RF-15'),'Escriba un término en la barra superior.','');
  const has=(...xs)=>norm(xs.join(' ')).includes(q);
  const L=DB.leads.filter(l=>!l.convertidoA&&has(l.nombre,l.telefono,l.correo,l.servicio,l.nacionalidad));
  const C=DB.clientes.filter(c=>has(c.nombre,c.numId,c.telefono,c.correo,c.nacionalidad));
  const P=DB.proyectos.filter(p=>has(p.nombre,p.tipo,p.ubicacion,p.descripcion,cliName(p.clienteId),p.estado));
  const V=DB.proveedores.filter(v=>has(v.nombre,v.contacto,v.categorias.join(' '),v.ofrece));
  const M=DB.materiales.filter(m=>has(m.nombre,m.modelo,m.categoria));
  const tot=L.length+C.length+P.length+V.length+M.length;
  const sec=(t,arr,fn)=>arr.length?`<section class="card"><h3>${t} <span class="b mute">${arr.length}</span></h3><table class="tbl"><tbody>${arr.map(fn).join('')}</tbody></table></section>`:'';
  return ph('Resultados para «'+esc(ui.q)+'» '+rf('RF-15'),tot?tot+' coincidencia(s)':'','')+
  (tot?`<div class="stack">
   ${sec('Proyectos',P,p=>`<tr class="click" data-goto="#proyecto-${p.id}"><td><b>${esc(p.nombre)}</b><br><small class="muted">${esc(cliName(p.clienteId))} · ${esc(p.tipo)}</small></td><td class="num">${badge(p.estado,KIND_PROY[p.estado])}</td></tr>`)}
   ${sec('Clientes',C,c=>`<tr class="click" data-goto="#cliente-${c.id}"><td><b>${esc(c.nombre)}</b><br><small class="muted">${esc(c.tipoId)} ${esc(c.numId)}</small></td><td class="num"><small>${DB.proyectos.filter(p=>p.clienteId===c.id).length} proyecto(s)</small></td></tr>`)}
   ${sec('Potenciales clientes',L,l=>`<tr class="click" data-act="editLead" data-id="${l.id}"><td><b>${esc(l.nombre)}</b><br><small class="muted">${esc(l.servicio)}</small></td><td class="num">${badge(l.estado,KIND_LEAD[l.estado])}</td></tr>`)}
   ${sec('Proveedores',V,v=>`<tr class="click" data-goto="#proveedor-${v.id}"><td><b>${esc(v.nombre)}</b><br><small class="muted">${esc(v.ofrece)}</small></td><td class="num">${v.categorias.map(c=>badge(c,'sea')).join(' ')}</td></tr>`)}
   ${sec('Materiales y productos',M,m=>`<tr class="click" data-act="editMat" data-id="${m.id}"><td><b>${esc(m.nombre)}</b></td><td class="num">${badge(m.categoria,'sea')}</td></tr>`)}
  </div>`:emptyBox('No se encontraron resultados para el criterio ingresado.'))}

/* ---------- Acerca ---------- */
function vAcerca(){
  const T=[['RF-01','Registrar potencial cliente','Potenciales clientes → «Registrar»'],['RF-02','Actualizar y consultar potenciales','Potenciales clientes → clic en la fila; filtros por estado'],['RF-03','Convertir en cliente','Botón «Convertir a cliente» (pide cédula/pasaporte y confirmación de contrato)'],
   ['RF-04','Gestionar clientes','Clientes → ficha con sus proyectos'],['RF-05','Registrar proyecto','«Nuevo proyecto» (exige cliente existente)'],['RF-06','Actualizar y consultar proyecto','Ficha del proyecto → Resumen → Editar'],
   ['RF-07','Clasificar proyectos','Campo «Tipo de servicio» + filtro por tipo en Proyectos'],['RF-08','Cambiar estado','Selector de estado en la ficha (solo transiciones permitidas)'],['RF-09','Gestionar proveedores','Proveedores → categorías, ficha y alternativas'],
   ['RF-10','Gestionar materiales y productos','Materiales → catálogo con proveedores'],['RF-11','Relacionar proveedores y proyectos','Ficha del proyecto → pestaña Proveedores (considerado/seleccionado)'],['RF-12','Relacionar materiales y proyectos','Ficha del proyecto → pestaña Materiales'],
   ['RF-13','Registrar actividades','Ficha del proyecto → Actividades; plan de acción por tipo'],['RF-14','Actualizar actividades y calendario','Calendario mensual; clic en actividad → editar o abrir proyecto'],['RF-15','Consultar información relacionada','Barra de búsqueda superior + fichas con relaciones'],
   ['RF-16','Referencia a cotización','Ficha del proyecto → Cotizaciones'],['RF-17','Controlar acceso','Pantalla de ingreso; usuario «consulta» demuestra el bloqueo por rol']];
  const N=[['RNF-01','Usabilidad','Formularios con campos obligatorios marcados (*) y ayudas visibles.'],['RNF-02','Integridad','No se puede crear un proyecto sin cliente existente.'],['RNF-03','Privacidad','Todo requiere ingreso; el rol de consulta no puede modificar.'],
   ['RNF-04','Recuperación','Ante un error, el formulario conserva los valores y marca el campo.'],['RNF-05','Adaptabilidad','Proyectos válidos sin proveedores, materiales ni actividades (ej. «Anteproyecto casa de playa»).']];
  return ph('Acerca del prototipo','Prototipo funcional del ERS v1.0 de Anémona Design Studio — IC5821, Grupo 01.','')+
  `<div class="stack"><section class="card"><h3>Matriz de trazabilidad RF → pantalla</h3><div class="tblwrap"><table class="tbl trace"><thead><tr><th>Código</th><th>Requisito</th><th>Dónde se verifica</th></tr></thead><tbody>${T.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="card"><h3>Requisitos no funcionales</h3><table class="tbl trace"><tbody>${N.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></section>
  <section class="card"><h3>Supuestos del prototipo (validar con Anémona)</h3><ul>
   <li><b>Estados de proyecto:</b> ${ESTADOS.join(' → ')}. Transiciones: ${Object.entries(TRANS).filter(([k,v])=>v.length).map(([k,v])=>`${k} → ${v.join(' / ')}`).join('; ')}. Finalizado y Cancelado son estados finales.</li>
   <li><b>Estados de seguimiento de potenciales clientes:</b> ${EST_LEAD.join(', ')}.</li>
   <li><b>Plan de acción por tipo de servicio:</b> actividades y plazos sugeridos a partir de la minuta 01 (tema 3); son editables y deben validarse (punto pendiente 1 de la minuta).</li>
   <li><b>Cédula</b> de 9 dígitos; <b>pasaporte</b> de 6 a 20 caracteres alfanuméricos.</li>
   <li><b>Duplicados:</b> se considera la misma persona si coincide el nombre, el teléfono o el correo.</li>
   <li><b>Roles:</b> la minuta indica que Gabriela y María José tienen los mismos permisos; el usuario «consulta» existe solo para demostrar RF-17.</li></ul></section>
  <section class="card"><h3>Limitaciones conocidas</h3><ul><li>Los datos se guardan solo en este navegador (no hay servidor ni base de datos compartida).</li><li>De los documentos adjuntos solo se registra el nombre del archivo.</li><li>Las contraseñas son de demostración; no hay cifrado real.</li><li>Fuera de alcance (ERS 2.11): generación de cotizaciones, notificaciones automáticas, fotos y renders, historial de cambios.</li></ul></section></div>`}
const notFound=t=>ph('No encontrado','El '+t+' solicitado no existe.','')+`<a class="btn ghost" href="#inicio">Volver al inicio</a>`;

/* ================= Router ================= */
function render(){
  const app=$('#app');
  if(!USER){app.innerHTML=vLogin();return}
  const h=(location.hash||'#inicio').slice(1);const i=h.indexOf('-');const view=i<0?h:h.slice(0,i),id=i<0?'':h.slice(i+1);
  const V={inicio:vInicio,potenciales:vPotenciales,clientes:vClientes,cliente:()=>vCliente(id),proyectos:vProyectos,proyecto:()=>vProyecto(id),calendario:vCalendario,proveedores:vProveedores,proveedor:()=>vProveedor(id),materiales:vMateriales,buscar:vBuscar,acerca:vAcerca};
  app.innerHTML=shell(view,(V[view]||vInicio)());
}

/* ================= Acciones ================= */
const ACT={
  logout(){USER=null;try{sessionStorage.removeItem(LS+'-u')}catch(e){}closeModal();render()},
  reset(){confirmBox('Restablecer datos','Se borrarán los cambios hechos en este navegador y se cargarán de nuevo los datos de ejemplo.','Restablecer',()=>{DB=seed();save();ui.tab='resumen';toast('Datos de ejemplo restablecidos.');location.hash='#inicio';render()})},
  tab(id){ui.tab=id;render()},
  leadF(id){ui.leadF=id;render()},
  provCat(id){ui.provCat=id;render()},
  pfClear(){ui.pf={tipo:'',estado:'',q:''};render()},
  calMove(n){n=+n;if(!n){ui.cal=today().slice(0,7)}else{const [y,m]=ui.cal.split('-').map(Number);const d=new Date(y,m-1+n,1);ui.cal=d.getFullYear()+'-'+pad(d.getMonth()+1)}render()},
  nuevoLead(){formLead(null)},
  editLead(id){const l=byId('leads',id);if(l.convertidoA){location.hash='#cliente-'+l.convertidoA;return}if(!can()){infoBox(l.nombre,`${esc(l.servicio)} · ${badge(l.estado,KIND_LEAD[l.estado])}<br>${esc(l.telefono||'')} ${esc(l.correo||'')}<br><small class="muted">${esc(l.notas||'')}</small>`);return}formLead(l)},
  convertir(id){formConvertir(byId('leads',id))},
  nuevoCliente(){formCliente(null)},
  editCliente(id){formCliente(byId('clientes',id))},
  nuevoProyecto(id){formProyecto(null,id)},
  editProyecto(id){formProyecto(byId('proyectos',id))},
  nuevaAct(id){if(!needEdit())return;formAct(null,id)},
  verAct(id){formAct(byId('actividades',id))},
  cargarPlan(id){if(!needEdit())return;const p=byId('proyectos',id);const n=(PLAN[p.tipo]||[]).length;
    confirmBox('Cargar plan de acción',`Se agregarán ${n} actividades sugeridas para «${esc(p.tipo)}», con fechas calculadas desde el inicio del proyecto (${fd(p.fechaInicio)}). Podrá editarlas después.`,'Cargar plan',()=>{DB.actividades.push(...planActs(id,p.tipo,p.fechaInicio));save();toast('Plan de acción cargado.');render()})},
  asocProv(id){formAsocProv(id)},
  quitarProv(id){if(!needEdit())return;const x=byId('provProy',id);const v=byId('proveedores',x.proveedorId);confirmBox('Quitar proveedor',`¿Quitar a «${esc(v.nombre)}» de este proyecto? El proveedor seguirá en el directorio.`,'Quitar',()=>{DB.provProy=DB.provProy.filter(z=>z.id!==id);save();toast('Asociación eliminada.');render()})},
  asocMat(id){formMatProy(id,null)},
  editMatProy(id){const x=byId('matProy',id);formMatProy(x.proyectoId,x)},
  quitarMat(id){if(!needEdit())return;confirmBox('Quitar material','¿Quitar este material del proyecto? Seguirá en el catálogo.','Quitar',()=>{DB.matProy=DB.matProy.filter(z=>z.id!==id);save();toast('Material quitado del proyecto.');render()})},
  nuevaCot(id){formCot(id,null)},
  editCot(id){const c=byId('cotizaciones',id);formCot(c.proyectoId,c)},
  nuevoProv(){formProv(null)},
  editProv(id){formProv(byId('proveedores',id))},
  nuevoMat(){formMat(null)},
  editMat(id){if(!can()){location.hash='#materiales';needEdit();return}formMat(byId('materiales',id))}
};
const CHG={
  toggleRF(el){document.body.classList.toggle('show-rf',el.checked)},
  pfTipo(el){ui.pf.tipo=el.value;render()},pfEstado(el){ui.pf.estado=el.value;render()},pfQ(el){ui.pf.q=el.value;render()},
  matCat(el){ui.matCat=el.value;render()},calResp(el){ui.calResp=el.value;render()},
  estadoProy(el){const p=byId('proyectos',el.dataset.id);const nv=el.value;if(!nv)return;
    if(!needEdit()){render();return}
    if(!TRANS[p.estado].includes(nv)){toast(`Transición no permitida: de «${p.estado}» no se puede pasar a «${nv}». Se conserva el estado anterior.`,'err');render();return}
    const ant=p.estado;p.estado=nv;save();toast(`Estado actualizado: ${ant} → ${nv}.`);render()},
  estadoAct(el){const a=byId('actividades',el.dataset.id);if(!needEdit()){render();return}a.estado=el.value;save();toast('Estado de la actividad actualizado.');render()},
  condProv(el){const x=byId('provProy',el.dataset.id);if(!needEdit()){render();return}x.condicion=el.value;save();toast('Condición actualizada: '+el.value+'.');render()}
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
document.addEventListener('submit',e=>{
  if(e.target.id==='loginf'){e.preventDefault();const f=e.target;const u=USERS.find(x=>x.u===f.u.value.trim().toLowerCase()&&x.p===f.p.value);
    if(!u){f.querySelector('.msg').innerHTML='<div class="errsum">Usuario o contraseña incorrectos. Acceso rechazado.</div>';return}
    USER=u;try{sessionStorage.setItem(LS+'-u',u.u)}catch(er){}if(!location.hash)location.hash='#inicio';render();toast('Bienvenida, '+u.nombre.split(' ')[0]+'.');return}
  if(e.target.matches('[data-search]')){e.preventDefault();ui.q=e.target.q.value.trim();if(location.hash==='#buscar')render();else location.hash='#buscar'}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
window.addEventListener('hashchange',()=>{closeModal();render();window.scrollTo(0,0)});

/* ================= Inicio ================= */
load();
try{const su=sessionStorage.getItem(LS+'-u');if(su)USER=USERS.find(u=>u.u===su)||null}catch(e){}
render();
