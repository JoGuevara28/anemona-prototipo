# 6. Plan de pruebas

## Objetivo

Comprobar de forma **objetiva y repetible** que el prototipo cumple los **criterios de aceptación** de los casos de uso CU-01 a CU-17 y los requisitos no funcionales del ERS.

Un **criterio de aceptación** es una condición verificable que debe cumplirse para dar por terminado un requisito, por ejemplo: «si falta un dato obligatorio, el sistema no guarda y señala el campo».

## Estrategia

| Tipo | Qué cubre | Cómo |
|---|---|---|
| Pruebas de aceptación automatizadas | CA de CU-01 a CU-17, flujos alternos, RNF-02 a RNF-05 | `pruebas/pruebas_aceptacion.py`, que controla un navegador real con Playwright, **en los dos modos** (servidor con base de datos y demostración) |
| Pruebas de API y base de datos | Reglas de negocio en el servidor, seguridad, restricciones de la base | `pruebas/pruebas_api.py` (unittest, sin dependencias) |
| Revisión de usabilidad | RNF-01 | Prueba con una persona del estudio (guía de demostración) |
| Validación con el cliente | Supuestos S-01 a S-12 | Reunión con Gabriela (`04-supuestos-y-decisiones.md`) |

Cada prueba automática inicia con datos de ejemplo limpios, en un navegador nuevo, para que sean independientes entre sí. En modo servidor, las pruebas levantan su propio servidor con una base de datos temporal, así que no tocan `anemona.db`. Una prueba falla si el criterio no se cumple **o** si aparece cualquier error de JavaScript.

## Cómo ejecutarlas

```bash
# API y base de datos (no requiere instalar nada)
python pruebas/pruebas_api.py

# Aceptación en navegador
pip install playwright
python -m playwright install chromium
python pruebas/pruebas_aceptacion.py            # ambos modos
python pruebas/pruebas_aceptacion.py servidor   # solo uno
```

El script de aceptación imprime el resultado de cada prueba y actualiza [`pruebas/resultados.md`](../pruebas/resultados.md).

## Casos de prueba

| Código | CU / RNF | Criterio verificado |
|---|---|---|
| PA-01 | CU-01 CA1 | Con datos válidos, el potencial cliente aparece en la lista |
| PA-02 | CU-01 CA2 | Si falta un dato obligatorio no se guarda y se señala el campo |
| PA-03 | CU-01 Alt. | Persona existente → se informa y no se duplica |
| PA-04 | CU-02 CA1-2 | Cambio de estado de seguimiento guardado y visible |
| PA-05 | CU-03 CA1-2 | La conversión conserva el contacto y la persona pasa a clientes |
| PA-06 | CU-03 CA3 | Identificación de otro cliente → no se convierte |
| PA-07 | CU-03 R1 | Cédula con formato inválido rechazada |
| PA-08 | CU-04 CA1-2 | La ficha del cliente muestra sus proyectos |
| PA-09 | CU-04 CA3 | Dos clientes con la misma identificación → rechazado |
| PA-10 | CU-05 CA1 | El proyecto aparece en la ficha del cliente |
| PA-11 | CU-05 CA2, RNF-02 | Proyecto sin cliente → rechazado |
| PA-12 | CU-06 | Cambios del proyecto guardados |
| PA-13 | CU-07 CA2 | El filtro por tipo devuelve solo ese tipo |
| PA-14 | CU-08 CA1 | El nuevo estado queda visible |
| PA-15 | CU-08 CA2 | Transición no permitida bloqueada |
| PA-16 | CU-09 | El proveedor aparece en su categoría |
| PA-17 | CU-10 | El material muestra el proveedor que lo ofrece |
| PA-18 | CU-11 | Proveedor asociado con su condición; está en más de un proyecto |
| PA-19 | CU-12, RNF-05 | Materiales consultables desde el proyecto; sin materiales también es válido |
| PA-20 | CU-13 | La actividad aparece en el proyecto y en el calendario |
| PA-21 | CU-13 Alt., RNF-04 | Sin fecha no se guarda y se conservan los valores |
| PA-22 | CU-14 CA1-3 | Cambio de fecha refleja el calendario; desde él se abre el proyecto |
| PA-23 | CU-15 CA1 | La búsqueda devuelve coincidencias |
| PA-24 | CU-15 Alt. | Sin coincidencias se informa |
| PA-25 | CU-16 | Cotización exige enlace o documento y se consulta desde el proyecto |
| PA-26 | CU-17 CA1, RNF-03 | Sin autenticación no hay datos; credenciales inválidas rechazadas |
| PA-27 | CU-17 CA2 | Rol sin permiso bloqueado e informado |
| PA-28 | RNF-05, RN-02 | Proyecto sin proveedores, materiales ni actividades |
| PA-29 | RF-16 · solo servidor | El documento adjunto se guarda en la base y se puede abrir |
| PA-30 | RNF-02, RNF-03 · solo servidor | Lo que registra una usuaria lo ve otra desde otro navegador |
| PA-31 | RF-17 · solo servidor | El servidor rechaza modificaciones del rol consulta aunque se salte la interfaz |

## Pruebas de API y base de datos (29)

| Grupo | Qué verifican |
|---|---|
| Acceso | Sin sesión → 401; contraseña incorrecta; cookie HttpOnly; rol consulta → 403; cierre de sesión; contraseñas cifradas en la base |
| Personas | Medio de contacto obligatorio; duplicados; conversión sin duplicar y exigiendo contrato; identificación única aunque cambie el formato; formato de cédula |
| Proyectos | Cliente inexistente; tipo fuera del catálogo; plan de acción; proyecto mínimo válido; transiciones (incluye estados finales); área negativa |
| Relaciones | Proveedor no repetido; cantidad > 0; precio de referencia; cotización con enlace o documento; descarga de documento; formato no permitido |
| Base de datos | Proyecto huérfano, identificación repetida y estado fuera de catálogo rechazados por la propia base |
| Servidor web | No se pueden leer archivos fuera de `prototipo/`; sirve la interfaz |

## Criterio de salida

El prototipo se considera listo para validar con el cliente cuando se cumplen dos condiciones:

- **todas** las pruebas automáticas están aprobadas;
- no hay errores de JavaScript.

Estado actual: **59/59 ejecuciones de aceptación** y **29/29 pruebas de API** aprobadas.
