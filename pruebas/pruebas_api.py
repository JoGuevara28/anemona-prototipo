"""
Pruebas de la API y de la base de datos — Prototipo Anémona Design Studio

Verifican que las reglas del ERS se cumplen en el SERVIDOR, aunque alguien se
salte la interfaz, y que la base de datos protege la integridad de los datos.
Solo usan la biblioteca estándar de Python (no requieren instalar nada).

Uso:
    python pruebas/pruebas_api.py
"""
import base64
import json
import sqlite3
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "servidor"))
import logica as L  # noqa: E402
import servidor as S  # noqa: E402


class Cliente:
    """Cliente HTTP con su propia cookie de sesión (como un navegador)."""

    def __init__(self, base):
        self.base = base
        self.cookies = CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))

    def pedir(self, metodo, ruta, cuerpo=None):
        datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
        req = urllib.request.Request(self.base + ruta, data=datos, method=metodo, headers={"Content-Type": "application/json"})
        try:
            with self.op.open(req) as r:
                return r.status, r.headers, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.headers, e.read()

    def json(self, metodo, ruta, cuerpo=None):
        s, _, b = self.pedir(metodo, ruta, cuerpo)
        return s, (json.loads(b) if b else {})

    def entrar(self, usuario="gabriela", clave="anemona2026"):
        return self.json("POST", "/api/sesion", {"usuario": usuario, "clave": clave})


class PruebasAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        S.Manejador.log_message = lambda *a: None
        cls.bd = Path(tempfile.mkdtemp()) / "api.db"
        cls.srv = S.crear_servidor("127.0.0.1", 0, cls.bd, reiniciar=True)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.srv.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def setUp(self):
        con = L.conectar(self.bd)
        L.reiniciar_datos(con)
        con.close()
        self.c = Cliente(self.base)
        self.assertEqual(self.c.entrar()[0], 200)

    # ------------------------------------------------------------ acceso (RF-17, RNF-03)
    def test_sin_sesion_no_hay_datos(self):
        s, _ = Cliente(self.base).json("GET", "/api/datos")
        self.assertEqual(s, 401)

    def test_clave_incorrecta_rechazada(self):
        s, r = Cliente(self.base).entrar("gabriela", "otra")
        self.assertEqual(s, 401)
        self.assertIn("rechazado", r["mensaje"])

    def test_cookie_de_sesion_es_httponly(self):
        s, h, _ = Cliente(self.base).pedir("POST", "/api/sesion", {"usuario": "gabriela", "clave": "anemona2026"})
        self.assertEqual(s, 200)
        self.assertIn("HttpOnly", h["Set-Cookie"])
        self.assertIn("SameSite=Strict", h["Set-Cookie"])

    def test_rol_consulta_no_puede_modificar(self):
        c = Cliente(self.base)
        c.entrar("consulta", "consulta")
        self.assertEqual(c.json("GET", "/api/datos")[0], 200)
        self.assertEqual(c.json("POST", "/api/potenciales", {"nombre": "X", "telefono": "88887777", "servicio": "Anteproyecto", "estado": "Nuevo"})[0], 403)

    def test_cerrar_sesion_invalida_el_token(self):
        self.c.json("DELETE", "/api/sesion")
        self.assertEqual(self.c.json("GET", "/api/datos")[0], 401)

    def test_contrasenas_no_se_guardan_en_texto_plano(self):
        con = sqlite3.connect(self.bd)
        filas = con.execute("SELECT clave_hash FROM usuario").fetchall()
        con.close()
        self.assertTrue(all("anemona2026" not in f[0] and len(f[0]) == 64 for f in filas))

    # ------------------------------------------------------------ potenciales y clientes (RF-01..RF-04)
    def test_potencial_requiere_medio_de_contacto(self):
        s, r = self.c.json("POST", "/api/potenciales", {"nombre": "Sin Contacto", "servicio": "Anteproyecto", "estado": "Nuevo"})
        self.assertEqual(s, 400)
        self.assertIn("telefono", r["errores"])

    def test_potencial_duplicado_rechazado(self):
        s, r = self.c.json("POST", "/api/potenciales", {"nombre": "Otra", "correo": "SOFIA.ROJAS@correo.com", "servicio": "Anteproyecto", "estado": "Nuevo"})
        self.assertEqual(s, 400)
        self.assertIn("Ya existe", r["errores"]["nombre"])

    def test_conversion_conserva_contacto_y_no_duplica(self):
        s, r = self.c.json("POST", "/api/potenciales/l1/convertir", {"tipoId": "Cédula", "numId": "4-0222-0333", "contrato": True})
        self.assertEqual(s, 201)
        d = self.c.json("GET", "/api/datos")[1]["datos"]
        cli = next(c for c in d["clientes"] if c["id"] == r["id"])
        self.assertEqual((cli["telefono"], cli["correo"]), ("8890-1122", "sofia.rojas@correo.com"))
        self.assertEqual(next(l for l in d["leads"] if l["id"] == "l1")["convertidoA"], r["id"])
        self.assertEqual(self.c.json("POST", "/api/potenciales/l1/convertir", {"tipoId": "Cédula", "numId": "5-0555-0555", "contrato": True})[0], 400)

    def test_conversion_exige_contrato(self):
        s, r = self.c.json("POST", "/api/potenciales/l2/convertir", {"tipoId": "Cédula", "numId": "4-0222-0333"})
        self.assertEqual(s, 400)
        self.assertIn("contrato", r["errores"])

    def test_identificacion_unica_aunque_cambie_el_formato(self):
        s, r = self.c.json("POST", "/api/clientes", {"nombre": "Otro", "tipoId": "Cédula", "numId": "112340567", "telefono": "88880000"})
        self.assertEqual(s, 400)
        self.assertIn("numId", r["errores"])

    def test_formato_de_cedula(self):
        s, r = self.c.json("POST", "/api/clientes", {"nombre": "Otro", "tipoId": "Cédula", "numId": "123", "telefono": "88880000"})
        self.assertEqual(s, 400)
        self.assertIn("9 dígitos", r["errores"]["numId"])

    # ------------------------------------------------------------ proyectos (RF-05..RF-08, RNF-02, RNF-05)
    def test_proyecto_sin_cliente_existente_rechazado(self):
        s, r = self.c.json("POST", "/api/proyectos", {"clienteId": "noexiste", "nombre": "X", "tipo": "Anteproyecto", "descripcion": "x", "fechaInicio": "2026-12-01"})
        self.assertEqual(s, 400)
        self.assertIn("clienteId", r["errores"])

    def test_tipo_de_servicio_fuera_del_catalogo(self):
        s, r = self.c.json("POST", "/api/proyectos", {"clienteId": "c1", "nombre": "X", "tipo": "Paisajismo", "descripcion": "x", "fechaInicio": "2026-12-01"})
        self.assertEqual(s, 400)
        self.assertIn("tipo", r["errores"])

    def test_proyecto_con_plan_de_accion(self):
        s, r = self.c.json("POST", "/api/proyectos", {"clienteId": "c1", "nombre": "X", "tipo": "Mobiliario a medida", "descripcion": "x", "fechaInicio": "2026-12-01", "plan": True})
        self.assertEqual(s, 201)
        acts = [a for a in self.c.json("GET", "/api/datos")[1]["datos"]["actividades"] if a["proyectoId"] == r["id"]]
        self.assertEqual(len(acts), len(L.PLAN["Mobiliario a medida"]))
        self.assertEqual(acts[0]["fecha"], "2026-12-01")

    def test_proyecto_minimo_es_valido(self):
        s, _ = self.c.json("POST", "/api/proyectos", {"clienteId": "c2", "nombre": "Solo planos", "tipo": "Anteproyecto", "descripcion": "x", "fechaInicio": "2026-12-01"})
        self.assertEqual(s, 201)

    def test_transiciones_de_estado(self):
        self.assertEqual(self.c.json("PUT", "/api/proyectos/p3/estado", {"estado": "Finalizado"})[0], 400)
        self.assertEqual(self.c.json("PUT", "/api/proyectos/p3/estado", {"estado": "En diseño"})[0], 200)
        self.assertEqual(self.c.json("PUT", "/api/proyectos/p3/estado", {"estado": "Finalizado"})[0], 200)
        self.assertEqual(self.c.json("PUT", "/api/proyectos/p3/estado", {"estado": "En diseño"})[0], 400)  # estado final

    def test_area_negativa_rechazada(self):
        s, r = self.c.json("PUT", "/api/proyectos/p4", {"clienteId": "c2", "nombre": "X", "tipo": "Anteproyecto", "descripcion": "x", "fechaInicio": "2026-12-01", "area": "-5"})
        self.assertEqual(s, 400)
        self.assertIn("area", r["errores"])

    # ------------------------------------------------------------ relaciones y cotizaciones (RF-11, RF-12, RF-16)
    def test_proveedor_no_se_asocia_dos_veces(self):
        s, r = self.c.json("POST", "/api/proyectos/p1/proveedores", {"ids": ["v1"], "condicion": "Considerado"})
        self.assertEqual((s, r["agregados"]), (201, 0))

    def test_cantidad_de_material_debe_ser_positiva(self):
        s, r = self.c.json("POST", "/api/proyectos/p4/materiales", {"materialId": "m2", "cantidad": "0"})
        self.assertEqual(s, 400)
        self.assertIn("cantidad", r["errores"])

    def test_material_usa_precio_de_referencia(self):
        self.c.json("POST", "/api/proyectos/p4/materiales", {"materialId": "m2", "cantidad": "10"})
        mp = [x for x in self.c.json("GET", "/api/datos")[1]["datos"]["matProy"] if x["proyectoId"] == "p4"]
        self.assertEqual(mp[0]["precioUnit"], 12500)

    def test_cotizacion_requiere_enlace_o_documento(self):
        s, r = self.c.json("POST", "/api/cotizaciones", {"proyectoId": "p1", "codigo": "C", "fecha": "2026-11-08", "estado": "Enviada"})
        self.assertEqual(s, 400)
        self.assertIn("enlace", r["errores"])

    def test_cotizacion_con_documento_se_descarga(self):
        contenido = b"%PDF-1.4 documento de prueba"
        s, r = self.c.json("POST", "/api/cotizaciones", {"proyectoId": "p1", "codigo": "C", "fecha": "2026-11-08", "estado": "Enviada",
                                                        "archivo": "c.pdf", "archivoTipo": "application/pdf", "archivoDatos": base64.b64encode(contenido).decode()})
        self.assertEqual(s, 201)
        s, h, b = self.c.pedir("GET", f"/api/cotizaciones/{r['id']}/archivo")
        self.assertEqual((s, b, h["Content-Type"]), (200, contenido, "application/pdf"))

    def test_formato_de_documento_no_permitido(self):
        s, r = self.c.json("POST", "/api/cotizaciones", {"proyectoId": "p1", "codigo": "C", "fecha": "2026-11-08", "estado": "Enviada", "archivo": "virus.exe"})
        self.assertEqual(s, 400)
        self.assertIn("archivo", r["errores"])

    # ------------------------------------------------------------ integridad en la propia base de datos
    def test_bd_impide_proyecto_huerfano(self):
        con = L.conectar(self.bd)
        with self.assertRaises(sqlite3.IntegrityError):
            con.execute("INSERT INTO proyecto (id,cliente_id,nombre,tipo,descripcion,fecha_inicio,creado,actualizado) VALUES ('px','nadie','X','Anteproyecto','d','2026-01-01','x','x')")
        con.close()

    def test_bd_impide_identificacion_repetida(self):
        con = L.conectar(self.bd)
        with self.assertRaises(sqlite3.IntegrityError):
            con.execute("INSERT INTO cliente (id,nombre,tipo_id,num_id,num_id_normal,telefono,creado,actualizado) VALUES ('cx','X','Cédula','1-1234-0567','112340567','8888','x','x')")
        con.close()

    def test_bd_impide_estado_fuera_de_catalogo(self):
        con = L.conectar(self.bd)
        with self.assertRaises(sqlite3.IntegrityError):
            con.execute("UPDATE proyecto SET estado='Inventado' WHERE id='p1'")
        con.close()

    # ------------------------------------------------------------ servidor web
    def test_no_se_puede_leer_fuera_de_la_carpeta_publica(self):
        s, _, _ = Cliente(self.base).pedir("GET", "/../servidor/db/esquema.sql")
        self.assertEqual(s, 404)

    def test_sirve_la_interfaz(self):
        s, h, b = Cliente(self.base).pedir("GET", "/")
        self.assertEqual(s, 200)
        self.assertIn(b"js/app.js", b)


if __name__ == "__main__":
    unittest.main(verbosity=2)
