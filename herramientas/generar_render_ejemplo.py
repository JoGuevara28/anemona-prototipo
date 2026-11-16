"""
Genera el render 360° de ejemplo del prototipo (una sala sencilla, ficticia).

Es una imagen equirectangular (proporción 2:1), el mismo formato que exportan
Enscape, V-Ray, Lumion o SketchUp como "panorama 360". Se calcula con un trazado
de rayos muy simple: para cada píxel se lanza un rayo desde el centro de la sala
y se colorea lo primero que toca (piso, paredes, ventana, sofá, mesa, lámpara).

Solo hace falta para volver a generar la imagen; el prototipo no lo usa.
Requiere numpy y Pillow:   pip install numpy pillow
Uso:                       python herramientas/generar_render_ejemplo.py
"""
import base64
import io
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ANCHO, ALTO = 2048, 1024

# Sala: x -3..3 (ancho), y 0..2.8 (alto), z -2.5..2.5 (fondo). Cámara a 1.5 m de altura.
X0, X1, Y0, Y1, Z0, Z1 = -3.0, 3.0, 0.0, 2.8, -2.5, 2.5
CAM = np.array([0.0, 1.5, 0.2])
SOL = np.array([0.35, 0.55, 0.75])  # luz que entra por la ventana (pared del frente, z = -2.5)
SOL = SOL / np.linalg.norm(SOL)


def color(hexa):
    return np.array([int(hexa[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float64) / 255.0


CREMA, CREMA_OSC, TECHO = color("#f3ece1"), color("#e6dccd"), color("#f8f5f0")
MADERA, MADERA_OSC, ARENA = color("#b98f6a"), color("#9c7452"), color("#d9cbb8")
TINTA, LINO, RATAN = color("#2b2925"), color("#cfc3b0"), color("#b08a5c")
CIELO_A, CIELO_B, VERDE = color("#cfe0ea"), color("#f3f1ea"), color("#8fa27a")


def rayos():
    u = (np.arange(ANCHO) + 0.5) / ANCHO
    v = (np.arange(ALTO) + 0.5) / ALTO
    lon = (u - 0.5) * 2 * np.pi
    lat = (0.5 - v) * np.pi
    lon, lat = np.meshgrid(lon, lat)
    d = np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), -np.cos(lat) * np.cos(lon)], axis=-1)
    return d


def caja(o, d, mn, mx):
    """Intersección rayo-caja (método de losas). Devuelve t y la normal."""
    with np.errstate(divide="ignore", invalid="ignore"):
        inv = 1.0 / d
        t1, t2 = (mn - o) * inv, (mx - o) * inv
    tmin, tmax = np.minimum(t1, t2), np.maximum(t1, t2)
    tn, tf = tmin.max(axis=-1), tmax.min(axis=-1)
    hit = (tf >= tn) & (tf > 0) & (tn > 0)
    eje = tmin.argmax(axis=-1)
    normal = np.zeros_like(d)
    signo = -np.sign(np.take_along_axis(d, eje[..., None], -1))[..., 0]
    np.put_along_axis(normal, eje[..., None], signo[..., None], -1)
    return np.where(hit, tn, np.inf), normal


def esfera(o, d, c, r):
    oc = o - c
    b = (d * oc).sum(-1)
    disc = b * b - ((oc * oc).sum() - r * r)
    t = -b - np.sqrt(np.maximum(disc, 0))
    return np.where((disc > 0) & (t > 0), t, np.inf)


def arco(a, b, a0, a1, base, alto):
    """Máscara de un arco (rectángulo con medio círculo arriba) en coordenadas de pared."""
    cx, rad = (a0 + a1) / 2, (a1 - a0) / 2
    rect = (a >= a0) & (a <= a1) & (b >= base) & (b <= alto - rad)
    semi = ((a - cx) ** 2 + (b - (alto - rad)) ** 2 <= rad ** 2) & (b > alto - rad)
    return rect | semi


def main():
    d = rayos()
    o = CAM
    # --- sala (interior de una caja): la pared más cercana en la dirección del rayo
    with np.errstate(divide="ignore", invalid="ignore"):
        tx = np.where(d[..., 0] > 0, (X1 - o[0]) / d[..., 0], (X0 - o[0]) / d[..., 0])
        ty = np.where(d[..., 1] > 0, (Y1 - o[1]) / d[..., 1], (Y0 - o[1]) / d[..., 1])
        tz = np.where(d[..., 2] > 0, (Z1 - o[2]) / d[..., 2], (Z0 - o[2]) / d[..., 2])
    ts = np.stack([tx, ty, tz], -1)
    eje = np.nanargmin(np.where(ts > 0, ts, np.inf), axis=-1)
    t_sala = np.take_along_axis(ts, eje[..., None], -1)[..., 0]
    p = o + d * t_sala[..., None]
    img = np.zeros(d.shape)
    normal = np.zeros(d.shape)

    piso = (eje == 1) & (d[..., 1] < 0)
    techo = (eje == 1) & (d[..., 1] > 0)
    frente = (eje == 2) & (d[..., 2] < 0)   # ventana
    fondo = (eje == 2) & (d[..., 2] > 0)    # sofá
    izq = (eje == 0) & (d[..., 0] < 0)      # arcos
    der = (eje == 0) & (d[..., 0] > 0)      # puerta y cuadro

    # piso de madera en tablas
    tabla = np.floor(p[..., 0] / 0.18)
    ruido = (np.sin(tabla * 12.9898) * 43758.5453) % 1
    veta = 0.04 * np.sin(p[..., 2] * 9 + tabla)
    img[piso] = (MADERA * (0.88 + 0.16 * ruido[..., None] + veta[..., None]))[piso]
    junta = (np.abs(p[..., 0] / 0.18 - np.round(p[..., 0] / 0.18)) < 0.04) & piso
    img[junta] = MADERA_OSC * 0.9
    alfombra = piso & (np.abs(p[..., 0]) < 1.25) & (p[..., 2] > 0.25) & (p[..., 2] < 1.45)
    img[alfombra] = color("#efe6d6")
    normal[piso] = [0, 1, 0]

    img[techo] = TECHO
    normal[techo] = [0, -1, 0]

    for m, base, n in ((frente, CREMA, [0, 0, 1]), (fondo, CREMA, [0, 0, -1]), (izq, CREMA_OSC, [1, 0, 0]), (der, CREMA, [-1, 0, 0])):
        img[m] = base
        normal[m] = n

    # ventana grande con marco
    vent = frente & (np.abs(p[..., 0]) < 1.7) & (p[..., 1] > 0.6) & (p[..., 1] < 2.4)
    cielo = CIELO_B + (CIELO_A - CIELO_B) * np.clip((p[..., 1] - 0.6) / 1.8, 0, 1)[..., None]
    arbol = vent & (p[..., 1] < 1.1 + 0.25 * np.sin(p[..., 0] * 3.1) + 0.1 * np.sin(p[..., 0] * 11))
    img[vent] = cielo[vent]
    img[arbol] = VERDE * (0.85 + 0.15 * np.sin(p[..., 0] * 20)[..., None])[arbol]
    marco = frente & (np.abs(p[..., 0]) < 1.75) & (p[..., 1] > 0.55) & (p[..., 1] < 2.45) & ~vent
    parteluz = vent & ((np.abs(p[..., 0]) < 0.025) | (np.abs(p[..., 1] - 1.5) < 0.02))
    img[marco | parteluz] = TINTA

    # dos arcos en la pared izquierda (el motivo de Anémona)
    a, b = p[..., 2], p[..., 1]
    for a0 in (-1.6, -0.2):
        nicho = izq & arco(a, b, a0, a0 + 1.1, 0.0, 2.3)
        borde = izq & arco(a, b, a0 - 0.05, a0 + 1.15, 0.0, 2.35) & ~nicho
        img[nicho] = ARENA * 0.95
        img[borde] = MADERA_OSC

    # puerta y cuadro en la pared derecha
    puerta = der & (p[..., 2] > 0.9) & (p[..., 2] < 1.8) & (p[..., 1] < 2.1)
    img[puerta] = MADERA * (0.9 + 0.05 * np.sin(p[..., 1] * 30))[..., None][puerta]
    cuadro = der & (np.abs(p[..., 2] + 0.8) < 0.6) & (np.abs(p[..., 1] - 1.6) < 0.4)
    img[cuadro] = TINTA
    lienzo = der & (np.abs(p[..., 2] + 0.8) < 0.55) & (np.abs(p[..., 1] - 1.6) < 0.35)
    img[lienzo] = np.where((np.hypot(p[..., 2] + 0.8, p[..., 1] - 1.55) < 0.2)[..., None], MADERA, CREMA)[lienzo]

    # --- objetos: sofá, respaldo, mesa de centro y lámpara de ratán
    t_obj = t_sala.copy()
    objetos = [
        (np.array([-1.5, 0.0, 1.65]), np.array([1.5, 0.45, 2.5]), LINO),
        (np.array([-1.5, 0.45, 2.15]), np.array([1.5, 0.95, 2.5]), LINO * 0.93),
        (np.array([-1.65, 0.0, 1.65]), np.array([-1.5, 0.62, 2.5]), LINO * 0.88),
        (np.array([1.5, 0.0, 1.65]), np.array([1.65, 0.62, 2.5]), LINO * 0.88),
        (np.array([-0.6, 0.34, 0.45]), np.array([0.6, 0.4, 1.15]), MADERA_OSC),
        (np.array([-0.55, 0.0, 0.5]), np.array([0.55, 0.34, 1.1]), MADERA * 0.8),
    ]
    for mn, mx, col in objetos:
        t, n = caja(o, d, mn, mx)
        m = t < t_obj
        t_obj = np.where(m, t, t_obj)
        img[m] = col
        normal[m] = n[m]
    t = esfera(o, d, np.array([0.0, 2.25, 0.8]), 0.22)
    m = t < t_obj
    pl = o + d * t[..., None]
    pl = np.nan_to_num(pl)
    trama = (np.sin(pl[..., 0] * 60) * np.sin(pl[..., 1] * 60) > 0)
    img[m] = (RATAN * np.where(trama, 1.0, 0.82)[..., None])[m]
    normal[m] = ((pl - np.array([0.0, 2.25, 0.8])) / 0.22)[m]
    cable = (np.abs(d[..., 0] * ((2.47 - o[1]) / np.maximum(d[..., 1], 1e-6))) < 0.006) & (d[..., 1] > 0)
    zc = o[2] + d[..., 2] * ((2.47 - o[1]) / np.maximum(d[..., 1], 1e-6))
    t_cable = (2.47 - o[1]) / np.maximum(d[..., 1], 1e-6)
    img[cable & (np.abs(zc - 0.8) < 0.02) & (t_cable < t_obj)] = TINTA
    t_obj = np.minimum(t_obj, t)

    # --- iluminación: luz de la ventana + ambiente + oscurecido suave en esquinas
    luz = np.clip((normal * SOL).sum(-1), 0, 1)
    pf = o + d * np.where(np.isfinite(t_obj), t_obj, t_sala)[..., None]
    rincon = np.minimum.reduce([pf[..., 0] - X0, X1 - pf[..., 0], pf[..., 1] - Y0, Y1 - pf[..., 1], pf[..., 2] - Z0, Z1 - pf[..., 2]])
    ao = 0.86 + 0.14 * np.clip(rincon / 0.6, 0, 1)
    brillo = (0.93 + 0.18 * luz) * ao
    brillo = np.where(vent & (t_obj >= t_sala - 1e-6), 1.08, brillo)
    out = np.clip(img * brillo[..., None], 0, 1)

    imagen = Image.fromarray((out * 255).astype(np.uint8))
    destino = RAIZ / "prototipo" / "img" / "render-ejemplo-360.jpg"
    destino.parent.mkdir(parents=True, exist_ok=True)
    imagen.save(destino, quality=82, optimize=True)
    mini = imagen.resize((512, 256), Image.LANCZOS)
    buf = io.BytesIO()
    mini.save(buf, "JPEG", quality=78)
    (RAIZ / "prototipo" / "img" / "render-ejemplo-360-mini.jpg").write_bytes(buf.getvalue())
    # versión embebida para el modo demostración (WebGL no acepta imágenes de file://)
    js = ("/* Render 360° de ejemplo (generado por herramientas/generar_render_ejemplo.py). No editar a mano. */\n"
          f"const RENDER_EJEMPLO_360='data:image/jpeg;base64,{base64.b64encode(destino.read_bytes()).decode()}';\n"
          f"const RENDER_EJEMPLO_MINI='data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}';\n")
    (RAIZ / "prototipo" / "js" / "render-ejemplo.js").write_text(js)
    print(destino, destino.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
