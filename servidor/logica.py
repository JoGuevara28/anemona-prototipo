"""
Capa de lógica y acceso a datos del prototipo Anémona Design Studio.

Aquí viven las reglas de negocio del ERS. El servidor HTTP (servidor.py) solo
traduce peticiones a llamadas de este módulo, de modo que las reglas se aplican
siempre en el servidor aunque alguien se salte la interfaz.

Solo usa la biblioteca estándar de Python (sqlite3, hashlib, secrets...).
"""
from __future__ import annotations

import base64
import datetime as dt
import hashlib
import re
import secrets
import sqlite3
import unicodedata
from pathlib import Path

ESQUEMA = Path(__file__).resolve().parent / "db" / "esquema.sql"

# --------------------------------------------------------------------------- catálogos
TIPOS = ["Anteproyecto", "Diseño de interiores", "Mobiliario a medida", "Remodelación", "Gestión de construcción"]
ESTADOS = [("Por iniciar", 1), ("En diseño", 1), ("En ejecución", 1), ("En pausa", 0), ("Finalizado", 0), ("Cancelado", 0)]
TRANSICIONES = {
    "Por iniciar": ["En diseño", "Cancelado"],
    "En diseño": ["En ejecución", "En pausa", "Finalizado", "Cancelado"],
    "En ejecución": ["En pausa", "Finalizado", "Cancelado"],
    "En pausa": ["En diseño", "En ejecución", "Cancelado"],
}
EST_LEAD = ["Nuevo", "Contactado", "Reunión agendada", "Cotización enviada", "No continuó"]
EST_ACT = ["Pendiente", "En proceso", "Completada"]
CATEGORIAS = ["Iluminación", "Mobiliario", "Ebanistería", "Construcción", "Acabados", "Materiales", "Electrodomésticos", "Otros servicios"]
UNIDADES = ["unidad", "m²", "metro lineal", "lámina", "galón", "juego", "servicio"]
CONDICIONES = ["Considerado", "Seleccionado"]
EST_COT = ["Enviada", "Aceptada", "Rechazada"]
RESPONSABLES = ["Gabriela Núñez", "María José", "Colaborador externo"]
TIPOS_ID = ["Cédula", "Pasaporte"]
PLAN = {
    "Anteproyecto": [("Reunión inicial con el cliente", 0), ("Levantamiento del sitio", 5), ("Propuesta conceptual", 14, 1), ("Revisión con el cliente", 18), ("Ajustes y entrega del anteproyecto", 28, 1)],
    "Diseño de interiores": [("Reunión inicial con el cliente", 0), ("Elaboración del mood board", 7, 1), ("Revisión del mood board con el cliente", 10), ("Registro e incorporación de comentarios", 14), ("Propuesta de distribución y planos", 24, 1, "María José"), ("Renders", 35, 1, "María José"), ("Selección de materiales y proveedores", 40), ("Entrega final", 50, 1)],
    "Mobiliario a medida": [("Reunión y toma de medidas", 0), ("Diseño del mueble", 7, 1), ("Aprobación del diseño por el cliente", 10), ("Coordinación con ebanista", 12), ("Fabricación", 30), ("Instalación y entrega", 35, 1)],
    "Remodelación": [("Reunión inicial con el cliente", 0), ("Levantamiento del sitio", 5), ("Diseño y planos", 20, 1, "María José"), ("Selección de materiales", 25), ("Cotización con contratistas", 30), ("Inicio de obra", 40), ("Seguimiento de obra", 60), ("Entrega de la remodelación", 75, 1)],
    "Gestión de construcción": [("Revisión de planos", 0), ("Contratación del equipo de construcción", 10), ("Inicio de obra", 20), ("Inspección de avance", 45), ("Entrega de obra", 80, 1)],
}
USUARIOS = [
    ("gabriela", "anemona2026", "Gabriela Núñez", "GN", "Propietaria", 1),
    ("mariajose", "anemona2026", "María José", "MJ", "Arquitecta", 1),
    ("consulta", "consulta", "Usuario de consulta", "UC", "Solo consulta (demo)", 0),
]
DURACION_SESION = dt.timedelta(hours=8)
MAX_ARCHIVO = 10 * 1024 * 1024  # 10 MB
EXT_PERMITIDAS = (".pdf", ".png", ".jpg", ".jpeg", ".docx")


# --------------------------------------------------------------------------- errores
class ReglaError(Exception):
    """Datos inválidos o regla de negocio incumplida → HTTP 400. `errores` = {campo: mensaje}."""

    def __init__(self, errores: dict, mensaje: str = "Datos inválidos"):
        super().__init__(mensaje)
        self.errores = errores
        self.mensaje = mensaje


class NoAutenticado(Exception):
    """Sin sesión válida → HTTP 401."""


class Prohibido(Exception):
    """Sesión válida pero sin permiso → HTTP 403."""


class NoEncontrado(Exception):
    """Registro inexistente → HTTP 404."""


# --------------------------------------------------------------------------- utilidades
def hoy() -> dt.date:
    return dt.date.today()


def ahora_iso() -> str:
    return dt.datetime.now().isoformat(timespec="seconds")


def nuevo_id(prefijo: str) -> str:
    return prefijo + secrets.token_hex(3)


def norm(texto) -> str:
    t = unicodedata.normalize("NFD", str(texto or ""))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t.lower().strip())


def digitos(texto) -> str:
    return re.sub(r"\D", "", str(texto or ""))


def txt(v) -> str:
    return str(v if v is not None else "").strip()


def num_o_none(v):
    v = txt(v)
    return None if v == "" else float(v)


def hash_clave(clave: str, sal: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", clave.encode(), bytes.fromhex(sal), 120_000).hex()


# --------------------------------------------------------------------------- conexión
def conectar(ruta) -> sqlite3.Connection:
    con = sqlite3.connect(str(ruta), timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def crear_bd(ruta, reiniciar: bool = False) -> None:
    """Crea la base de datos con el esquema y los datos de ejemplo si no existe."""
    ruta = Path(ruta)
    if reiniciar and ruta.exists():
        ruta.unlink()
    nueva = not ruta.exists()
    con = conectar(ruta)
    try:
        if nueva:
            con.executescript(ESQUEMA.read_text(encoding="utf-8"))
            sembrar(con)
            con.commit()
    finally:
        con.close()


def reiniciar_datos(con: sqlite3.Connection) -> None:
    """Borra todos los datos de negocio y vuelve a cargar los de ejemplo (conserva usuarios y sesiones)."""
    for t in ["cotizacion", "proyecto_material", "proyecto_proveedor", "material_proveedor", "material",
              "proveedor_categoria", "proveedor", "actividad", "proyecto", "potencial_cliente", "cliente"]:
        con.execute(f"DELETE FROM {t}")
    sembrar_negocio(con)
    con.commit()


# --------------------------------------------------------------------------- datos de ejemplo
def sembrar(con: sqlite3.Connection) -> None:
    for i, t in enumerate(TIPOS):
        con.execute("INSERT INTO tipo_servicio VALUES (?,?)", (t, i))
    for i, (e, activo) in enumerate(ESTADOS):
        con.execute("INSERT INTO estado_proyecto VALUES (?,?,?)", (e, i, activo))
    for desde, hastas in TRANSICIONES.items():
        for h in hastas:
            con.execute("INSERT INTO transicion_estado VALUES (?,?)", (desde, h))
    for i, c in enumerate(CATEGORIAS):
        con.execute("INSERT INTO categoria VALUES (?,?)", (c, i))
    for tipo, pasos in PLAN.items():
        for i, paso in enumerate(pasos):
            nombre, dias = paso[0], paso[1]
            ent = paso[2] if len(paso) > 2 else 0
            resp = paso[3] if len(paso) > 3 else "Gabriela Núñez"
            con.execute("INSERT INTO plan_actividad (tipo_servicio, orden, nombre, dias_desde_inicio, entregable, responsable) VALUES (?,?,?,?,?,?)",
                        (tipo, i, nombre, dias, ent, resp))
    for usuario, clave, nombre, ini, rol, edita in USUARIOS:
        sal = secrets.token_hex(16)
        con.execute("INSERT INTO usuario VALUES (?,?,?,?,?,?,?,?)",
                    (nuevo_id("u"), usuario, nombre, ini, rol, edita, hash_clave(clave, sal), sal))
    sembrar_negocio(con)


def _d(dias: int) -> str:
    return (hoy() + dt.timedelta(days=dias)).isoformat()


def sembrar_negocio(con: sqlite3.Connection) -> None:
    n = ahora_iso()
    T = hoy().isoformat()
    clientes = [
        ("c1", "Laura Méndez Quesada", "Cédula", "1-1234-0567", "8765-4321", "laura.mendez@correo.com", "Costarricense", _d(-40)),
        ("c2", "Andrew Solís", "Pasaporte", "P88123456", "+1 305 555 0142", "andrew.solis@mail.com", "Estadounidense", _d(-25)),
    ]
    for c in clientes:
        con.execute("INSERT INTO cliente (id,nombre,tipo_id,num_id,num_id_normal,telefono,correo,nacionalidad,origen_potencial,creado,actualizado) VALUES (?,?,?,?,?,?,?,?,NULL,?,?)",
                    (c[0], c[1], c[2], c[3], normalizar_id(c[2], c[3]), c[4], c[5], c[6], c[7], n))
    leads = [
        ("l1", "Sofía Rojas Alvarado", "8890-1122", "sofia.rojas@correo.com", "Costarricense", "Diseño de interiores", "Contactado", "Escribió por WhatsApp; apartamento nuevo en Heredia.", _d(-6)),
        ("l2", "Carlos Vargas Mena", "7012-4455", "", "Costarricense", "Mobiliario a medida", "Nuevo", "Interesado en un escritorio y librero.", _d(-2)),
        ("l3", "Daniela Jiménez", "", "dani.jimenez@mail.com", "Colombiana", "Remodelación", "Cotización enviada", "Remodelación de baño principal. Cotización enviada por WhatsApp.", _d(-15)),
    ]
    for l in leads:
        con.execute("INSERT INTO potencial_cliente (id,nombre,telefono,correo,nacionalidad,servicio,estado,notas,convertido_a,creado,actualizado) VALUES (?,?,?,?,?,?,?,?,NULL,?,?)", (*l, n))
    proyectos = [
        ("p1", "c1", "Apartamento Escazú", "Diseño de interiores", "Diseño interior completo de apartamento de 2 habitaciones: sala, comedor, cocina y dormitorio principal.", _d(-20), "Escazú, San José", 85, "En diseño"),
        ("p2", "c1", "Mueble de TV a medida", "Mobiliario a medida", "Mueble flotante de TV con almacenamiento para la sala.", _d(-15), "Escazú, San José", None, "En ejecución"),
        ("p3", "c2", "Remodelación de cocina Solís", "Remodelación", "Remodelación de cocina con nueva distribución, muebles y acabados.", _d(5), "Santa Ana, San José", 18, "Por iniciar"),
        ("p4", "c2", "Anteproyecto casa de playa", "Anteproyecto", "Anteproyecto de vivienda vacacional. Solo trabajo interno del estudio (sin proveedores ni materiales).", _d(12), "Nosara, Guanacaste", 160, "Por iniciar"),
    ]
    for p in proyectos:
        con.execute("INSERT INTO proyecto (id,cliente_id,nombre,tipo,descripcion,fecha_inicio,ubicacion,area,estado,creado,actualizado) VALUES (?,?,?,?,?,?,?,?,?,?,?)", (*p, n, n))
    for a in _plan(con, "p1", "Diseño de interiores", _d(-20)):
        if a["fecha"] < T:
            a["estado"] = "Pendiente" if "comentarios" in a["nombre"] else "Completada"
        elif "planos" in a["nombre"]:
            a["estado"] = "En proceso"
        _insertar_actividad(con, a)
    for a in _plan(con, "p2", "Mobiliario a medida", _d(-15)):
        a["estado"] = "Completada" if a["fecha"] < T else ("En proceso" if a["nombre"] == "Fabricación" else "Pendiente")
        _insertar_actividad(con, a)
    for a in _plan(con, "p3", "Remodelación", _d(5)):
        _insertar_actividad(con, a)
    proveedores = [
        ("v1", "Luz & Forma", ["Iluminación"], "Pamela Ruiz", "8811-2233", "ventas@luzyforma.cr", "Lámparas colgantes, apliques, cintas LED.", "Responde rápido; buena experiencia previa."),
        ("v2", "Iluminarte", ["Iluminación"], "Diego Castro", "2222-3344", "", "Iluminación decorativa importada.", "Tiempos de entrega de 3–4 semanas."),
        ("v3", "Ebanistería Hermanos Mora", ["Ebanistería", "Mobiliario"], "Luis Mora", "8456-7788", "", "Muebles a medida, cocinas, closets.", ""),
        ("v4", "Porcelanatos del Valle", ["Acabados", "Materiales"], "Karla Vindas", "2290-1010", "kvindas@pvalle.cr", "Porcelanatos, revestimientos, griferías.", ""),
        ("v5", "Constructora Brenes", ["Construcción"], "Mauricio Brenes", "8333-9090", "", "Obra gris, remodelaciones, demoliciones.", ""),
        ("v6", "Casa Mobili", ["Mobiliario"], "Andrea León", "4000-1200", "hola@casamobili.cr", "Sofás, sillas, mesas de comedor.", ""),
    ]
    for v in proveedores:
        con.execute("INSERT INTO proveedor VALUES (?,?,?,?,?,?,?)", (v[0], v[1], v[3], v[4], v[5], v[6], v[7]))
        for c in v[2]:
            con.execute("INSERT INTO proveedor_categoria VALUES (?,?)", (v[0], c))
    materiales = [
        ("m1", "Lámpara colgante de ratán", "RT-40", "Iluminación", "unidad", 45000, "Diámetro 40 cm.", ["v1", "v2"]),
        ("m2", "Porcelanato 60×60 gris cemento", "PV-6060G", "Acabados", "m²", 12500, "", ["v4"]),
        ("m3", "Plywood de pino 18 mm", "", "Materiales", "lámina", 28000, "", ["v3"]),
        ("m4", "Sofá modular 3 plazas", "Oslo", "Mobiliario", "unidad", 650000, "Tela lino arena.", ["v6"]),
    ]
    for m in materiales:
        con.execute("INSERT INTO material VALUES (?,?,?,?,?,?,?)", m[:7])
        for pv in m[7]:
            con.execute("INSERT INTO material_proveedor VALUES (?,?)", (m[0], pv))
    for r in [("pp1", "p1", "v1", "Seleccionado"), ("pp2", "p1", "v2", "Considerado"), ("pp3", "p1", "v6", "Seleccionado"),
              ("pp4", "p2", "v3", "Seleccionado"), ("pp5", "p3", "v4", "Considerado"), ("pp6", "p3", "v5", "Considerado")]:
        con.execute("INSERT INTO proyecto_proveedor VALUES (?,?,?,?)", r)
    for r in [("mp1", "p1", "m1", 3, 45000, "Comedor"), ("mp2", "p1", "m4", 1, 650000, ""), ("mp3", "p2", "m3", 4, 28000, "")]:
        con.execute("INSERT INTO proyecto_material VALUES (?,?,?,?,?,?)", r)
    con.execute("INSERT INTO cotizacion (id,proyecto_id,codigo,fecha,monto,estado,enlace,archivo_nombre) VALUES (?,?,?,?,?,?,?,?)",
                ("q1", "p1", "COT-2026-014", _d(-28), 1800000, "Aceptada", "https://www.canva.com/", ""))


# --------------------------------------------------------------------------- lectura
def _plan(con, proyecto_id: str, tipo: str, inicio: str) -> list[dict]:
    base = dt.date.fromisoformat(inicio)
    filas = con.execute("SELECT * FROM plan_actividad WHERE tipo_servicio=? ORDER BY orden", (tipo,)).fetchall()
    return [{"id": nuevo_id("a"), "proyectoId": proyecto_id, "nombre": f["nombre"], "responsable": f["responsable"],
             "fecha": (base + dt.timedelta(days=f["dias_desde_inicio"])).isoformat(), "estado": "Pendiente",
             "entregable": bool(f["entregable"])} for f in filas]


def _insertar_actividad(con, a: dict) -> None:
    con.execute("INSERT INTO actividad VALUES (?,?,?,?,?,?,?)",
                (a["id"], a["proyectoId"], a["nombre"], a["responsable"], a["fecha"], a["estado"], 1 if a["entregable"] else 0))


def _num(x):
    if x is None:
        return ""
    return int(x) if float(x).is_integer() else x


def catalogos(con) -> dict:
    trans: dict[str, list[str]] = {e: [] for e, _ in con.execute("SELECT nombre, orden FROM estado_proyecto ORDER BY orden")}
    for f in con.execute("SELECT t.desde, t.hasta FROM transicion_estado t JOIN estado_proyecto e ON e.nombre=t.hasta ORDER BY e.orden"):
        trans[f["desde"]].append(f["hasta"])
    plan: dict[str, list] = {}
    for f in con.execute("SELECT * FROM plan_actividad ORDER BY tipo_servicio, orden"):
        plan.setdefault(f["tipo_servicio"], []).append([f["nombre"], f["dias_desde_inicio"], f["entregable"], f["responsable"]])
    return {
        "tipos": [f[0] for f in con.execute("SELECT nombre FROM tipo_servicio ORDER BY orden")],
        "estados": [f[0] for f in con.execute("SELECT nombre FROM estado_proyecto ORDER BY orden")],
        "activos": [f[0] for f in con.execute("SELECT nombre FROM estado_proyecto WHERE activo=1 ORDER BY orden")],
        "transiciones": trans,
        "categorias": [f[0] for f in con.execute("SELECT nombre FROM categoria ORDER BY orden")],
        "plan": plan,
        "responsables": RESPONSABLES,
    }


def datos(con) -> dict:
    """Todos los registros, con las claves que usa la interfaz."""
    q = lambda sql, *a: con.execute(sql, a).fetchall()  # noqa: E731
    cats: dict[str, list] = {}
    for f in q("SELECT pc.proveedor_id, pc.categoria FROM proveedor_categoria pc JOIN categoria c ON c.nombre=pc.categoria ORDER BY c.orden"):
        cats.setdefault(f[0], []).append(f[1])
    provs_mat: dict[str, list] = {}
    for f in q("SELECT material_id, proveedor_id FROM material_proveedor"):
        provs_mat.setdefault(f[0], []).append(f[1])
    return {
        "leads": [{"id": f["id"], "nombre": f["nombre"], "telefono": f["telefono"], "correo": f["correo"], "nacionalidad": f["nacionalidad"],
                   "servicio": f["servicio"], "estado": f["estado"], "notas": f["notas"], "creado": f["creado"], "convertidoA": f["convertido_a"]}
                  for f in q("SELECT * FROM potencial_cliente")],
        "clientes": [{"id": f["id"], "nombre": f["nombre"], "tipoId": f["tipo_id"], "numId": f["num_id"], "telefono": f["telefono"],
                      "correo": f["correo"], "nacionalidad": f["nacionalidad"], "origenLead": f["origen_potencial"], "creado": f["creado"]}
                     for f in q("SELECT * FROM cliente")],
        "proyectos": [{"id": f["id"], "clienteId": f["cliente_id"], "nombre": f["nombre"], "tipo": f["tipo"], "descripcion": f["descripcion"],
                       "fechaInicio": f["fecha_inicio"], "ubicacion": f["ubicacion"], "area": _num(f["area"]), "estado": f["estado"]}
                      for f in q("SELECT * FROM proyecto ORDER BY creado, id")],
        "actividades": [{"id": f["id"], "proyectoId": f["proyecto_id"], "nombre": f["nombre"], "responsable": f["responsable"],
                         "fecha": f["fecha"], "estado": f["estado"], "entregable": bool(f["entregable"])}
                        for f in q("SELECT * FROM actividad ORDER BY fecha, rowid")],
        "proveedores": [{"id": f["id"], "nombre": f["nombre"], "categorias": cats.get(f["id"], []), "contacto": f["contacto"],
                         "telefono": f["telefono"], "correo": f["correo"], "ofrece": f["ofrece"], "notas": f["notas"]}
                        for f in q("SELECT * FROM proveedor")],
        "materiales": [{"id": f["id"], "nombre": f["nombre"], "modelo": f["modelo"], "categoria": f["categoria"], "unidad": f["unidad"],
                        "precioRef": _num(f["precio_ref"]), "proveedorIds": provs_mat.get(f["id"], []), "descripcion": f["descripcion"]}
                       for f in q("SELECT * FROM material")],
        "provProy": [{"id": f["id"], "proyectoId": f["proyecto_id"], "proveedorId": f["proveedor_id"], "condicion": f["condicion"]}
                     for f in q("SELECT * FROM proyecto_proveedor ORDER BY rowid")],
        "matProy": [{"id": f["id"], "proyectoId": f["proyecto_id"], "materialId": f["material_id"], "cantidad": _num(f["cantidad"]),
                     "precioUnit": _num(f["precio_unit"]), "nota": f["nota"]} for f in q("SELECT * FROM proyecto_material ORDER BY rowid")],
        "cotizaciones": [{"id": f["id"], "proyectoId": f["proyecto_id"], "codigo": f["codigo"], "fecha": f["fecha"], "monto": _num(f["monto"]),
                          "estado": f["estado"], "enlace": f["enlace"], "archivo": f["archivo_nombre"], "tieneArchivo": bool(f["datos"])}
                         for f in q("SELECT id,proyecto_id,codigo,fecha,monto,estado,enlace,archivo_nombre,archivo_datos IS NOT NULL AND length(archivo_datos)>0 AS datos FROM cotizacion ORDER BY fecha, rowid")],
    }


def archivo_cotizacion(con, cid: str):
    f = con.execute("SELECT archivo_nombre, archivo_tipo, archivo_datos FROM cotizacion WHERE id=?", (cid,)).fetchone()
    if not f or not f["archivo_datos"]:
        raise NoEncontrado()
    return f["archivo_nombre"], f["archivo_tipo"] or "application/octet-stream", bytes(f["archivo_datos"])


# --------------------------------------------------------------------------- acceso (RF-17)
def iniciar_sesion(con, usuario: str, clave: str) -> tuple[str, dict]:
    f = con.execute("SELECT * FROM usuario WHERE usuario=?", (txt(usuario).lower(),)).fetchone()
    if not f or not secrets.compare_digest(f["clave_hash"], hash_clave(clave or "", f["clave_sal"])):
        raise NoAutenticado()
    token = secrets.token_urlsafe(32)
    con.execute("DELETE FROM sesion WHERE expira < ?", (ahora_iso(),))
    con.execute("INSERT INTO sesion VALUES (?,?,?)", (token, f["id"], (dt.datetime.now() + DURACION_SESION).isoformat(timespec="seconds")))
    con.commit()
    return token, usuario_publico(f)


def usuario_publico(f) -> dict:
    return {"u": f["usuario"], "nombre": f["nombre"], "ini": f["iniciales"], "rol": f["rol"], "edit": bool(f["puede_editar"])}


def usuario_de_token(con, token: str | None):
    if not token:
        return None
    f = con.execute("SELECT u.* FROM sesion s JOIN usuario u ON u.id=s.usuario_id WHERE s.token=? AND s.expira > ?", (token, ahora_iso())).fetchone()
    return usuario_publico(f) if f else None


def cerrar_sesion(con, token: str | None) -> None:
    if token:
        con.execute("DELETE FROM sesion WHERE token=?", (token,))
        con.commit()


# --------------------------------------------------------------------------- validación
RE_CORREO = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
RE_TEL = re.compile(r"^\+?[\d\s()-]+$")


class Validador:
    """Acumula errores por campo, con los mismos mensajes que muestra la interfaz."""

    def __init__(self, v: dict):
        self.v = v
        self.e: dict[str, str] = {}

    def __call__(self, campo):
        return txt(self.v.get(campo))

    def error(self, campo, msg):
        self.e.setdefault(campo, msg)

    def req(self, *campos):
        for c in campos:
            if self(c) == "":
                self.error(c, "Este campo es obligatorio.")

    def en(self, campo, opciones, req=True):
        val = self(campo)
        if val == "":
            if req:
                self.error(campo, "Este campo es obligatorio.")
        elif val not in opciones:
            self.error(campo, "Valor no permitido.")

    def correo(self, campo):
        if self(campo) and not RE_CORREO.match(self(campo)):
            self.error(campo, "Formato de correo inválido (ej. nombre@dominio.com).")

    def telefono(self, campo):
        val = self(campo)
        if val and not (RE_TEL.match(val) and 8 <= len(digitos(val)) <= 15):
            self.error(campo, "Teléfono inválido: use al menos 8 dígitos (ej. 8421-1692).")

    def numero(self, campo, positivo=False):
        val = self(campo)
        if val == "":
            return
        try:
            n = float(val)
        except ValueError:
            self.error(campo, "Debe ser un número mayor o igual a 0.")
            return
        if n < 0:
            self.error(campo, "Debe ser un número mayor o igual a 0.")
        elif positivo and n <= 0:
            self.error(campo, "La cantidad debe ser mayor que 0.")

    def fecha(self, campo):
        val = self(campo)
        if val:
            try:
                dt.date.fromisoformat(val)
            except ValueError:
                self.error(campo, "Fecha inválida.")

    def contacto(self):
        if not self("telefono") and not self("correo"):
            self.error("telefono", "Indique al menos un medio de contacto: teléfono o correo.")

    def fin(self):
        if self.e:
            raise ReglaError(self.e)


def normalizar_id(tipo: str, numero: str) -> str:
    return digitos(numero) if tipo == "Cédula" else re.sub(r"[\s-]", "", str(numero)).upper()


def _validar_identificacion(val: Validador):
    t, n = val("tipoId"), val("numId")
    if not n or not t:
        return
    if t == "Cédula" and len(digitos(n)) != 9:
        val.error("numId", "La cédula debe tener 9 dígitos (ej. 1-1234-0567).")
    if t == "Pasaporte" and not re.fullmatch(r"[A-Za-z0-9]{6,20}", re.sub(r"[\s-]", "", n)):
        val.error("numId", "El pasaporte debe tener entre 6 y 20 letras o números.")


def _id_duplicado(con, tipo, numero, excepto=None):
    return con.execute("SELECT nombre FROM cliente WHERE tipo_id=? AND num_id_normal=? AND id IS NOT ?",
                       (tipo, normalizar_id(tipo, numero), excepto)).fetchone()


def _persona_duplicada(con, v: dict, excepto_lead=None, excepto_cliente=None) -> str:
    """CU-01, flujo alterno: misma persona si coincide nombre, teléfono o correo."""
    n, t, c = norm(v.get("nombre")), digitos(v.get("telefono")), norm(v.get("correo"))

    def igual(f):
        return (n and norm(f["nombre"]) == n) or (len(t) >= 8 and digitos(f["telefono"]) == t) or (c and norm(f["correo"]) == c)

    for f in con.execute("SELECT id, nombre, telefono, correo FROM potencial_cliente WHERE convertido_a IS NULL"):
        if f["id"] != excepto_lead and igual(f):
            return f"Ya existe como potencial cliente: «{f['nombre']}»."
    for f in con.execute("SELECT id, nombre, telefono, correo FROM cliente"):
        if f["id"] != excepto_cliente and igual(f):
            return f"Ya existe como cliente: «{f['nombre']}»."
    return ""


def _existe(con, tabla, id_):
    f = con.execute(f"SELECT * FROM {tabla} WHERE id=?", (id_,)).fetchone()
    if not f:
        raise NoEncontrado()
    return f


def _tipos(con):
    return [f[0] for f in con.execute("SELECT nombre FROM tipo_servicio")]


# --------------------------------------------------------------------------- potenciales clientes (RF-01..RF-03)
def _validar_lead(con, v, excepto=None):
    val = Validador(v)
    val.req("nombre")
    val.telefono("telefono")
    val.correo("correo")
    val.contacto()
    val.en("servicio", _tipos(con))
    val.en("estado", EST_LEAD)
    val.fin()
    dup = _persona_duplicada(con, v, excepto_lead=excepto)
    if dup:
        raise ReglaError({"nombre": dup + " No se creó un registro duplicado."})


def crear_potencial(con, v):
    _validar_lead(con, v)
    i, n = nuevo_id("l"), ahora_iso()
    con.execute("INSERT INTO potencial_cliente (id,nombre,telefono,correo,nacionalidad,servicio,estado,notas,creado,actualizado) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (i, txt(v["nombre"]), txt(v.get("telefono")), txt(v.get("correo")), txt(v.get("nacionalidad")), txt(v["servicio"]),
                 txt(v["estado"]), txt(v.get("notas")), hoy().isoformat(), n))
    return {"id": i}


def editar_potencial(con, lid, v):
    _existe(con, "potencial_cliente", lid)
    _validar_lead(con, v, excepto=lid)
    con.execute("UPDATE potencial_cliente SET nombre=?,telefono=?,correo=?,nacionalidad=?,servicio=?,estado=?,notas=?,actualizado=? WHERE id=?",
                (txt(v["nombre"]), txt(v.get("telefono")), txt(v.get("correo")), txt(v.get("nacionalidad")), txt(v["servicio"]),
                 txt(v["estado"]), txt(v.get("notas")), ahora_iso(), lid))
    return {"id": lid}


def convertir_potencial(con, lid, v):
    """RF-03: conserva los datos de contacto y marca al potencial como convertido (sin duplicar)."""
    lead = _existe(con, "potencial_cliente", lid)
    if lead["convertido_a"]:
        raise ReglaError({"numId": "Este potencial cliente ya fue convertido."})
    val = Validador(v)
    val.en("tipoId", TIPOS_ID)
    val.req("numId")
    if not v.get("contrato"):
        val.error("contrato", "Debe confirmarse para continuar.")
    _validar_identificacion(val)
    val.fin()
    dup = _id_duplicado(con, v["tipoId"], v["numId"])
    if dup:
        raise ReglaError({"numId": f"Esta identificación ya pertenece al cliente «{dup['nombre']}». No se creó un nuevo registro."})
    cid, n = nuevo_id("c"), ahora_iso()
    con.execute("INSERT INTO cliente (id,nombre,tipo_id,num_id,num_id_normal,telefono,correo,nacionalidad,origen_potencial,creado,actualizado) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (cid, lead["nombre"], v["tipoId"], txt(v["numId"]), normalizar_id(v["tipoId"], v["numId"]), lead["telefono"], lead["correo"],
                 lead["nacionalidad"], lid, hoy().isoformat(), n))
    con.execute("UPDATE potencial_cliente SET convertido_a=?, actualizado=? WHERE id=?", (cid, n, lid))
    return {"id": cid}


# --------------------------------------------------------------------------- clientes (RF-04)
def _validar_cliente(con, v, excepto=None):
    val = Validador(v)
    val.req("nombre")
    val.en("tipoId", TIPOS_ID)
    val.req("numId")
    _validar_identificacion(val)
    val.telefono("telefono")
    val.correo("correo")
    val.contacto()
    val.fin()
    dup = _id_duplicado(con, v["tipoId"], v["numId"], excepto)
    if dup:
        raise ReglaError({"numId": f"Ya existe un cliente con esta identificación: «{dup['nombre']}»."})


def crear_cliente(con, v):
    _validar_cliente(con, v)
    cid, n = nuevo_id("c"), ahora_iso()
    con.execute("INSERT INTO cliente (id,nombre,tipo_id,num_id,num_id_normal,telefono,correo,nacionalidad,creado,actualizado) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (cid, txt(v["nombre"]), v["tipoId"], txt(v["numId"]), normalizar_id(v["tipoId"], v["numId"]), txt(v.get("telefono")),
                 txt(v.get("correo")), txt(v.get("nacionalidad")), hoy().isoformat(), n))
    return {"id": cid}


def editar_cliente(con, cid, v):
    _existe(con, "cliente", cid)
    _validar_cliente(con, v, excepto=cid)
    con.execute("UPDATE cliente SET nombre=?,tipo_id=?,num_id=?,num_id_normal=?,telefono=?,correo=?,nacionalidad=?,actualizado=? WHERE id=?",
                (txt(v["nombre"]), v["tipoId"], txt(v["numId"]), normalizar_id(v["tipoId"], v["numId"]), txt(v.get("telefono")),
                 txt(v.get("correo")), txt(v.get("nacionalidad")), ahora_iso(), cid))
    return {"id": cid}


# --------------------------------------------------------------------------- proyectos (RF-05..RF-08)
def _validar_proyecto(con, v):
    val = Validador(v)
    val.req("clienteId", "nombre", "descripcion", "fechaInicio")
    val.en("tipo", _tipos(con))
    val.fecha("fechaInicio")
    val.numero("area")
    if val("clienteId") and not con.execute("SELECT 1 FROM cliente WHERE id=?", (val("clienteId"),)).fetchone():
        val.error("clienteId", "El cliente seleccionado no existe.")  # RNF-02
    val.fin()


def crear_proyecto(con, v):
    _validar_proyecto(con, v)
    pid, n = nuevo_id("p"), ahora_iso()
    con.execute("INSERT INTO proyecto (id,cliente_id,nombre,tipo,descripcion,fecha_inicio,ubicacion,area,estado,creado,actualizado) VALUES (?,?,?,?,?,?,?,?,'Por iniciar',?,?)",
                (pid, v["clienteId"], txt(v["nombre"]), v["tipo"], txt(v["descripcion"]), v["fechaInicio"], txt(v.get("ubicacion")),
                 num_o_none(v.get("area")), n, n))
    if v.get("plan"):
        for a in _plan(con, pid, v["tipo"], v["fechaInicio"]):
            _insertar_actividad(con, a)
    return {"id": pid}


def editar_proyecto(con, pid, v):
    _existe(con, "proyecto", pid)
    _validar_proyecto(con, v)
    con.execute("UPDATE proyecto SET cliente_id=?,nombre=?,tipo=?,descripcion=?,fecha_inicio=?,ubicacion=?,area=?,actualizado=? WHERE id=?",
                (v["clienteId"], txt(v["nombre"]), v["tipo"], txt(v["descripcion"]), v["fechaInicio"], txt(v.get("ubicacion")),
                 num_o_none(v.get("area")), ahora_iso(), pid))
    return {"id": pid}


def cambiar_estado(con, pid, v):
    p = _existe(con, "proyecto", pid)
    nuevo = txt(v.get("estado"))
    ok = con.execute("SELECT 1 FROM transicion_estado WHERE desde=? AND hasta=?", (p["estado"], nuevo)).fetchone()
    if not ok:
        raise ReglaError({"estado": f"Transición no permitida: de «{p['estado']}» no se puede pasar a «{nuevo}»."},
                         "Transición no permitida")
    con.execute("UPDATE proyecto SET estado=?, actualizado=? WHERE id=?", (nuevo, ahora_iso(), pid))
    return {"id": pid, "anterior": p["estado"], "estado": nuevo}


def cargar_plan(con, pid):
    p = _existe(con, "proyecto", pid)
    acts = _plan(con, pid, p["tipo"], p["fecha_inicio"])
    for a in acts:
        _insertar_actividad(con, a)
    return {"id": pid, "agregadas": len(acts)}


# --------------------------------------------------------------------------- actividades (RF-13, RF-14)
def _validar_actividad(v):
    val = Validador(v)
    val.req("nombre", "fecha")
    val.en("responsable", RESPONSABLES)
    val.en("estado", EST_ACT)
    val.fecha("fecha")
    val.fin()


def crear_actividad(con, v):
    _existe(con, "proyecto", txt(v.get("proyectoId")))
    _validar_actividad(v)
    a = {"id": nuevo_id("a"), "proyectoId": v["proyectoId"], "nombre": txt(v["nombre"]), "responsable": v["responsable"],
         "fecha": v["fecha"], "estado": v["estado"], "entregable": bool(v.get("entregable"))}
    _insertar_actividad(con, a)
    return {"id": a["id"]}


def editar_actividad(con, aid, v):
    _existe(con, "actividad", aid)
    _validar_actividad(v)
    con.execute("UPDATE actividad SET nombre=?,responsable=?,fecha=?,estado=?,entregable=? WHERE id=?",
                (txt(v["nombre"]), v["responsable"], v["fecha"], v["estado"], 1 if v.get("entregable") else 0, aid))
    return {"id": aid}


# --------------------------------------------------------------------------- proveedores y materiales (RF-09..RF-12)
def _categorias(con):
    return [f[0] for f in con.execute("SELECT nombre FROM categoria")]


def _validar_proveedor(con, v):
    val = Validador(v)
    val.req("nombre", "telefono", "ofrece")
    val.telefono("telefono")
    val.correo("correo")
    cats = v.get("categorias") or []
    if not cats:
        val.error("categorias", "Seleccione al menos una opción.")
    elif any(c not in _categorias(con) for c in cats):
        val.error("categorias", "Valor no permitido.")
    val.fin()


def _guardar_categorias(con, vid, cats):
    con.execute("DELETE FROM proveedor_categoria WHERE proveedor_id=?", (vid,))
    for c in dict.fromkeys(cats):
        con.execute("INSERT INTO proveedor_categoria VALUES (?,?)", (vid, c))


def crear_proveedor(con, v):
    _validar_proveedor(con, v)
    vid = nuevo_id("v")
    con.execute("INSERT INTO proveedor VALUES (?,?,?,?,?,?,?)",
                (vid, txt(v["nombre"]), txt(v.get("contacto")), txt(v["telefono"]), txt(v.get("correo")), txt(v["ofrece"]), txt(v.get("notas"))))
    _guardar_categorias(con, vid, v["categorias"])
    return {"id": vid}


def editar_proveedor(con, vid, v):
    _existe(con, "proveedor", vid)
    _validar_proveedor(con, v)
    con.execute("UPDATE proveedor SET nombre=?,contacto=?,telefono=?,correo=?,ofrece=?,notas=? WHERE id=?",
                (txt(v["nombre"]), txt(v.get("contacto")), txt(v["telefono"]), txt(v.get("correo")), txt(v["ofrece"]), txt(v.get("notas")), vid))
    _guardar_categorias(con, vid, v["categorias"])
    return {"id": vid}


def _validar_material(con, v):
    val = Validador(v)
    val.req("nombre")
    val.en("categoria", _categorias(con))
    val.en("unidad", UNIDADES)
    val.numero("precioRef")
    for pid in v.get("proveedorIds") or []:
        if not con.execute("SELECT 1 FROM proveedor WHERE id=?", (pid,)).fetchone():
            val.error("proveedorIds", "Uno de los proveedores no existe.")
    val.fin()


def _guardar_mat_prov(con, mid, ids):
    con.execute("DELETE FROM material_proveedor WHERE material_id=?", (mid,))
    for pid in dict.fromkeys(ids or []):
        con.execute("INSERT INTO material_proveedor VALUES (?,?)", (mid, pid))


def crear_material(con, v):
    _validar_material(con, v)
    mid = nuevo_id("m")
    con.execute("INSERT INTO material VALUES (?,?,?,?,?,?,?)",
                (mid, txt(v["nombre"]), txt(v.get("modelo")), v["categoria"], v["unidad"], num_o_none(v.get("precioRef")), txt(v.get("descripcion"))))
    _guardar_mat_prov(con, mid, v.get("proveedorIds"))
    return {"id": mid}


def editar_material(con, mid, v):
    _existe(con, "material", mid)
    _validar_material(con, v)
    con.execute("UPDATE material SET nombre=?,modelo=?,categoria=?,unidad=?,precio_ref=?,descripcion=? WHERE id=?",
                (txt(v["nombre"]), txt(v.get("modelo")), v["categoria"], v["unidad"], num_o_none(v.get("precioRef")), txt(v.get("descripcion")), mid))
    _guardar_mat_prov(con, mid, v.get("proveedorIds"))
    return {"id": mid}


def asociar_proveedores(con, pid, v):
    _existe(con, "proyecto", pid)
    val = Validador(v)
    ids = v.get("ids") or []
    if not ids:
        val.error("ids", "Seleccione al menos una opción.")
    val.en("condicion", CONDICIONES)
    val.fin()
    agregados = 0
    for i in ids:
        if not con.execute("SELECT 1 FROM proveedor WHERE id=?", (i,)).fetchone():
            raise ReglaError({"ids": "Uno de los proveedores no existe."})
        if not con.execute("SELECT 1 FROM proyecto_proveedor WHERE proyecto_id=? AND proveedor_id=?", (pid, i)).fetchone():
            con.execute("INSERT INTO proyecto_proveedor VALUES (?,?,?,?)", (nuevo_id("pp"), pid, i, v["condicion"]))
            agregados += 1
    return {"id": pid, "agregados": agregados}


def editar_proyecto_proveedor(con, ppid, v):
    _existe(con, "proyecto_proveedor", ppid)
    val = Validador(v)
    val.en("condicion", CONDICIONES)
    val.fin()
    con.execute("UPDATE proyecto_proveedor SET condicion=? WHERE id=?", (v["condicion"], ppid))
    return {"id": ppid}


def quitar_proyecto_proveedor(con, ppid):
    _existe(con, "proyecto_proveedor", ppid)
    con.execute("DELETE FROM proyecto_proveedor WHERE id=?", (ppid,))
    return {"id": ppid}


def _validar_mat_proy(v, con=None, nuevo=False):
    val = Validador(v)
    if nuevo:
        val.req("materialId")
        if val("materialId") and con and not con.execute("SELECT 1 FROM material WHERE id=?", (val("materialId"),)).fetchone():
            val.error("materialId", "El material no existe en el catálogo.")
    val.req("cantidad")
    val.numero("cantidad", positivo=True)
    val.numero("precioUnit")
    val.fin()


def asociar_material(con, pid, v):
    _existe(con, "proyecto", pid)
    _validar_mat_proy(v, con, nuevo=True)
    m = _existe(con, "material", v["materialId"])
    precio = num_o_none(v.get("precioUnit"))
    if precio is None:
        precio = m["precio_ref"] or 0
    mpid = nuevo_id("mp")
    con.execute("INSERT INTO proyecto_material VALUES (?,?,?,?,?,?)", (mpid, pid, v["materialId"], float(v["cantidad"]), precio, txt(v.get("nota"))))
    return {"id": mpid}


def editar_proyecto_material(con, mpid, v):
    actual = _existe(con, "proyecto_material", mpid)
    _validar_mat_proy(v)
    precio = num_o_none(v.get("precioUnit"))
    con.execute("UPDATE proyecto_material SET cantidad=?, precio_unit=?, nota=? WHERE id=?",
                (float(v["cantidad"]), actual["precio_unit"] if precio is None else precio, txt(v.get("nota")), mpid))
    return {"id": mpid}


def quitar_proyecto_material(con, mpid):
    _existe(con, "proyecto_material", mpid)
    con.execute("DELETE FROM proyecto_material WHERE id=?", (mpid,))
    return {"id": mpid}


# --------------------------------------------------------------------------- cotizaciones (RF-16)
def _validar_cotizacion(v, tiene_archivo_previo=False):
    val = Validador(v)
    val.req("codigo", "fecha")
    val.fecha("fecha")
    val.numero("monto")
    val.en("estado", EST_COT)
    enlace, archivo = val("enlace"), val("archivo")
    if enlace and not re.match(r"^https?://\S+\.\S+", enlace):
        val.error("enlace", "El enlace debe iniciar con http:// o https://")
    elif not enlace and not archivo and not tiene_archivo_previo:
        val.error("enlace", "Indique un enlace o adjunte el documento.")
    if archivo and not archivo.lower().endswith(EXT_PERMITIDAS):
        val.error("archivo", "Formato no permitido. Use PDF, PNG, JPG o DOCX.")
    datos_b64 = v.get("archivoDatos")
    contenido = None
    if datos_b64:
        try:
            contenido = base64.b64decode(datos_b64, validate=True)
        except ValueError:
            val.error("archivo", "No se pudo leer el archivo adjunto.")
        else:
            if len(contenido) > MAX_ARCHIVO:
                val.error("archivo", "El archivo supera el máximo de 10 MB.")
    val.fin()
    return contenido


def crear_cotizacion(con, v):
    pid = txt(v.get("proyectoId"))
    _existe(con, "proyecto", pid)
    contenido = _validar_cotizacion(v)
    qid = nuevo_id("q")
    con.execute("INSERT INTO cotizacion VALUES (?,?,?,?,?,?,?,?,?,?)",
                (qid, pid, txt(v["codigo"]), v["fecha"], num_o_none(v.get("monto")), v["estado"], txt(v.get("enlace")),
                 txt(v.get("archivo")), txt(v.get("archivoTipo")), contenido))
    return {"id": qid}


def editar_cotizacion(con, qid, v):
    actual = _existe(con, "cotizacion", qid)
    contenido = _validar_cotizacion(v, tiene_archivo_previo=bool(actual["archivo_nombre"]))
    if contenido is not None:
        nombre, tipo, datos_ = txt(v.get("archivo")), txt(v.get("archivoTipo")), contenido
    else:
        nombre = txt(v.get("archivo")) or actual["archivo_nombre"]
        tipo, datos_ = actual["archivo_tipo"], actual["archivo_datos"]
    con.execute("UPDATE cotizacion SET codigo=?,fecha=?,monto=?,estado=?,enlace=?,archivo_nombre=?,archivo_tipo=?,archivo_datos=? WHERE id=?",
                (txt(v["codigo"]), v["fecha"], num_o_none(v.get("monto")), v["estado"], txt(v.get("enlace")), nombre, tipo, datos_, qid))
    return {"id": qid}
