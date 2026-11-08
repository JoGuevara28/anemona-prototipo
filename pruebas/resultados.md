# Resultados de las pruebas de aceptación

Ejecución: 2026-11-08 09:40 · **28 de 28 aprobadas**

Generado automáticamente por `pruebas/pruebas_aceptacion.py`. Cada prueba verifica un criterio de aceptación (CA) de un caso de uso del ERS o un requisito no funcional.

| Código | Origen | Criterio verificado | Resultado |
|---|---|---|---|
| PA-01 | CU-01 · CA1 / RF-01 | Con datos válidos, el nuevo potencial cliente aparece en la lista | ✅ Aprobada |
| PA-02 | CU-01 · CA2 / RF-01 | Si falta un dato obligatorio no se guarda y se señala el campo | ✅ Aprobada |
| PA-03 | CU-01 · Flujo alterno | Si la persona ya existe, se informa y no se crea un duplicado | ✅ Aprobada |
| PA-04 | CU-02 · CA1-CA2 / RF-02 | Una modificación válida del estado de seguimiento queda guardada y visible | ✅ Aprobada |
| PA-05 | CU-03 · CA1-CA2 / RF-03 | La conversión conserva el contacto y la persona aparece en clientes | ✅ Aprobada |
| PA-06 | CU-03 · CA3 / Flujo alterno | No se convierte si la identificación pertenece a otro cliente | ✅ Aprobada |
| PA-07 | CU-03 · Restricción 1 | La cédula debe tener un formato válido (9 dígitos) | ✅ Aprobada |
| PA-08 | CU-04 · CA1-CA2 / RF-04 | Un cliente puede consultarse y su ficha muestra sus proyectos | ✅ Aprobada |
| PA-09 | CU-04 · CA3 | No se permite registrar dos clientes con la misma identificación | ✅ Aprobada |
| PA-10 | CU-05 · CA1 / RF-05 | Con datos válidos el proyecto aparece en la ficha del cliente | ✅ Aprobada |
| PA-11 | CU-05 · CA2 / RNF-02 | No se permite guardar un proyecto sin cliente existente | ✅ Aprobada |
| PA-12 | CU-06 · CA1-CA2 / RF-06 | Los cambios válidos del proyecto quedan guardados | ✅ Aprobada |
| PA-13 | CU-07 · CA2 / RF-07 | El filtro por tipo devuelve solo proyectos de esa clasificación | ✅ Aprobada |
| PA-14 | CU-08 · CA1 / RF-08 | El estado seleccionado queda visible después de guardar | ✅ Aprobada |
| PA-15 | CU-08 · CA2 / Flujo alterno | No se aceptan transiciones fuera de las permitidas | ✅ Aprobada |
| PA-16 | CU-09 · CA1-CA2 / RF-09 | El proveedor registrado aparece en el listado con su categoría | ✅ Aprobada |
| PA-17 | CU-10 · CA1-CA2 / RF-10 | El material registrado aparece en el catálogo con su proveedor | ✅ Aprobada |
| PA-18 | CU-11 · CA1-CA2 / RF-11 | Los proveedores asociados aparecen en el proyecto con su condición | ✅ Aprobada |
| PA-19 | CU-12 · CA1-CA2 / RF-12, RNF-05 | Los materiales asociados se consultan desde el proyecto; un proyecto sin materiales es válido | ✅ Aprobada |
| PA-20 | CU-13 · CA1-CA2 / RF-13 | La actividad aparece en el proyecto y queda disponible para el calendario | ✅ Aprobada |
| PA-21 | CU-13 · Flujo alterno / RNF-04 | Sin fecha prevista no se guarda y se conservan los demás datos | ✅ Aprobada |
| PA-22 | CU-14 · CA1-CA3 / RF-14 | Al cambiar la fecha el calendario se actualiza y desde él se abre el proyecto | ✅ Aprobada |
| PA-23 | CU-15 · CA1-CA2 / RF-15 | La búsqueda devuelve registros que cumplen el criterio | ✅ Aprobada |
| PA-24 | CU-15 · Flujo alterno | Si no hay coincidencias se informa que no hubo resultados | ✅ Aprobada |
| PA-25 | CU-16 · CA1 / Flujo alterno / RF-16 | La referencia de cotización exige enlace o documento y luego se consulta desde el proyecto | ✅ Aprobada |
| PA-26 | CU-17 · CA1 / Flujo alterno 1 / RNF-03 | Sin autenticación no se ven datos y las credenciales inválidas se rechazan | ✅ Aprobada |
| PA-27 | CU-17 · CA2 / Flujo alterno 2 | Un usuario sin permiso de modificación es bloqueado e informado | ✅ Aprobada |
| PA-28 | RNF-05 / RN-02 | Se registra un proyecto sin proveedores, materiales ni actividades | ✅ Aprobada |
