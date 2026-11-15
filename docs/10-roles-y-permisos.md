# 10. Roles y permisos

Este documento define qué puede ver y hacer cada usuario del prototipo. Responde al **RF-17 (Controlar acceso)** y al **CU-17**: «el sistema aplicará permisos de consulta y modificación según el rol definido».

Un **rol** es un conjunto de permisos que se asigna a un usuario. Controlar el acceso por roles se conoce como **RBAC** (*Role-Based Access Control*): los permisos se le dan al rol, no a cada persona.

## De dónde salen los roles

| Fuente | Qué dice | Cómo se aplicó |
|---|---|---|
| ERS §2.3 Usuarios | La propietaria es la principal usuaria y accede a toda la información. El personal interno consulta o registra información «de los proyectos en los que participe». | Tres roles con alcances distintos |
| ERS §2.9 Actores | **Propietaria:** consultar y administrar clientes, proyectos, proveedores, materiales y actividades. **Personal interno:** consultar proyectos y registrar o actualizar la información de los proyectos en los que participe, según permisos asignados. | Rol *Propietaria* y rol *Personal interno* |
| Minuta 01, tema 6 | Gabriela indicó que María José puede consultar y modificar la información sin inconveniente. Futuros integrantes podrían usar el sistema. | Rol *Arquitecta* con edición completa; el rol *Personal interno* se usa para futuros integrantes |
| CU-17, criterios y flujo alterno 2 | Un usuario solo ejecuta las acciones de su rol. Si intenta otra, el sistema la bloquea e informa. | Botones ocultos según el rol, pantalla «Acceso no autorizado» y respuesta 403 del servidor |

## Usuarios del prototipo

| Usuario | Contraseña | Persona | Rol |
|---|---|---|---|
| `gabriela` | `anemona2026` | Gabriela Núñez | Propietaria |
| `mariajose` | `anemona2026` | María José | Arquitecta |
| `colaborador` | `colaborador2026` | Daniel Rojas (**persona ficticia**) | Personal interno |

Daniel Rojas representa a un futuro integrante del estudio. En los datos de ejemplo tiene actividades asignadas en dos proyectos: *Mueble de TV a medida* y *Remodelación de cocina Solís*.

## Matriz de permisos

✅ permitido · 👁 solo consulta · — no disponible (no aparece en el menú)

| Función | Propietaria | Arquitecta | Personal interno | Por qué |
|---|---|---|---|---|
| Inicio | Vista general del estudio | Sus actividades primero + proyectos activos | Sus actividades y sus proyectos | Cada persona ve primero lo que le toca (minuta, tema 3: quién es responsable de cada actividad) |
| Potenciales clientes (RF-01 a RF-03) | ✅ | ✅ | — | Información comercial y de contacto de terceros (RNF-03) |
| Clientes (RF-04) | ✅ | ✅ | — | Datos personales: identificación y contacto (RNF-03) |
| Proyectos: ver (RF-06) | Todos | Todos | **Solo en los que participa** | ERS §2.9 |
| Proyectos: registrar, editar, cambiar estado (RF-05 a RF-08) | ✅ | ✅ | 👁 | ERS §2.9: el personal interno no administra proyectos |
| Actividades y calendario (RF-13, RF-14) | ✅ | ✅ | ✅ en sus proyectos | ERS §2.9: «registrar o actualizar la información de los proyectos en los que participe» |
| Cargar plan de acción | ✅ | ✅ | — | Define la planificación del proyecto |
| Proveedores y materiales del proyecto (RF-11, RF-12) | ✅ | ✅ | 👁 | Consulta para ejecutar su trabajo |
| Catálogo de proveedores y materiales (RF-09, RF-10) | ✅ | ✅ | 👁 | ERS §2.9 |
| Cotizaciones (RF-16) y Cotizador | ✅ | ✅ | — | Información comercial |
| Datos del cliente dentro de un proyecto | Nombre + enlace a la ficha | Nombre + enlace a la ficha | Solo el nombre | Necesita saber de quién es el proyecto, no sus datos de contacto |
| Restablecer datos de ejemplo (administración) | ✅ | — | — | Función de administración |

> **Pendiente de validar con Gabriela** (supuesto S-09): el ERS dice que «la definición exacta de permisos está pendiente de validación». Esta matriz es la propuesta del equipo.

## Cómo se implementa

La regla se aplica en las tres capas, para que no dependa solo de ocultar botones.

| Capa | Qué hace | Dónde |
|---|---|---|
| **Base de datos** | Tabla `rol` con los permisos de cada rol (`ve_comercial`, `edita`, `administra`, `alcance`). Cada usuario apunta a un rol. Cambiar un permiso es cambiar una fila. | `servidor/db/esquema.sql` |
| **Servidor** | Cada ruta de la API declara el permiso que exige (`ver`, `todo`, `actividad`, `admin`); si el rol no lo tiene, responde **403**. `/api/datos` solo envía lo que el rol puede ver: el personal interno no recibe potenciales clientes, cotizaciones ni datos de contacto. | `servidor/servidor.py` (`autorizado`), `servidor/logica.py` (`filtrar_por_rol`, `verificar_alcance`) |
| **Interfaz** | El menú muestra solo las secciones del rol, el inicio cambia según quién ingresa y los botones sin permiso no se muestran. Si alguien escribe la dirección de una sección ajena, ve «Acceso no autorizado». | `prototipo/js/app.js` (`puedeVer`, `can`, `canAct`, `aplicarPermisos`, `vInicio`) |

**¿Por qué no basta con ocultar botones?** Cualquiera con conocimientos básicos puede llamar a la API directamente. Por eso el servidor vuelve a verificar el permiso, y las pruebas PA-31 y `test_personal_interno_*` lo comprueban sin usar la interfaz.

## Pruebas relacionadas

| Prueba | Verifica |
|---|---|
| PA-27 | El personal interno que intenta entrar a Clientes ve «Acceso no autorizado» |
| PA-32 | Cada rol ve un menú, un inicio y opciones de administración distintos |
| PA-33 | El personal interno solo ve sus proyectos, sin contacto del cliente ni cotizaciones |
| PA-34 | El personal interno registra actividades en su proyecto, pero no cambia el proyecto ni los catálogos |
| PA-31 | El servidor rechaza (403) acciones fuera del rol y no envía datos comerciales |
| `test_personal_interno_*`, `test_solo_la_propietaria_administra` | Las mismas reglas, directamente contra la API |
