# 2. Matriz de trazabilidad

Una **matriz de trazabilidad** relaciona cada requisito con el lugar donde se implementó y con la prueba que demuestra que se cumple. Si un requisito no aparece en la matriz, no está cubierto. Si una pantalla no tiene requisito asociado, sería alcance no pedido.

Las pruebas `PA-xx` están en [`pruebas/pruebas_aceptacion.py`](../pruebas/pruebas_aceptacion.py) y su último resultado en [`pruebas/resultados.md`](../pruebas/resultados.md). En el prototipo, cada pantalla y formulario muestra su código RF (se puede ocultar con «Mostrar trazabilidad»).

## Requisitos funcionales

| RF | Requisito | CU | Dónde se implementa (pantalla / función en `app.js`) | Prueba |
|---|---|---|---|---|
| RF-01 | Registrar potencial cliente | CU-01 | Potenciales clientes → «Registrar» · `formLead`, `personaDuplicada` | PA-01, PA-02, PA-03 |
| RF-02 | Actualizar y consultar potenciales clientes | CU-02 | Potenciales clientes → clic en fila, filtros por estado · `formLead` | PA-04 |
| RF-03 | Convertir potencial cliente en cliente | CU-03 | Botón «Convertir a cliente» · `formConvertir`, `idCheck`, `idDuplicado` | PA-05, PA-06, PA-07 |
| RF-04 | Gestionar clientes | CU-04 | Clientes → ficha con proyectos · `formCliente`, `vCliente` | PA-08, PA-09 |
| RF-05 | Registrar proyecto | CU-05 | «Nuevo proyecto» · `formProyecto` | PA-10, PA-11 |
| RF-06 | Actualizar y consultar proyecto | CU-06 | Ficha del proyecto → Resumen → Editar · `vProyecto` | PA-12 |
| RF-07 | Clasificar proyectos | CU-07 | Campo «Tipo de servicio» y filtro por tipo · `TIPOS`, `vProyectos` | PA-13 |
| RF-08 | Cambiar estado de proyecto | CU-08 | Selector de estado en la ficha · `TRANS`, `CHG.estadoProy` | PA-14, PA-15 |
| RF-09 | Gestionar proveedores | CU-09 | Proveedores → categorías, ficha y alternativas · `formProv`, `vProveedor` | PA-16 |
| RF-10 | Gestionar materiales y productos | CU-10 | Materiales → catálogo · `formMat` | PA-17 |
| RF-11 | Relacionar proveedores y proyectos | CU-11 | Ficha del proyecto → Proveedores · `formAsocProv` | PA-18 |
| RF-12 | Relacionar materiales y proyectos | CU-12 | Ficha del proyecto → Materiales · `formMatProy` | PA-19 |
| RF-13 | Registrar actividades | CU-13 | Ficha del proyecto → Actividades, plan de acción · `formAct`, `PLAN` | PA-20, PA-21 |
| RF-14 | Actualizar actividades y calendario | CU-14 | Calendario mensual · `vCalendario`, `formAct` | PA-22 |
| RF-15 | Consultar información relacionada | CU-15 | Barra de búsqueda y fichas con relaciones · `vBuscar` | PA-23, PA-24 |
| RF-16 | Registrar referencia a cotización | CU-16 | Ficha del proyecto → Cotizaciones · `formCot` | PA-25 |
| RF-17 | Controlar acceso | CU-17 | Pantalla de ingreso y permisos por rol · `USERS`, `needEdit` | PA-26, PA-27 |

## Requisitos no funcionales

| RNF | Categoría | Cómo se cumple | Prueba |
|---|---|---|---|
| RNF-01 | Usabilidad | Campos obligatorios marcados con «*», ayudas bajo cada campo, mensajes de confirmación y lenguaje del estudio. **Requiere una revisión con una persona del estudio** (ver guía de demostración §6). | Revisión manual con Gabriela o María José |
| RNF-02 | Integridad | El cliente es obligatorio y se verifica que exista. Si no hay clientes, se ofrece registrarlo primero. | PA-11 |
| RNF-03 | Privacidad | Todo requiere ingreso, y el rol «consulta» no puede modificar. | PA-26, PA-27 |
| RNF-04 | Recuperación | Ante un error, el formulario conserva los valores, marca el campo y muestra un resumen. | PA-02, PA-21 |
| RNF-05 | Adaptabilidad | Proveedores, materiales y actividades son opcionales. «Anteproyecto casa de playa» es el ejemplo. | PA-19, PA-28 |

## Reglas de negocio e interfaces externas

| Código | Enunciado | Implementación | Prueba |
|---|---|---|---|
| RN-01 | Cada proyecto se vincula con un cliente registrado; un cliente puede tener varios | `clienteId` obligatorio; ficha del cliente lista sus proyectos | PA-08, PA-11 |
| RN-02 | Un proyecto puede existir sin proveedores ni materiales; un proveedor puede estar en varios proyectos | Asociaciones opcionales; Luz & Forma está en dos proyectos | PA-18, PA-28 |
| RN-03 | Los proyectos usan los tipos y estados definidos | Catálogos `TIPOS` y `ESTADOS` y transiciones `TRANS` | PA-13, PA-15 |
| IE-01 | Documentos externos se asocian manualmente | Enlace o nombre de archivo en la cotización | PA-25 |

## Necesidades de la minuta → funcionalidad

| Necesidad (Minuta 01) | Funcionalidad | RF |
|---|---|---|
| Ver al iniciar el día proyectos activos, tareas, entregables y urgencias | Pantalla Inicio | RF-06, RF-13, RF-14 |
| Plan de pasos y entregables por tipo de servicio | Plan de acción | RF-13 |
| Responsables por actividad | Campo Responsable y filtro en el calendario | RF-13, RF-14 |
| Calendario | Vista Calendario | RF-14 |
| Directorio de proveedores por categoría | Proveedores | RF-09 |
| Cliente = contrato firmado + primer depósito | Confirmación obligatoria al convertir | RF-03 |
