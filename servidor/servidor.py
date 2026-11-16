"""
Servidor del prototipo Anémona Design Studio.

    python servidor/servidor.py                 → http://localhost:8000
    python servidor/servidor.py --puerto 9000
    python servidor/servidor.py --reiniciar     → borra la base y carga los datos de ejemplo

Sirve la interfaz (carpeta prototipo/) y una API REST en /api/ que guarda los
datos en SQLite (servidor/db/anemona.db). Solo usa la biblioteca estándar de
Python 3.9+, así que no hay nada que instalar.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import re
import sys
import traceback
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import logica as L  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "prototipo"
BD_POR_DEFECTO = Path(__file__).resolve().parent / "db" / "anemona.db"
MAX_CUERPO = 40 * 1024 * 1024  # un render de 25 MB ocupa ~34 MB en base64
COOKIE = "anemona_sesion"

# ------------------------------------------------------------------ rutas de la API
# (método, patrón, función, permiso requerido)
# Permisos (RF-17, CU-17 · docs/10-roles-y-permisos.md):
#   "ver"        cualquier usuario autenticado
#   "todo"       roles que editan todo (propietaria, arquitecta)
#   "actividad"  además el personal interno, solo en proyectos donde participa
#   "admin"      solo la propietaria
RUTAS: list[tuple[str, re.Pattern, object, str]] = []


def ruta(metodo: str, patron: str, permiso: str = "todo"):
    def deco(fn):
        RUTAS.append((metodo, re.compile("^" + patron + "$"), fn, permiso))
        return fn
    return deco


def autorizado(usuario: dict, permiso: str) -> bool:
    p = usuario["permisos"]
    return {"ver": True, "todo": p["edita"] == "todo", "admin": p["admin"],
            "actividad": p["edita"] in ("todo", "actividades")}[permiso]


@ruta("GET", r"/api/datos", permiso="ver")
def _datos(con, cuerpo, usuario):
    return {"datos": L.datos(con, usuario), "catalogos": L.catalogos(con)}


@ruta("POST", r"/api/potenciales")
def _(con, c, u): return L.crear_potencial(con, c)
@ruta("PUT", r"/api/potenciales/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_potencial(con, id, c)
@ruta("POST", r"/api/potenciales/(?P<id>\w+)/convertir")
def _(con, c, u, id): return L.convertir_potencial(con, id, c)

@ruta("POST", r"/api/clientes/(?P<id>\w+)/acceso")
def _(con, c, u, id): return L.dar_acceso_cliente(con, id, c)
@ruta("PUT", r"/api/clientes/(?P<id>\w+)/acceso")
def _(con, c, u, id): return L.cambiar_acceso_cliente(con, id, c)

@ruta("POST", r"/api/clientes")
def _(con, c, u): return L.crear_cliente(con, c)
@ruta("PUT", r"/api/clientes/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_cliente(con, id, c)

@ruta("POST", r"/api/proyectos")
def _(con, c, u): return L.crear_proyecto(con, c)
@ruta("PUT", r"/api/proyectos/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_proyecto(con, id, c)
@ruta("PUT", r"/api/proyectos/(?P<id>\w+)/estado")
def _(con, c, u, id): return L.cambiar_estado(con, id, c)
@ruta("POST", r"/api/proyectos/(?P<id>\w+)/plan")
def _(con, c, u, id): return L.cargar_plan(con, id)
@ruta("POST", r"/api/proyectos/(?P<id>\w+)/proveedores")
def _(con, c, u, id): return L.asociar_proveedores(con, id, c)
@ruta("POST", r"/api/proyectos/(?P<id>\w+)/materiales")
def _(con, c, u, id): return L.asociar_material(con, id, c)

@ruta("POST", r"/api/proyectos/(?P<id>\w+)/renders")
def _(con, c, u, id): return L.subir_render(con, id, c, u)
@ruta("PUT", r"/api/renders/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_render(con, id, c)
@ruta("DELETE", r"/api/renders/(?P<id>\w+)")
def _(con, c, u, id): return L.eliminar_render(con, id)

@ruta("POST", r"/api/actividades", permiso="actividad")
def _(con, c, u): return L.crear_actividad(con, c, u)
@ruta("PUT", r"/api/actividades/(?P<id>\w+)", permiso="actividad")
def _(con, c, u, id): return L.editar_actividad(con, id, c, u)

@ruta("POST", r"/api/proveedores")
def _(con, c, u): return L.crear_proveedor(con, c)
@ruta("PUT", r"/api/proveedores/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_proveedor(con, id, c)

@ruta("POST", r"/api/materiales")
def _(con, c, u): return L.crear_material(con, c)
@ruta("PUT", r"/api/materiales/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_material(con, id, c)

@ruta("PUT", r"/api/proyecto-proveedores/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_proyecto_proveedor(con, id, c)
@ruta("DELETE", r"/api/proyecto-proveedores/(?P<id>\w+)")
def _(con, c, u, id): return L.quitar_proyecto_proveedor(con, id)
@ruta("PUT", r"/api/proyecto-materiales/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_proyecto_material(con, id, c)
@ruta("DELETE", r"/api/proyecto-materiales/(?P<id>\w+)")
def _(con, c, u, id): return L.quitar_proyecto_material(con, id)

@ruta("POST", r"/api/cotizaciones")
def _(con, c, u): return L.crear_cotizacion(con, c)
@ruta("PUT", r"/api/cotizaciones/(?P<id>\w+)")
def _(con, c, u, id): return L.editar_cotizacion(con, id, c)

@ruta("POST", r"/api/reiniciar", permiso="admin")
def _(con, c, u):
    L.reiniciar_datos(con)
    return {"ok": True}


# ------------------------------------------------------------------ manejador HTTP
class Manejador(BaseHTTPRequestHandler):
    server_version = "AnemonaPrototipo/1.0"
    bd: Path = BD_POR_DEFECTO

    # -- utilidades
    def log_message(self, fmt, *args):  # registro breve en consola
        if self.path.startswith("/api/"):
            sys.stderr.write(f"[{self.log_date_time_string()}] {self.command} {self.path} → {args[1] if len(args) > 1 else ''}\n")

    def _json(self, estado: int, obj, extra_headers: dict | None = None):
        cuerpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(estado)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for k, v in (extra_headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(cuerpo)

    def _token(self):
        c = SimpleCookie(self.headers.get("Cookie", ""))
        return c[COOKIE].value if COOKIE in c else None

    def _cookie(self, valor: str, borrar=False):
        partes = [f"{COOKIE}={valor}", "Path=/", "HttpOnly", "SameSite=Strict"]
        partes.append("Max-Age=0" if borrar else f"Max-Age={int(L.DURACION_SESION.total_seconds())}")
        return {"Set-Cookie": "; ".join(partes)}

    def _cuerpo(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_CUERPO:
            raise L.ReglaError({"archivo": "La solicitud es demasiado grande."})
        if not n:
            return {}
        try:
            datos = json.loads(self.rfile.read(n).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            raise L.ReglaError({}, "JSON inválido")
        if not isinstance(datos, dict):
            raise L.ReglaError({}, "Se esperaba un objeto JSON")
        return datos

    # -- verbos
    def do_GET(self):
        self._despachar("GET")

    def do_POST(self):
        self._despachar("POST")

    def do_PUT(self):
        self._despachar("PUT")

    def do_DELETE(self):
        self._despachar("DELETE")

    # -- enrutador
    def _despachar(self, metodo):
        ruta_ = urlparse(self.path).path
        if not ruta_.startswith("/api/"):
            if metodo == "GET":
                return self._estatico(ruta_)
            return self._json(405, {"mensaje": "Método no permitido"})
        con = L.conectar(self.bd)
        try:
            self._api(con, metodo, ruta_)
        except L.ReglaError as e:
            con.rollback()
            self._json(400, {"mensaje": e.mensaje, "errores": e.errores})
        except L.NoAutenticado:
            con.rollback()
            self._json(401, {"mensaje": "Debe iniciar sesión."})
        except L.Prohibido:
            con.rollback()
            self._json(403, {"mensaje": "Acción no autorizada para su rol."})
        except L.NoEncontrado:
            con.rollback()
            self._json(404, {"mensaje": "Registro no encontrado."})
        except Exception:  # noqa: BLE001
            con.rollback()
            traceback.print_exc()
            self._json(500, {"mensaje": "Error interno del servidor."})
        finally:
            con.close()

    def _api(self, con, metodo, ruta_):
        # rutas públicas
        if ruta_ == "/api/salud":
            return self._json(200, {"ok": True, "baseDeDatos": "SQLite", "version": L.sqlite3.sqlite_version})
        if ruta_ == "/api/sesion" and metodo == "POST":
            c = self._cuerpo()
            try:
                token, u = L.iniciar_sesion(con, c.get("usuario", ""), c.get("clave", ""))
            except L.NoAutenticado as e:
                return self._json(401, {"mensaje": str(e) or "Usuario o contraseña incorrectos. Acceso rechazado."})
            return self._json(200, {"usuario": u}, self._cookie(token))
        if ruta_ == "/api/sesion" and metodo == "DELETE":
            L.cerrar_sesion(con, self._token())
            return self._json(200, {"ok": True}, self._cookie("", borrar=True))

        # rutas protegidas (RF-17, RNF-03)
        usuario = L.usuario_de_token(con, self._token())
        if not usuario:
            raise L.NoAutenticado()
        if ruta_ == "/api/sesion" and metodo == "GET":
            return self._json(200, {"usuario": usuario})
        m = re.fullmatch(r"/api/cotizaciones/(\w+)/archivo", ruta_)
        mr = re.fullmatch(r"/api/renders/(\w+)/(archivo|miniatura)", ruta_)
        if mr and metodo == "GET":
            if not autorizado(usuario, "todo"):  # SC-02: solo propietaria y arquitecta
                raise L.Prohibido()
            nombre, tipo, contenido = L.archivo_render(con, mr.group(1), mr.group(2) == "miniatura")
            return self._archivo(nombre, tipo, contenido, cache=True)
        if m and metodo == "GET":
            if not L.puede_ver_cotizacion(con, usuario, m.group(1)):
                raise L.Prohibido()
            nombre, tipo, contenido = L.archivo_cotizacion(con, m.group(1))
            self.send_response(200)
            self.send_header("Content-Type", tipo)
            self.send_header("Content-Length", str(len(contenido)))
            self.send_header("Content-Disposition", f"inline; filename*=UTF-8''{quote(nombre)}")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(contenido)
            return
        for verbo, patron, fn, permiso in RUTAS:
            coincide = patron.match(ruta_)
            if verbo == metodo and coincide:
                if not autorizado(usuario, permiso):
                    raise L.Prohibido()
                cuerpo = self._cuerpo() if metodo in ("POST", "PUT") else {}
                resultado = fn(con, cuerpo, usuario, **coincide.groupdict())
                con.commit()
                return self._json(201 if metodo == "POST" else 200, resultado)
        raise L.NoEncontrado()

    def _archivo(self, nombre, tipo, contenido, cache=False):
        self.send_response(200)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(contenido)))
        self.send_header("Content-Disposition", f"inline; filename*=UTF-8''{quote(nombre)}")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "private, max-age=3600" if cache else "no-store")
        self.end_headers()
        self.wfile.write(contenido)

    def _estatico(self, ruta_):
        if ruta_ in ("", "/"):
            ruta_ = "/index.html"
        destino = (WEB / ruta_.lstrip("/")).resolve()
        if WEB.resolve() not in destino.parents or not destino.is_file():  # evita salir de prototipo/
            self.send_error(HTTPStatus.NOT_FOUND, "No encontrado")
            return
        contenido = destino.read_bytes()
        tipo = mimetypes.guess_type(destino.name)[0] or "application/octet-stream"
        if tipo.startswith("text/") or tipo in ("application/javascript",):
            tipo += "; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(contenido)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(contenido)


def crear_servidor(host: str, puerto: int, bd: Path, reiniciar: bool = False) -> ThreadingHTTPServer:
    L.crear_bd(bd, reiniciar=reiniciar)
    manejador = type("ManejadorAnemona", (Manejador,), {"bd": bd})
    return ThreadingHTTPServer((host, puerto), manejador)


def main():
    ap = argparse.ArgumentParser(description="Servidor del prototipo Anémona Design Studio")
    ap.add_argument("--puerto", type=int, default=8000)
    ap.add_argument("--host", default="127.0.0.1", help="use 0.0.0.0 para abrirlo desde otro dispositivo de la red")
    ap.add_argument("--bd", type=Path, default=BD_POR_DEFECTO, help="ruta del archivo SQLite")
    ap.add_argument("--reiniciar", action="store_true", help="borra la base de datos y carga los datos de ejemplo")
    a = ap.parse_args()
    srv = crear_servidor(a.host, a.puerto, a.bd, a.reiniciar)
    print("\n  Anémona Design Studio · prototipo")
    print(f"  Base de datos: {a.bd}")
    print(f"  Abra en el navegador:  http://localhost:{a.puerto}\n  (Ctrl+C para detener)\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor detenido.")
        srv.server_close()


if __name__ == "__main__":
    main()
