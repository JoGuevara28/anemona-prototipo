# 10. Roles y permisos

Este documento define qué puede ver y hacer cada usuario del prototipo. Responde al **RF-17 (Controlar acceso)** y al **CU-17** («el sistema aplicará permisos de consulta y modificación según el rol definido»), y a la solicitud de cambio [**SC-01**](11-solicitud-de-cambio-SC-01.md), que agrega el acceso de clientes.

Un **rol** es un conjunto de permisos que se asigna a un usuario. Controlar el acceso por roles se conoce como **RBAC** (*Role-Based Access Control*): los permisos se le dan al rol, no a cada persona.

## De dónde salen los roles

| Fuente | Qué dice | Cómo se aplicó |
|---|---|---|
| ERS §2.3 y §2.9 | La **propietaria** consulta y administra todo. El **personal interno** consulta y actualiza los proyectos en los que participa. | Rol *Propietaria*. El rol *Personal interno* queda definido, pero sin cuenta de ejemplo: hoy Anémona no tiene personal interno además de María José. |
| Minuta 01, tema 6 | María José puede consultar y modificar la información sin inconveniente. | Rol *Arquitecta* con edición completa |
| **SC-01** (aprobada por el equipo) | El **cliente** tiene una cuenta para consultar el avance de **sus propios** proyectos. | Rol *Cliente*, de solo consulta |
| CU-17, criterios y flujo alterno 2 | Un usuario solo ejecuta las acciones de su rol. Si intenta otra, el sistema la bloquea e informa. | Menú y botones según el rol, pantalla «Acceso no autorizado» y respuesta 403 del servidor |

## Usuarios del prototipo

| Usuario | Contraseña | Persona | Rol |
|---|---|---|---|
| `gabriela` | `anemona2026` | Gabriela Núñez | Propietaria |
| `mariajose` | `anemona2026` | María José | Arquitecta |
| `cliente` | `cliente2026` | Laura Méndez Quesada (**clienta ficticia**) | Cliente |

Laura tiene dos proyectos en los datos de ejemplo: *Apartamento Escazú* y *Mueble de TV a medida*. El otro cliente de ejemplo, Andrew Solís, no tiene cuenta; sirve para demostrar «Dar acceso».

## Matriz de permisos

✅ permitido · 👁 solo consulta · — no disponible (no aparece en el menú)

| Función | Propietaria | Arquitecta | Cliente | Por qué |
|---|---|---|---|---|
| Inicio | Vista general del estudio | Sus actividades primero + proyectos activos | Sus proyectos con avance y próximo entregable | Cada persona ve primero lo que le toca |
| Potenciales clientes (RF-01 a RF-03) | ✅ | ✅ | — | Información comercial de terceros (RNF-03) |
| Clientes (RF-04) | ✅ | ✅ | — | Datos personales de otros clientes (RNF-03) |
| Dar o quitar acceso a un cliente (RF-18) | ✅ | ✅ | — | Decisión del equipo en SC-01 |
| Proyectos: ver (RF-06, RF-19) | Todos | Todos | **Solo los suyos**: estado, avance, descripción | SC-01 |
| Proyectos: registrar, editar, cambiar estado (RF-05 a RF-08) | ✅ | ✅ | — | El cliente no modifica nada |
| Entregables | ✅ | ✅ | 👁 de sus proyectos | SC-01: lo que el cliente espera recibir |
| Actividades internas y calendario (RF-13, RF-14) | ✅ | ✅ | — | Organización interna del estudio |
| Proveedores, materiales y costos (RF-09 a RF-12) | ✅ | ✅ | — | Información comercial del estudio |
| Cotizaciones (RF-16) | ✅ | ✅ | 👁 solo las suyas | SC-01 |
| Cotizador | ✅ | ✅ | — | Información comercial |
| Renders 360°: ver, subir, editar, eliminar (RF-20, RF-21) | ✅ | ✅ | — | SC-02: material de trabajo del estudio |
| Búsqueda general (RF-15) | ✅ | ✅ | — | Recorre información del estudio |
| Restablecer datos de ejemplo (administración) | ✅ | — | — | Función de administración |

El **porcentaje de avance** que ve el cliente se calcula con **todas** las actividades del proyecto, para que coincida con lo que ve el estudio. Al cliente solo se le envían las actividades marcadas como entregables.

> **Pendiente de validar con Gabriela:** el ERS dice que «la definición exacta de permisos está pendiente de validación» (supuesto S-09), y la SC-01 todavía no la ha aprobado Anémona.

## Cómo se implementa

La regla se aplica en las tres capas, para que no dependa solo de ocultar botones.

| Capa | Qué hace | Dónde |
|---|---|---|
| **Base de datos** | Tabla `rol` (`ve_comercial`, `edita`, `administra`, `alcance`: `todos`, `participa` o `propios`). Las cuentas de cliente apuntan a su cliente (`usuario.cliente_id`) y tienen el campo `activo`. Una restricción `CHECK` obliga a que toda cuenta de cliente tenga cliente, y un índice único permite una sola cuenta por cliente. | `servidor/db/esquema.sql` |
| **Servidor** | Cada ruta declara el permiso que exige (`ver`, `todo`, `actividad`, `admin`) y responde **403** si el rol no lo tiene. `/api/datos` solo envía lo que el rol puede ver: al cliente, sus proyectos, entregables y cotizaciones, y nada más. Una cuenta desactivada no puede ingresar y sus sesiones se cierran. | `servidor/servidor.py` (`autorizado`), `servidor/logica.py` (`filtrar_por_rol`, `_vista_cliente`, `dar_acceso_cliente`, `cambiar_acceso_cliente`) |
| **Interfaz** | El menú muestra solo las secciones del rol, el inicio cambia según quién ingresa y los botones sin permiso no se muestran. El cliente tiene su propio portal: Inicio y Mis proyectos. | `prototipo/js/app.js` (`puedeVer`, `can`, `esCliente`, `aplicarPermisos`, `vInicioCliente`, `vProyectoCliente`, `tarjetaAcceso`) |

**¿Por qué no basta con ocultar botones?** Cualquiera con conocimientos básicos puede llamar a la API directamente. Por eso el servidor vuelve a verificar el permiso y filtra los datos antes de enviarlos.

## Pruebas relacionadas

| Prueba | Verifica |
|---|---|
| PA-27 | El cliente que intenta entrar a Clientes ve «Acceso no autorizado» |
| PA-32 | Cada rol ve un menú, un inicio y opciones de administración distintos |
| PA-33 | El cliente solo ve sus proyectos, con entregables y cotización, sin costos ni proveedores |
| PA-34 | La arquitecta da acceso a un cliente, este ve solo lo suyo y, al desactivarlo, ya no puede ingresar |
| PA-31 | El servidor rechaza (403) acciones fuera del rol y no envía al cliente datos internos ni de otros clientes |
| `test_cliente_*`, `test_dar_y_desactivar_acceso`, `test_validaciones_del_acceso`, `test_avance_*`, `test_solo_la_propietaria_administra` | Las mismas reglas, directamente contra la API y la base |
