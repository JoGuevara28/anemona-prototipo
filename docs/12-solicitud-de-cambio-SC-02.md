# 12. Solicitud de cambio SC-02 — Renders 360° del proyecto

| Campo | Valor |
|---|---|
| Código | SC-02 |
| Fecha | 15-11-2026 |
| Solicitado por | Equipo del proyecto (Jorge Guevara, José Gabriel Pérez) |
| ERS afectado | ERS v1.0 → propuesta v1.1 |
| Origen | **Minuta 01, tema 5**: «posibilidad futura de contar con un espacio asociado a cada proyecto donde puedan almacenarse o consultarse fotografías y renders». En las funciones para etapas posteriores aparece «Almacenamiento de renders». |
| Prioridad (MoSCoW) | **Could** (*podría*): útil para presentar y revisar, pero no es parte del núcleo de seguimiento |
| Estado | 🟢 **Aprobada por el equipo e implementada en el prototipo** (15-11-2026) · 🟡 pendiente de validación con Anémona |

---

## 1. Motivo

Gabriela y María José producen renders en herramientas especializadas (SketchUp, Enscape, Lumion, V-Ray) y los comparten por WhatsApp o carpetas. Se propone que cada proyecto tenga un espacio de **renders 360°** que se puedan **ver y girar dentro del sistema**: arrastrar a los lados y arriba-abajo, como si uno estuviera dentro del espacio diseñado.

## 2. Relación con el ERS v1.0

| Sección | Texto actual | Cómo encaja el cambio |
|---|---|---|
| §2.11 | «La **producción** de planos o renders queda fuera del alcance inicial.» | El sistema **no produce** renders: solo **guarda y muestra** los que se exportan desde otras herramientas. |
| §2.6 | «El sistema no pretende sustituir las herramientas utilizadas actualmente para elaboración de planos, renders…» | Se respeta: el render se sigue haciendo en la herramienta del estudio. |
| §2.10 | «Los datos de planos, renders y cotizaciones producidos con herramientas externas se registrarían por medio de referencias o documentos asociados.» | El cambio amplía esa idea: además de guardar el archivo, se puede **visualizar** de forma interactiva. |

## 3. Decisión de diseño: render 360° (no modelo 3D)

| Opción | Descripción | Decisión |
|---|---|---|
| **A. Render 360°** | Imagen panorámica (equirectangular, proporción 2:1) exportada desde Enscape, V-Ray, Lumion o SketchUp. Se mira alrededor arrastrando. | ✅ **Elegida.** Es la más usada en diseño de interiores, funciona sin librerías externas y se puede probar por completo. |
| B. Modelo 3D (`.glb`) | El objeto 3D se gira como una maqueta. | Descartada por ahora: requiere una librería externa y archivos más pesados y propensos a errores. |

**Condición para el usuario:** el render debe exportarse en formato **360° / panorama**, una imagen el doble de ancha que de alta (por ejemplo 4096 × 2048 u 8192 × 4096). Una foto o un render normal se rechaza con un mensaje que explica cómo exportarlo.

## 4. Requisitos nuevos

| Código | Nombre | Requisito y resultado verificable |
|---|---|---|
| **RF-20** | Gestionar renders del proyecto | La propietaria o la arquitecta podrá subir un render 360° a un proyecto (título, descripción opcional y archivo), editar su título y descripción, y eliminarlo con confirmación. El render aparecerá en la galería del proyecto y en la sección «Renders», con su título, su proyecto, quién lo subió y la fecha. |
| **RF-21** | Visualizar render 360° | Al abrir un render, el usuario podrá girar la vista **horizontalmente** (360°) y **verticalmente** (hasta casi el techo y el piso) arrastrando con el mouse o el dedo, o con las flechas del teclado. También podrá acercar o alejar con la rueda o los botones, volver a la vista inicial y verlo en pantalla completa. |

| Código | Tipo | Criterio verificable |
|---|---|---|
| **RNF-06** | Rendimiento | Un render de hasta 25 MB se muestra en menos de 5 segundos en la red del estudio. |
| **RNF-07** | Compatibilidad | El visor funciona en las versiones actuales de Chrome, Edge, Safari y Firefox. Si el navegador no puede mostrarlo (sin WebGL), informa al usuario. Si la imagen supera el tamaño que admite el dispositivo, se reduce automáticamente para mostrarla. |
| **RN-06** | Regla de negocio | Solo se aceptan imágenes **JPG o PNG**, de hasta **25 MB**, con proporción **2:1** (±2 %). El servidor verifica el contenido real del archivo, no solo su extensión. |

## 5. Casos de uso

### CU-20 — Gestionar renders del proyecto

**Precondiciones:** 1. La propietaria o la arquitecta ha ingresado. 2. El proyecto existe.
**Iniciador:** Propietaria o arquitecta.

| Actor | Sistema |
|---|---|
| 1. En la pestaña «Renders» del proyecto, o en la sección «Renders», selecciona «Subir render». | 1. Muestra el formulario: proyecto, título, descripción y archivo. |
| 2. Completa los datos y guarda. | 2. Verifica formato, tamaño y proporción 2:1, guarda el render y una miniatura, y lo muestra en la galería. |
| 3. (Opcional) Edita el título o elimina el render. | 3. Guarda el cambio o lo elimina después de confirmar. |

**Criterios de aceptación:**
1. Con un render 360° válido, aparece en la galería del proyecto y en la sección «Renders».
2. Si el archivo no es JPG o PNG, pesa más de 25 MB o no tiene proporción 2:1, no se guarda: se señala el campo con el motivo y se conservan los demás datos (RNF-04).
3. Al eliminar un render, el sistema pide confirmación.

**Requisito relacionado:** RF-20

### CU-21 — Visualizar render 360°

**Precondiciones:** 1. Existe un render en el proyecto.
**Iniciador:** Propietaria o arquitecta.

| Actor | Sistema |
|---|---|
| 1. Selecciona un render de la galería. | 1. Abre el visor mirando al centro de la imagen. |
| 2. Arrastra a los lados o arriba-abajo (o usa las flechas). | 2. Gira la vista en esa dirección. |
| 3. Usa la rueda, «+» o «−». | 3. Acerca o aleja la vista. |
| 4. Selecciona «Restablecer» o «Pantalla completa». | 4. Vuelve a la vista inicial o la amplía a toda la pantalla. |

**Criterios de aceptación:**
1. Al arrastrar horizontalmente, la vista gira 360° sin cortes.
2. Al arrastrar verticalmente, la vista sube o baja hasta un límite cercano al techo o al piso, sin voltearse.
3. «Restablecer» devuelve la vista a la posición inicial.

**Flujo alternativo:** 1. Si el navegador no admite WebGL, el sistema lo informa.
**Requisito relacionado:** RF-21

## 6. Historias de usuario

> **HU-20 — Subir un render 360°.** *Como* arquitecta, *quiero* subir el render 360° de un proyecto *para* tenerlo junto a la información del proyecto y no perderlo en WhatsApp.
> - *Dado que* estoy en un proyecto, *cuando* subo un JPG 360° de menos de 25 MB, *entonces* aparece en la galería con su miniatura.
> - *Dado que* subo una foto normal (no 2:1), *cuando* intento guardar, *entonces* el sistema me explica que debe exportarse como 360° y conserva el título que escribí.

> **HU-21 — Girar el render.** *Como* propietaria, *quiero* mirar alrededor del render arrastrándolo *para* revisar el diseño como si estuviera en el espacio.
> - *Dado que* abrí un render, *cuando* arrastro hacia la izquierda, *entonces* la vista gira hacia la derecha del espacio, como al voltear la cabeza.
> - *Dado que* giré la vista, *cuando* pulso «Restablecer», *entonces* vuelvo a la vista inicial.

## 7. Permisos

| Función | Propietaria | Arquitecta | Cliente |
|---|---|---|---|
| Ver renders (sección y pestaña) | ✅ | ✅ | — |
| Subir, editar y eliminar renders | ✅ | ✅ | — |

El cliente no ve los renders. Si se quiere que vea los de su proyecto, se tramita en otra solicitud de cambio.

## 8. Impacto

| Área | Cambio |
|---|---|
| ERS | §2.10, RF-20, RF-21, RNF-06, RNF-07, RN-06, CU-20, CU-21 y la matriz de trazabilidad |
| Base de datos | Tabla `render` (esquema v4): archivo y miniatura como BLOB, dimensiones, quién lo subió |
| Servidor | Rutas para subir, editar, eliminar y descargar; validación del contenido real (cabeceras JPG/PNG), tamaño y proporción |
| Interfaz | Sección «Renders», pestaña en el proyecto y visor 360° con WebGL (sin librerías externas) |
| Pruebas | Aceptación: subir, rechazar, girar y permisos. API: validaciones y permisos. |

## 9. Preguntas para validar con Anémona

1. ¿En qué programa exportan sus renders y pueden exportarlos en 360°?
2. ¿Les sirve ver renders normales (no 360°) en la misma galería, aunque no se puedan girar?
3. ¿Quieren que el cliente vea los renders de su proyecto en su portal?

## 10. Aprobación

| Rol | Nombre | Decisión | Fecha |
|---|---|---|---|
| Equipo | Jorge Guevara Chavarría | Aprobada | 15-11-2026 |
| Equipo | José Gabriel Pérez Tullocks | | |
| Cliente del proyecto | Gabriela Núñez (Anémona) | *Pendiente* | |
