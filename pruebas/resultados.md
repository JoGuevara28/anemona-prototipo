# Resultados de las pruebas de aceptación

Ejecución: 2026-11-08 12:02 · **59 de 59 ejecuciones aprobadas** (31 pruebas × modos servidor, demostración)

Generado automáticamente por `pruebas/pruebas_aceptacion.py`. Cada prueba verifica un criterio de aceptación (CA) de un caso de uso del ERS o un requisito no funcional. Las pruebas PA-29 a PA-31 verifican la base de datos y solo aplican al modo servidor.

| Código | Origen | Criterio verificado | Modo servidor | Modo demostración |
|---|---|---|---|---|
| PA-01 | CU-01 · CA1 / RF-01 | Con datos válidos, el nuevo potencial cliente aparece en la lista | ✅ Aprobada | ✅ Aprobada |
| PA-02 | CU-01 · CA2 / RF-01 | Si falta un dato obligatorio no se guarda y se señala el campo | ✅ Aprobada | ✅ Aprobada |
| PA-03 | CU-01 · Flujo alterno | Si la persona ya existe, se informa y no se crea un duplicado | ✅ Aprobada | ✅ Aprobada |
| PA-04 | CU-02 · CA1-CA2 / RF-02 | Una modificación válida del estado de seguimiento queda guardada y visible | ✅ Aprobada | ✅ Aprobada |
| PA-05 | CU-03 · CA1-CA2 / RF-03 | La conversión conserva el contacto y la persona aparece en clientes | ✅ Aprobada | ✅ Aprobada |
| PA-06 | CU-03 · CA3 / Flujo alterno | No se convierte si la identificación pertenece a otro cliente | ✅ Aprobada | ✅ Aprobada |
| PA-07 | CU-03 · Restricción 1 | La cédula debe tener un formato válido (9 dígitos) | ✅ Aprobada | ✅ Aprobada |
| PA-08 | CU-04 · CA1-CA2 / RF-04 | Un cliente puede consultarse y su ficha muestra sus proyectos | ✅ Aprobada | ✅ Aprobada |
| PA-09 | CU-04 · CA3 | No se permite registrar dos clientes con la misma identificación | ✅ Aprobada | ✅ Aprobada |
| PA-10 | CU-05 · CA1 / RF-05 | Con datos válidos el proyecto aparece en la ficha del cliente | ✅ Aprobada | ✅ Aprobada |
| PA-11 | CU-05 · CA2 / RNF-02 | No se permite guardar un proyecto sin cliente existente | ✅ Aprobada | ✅ Aprobada |
| PA-12 | CU-06 · CA1-CA2 / RF-06 | Los cambios válidos del proyecto quedan guardados | ✅ Aprobada | ✅ Aprobada |
| PA-13 | CU-07 · CA2 / RF-07 | El filtro por tipo devuelve solo proyectos de esa clasificación | ✅ Aprobada | ✅ Aprobada |
| PA-14 | CU-08 · CA1 / RF-08 | El estado seleccionado queda visible después de guardar | ✅ Aprobada | ✅ Aprobada |
| PA-15 | CU-08 · CA2 / Flujo alterno | No se aceptan transiciones fuera de las permitidas | ✅ Aprobada | ✅ Aprobada |
| PA-16 | CU-09 · CA1-CA2 / RF-09 | El proveedor registrado aparece en el listado con su categoría | ✅ Aprobada | ✅ Aprobada |
| PA-17 | CU-10 · CA1-CA2 / RF-10 | El material registrado aparece en el catálogo con su proveedor | ✅ Aprobada | ✅ Aprobada |
| PA-18 | CU-11 · CA1-CA2 / RF-11 | Los proveedores asociados aparecen en el proyecto con su condición | ✅ Aprobada | ✅ Aprobada |
| PA-19 | CU-12 · CA1-CA2 / RF-12, RNF-05 | Los materiales asociados se consultan desde el proyecto; un proyecto sin materiales es válido | ✅ Aprobada | ✅ Aprobada |
| PA-20 | CU-13 · CA1-CA2 / RF-13 | La actividad aparece en el proyecto y queda disponible para el calendario | ✅ Aprobada | ✅ Aprobada |
| PA-21 | CU-13 · Flujo alterno / RNF-04 | Sin fecha prevista no se guarda y se conservan los demás datos | ✅ Aprobada | ✅ Aprobada |
| PA-22 | CU-14 · CA1-CA3 / RF-14 | Al cambiar la fecha el calendario se actualiza y desde él se abre el proyecto | ✅ Aprobada | ✅ Aprobada |
| PA-23 | CU-15 · CA1-CA2 / RF-15 | La búsqueda devuelve registros que cumplen el criterio | ✅ Aprobada | ✅ Aprobada |
| PA-24 | CU-15 · Flujo alterno | Si no hay coincidencias se informa que no hubo resultados | ✅ Aprobada | ✅ Aprobada |
| PA-25 | CU-16 · CA1 / Flujo alterno / RF-16 | La referencia de cotización exige enlace o documento y luego se consulta desde el proyecto | ✅ Aprobada | ✅ Aprobada |
| PA-26 | CU-17 · CA1 / Flujo alterno 1 / RNF-03 | Sin autenticación no se ven datos y las credenciales inválidas se rechazan | ✅ Aprobada | ✅ Aprobada |
| PA-27 | CU-17 · CA2 / Flujo alterno 2 | Un usuario sin permiso de modificación es bloqueado e informado | ✅ Aprobada | ✅ Aprobada |
| PA-28 | RNF-05 / RN-02 | Se registra un proyecto sin proveedores, materiales ni actividades | ✅ Aprobada | ✅ Aprobada |
| PA-29 | RF-16 / IE-01 · base de datos | El documento adjunto a una cotización se guarda y se puede abrir | ✅ Aprobada | — No aplica |
| PA-30 | RNF-02 / RNF-03 · base de datos | Los datos quedan en la base: otra persona los ve al ingresar desde otro navegador | ✅ Aprobada | — No aplica |
| PA-31 | RF-17 · base de datos | El servidor rechaza modificaciones de un usuario sin permiso aunque se salte la interfaz | ✅ Aprobada | — No aplica |
