# 11. Solicitud de cambio SC-01 — Acceso de clientes (usuario externo)

Una **solicitud de cambio** documenta una modificación al alcance de un ERS que ya fue validado: qué cambia, por qué, qué secciones afecta y quién la aprueba. Sirve para que el alcance crezca de forma controlada y trazable, y no por agregados informales (*scope creep*).

| Campo | Valor |
|---|---|
| Código | SC-01 |
| Fecha | 15-11-2026 |
| Solicitado por | Equipo del proyecto (Jorge Guevara, José Gabriel Pérez) |
| ERS afectado | ERS v1.0 → propuesta v1.1 |
| Prioridad (MoSCoW) | **Should** (*debería*): aporta valor al cliente final, pero el sistema cumple su objetivo principal sin esta función |
| Estado | 🟢 **Aprobada por el equipo e implementada en el prototipo** (15-11-2026) · 🟡 pendiente de validación con Anémona |

---

## 1. Motivo

Hoy los clientes de Anémona se enteran del avance de su proyecto solo por WhatsApp o en reuniones. El equipo propone que **el cliente tenga una cuenta** con la que consulte el avance de **su propio proyecto**: estado, próximos entregables y la referencia a su cotización. Así se reducen las consultas repetidas por WhatsApp y Gabriela tiene un canal ordenado para mostrar avances.

## 2. Conflicto con el ERS v1.0

El ERS v1.0 **excluye** este cambio de forma explícita, por eso se tramita como solicitud de cambio:

| Sección | Texto actual | Conflicto |
|---|---|---|
| §2.3 Usuarios | Solo la propietaria y el personal del estudio | Falta el cliente como usuario |
| §2.9 Actores | «Los clientes y proveedores son entidades registradas, **no usuarios del sistema** en esta propuesta.» | Lo contradice directamente |
| §2.1 Diagrama de contexto | «Las relaciones sin acceso directo se gestionan por medio del personal» | El cliente pasaría a tener acceso directo |
| RF-17 / CU-17 | «El sistema permitirá el ingreso de **personal autorizado**» | El ingreso deja de ser solo del personal |

## 3. Cambios propuestos al ERS

### 3.1 §2.3 Usuarios del sistema — agregar
> **Cliente con acceso (usuario externo).** Persona registrada como cliente de Anémona a quien el estudio le crea una cuenta para consultar el avance de sus propios proyectos. No registra ni modifica información del estudio.

### 3.2 §2.9 Actores — agregar fila y reemplazar la nota

| Actor | Funciones previstas |
|---|---|
| Cliente con acceso | Consultar el estado, el avance y los entregables de sus propios proyectos, y la referencia a su cotización. |

Nota reemplazada: *«Los proveedores son entidades registradas, no usuarios del sistema. Los clientes son entidades registradas y, cuando el estudio lo habilite, pueden tener una cuenta de solo consulta sobre sus propios proyectos (RF-18, RF-19).»*

### 3.3 Requisitos funcionales nuevos

| Código | Nombre | Requisito y resultado verificable | Origen y estado |
|---|---|---|---|
| **RF-18** | Gestionar acceso de clientes | La propietaria o la arquitecta podrá crear, desactivar y reactivar la cuenta de acceso de un cliente registrado, indicando un usuario y una contraseña inicial. El sistema mostrará en la ficha del cliente si tiene acceso activo. | SC-01; propuesto |
| **RF-19** | Consultar avance del proyecto (cliente) | El cliente con acceso podrá ver, únicamente de sus propios proyectos: nombre, tipo de servicio, estado, fecha de inicio, porcentaje de avance, entregables con su fecha prevista y estado, y la referencia a sus cotizaciones. | SC-01; propuesto |

### 3.4 Requisitos no funcionales y reglas de negocio

| Código | Tipo | Texto propuesto | Por qué |
|---|---|---|---|
| **RNF-03** (modificado) | Privacidad | «Solo los usuarios autenticados podrán consultar datos de contacto y proyectos; cada usuario podrá ejecutar únicamente las acciones correspondientes a sus permisos. **Un cliente con acceso nunca podrá ver información de otros clientes, proveedores, materiales, costos ni notas internas del estudio.**» | Abrir el sistema a terceros es el mayor riesgo del cambio; el criterio debe poder verificarse con una prueba. |
| **RN-04** (nueva) | Regla de negocio | Solo una persona registrada como **cliente** (con contrato firmado) puede tener cuenta. Los potenciales clientes no tienen acceso. | Coincide con la regla de la Minuta 01: se es cliente al firmar el contrato y pagar el primer depósito. |
| **RN-05** (nueva) | Regla de negocio | La cuenta del cliente la crea el personal del estudio; no existe registro abierto. Al desactivarla, el cliente pierde el acceso de inmediato. | Mantiene el control del estudio sobre quién ve qué (RF-17). |

## 4. Casos de uso nuevos

### CU-18 — Gestionar acceso de clientes

**Precondiciones:** 1. El usuario del estudio ha ingresado al sistema. 2. El cliente existe.
**Iniciador:** Propietaria o arquitecta.
**Detalle:** Crear, desactivar o reactivar la cuenta con la que un cliente consulta sus proyectos.
**Restricciones:** 1. Solo para clientes registrados (RN-04). 2. El nombre de usuario es único. 3. La contraseña inicial tiene al menos 8 caracteres.

| Actor | Sistema |
|---|---|
| 1. Abre la ficha del cliente y selecciona «Dar acceso». | 1. Muestra el formulario con usuario y contraseña inicial. |
| 2. Ingresa los datos y guarda. | 2. Valida, crea la cuenta y muestra «Acceso activo» en la ficha. |
| 3. (Opcional) Selecciona «Desactivar acceso». | 3. Cierra las sesiones abiertas del cliente y marca el acceso como inactivo. |

**Postcondiciones:** el cliente puede o no puede ingresar, según el estado de su cuenta.
**Criterios de aceptación:**
1. Con datos válidos, la ficha del cliente muestra «Acceso activo».
2. Si el usuario ya existe o la contraseña es muy corta, no se guarda y se señala el campo (RNF-04).
3. Un cliente con acceso desactivado no puede ingresar.

**Flujo alternativo:** 1. Si la persona es un potencial cliente, la opción no está disponible (RN-04).
**Requisito relacionado:** RF-18

### CU-19 — Consultar avance del proyecto (cliente)

**Precondiciones:** 1. El cliente tiene una cuenta activa. 2. Tiene al menos un proyecto.
**Iniciador:** Cliente con acceso.
**Detalle:** Consultar el estado, el avance y los entregables de sus propios proyectos.
**Restricciones:** 1. Solo consulta, no modifica nada. 2. Solo ve sus proyectos (RNF-03). 3. No ve proveedores, materiales, costos, notas internas ni actividades que no sean entregables.

| Actor | Sistema |
|---|---|
| 1. Ingresa con su usuario y contraseña. | 1. Valida el acceso y muestra la lista de **sus** proyectos. |
| 2. Selecciona un proyecto. | 2. Muestra estado, avance, entregables (fecha y estado) y la referencia a la cotización. |
| 3. Cierra sesión. | 3. Finaliza la sesión. |

**Postcondiciones:** el cliente conoce el avance sin consultar por WhatsApp.
**Criterios de aceptación:**
1. El cliente solo ve sus propios proyectos.
2. Si intenta abrir un proyecto ajeno o una sección del estudio, el sistema lo bloquea e informa (CU-17).
3. El porcentaje de avance coincide con el que ve el estudio.

**Flujo alternativo:** 1. Si no tiene proyectos, el sistema informa que aún no hay proyectos para mostrar.
**Requisito relacionado:** RF-19

## 5. Historias de usuario

> **HU-18 — Dar acceso a un cliente.** *Como* propietaria, *quiero* crear una cuenta para un cliente *para* que consulte el avance de su proyecto sin escribirme por WhatsApp.
> - *Dado que* el cliente está registrado, *cuando* creo su cuenta con un usuario único y una contraseña de al menos 8 caracteres, *entonces* su ficha muestra «Acceso activo».
> - *Dado que* el cliente tiene acceso activo, *cuando* lo desactivo, *entonces* ya no puede ingresar.

> **HU-19 — Ver el avance de mi proyecto.** *Como* cliente de Anémona, *quiero* ver el estado y los próximos entregables de mi proyecto *para* saber cómo avanza y qué viene.
> - *Dado que* ingresé con mi cuenta, *cuando* abro el inicio, *entonces* veo solo mis proyectos con su estado y porcentaje de avance.
> - *Dado que* abro mi proyecto, *cuando* reviso los entregables, *entonces* veo cada uno con su fecha prevista y estado, sin costos ni proveedores.
> - *Dado que* escribo la dirección de otro proyecto o de una sección del estudio, *cuando* la abro, *entonces* el sistema me informa que no tengo acceso.

## 6. Cambio en la matriz de permisos

Se agrega la columna **Cliente** a [`10-roles-y-permisos.md`](10-roles-y-permisos.md). El rol *Personal interno* sigue definido en el ERS (§2.9), pero el prototipo no usa una cuenta de ejemplo para él, porque Anémona no tiene hoy personal interno además de María José.

| Función | Propietaria | Arquitecta | Cliente |
|---|---|---|---|
| Sus proyectos: estado, avance, entregables | ✅ (todos) | ✅ (todos) | 👁 solo los suyos |
| Referencia a su cotización | ✅ | ✅ | 👁 solo las suyas |
| Actividades internas, proveedores, materiales, costos | ✅ | ✅ | — |
| Potenciales clientes, otros clientes | ✅ | ✅ | — |
| Gestionar acceso de clientes (RF-18) | ✅ | ✅ | — |

## 7. Impacto

| Área | Impacto |
|---|---|
| ERS | §2.1, §2.3, §2.9, RF-17 (texto), RF-18 y RF-19 nuevos, RNF-03, RN-04, RN-05, CU-18 y CU-19 nuevos, matriz de trazabilidad |
| Base de datos | Rol `cliente`; columna `usuario.cliente_id` (FK a cliente); columna `usuario.activo` |
| Servidor | Rutas para crear y desactivar el acceso; filtro de datos para el rol cliente |
| Interfaz | Botón «Dar acceso» en la ficha del cliente; portal del cliente con su inicio y la ficha de su proyecto |
| Pruebas | Nuevas pruebas de aceptación (CU-18, CU-19) y de API (aislamiento entre clientes) |
| Riesgo | **Privacidad**: un error mostraría datos de un cliente a otro. Se mitiga filtrando en el servidor (no solo en la pantalla) y con pruebas que intenten acceder a proyectos ajenos. |

## 8. Preguntas para validar con Anémona

1. ¿Le interesa que sus clientes tengan cuenta, o prefiere seguir informando el avance por WhatsApp?
2. ¿Qué debe ver el cliente? (propuesta: estado, avance %, entregables y su cotización; no costos ni proveedores)
3. ¿El cliente debe ver la fecha de **todas** las actividades o solo de los entregables?
4. ¿María José también puede dar acceso a clientes, o solo Gabriela?

## 9. Decisiones del equipo (15-11-2026)

| Pregunta | Decisión |
|---|---|
| ¿Qué ve el cliente? | Estado, avance, entregables y sus cotizaciones. No ve actividades internas, costos ni proveedores. |
| ¿Quién da acceso? | Gabriela y María José, coherente con la minuta: María José modifica todo sin inconveniente. |
| ¿Cuenta de ejemplo de personal interno? | Se quita. El rol sigue descrito en el ERS, pero Anémona no tiene hoy personal interno además de María José. |

## 10. Aprobación

| Rol | Nombre | Decisión | Fecha |
|---|---|---|---|
| Equipo | Jorge Guevara Chavarría | Aprobada | 15-11-2026 |
| Equipo | José Gabriel Pérez Tullocks | | |
| Cliente del proyecto | Gabriela Núñez (Anémona) | *Pendiente: por ahora el prototipo lo usa solo el equipo* | |
