# 7. Plan de trabajo

## Estado general

| Fase | Entregable | Estado |
|---|---|---|
| 1. Elicitación | Minuta 01 con Anémona | ✅ Hecho |
| 2. Especificación | ERS v1.0 validado (entregado aparte) | ✅ Hecho |
| 3. Prototipo | Interfaz (`prototipo/`) que cubre RF-01 a RF-17 | ✅ Hecho |
| 3b. Base de datos | Servidor Python + SQLite con API REST, sesiones y reglas en el servidor (`servidor/`) | ✅ Hecho |
| 3c. Identidad visual | Interfaz con el estilo de Anémona (`docs/09-guia-de-estilo.md`) | ✅ Hecho |
| 4. Verificación | Pruebas de aceptación (dos modos) y de API y base de datos | ✅ 59/59 y 29/29 |
| 5. Documentación | Trazabilidad, modelo de datos, arquitectura, supuestos, guía de demo, plan de pruebas | ✅ Hecho |
| 6. Validación | Reunión con Gabriela: supuestos S-01 a S-12 y prueba de usabilidad (RNF-01) | ⏸ Más adelante (por ahora el prototipo solo lo usa el equipo) |
| 7. Ajustes | Cambios solicitados en la validación y actualización del ERS (v1.1) | ⏳ Pendiente |
| 8. Presentación | Demo en clase siguiendo `05-guia-de-demostracion.md` | ⏳ Pendiente |

## Reparto entre integrantes

Cada integrante es responsable de conocer a fondo sus módulos, presentarlos y validarlos con el cliente.

| Integrante | Módulos | Requisitos | Casos de uso |
|---|---|---|---|
| **Jorge Guevara Chavarría** | Acceso y seguridad, potenciales clientes, clientes, búsqueda, inicio, servidor y API | RF-01 a RF-04, RF-15, RF-17 · RNF-03, RNF-04 | CU-01 a CU-04, CU-15, CU-17 |
| **José Gabriel Pérez Tullocks** | Proyectos, actividades y calendario, proveedores, materiales, cotizaciones, modelo de base de datos | RF-05 a RF-14, RF-16 · RNF-02, RNF-05 | CU-05 a CU-14, CU-16 |

## Pendientes

- [ ] Revisar juntos el prototipo completo con la guía de demostración.
- [ ] Cada integrante corre el prototipo en su computadora (`python servidor/servidor.py`) y recorre sus módulos.
- [ ] Mientras no haya validación con Anémona, el equipo usa las cuentas `gabriela` y `mariajose` para simular los roles del caso.
- [ ] *(Más adelante)* Reunión de validación con Gabriela: tabla de supuestos, empezando por **S-04**, y prueba de usabilidad RNF-01; registrar el resultado en `04-supuestos-y-decisiones.md`.
- [ ] Ajustar el prototipo según los cambios solicitados y volver a ejecutar las pruebas.
- [ ] Actualizar el ERS a v1.1 con los supuestos confirmados (estados, transiciones y plan por servicio).
- [ ] Ensayar la presentación.

## Cómo trabajar con el repositorio

- La rama principal es `main` y siempre debe tener una versión que funcione.
- Cada cambio se describe en el mensaje del *commit* (qué se cambió y qué RF afecta). Ejemplo: `RF-08: agrega estado "En revisión" validado con Gabriela`.
- Después de cualquier cambio en `prototipo/` o `servidor/`, se ejecutan `python pruebas/pruebas_api.py` y `python pruebas/pruebas_aceptacion.py`, y se sube también `pruebas/resultados.md`.
- El archivo `servidor/db/anemona.db` **no** se sube (está en `.gitignore`): cada quien tiene su propia base local, creada a partir de `esquema.sql` y los datos de ejemplo.
