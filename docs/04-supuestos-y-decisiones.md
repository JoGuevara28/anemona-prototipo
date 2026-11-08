# 4. Supuestos y decisiones por validar con Anémona

El ERS deja algunas definiciones abiertas, como «estados permitidos», «reglas de transición» o «catálogo definido». Para que el prototipo funcione, el equipo tomó las decisiones de esta tabla. **Ninguna está confirmada por la empresa.** Corresponde al punto pendiente 6 de la Minuta 01: «validar posteriormente con Anémona los requerimientos actualizados y el prototipo propuesto».

## Tabla de supuestos

| # | Tema | Decisión tomada en el prototipo | Origen en el ERS | Pregunta para Gabriela | Estado |
|---|---|---|---|---|---|
| S-01 | Estados del proyecto | Por iniciar, En diseño, En ejecución, En pausa, Finalizado y Cancelado | CU-08, RN-03 | ¿Estos estados reflejan cómo avanza un proyecto? ¿Falta alguno, por ejemplo «En revisión con el cliente»? | Pendiente |
| S-02 | Transiciones de estado | Ver diagrama en `03-modelo-de-datos.md`; Finalizado y Cancelado son finales | CU-08, restricción 2 | ¿Un proyecto finalizado puede reabrirse? | Pendiente |
| S-03 | Estados de seguimiento de potenciales clientes | Nuevo, Contactado, Reunión agendada, Cotización enviada, No continuó | CU-02, restricción 1 | ¿Son las etapas reales antes de firmar el contrato? | Pendiente |
| S-04 | Plan de acción por tipo de servicio | Actividades y plazos sugeridos por tipo; se pueden editar | Minuta tema 3, pendiente 1 | ¿Cuáles son los pasos y entregables reales de cada servicio y cuánto tarda cada uno? | **Prioritario** |
| S-05 | Formato de cédula | 9 dígitos (cédula física de Costa Rica) | CU-03, restricción 1 | ¿Hay clientes con cédula jurídica (10 dígitos) o DIMEX? | Pendiente |
| S-06 | Formato de pasaporte | 6 a 20 letras o números | CU-03, restricción 1 | — | Pendiente |
| S-07 | Detección de duplicados | Misma persona si coincide el nombre, el teléfono o el correo | CU-01, flujo alterno | ¿Dos personas distintas podrían compartir un teléfono, por ejemplo una pareja? | Pendiente |
| S-08 | Conversión a cliente | Se confirma con una casilla «contrato firmado y primer depósito» | Minuta tema 2 | ¿Se debe registrar la fecha del contrato o el monto del depósito? | Pendiente |
| S-09 | Roles y permisos | Gabriela y María José con los mismos permisos; el rol «consulta» solo es demostrativo | Minuta tema 6, RF-17 | ¿Un futuro integrante tendría permisos limitados? | Pendiente |
| S-10 | Datos obligatorios del proveedor | Nombre, al menos una categoría, teléfono y lo que ofrece | CU-09, flujo alterno | ¿Qué datos son indispensables? | Pendiente |
| S-11 | Datos de la cotización | Código, fecha, estado y un enlace o documento; el monto es opcional | CU-16 | ¿Le sirve registrar el monto y si fue aceptada? | Pendiente |
| S-12 | Precio en proyecto | El precio unitario se copia del catálogo y puede cambiarse por proyecto | Minuta tema 4 | ¿Necesita conservar el precio histórico por proyecto? (el prototipo ya lo hace) | Pendiente |

## Decisiones técnicas (no requieren validación del cliente)

| Decisión | Motivo |
|---|---|
| Aplicación web: HTML, CSS y JavaScript en la interfaz; Python en el servidor | El ERS §2.6 no define tecnología. Una aplicación web funciona en cualquier computadora del estudio sin instalar programas. |
| Base de datos **SQLite** | Es un solo archivo, viene incluida en Python y basta para un estudio de 2–3 personas. El esquema SQL es estándar y se puede migrar a PostgreSQL si el sistema crece. |
| Servidor solo con la biblioteca estándar de Python | Nadie del equipo ni del estudio tiene que instalar dependencias para ejecutarlo. |
| Reglas validadas en interfaz, servidor y base de datos | La interfaz da respuesta inmediata, el servidor impide saltarse las reglas y la base garantiza la integridad (RNF-02). |
| Catálogos (estados, transiciones, tipos, plan de acción) guardados como tablas | Cuando Gabriela valide los supuestos S-01 a S-04, los cambios se hacen en datos y no en código. |
| Modo demostración sin servidor | Permite compartir un enlace para mirar el prototipo sin instalar nada. |
| Etiquetas RF visibles en la interfaz | Facilitan la revisión académica de la trazabilidad. Se pueden ocultar. |
| Pruebas de aceptación automatizadas | Demuestran objetivamente que se cumplen los criterios de aceptación del ERS. |

## Registro de validación

Llenar esta tabla después de la reunión de validación:

| Fecha | Medio | Participantes | Supuestos validados | Cambios solicitados |
|---|---|---|---|---|
| | | | | |
