"""
Pruebas de aceptación automatizadas — Prototipo Anémona Design Studio
IC5821 Requerimientos de Software · Grupo 01

Cada prueba (PA-xx) verifica un criterio de aceptación de los casos de uso
(CU-01 a CU-17) o un requisito no funcional (RNF) del ERS v1.0.

Uso:
    pip install playwright
    python -m playwright install chromium
    python pruebas/pruebas_aceptacion.py

Genera pruebas/resultados.md con el resultado de cada prueba.
"""
import datetime
import os
import shutil
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
URL = (RAIZ / "prototipo" / "index.html").as_uri()
SALIDA = Path(__file__).resolve().parent / "resultados.md"

PRUEBAS = []


def prueba(codigo, origen, descripcion):
    def deco(fn):
        PRUEBAS.append((codigo, origen, descripcion, fn))
        return fn
    return deco


# ---------------------------------------------------------------- helpers
def entrar(pg, usuario="gabriela", clave="anemona2026"):
    pg.goto(URL)
    pg.fill("[name=u]", usuario)
    pg.fill("[name=p]", clave)
    pg.click("#loginf button")
    pg.wait_for_selector(".layout")


def ir(pg, hash_):
    pg.evaluate(f"location.hash='#{hash_}'")
    pg.wait_for_timeout(120)


def guardar(pg):
    """Envía el formulario y espera su resultado: se cierra o muestra errores."""
    pg.click(".dialog button[type=submit]")
    pg.wait_for_function(
        "() => !document.querySelector('.dialog form') || "
        "!document.querySelector('.dialog .errsum').hidden",
        timeout=5000,
    )
    pg.wait_for_timeout(80)


def hay_modal(pg):
    return pg.locator(".dialog").count() > 0


def error_de(pg, campo):
    return pg.inner_text(f".dialog .field[data-k={campo}] .ferr").strip()


def toasts(pg):
    return pg.inner_text("#toasts")


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


# ---------------------------------------------------------------- CU-01
@prueba("PA-01", "CU-01 · CA1 / RF-01", "Con datos válidos, el nuevo potencial cliente aparece en la lista")
def _(pg):
    entrar(pg); ir(pg, "potenciales")
    pg.click("button[data-act=nuevoLead]")
    pg.fill("[name=nombre]", "Valeria Prueba Uno")
    pg.fill("[name=telefono]", "8812-3456")
    pg.select_option("[name=servicio]", "Remodelación")
    guardar(pg)
    check(not hay_modal(pg), "el formulario no se cerró")
    check("Valeria Prueba Uno" in pg.inner_text("#view"), "no aparece en la lista")
    check("registrado" in toasts(pg), "no se confirmó la operación")


@prueba("PA-02", "CU-01 · CA2 / RF-01", "Si falta un dato obligatorio no se guarda y se señala el campo")
def _(pg):
    entrar(pg); ir(pg, "potenciales")
    pg.click("button[data-act=nuevoLead]")
    pg.fill("[name=nombre]", "Sin Contacto")
    guardar(pg)
    check(hay_modal(pg), "se guardó sin datos obligatorios")
    check("medio de contacto" in error_de(pg, "telefono"), "no se señaló el contacto")
    check("obligatorio" in error_de(pg, "servicio"), "no se señaló el servicio")


@prueba("PA-03", "CU-01 · Flujo alterno", "Si la persona ya existe, se informa y no se crea un duplicado")
def _(pg):
    entrar(pg); ir(pg, "potenciales")
    antes = pg.locator("tbody tr").count()
    pg.click("button[data-act=nuevoLead]")
    pg.fill("[name=nombre]", "Persona Nueva")
    pg.fill("[name=telefono]", "8890-1122")  # teléfono de Sofía Rojas (dato de ejemplo)
    pg.select_option("[name=servicio]", "Anteproyecto")
    guardar(pg)
    check("Ya existe" in error_de(pg, "nombre"), "no informó el duplicado")
    pg.keyboard.press("Escape")
    check(pg.locator("tbody tr").count() == antes, "se creó un registro duplicado")


# ---------------------------------------------------------------- CU-02
@prueba("PA-04", "CU-02 · CA1-CA2 / RF-02", "Una modificación válida del estado de seguimiento queda guardada y visible")
def _(pg):
    entrar(pg); ir(pg, "potenciales")
    pg.click("tr:has-text('Carlos Vargas')")
    pg.select_option("[name=estado]", "Reunión agendada")
    guardar(pg)
    fila = pg.inner_text("tr:has-text('Carlos Vargas')")
    check("Reunión agendada" in fila, "el estado no se actualizó en la lista")


# ---------------------------------------------------------------- CU-03
@prueba("PA-05", "CU-03 · CA1-CA2 / RF-03", "La conversión conserva el contacto y la persona aparece en clientes")
def _(pg):
    entrar(pg); ir(pg, "potenciales")
    pg.click("tr:has-text('Sofía Rojas') button[data-act=convertir]")
    pg.select_option("[name=tipoId]", "Cédula")
    pg.fill("[name=numId]", "4-0222-0333")
    pg.check("[name=contrato]")
    guardar(pg)
    vista = pg.inner_text("#view")
    check("8890-1122" in vista and "sofia.rojas@correo.com" in vista, "no conservó los datos de contacto")
    ir(pg, "clientes")
    check("Sofía Rojas" in pg.inner_text("#view"), "no aparece en clientes")
    ir(pg, "potenciales")
    check("Sofía Rojas" not in pg.inner_text("#view"), "sigue tratándose como potencial cliente")


@prueba("PA-06", "CU-03 · CA3 / Flujo alterno", "No se convierte si la identificación pertenece a otro cliente")
def _(pg):
    entrar(pg); ir(pg, "potenciales")
    pg.click("tr:has-text('Carlos Vargas') button[data-act=convertir]")
    pg.select_option("[name=tipoId]", "Cédula")
    pg.fill("[name=numId]", "112340567")  # cédula de Laura Méndez
    pg.check("[name=contrato]")
    guardar(pg)
    check("ya pertenece" in error_de(pg, "numId"), "aceptó una identificación repetida")


@prueba("PA-07", "CU-03 · Restricción 1", "La cédula debe tener un formato válido (9 dígitos)")
def _(pg):
    entrar(pg); ir(pg, "potenciales")
    pg.click("tr:has-text('Carlos Vargas') button[data-act=convertir]")
    pg.select_option("[name=tipoId]", "Cédula")
    pg.fill("[name=numId]", "12345")
    pg.check("[name=contrato]")
    guardar(pg)
    check("9 dígitos" in error_de(pg, "numId"), "aceptó una cédula inválida")


# ---------------------------------------------------------------- CU-04
@prueba("PA-08", "CU-04 · CA1-CA2 / RF-04", "Un cliente puede consultarse y su ficha muestra sus proyectos")
def _(pg):
    entrar(pg); ir(pg, "clientes")
    pg.click("tr:has-text('Laura Méndez')")
    pg.wait_for_timeout(120)
    vista = pg.inner_text("#view")
    check("Apartamento Escazú" in vista and "Mueble de TV a medida" in vista, "la ficha no muestra los proyectos")


@prueba("PA-09", "CU-04 · CA3", "No se permite registrar dos clientes con la misma identificación")
def _(pg):
    entrar(pg); ir(pg, "clientes")
    pg.click("button[data-act=nuevoCliente]")
    pg.fill("[name=nombre]", "Otro Nombre")
    pg.select_option("[name=tipoId]", "Pasaporte")
    pg.fill("[name=numId]", "P88123456")  # pasaporte de Andrew Solís
    pg.fill("[name=correo]", "otro@correo.com")
    guardar(pg)
    check("Ya existe un cliente" in error_de(pg, "numId"), "permitió identificación repetida")


# ---------------------------------------------------------------- CU-05
@prueba("PA-10", "CU-05 · CA1 / RF-05", "Con datos válidos el proyecto aparece en la ficha del cliente")
def _(pg):
    entrar(pg); ir(pg, "cliente-c2")
    pg.click("button[data-act=nuevoProyecto]")
    pg.fill("[name=nombre]", "Terraza Solís")
    pg.select_option("[name=tipo]", "Diseño de interiores")
    pg.fill("[name=descripcion]", "Diseño de terraza")
    pg.uncheck("[name=plan]")
    guardar(pg)
    ir(pg, "cliente-c2")
    check("Terraza Solís" in pg.inner_text("#view"), "no aparece en la ficha del cliente")


@prueba("PA-11", "CU-05 · CA2 / RNF-02", "No se permite guardar un proyecto sin cliente existente")
def _(pg):
    entrar(pg); ir(pg, "proyectos")
    pg.click("button[data-act=nuevoProyecto]")
    pg.fill("[name=nombre]", "Proyecto huérfano")
    pg.select_option("[name=tipo]", "Anteproyecto")
    pg.fill("[name=descripcion]", "x")
    guardar(pg)
    check("obligatorio" in error_de(pg, "clienteId"), "guardó un proyecto sin cliente")


# ---------------------------------------------------------------- CU-06
@prueba("PA-12", "CU-06 · CA1-CA2 / RF-06", "Los cambios válidos del proyecto quedan guardados")
def _(pg):
    entrar(pg); ir(pg, "proyecto-p4")
    pg.click("button[data-act=editProyecto]")
    pg.fill("[name=area]", "175")
    guardar(pg)
    check("175 m²" in pg.inner_text("#view"), "el cambio no se reflejó")


# ---------------------------------------------------------------- CU-07
@prueba("PA-13", "CU-07 · CA2 / RF-07", "El filtro por tipo devuelve solo proyectos de esa clasificación")
def _(pg):
    entrar(pg); ir(pg, "proyectos")
    pg.select_option("select[data-chg=pfTipo]", "Remodelación")
    pg.wait_for_timeout(120)
    tarjetas = pg.locator(".pcard")
    check(tarjetas.count() == 1, f"se esperaban 1 proyecto, hay {tarjetas.count()}")
    check("Remodelación de cocina" in tarjetas.first.inner_text(), "el resultado no corresponde")


# ---------------------------------------------------------------- CU-08
@prueba("PA-14", "CU-08 · CA1 / RF-08", "El estado seleccionado queda visible después de guardar")
def _(pg):
    entrar(pg); ir(pg, "proyecto-p3")
    pg.select_option("select[data-chg=estadoProy]", "En diseño")
    pg.wait_for_timeout(150)
    check("En diseño" in pg.inner_text(".estado-box"), "el estado no se actualizó")


@prueba("PA-15", "CU-08 · CA2 / Flujo alterno", "No se aceptan transiciones fuera de las permitidas")
def _(pg):
    entrar(pg); ir(pg, "proyecto-p3")  # Por iniciar
    deshab = pg.locator("select[data-chg=estadoProy] option[value='Finalizado']").get_attribute("disabled")
    check(deshab is not None, "permite pasar de 'Por iniciar' a 'Finalizado'")


# ---------------------------------------------------------------- CU-09 / CU-10
@prueba("PA-16", "CU-09 · CA1-CA2 / RF-09", "El proveedor registrado aparece en el listado con su categoría")
def _(pg):
    entrar(pg); ir(pg, "proveedores")
    pg.click("button[data-act=nuevoProv]")
    pg.fill("[name=nombre]", "Electro Hogar Prueba")
    pg.check("[name=categorias][value='Electrodomésticos']")
    pg.fill("[name=telefono]", "2200-3344")
    pg.fill("[name=ofrece]", "Hornos y cocinas")
    guardar(pg)
    ir(pg, "proveedores")
    pg.click("button[data-act=provCat][data-id='Electrodomésticos']")
    pg.wait_for_timeout(120)
    check("Electro Hogar Prueba" in pg.inner_text("#view"), "no aparece en su categoría")


@prueba("PA-17", "CU-10 · CA1-CA2 / RF-10", "El material registrado aparece en el catálogo con su proveedor")
def _(pg):
    entrar(pg); ir(pg, "materiales")
    pg.click("button[data-act=nuevoMat]")
    pg.fill("[name=nombre]", "Cinta LED cálida")
    pg.select_option("[name=categoria]", "Iluminación")
    pg.check("[name=proveedorIds][value='v1']")
    guardar(pg)
    fila = pg.inner_text("tr:has-text('Cinta LED cálida')")
    check("Luz & Forma" in fila, "no muestra el proveedor que lo ofrece")


# ---------------------------------------------------------------- CU-11 / CU-12
@prueba("PA-18", "CU-11 · CA1-CA2 / RF-11", "Los proveedores asociados aparecen en el proyecto con su condición")
def _(pg):
    entrar(pg); ir(pg, "proyecto-p2")
    pg.click("button.tab[data-id=proveedores]")
    pg.click("button[data-act=asocProv]")
    pg.check(".dialog [name=ids][value='v1']")  # v1 ya está en p1 → proveedor en más de un proyecto
    pg.select_option("[name=condicion]", "Seleccionado")
    guardar(pg)
    fila = pg.locator("tr:has-text('Luz & Forma')")
    check(fila.count() == 1, "no aparece el proveedor asociado")
    check(fila.locator("select").input_value() == "Seleccionado", "no guardó la condición")


@prueba("PA-19", "CU-12 · CA1-CA2 / RF-12, RNF-05", "Los materiales asociados se consultan desde el proyecto; un proyecto sin materiales es válido")
def _(pg):
    entrar(pg); ir(pg, "proyecto-p4")
    check("sigue siendo válido" in pg.inner_text("#view"), "proyecto sin materiales no se trata como válido")
    pg.click("button.tab[data-id=materiales]")
    pg.click("button[data-act=asocMat]")
    pg.select_option("[name=materialId]", "m2")
    pg.fill("[name=cantidad]", "20")
    guardar(pg)
    vista = pg.inner_text("#view")
    check("Porcelanato" in vista and "₡250" in vista.replace(" ", ""), "no muestra el material o su costo")


# ---------------------------------------------------------------- CU-13 / CU-14
@prueba("PA-20", "CU-13 · CA1-CA2 / RF-13", "La actividad aparece en el proyecto y queda disponible para el calendario")
def _(pg):
    entrar(pg); ir(pg, "proyecto-p4")
    pg.click("button.tab[data-id=actividades]")
    pg.click("button[data-act=nuevaAct]")
    pg.fill("[name=nombre]", "Visita al terreno de prueba")
    pg.fill("[name=fecha]", datetime.date.today().isoformat())
    guardar(pg)
    check("Visita al terreno de prueba" in pg.inner_text("#view"), "no aparece en el proyecto")
    ir(pg, "calendario")
    check(pg.locator(".ev:has-text('Visita al terreno de prueba')").count() == 1, "no aparece en el calendario")


@prueba("PA-21", "CU-13 · Flujo alterno / RNF-04", "Sin fecha prevista no se guarda y se conservan los demás datos")
def _(pg):
    entrar(pg); ir(pg, "proyecto-p4")
    pg.click("button.tab[data-id=actividades]")
    pg.click("button[data-act=nuevaAct]")
    pg.fill("[name=nombre]", "Actividad sin fecha")
    guardar(pg)
    check("obligatorio" in error_de(pg, "fecha"), "guardó sin fecha")
    check(pg.input_value("[name=nombre]") == "Actividad sin fecha", "perdió el valor ingresado")


@prueba("PA-22", "CU-14 · CA1-CA3 / RF-14", "Al cambiar la fecha el calendario se actualiza y desde él se abre el proyecto")
def _(pg):
    entrar(pg); ir(pg, "calendario")
    hoy = datetime.date.today()
    nueva = hoy.replace(day=27 if hoy.day != 27 else 26).isoformat()
    pg.locator(".ev:has-text('Registro e incorporación')").first.click()
    pg.fill("[name=fecha]", nueva)
    guardar(pg)
    celda = pg.locator(".day:not(.out)").nth(int(nueva[-2:]) - 1)
    check(celda.locator(".ev:has-text('Registro e incorporación')").count() == 1, "el calendario no se actualizó")
    celda.locator(".ev").first.click()
    pg.click(".dialog [data-goto]")
    pg.wait_for_timeout(150)
    check(pg.evaluate("location.hash") == "#proyecto-p1", "no abrió el proyecto")


# ---------------------------------------------------------------- CU-15
@prueba("PA-23", "CU-15 · CA1-CA2 / RF-15", "La búsqueda devuelve registros que cumplen el criterio")
def _(pg):
    entrar(pg)
    pg.fill(".search input", "iluminación")
    pg.press(".search input", "Enter")
    pg.wait_for_timeout(150)
    vista = pg.inner_text("#view")
    check("Luz & Forma" in vista and "Iluminarte" in vista, "no encontró los proveedores de iluminación")


@prueba("PA-24", "CU-15 · Flujo alterno", "Si no hay coincidencias se informa que no hubo resultados")
def _(pg):
    entrar(pg)
    pg.fill(".search input", "zzzz-inexistente")
    pg.press(".search input", "Enter")
    pg.wait_for_timeout(150)
    check("No se encontraron resultados" in pg.inner_text("#view"), "no informó la ausencia de resultados")


# ---------------------------------------------------------------- CU-16
@prueba("PA-25", "CU-16 · CA1 / Flujo alterno / RF-16", "La referencia de cotización exige enlace o documento y luego se consulta desde el proyecto")
def _(pg):
    entrar(pg); ir(pg, "proyecto-p3")
    pg.click("button.tab[data-id=cotizaciones]")
    pg.click("button[data-act=nuevaCot]")
    pg.fill("[name=codigo]", "COT-2026-099")
    guardar(pg)
    check("enlace o adjunte" in error_de(pg, "enlace"), "guardó sin enlace ni documento")
    pg.fill("[name=enlace]", "https://www.canva.com/design/ejemplo")
    guardar(pg)
    check("COT-2026-099" in pg.inner_text("#view"), "no aparece en el proyecto")


# ---------------------------------------------------------------- CU-17
@prueba("PA-26", "CU-17 · CA1 / Flujo alterno 1 / RNF-03", "Sin autenticación no se ven datos y las credenciales inválidas se rechazan")
def _(pg):
    pg.goto(URL + "#clientes")
    check(pg.locator(".layout").count() == 0, "muestra datos sin autenticación")
    pg.fill("[name=u]", "gabriela")
    pg.fill("[name=p]", "incorrecta")
    pg.click("#loginf button")
    check("rechazado" in pg.inner_text("#loginf .msg"), "no rechazó credenciales inválidas")


@prueba("PA-27", "CU-17 · CA2 / Flujo alterno 2", "Un usuario sin permiso de modificación es bloqueado e informado")
def _(pg):
    entrar(pg, "consulta", "consulta"); ir(pg, "clientes")
    pg.click("button[data-act=nuevoCliente]")
    pg.wait_for_timeout(100)
    check(not hay_modal(pg), "abrió el formulario de registro")
    check("no autorizada" in toasts(pg), "no informó la falta de permiso")


# ---------------------------------------------------------------- RNF
@prueba("PA-28", "RNF-05 / RN-02", "Se registra un proyecto sin proveedores, materiales ni actividades")
def _(pg):
    entrar(pg); ir(pg, "proyectos")
    pg.click("button[data-act=nuevoProyecto]")
    pg.select_option("[name=clienteId]", "c1")
    pg.fill("[name=nombre]", "Planos de bodega")
    pg.select_option("[name=tipo]", "Anteproyecto")
    pg.fill("[name=descripcion]", "Solo planos")
    pg.uncheck("[name=plan]")
    guardar(pg)
    check(not hay_modal(pg) and "Planos de bodega" in pg.inner_text("#view"), "no permitió el proyecto mínimo")


# ---------------------------------------------------------------- ejecución
def navegador(p):
    for ruta in ("/usr/bin/google-chrome", shutil.which("chromium") or "", shutil.which("chrome") or ""):
        if ruta and os.path.exists(ruta):
            return p.chromium.launch(executable_path=ruta)
    return p.chromium.launch()


def main():
    resultados = []
    with sync_playwright() as p:
        b = navegador(p)
        for codigo, origen, desc, fn in PRUEBAS:
            ctx = b.new_context(viewport={"width": 1366, "height": 900})
            pg = ctx.new_page()
            errores_js = []
            pg.on("pageerror", lambda e: errores_js.append(str(e)))
            try:
                fn(pg)
                if errores_js:
                    raise AssertionError("error de JavaScript: " + errores_js[0])
                resultados.append((codigo, origen, desc, "Aprobada", ""))
            except Exception as e:  # noqa: BLE001
                resultados.append((codigo, origen, desc, "Fallida", str(e).splitlines()[0][:160]))
            ctx.close()
        b.close()

    ok = sum(r[3] == "Aprobada" for r in resultados)
    for r in resultados:
        print(f"{'✔' if r[3] == 'Aprobada' else '✘'} {r[0]} {r[1]:38} {r[2]}" + (f"  → {r[4]}" if r[4] else ""))
    print(f"\n{ok}/{len(resultados)} pruebas aprobadas")

    fecha = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    lineas = [
        "# Resultados de las pruebas de aceptación",
        "",
        f"Ejecución: {fecha} · **{ok} de {len(resultados)} aprobadas**",
        "",
        "Generado automáticamente por `pruebas/pruebas_aceptacion.py`. Cada prueba verifica un criterio de aceptación (CA) "
        "de un caso de uso del ERS o un requisito no funcional.",
        "",
        "| Código | Origen | Criterio verificado | Resultado |",
        "|---|---|---|---|",
    ]
    for c, o, d, r, m in resultados:
        lineas.append(f"| {c} | {o} | {d} | {'✅' if r == 'Aprobada' else '❌'} {r}{(' — ' + m) if m else ''} |")
    SALIDA.write_text("\n".join(lineas) + "\n", encoding="utf-8")
    sys.exit(0 if ok == len(resultados) else 1)


if __name__ == "__main__":
    main()
