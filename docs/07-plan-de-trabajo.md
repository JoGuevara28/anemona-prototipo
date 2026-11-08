# 7. Plan de trabajo

## Estado general

| Fase | Entregable | Estado |
|---|---|---|
| 1. Elicitación | Minuta 01 con Anémona | ✅ Hecho |
| 2. Especificación | ERS v1.0 validado (entregado aparte) | ✅ Hecho |
| 3. Prototipo | Aplicación funcional (`prototipo/`) que cubre RF-01 a RF-17 | ✅ Hecho |
| 4. Verificación | 28 pruebas de aceptación automatizadas | ✅ 28/28 |
| 5. Documentación | Trazabilidad, modelo de datos, supuestos, guía de demo y plan de pruebas | ✅ Hecho |
| 6. Validación | Reunión con Gabriela: supuestos S-01 a S-12 y prueba de usabilidad (RNF-01) | ⏳ Pendiente |
| 7. Ajustes | Cambios solicitados en la validación y actualización del ERS (v1.1) | ⏳ Pendiente |
| 8. Presentación | Demo en clase siguiendo `05-guia-de-demostracion.md` | ⏳ Pendiente |

## Reparto entre integrantes

Cada integrante es responsable de conocer a fondo sus módulos, presentarlos y validarlos con el cliente.

| Integrante | Módulos | Requisitos | Casos de uso |
|---|---|---|---|
| **Jorge Guevara Chavarría** | Acceso, potenciales clientes, clientes, búsqueda, pantalla de inicio | RF-01 a RF-04, RF-15, RF-17 · RNF-03, RNF-04 | CU-01 a CU-04, CU-15, CU-17 |
| **José Gabriel Pérez Tullocks** | Proyectos, actividades y calendario, proveedores, materiales, cotizaciones | RF-05 a RF-14, RF-16 · RNF-02, RNF-05 | CU-05 a CU-14, CU-16 |

## Pendientes

- [ ] Revisar juntos el prototipo completo con la guía de demostración.
- [ ] Agendar la reunión de validación con Gabriela (WhatsApp) y enviarle el enlace del prototipo.
- [ ] Recorrer con ella la tabla de supuestos, empezando por **S-04, el plan de acción por tipo de servicio**.
- [ ] Hacer la prueba de usabilidad RNF-01 y registrar el resultado.
- [ ] Registrar la validación en `04-supuestos-y-decisiones.md`.
- [ ] Ajustar el prototipo según los cambios solicitados y volver a ejecutar las pruebas.
- [ ] Actualizar el ERS a v1.1 con los supuestos confirmados (estados, transiciones y plan por servicio).
- [ ] Ensayar la presentación.

## Cómo trabajar con el repositorio

- La rama principal es `main` y siempre debe tener una versión que funcione.
- Cada cambio se describe en el mensaje del *commit* (qué se cambió y qué RF afecta). Ejemplo: `RF-08: agrega estado "En revisión" validado con Gabriela`.
- Después de cualquier cambio en `prototipo/`, se ejecuta `python pruebas/pruebas_aceptacion.py` y se sube también `pruebas/resultados.md`.
