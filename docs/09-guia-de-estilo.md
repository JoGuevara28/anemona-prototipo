# 9. Guía de estilo visual

La interfaz toma la identidad visual que Anémona Design Studio usa en su perfil de Instagram (@anemona.cr): un círculo crema con el logotipo «anemona» en negro, «design studio» en letras pequeñas y espaciadas, arcos de línea fina y fotografías de espacios en madera, piedra, blanco y tonos tierra.

**Objetivo:** que el estudio reconozca el sistema como propio y que la herramienta transmita la misma calma y orden que sus proyectos.

## Colores

| Uso | Nombre | Hex |
|---|---|---|
| Fondo general (como el círculo del logo) | Crema | `#f3eee6` |
| Barra lateral | Crema claro | `#f8f5ef` |
| Tarjetas y formularios | Papel | `#fcfaf6` |
| Texto, botones principales y elemento activo del menú (como el logotipo) | Tinta | `#1d1c1a` |
| Texto secundario | Gris cálido | `#8b8478` |
| Bordes | Línea | `#e4ddd2` |
| Acento: barras de avance, «convertir a cliente» | Madera | `#b49372` |

### Estados (tonos tierra apagados, nunca colores saturados)

| Significado | Color | Ejemplo |
|---|---|---|
| Pendiente / Por iniciar | Pizarra `#5f6e78` | Actividad pendiente |
| En diseño / categoría | Nogal `#7d5d40` | Estado «En diseño» |
| En ejecución / reunión | Terracota `#a85f45` | Estado «En ejecución» |
| En proceso / próximo | Ocre `#9a7128` | «En 4 días» |
| Completado / aceptado | Salvia `#5f7050` | Actividad completada |
| Atrasado / error | Ladrillo `#a2433a` | «Atrasada 6 d», errores de formulario |

## Tipografía

| Uso | Fuente | Estilo |
|---|---|---|
| Logotipo «anemona» y números grandes | **Quicksand** 700 | Redondeada y en minúsculas, como el logo del estudio |
| Interfaz y títulos | **Jost** 300–600 | Geométrica y limpia. Los títulos combinan peso ligero con una palabra en negrita, como en sus publicaciones («¿Qué hace **anemona**?») |
| Etiquetas pequeñas | Jost en minúsculas, con letras espaciadas | Imita «d e s i g n   s t u d i o» |

Ambas fuentes son gratuitas (Google Fonts).

## Elementos gráficos

- **Sello circular** con el logotipo, como la foto de perfil del estudio.
- **Arcos de línea fina**, el motivo de sus historias destacadas, en el logo y en el fondo de la pantalla de ingreso.
- **Círculos** para números y fechas: indicadores de Inicio y fechas de actividades.
- **Bordes redondeados** (10–18 px) y **botones tipo píldora** en el menú y los filtros, como los botones de Instagram.
- Sombras muy suaves y mucho espacio en blanco.

## Dónde se define

Todos los colores están como variables CSS al inicio de [`prototipo/css/styles.css`](../prototipo/css/styles.css). Para ajustar un tono basta con cambiar la variable.

> Pendiente de validar con Gabriela: si desea usar su archivo de logotipo original en lugar de la versión tipográfica del prototipo.
