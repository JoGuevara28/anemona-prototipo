# 1. Resumen del caso

Síntesis del ERS v1.0 y de la Minuta 01 (25-09-2026), usada como base para construir el prototipo.

## Problema de negocio

Anémona Design Studio tiene unos tres años de operar y gran parte de la gestión depende de su propietaria. La información está repartida así:

| Información | Dónde está hoy |
|---|---|
| Potenciales clientes y conversaciones | WhatsApp y correo |
| Archivos de proyectos | Carpetas por cliente o proyecto |
| Materiales, productos y precios | Hojas de Excel |
| Tareas y pendientes | iPad |
| Contactos de proveedores | Teléfono, WhatsApp y notas por tipo de producto |
| Cotizaciones | Plantilla en Canva, con apoyo de ChatGPT y Claude |

**Dolor principal (minuta, tema 1):** cuesta organizar los cronogramas y mantener el seguimiento al día cuando hay varios proyectos a la vez.

## Stakeholders (partes interesadas)

| Stakeholder | Rol | Interés en el sistema |
|---|---|---|
| Gabriela Núñez Cordero | Propietaria, usuaria principal y validadora del ERS | Ver de un vistazo proyectos activos, tareas, entregables y urgencias; tener un directorio de proveedores |
| María José | Arquitecta del estudio, usuaria | Consultar y actualizar los proyectos donde participa (planos, renders) |
| Futuros integrantes | Usuarios potenciales | Contar con un plan de acción por tipo de servicio para trabajar sin depender de Gabriela |
| Clientes | Entidad registrada (no usa el sistema) | Seguimiento ordenado de su proyecto |
| Proveedores y colaboradores externos | Entidad registrada (no usa el sistema) | Ser considerados o seleccionados en proyectos |
| Equipo de desarrollo y profesor | Analistas y evaluador | Requisitos verificables y trazables |

## Alcance del prototipo

**Incluido:** las 17 funciones del ERS §3.1, a saber:

- potenciales clientes y su conversión a clientes;
- clientes y proyectos, con su clasificación por tipo y su estado;
- proveedores por categoría y catálogo de materiales;
- relaciones proyecto–proveedor y proyecto–material;
- actividades y calendario;
- búsqueda general;
- referencias de cotización;
- control de acceso.

**Agregado a partir de la minuta:**

- pantalla de inicio con lo que Gabriela quiere ver al empezar el día;
- **plan de acción por tipo de servicio**, es decir, actividades y entregables sugeridos con fechas;
- marca de **entregable** en las actividades;
- costo total de los materiales de un proyecto.

**Fuera de alcance** (ERS §1.2, §2.6 y §2.11):

- generar o calcular cotizaciones;
- producir planos y renders;
- integraciones automáticas;
- notificaciones;
- archivo de fotos y renders;
- historial de cambios;
- eliminar clientes.

## Restricciones

- El sistema **complementa** las herramientas actuales (Canva, Illustrator, Excel) y no las reemplaza.
- No se definió una tecnología definitiva (ERS §2.6). Por eso el prototipo es una aplicación web sin servidor, fácil de abrir y de evaluar.
- El ERS no fija requisitos cuantitativos de rendimiento ni de capacidad.

## Necesidad → solución en el prototipo

| Necesidad (minuta) | Cómo la atiende el prototipo |
|---|---|
| Ver proyectos activos, tareas, entregables próximos y urgencias | Pantalla **Inicio** |
| Plan de pasos y entregables por tipo de servicio | Casilla «Cargar plan de acción» al crear un proyecto |
| Fechas, responsables y calendario | Actividades con responsable y fecha, más la vista **Calendario** filtrable |
| Directorio de proveedores por categoría | **Proveedores**, con filtro por categoría y alternativas de la misma categoría |
| Saber qué materiales y proveedores tuvo cada proyecto | Pestañas Proveedores y Materiales de la ficha del proyecto |
| Pasar de potencial cliente a cliente sin duplicar datos | Botón **Convertir a cliente** |
