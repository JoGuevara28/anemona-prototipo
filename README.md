# Anémona Design Studio — Prototipo funcional

Prototipo funcional del sistema de información especificado en el **ERS v1.0 de Anémona Design Studio** (entregado aparte en el curso; no se incluye aquí porque contiene datos de contacto de la empresa).

**Curso:** IC5821 Requerimientos de Software · Escuela de Ingeniería en Computación, TEC
**Grupo:** 01 · **Profesor:** Mario Chacón Rivas
**Integrantes:** Jorge Guevara Chavarría (2022437473) · José Gabriel Pérez Tullocks (2022437445)

---

## ¿Qué es esto?

Anémona Design Studio es un estudio de arquitectura y diseño de interiores. Hoy guarda su información en hojas de Excel, el iPad, WhatsApp y notas del teléfono. El prototipo muestra cómo funcionaría un sistema que **reúne en un solo lugar** a los potenciales clientes, los clientes, los proyectos, los proveedores, los materiales, las actividades y las cotizaciones de cada proyecto.

El prototipo es **funcional**: se pueden registrar, editar, relacionar y buscar datos, y aplica las validaciones y reglas de negocio del ERS. No tiene servidor. Los datos se guardan en el navegador de quien lo usa.

| | |
|---|---|
| Requisitos funcionales cubiertos | **17 de 17** (RF-01 a RF-17) |
| Requisitos no funcionales verificados | **5 de 5** (RNF-01 a RNF-05) |
| Reglas de negocio aplicadas | RN-01, RN-02, RN-03 e IE-01 |
| Pruebas de aceptación automatizadas | **28 de 28 aprobadas** → [`pruebas/resultados.md`](pruebas/resultados.md) |

## Cómo abrirlo

1. Descargue o clone el repositorio.
2. Abra `prototipo/index.html` con doble clic. Funciona en Chrome, Edge, Firefox y Safari y no necesita instalación.
3. Ingrese con un usuario de demostración. En la pantalla de ingreso puede hacer clic en el usuario para completar los datos.

| Usuario | Contraseña | Rol | Para qué sirve |
|---|---|---|---|
| `gabriela` | `anemona2026` | Propietaria | Acceso completo |
| `mariajose` | `anemona2026` | Arquitecta | Acceso completo (la minuta indica que tiene los mismos permisos) |
| `consulta` | `consulta` | Solo consulta | Demostrar el bloqueo por rol (RF-17) |

El botón **«Restablecer datos de ejemplo»**, abajo en el menú lateral, devuelve el prototipo a su estado inicial antes de una presentación.

## Estructura del repositorio

```
├── README.md                     ← este archivo
├── prototipo/                    ← la aplicación
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js                 ← lógica, reglas de negocio y validaciones
├── docs/                         ← documentación del trabajo
│   ├── 01-resumen-del-caso.md         problema, stakeholders, alcance y restricciones
│   ├── 02-matriz-de-trazabilidad.md   RF/RNF/RN → CU → pantalla → prueba
│   ├── 03-modelo-de-datos.md          entidades, relaciones y diagrama de estados
│   ├── 04-supuestos-y-decisiones.md   lo que hay que validar con Anémona
│   ├── 05-guia-de-demostracion.md     guion paso a paso para presentar
│   ├── 06-plan-de-pruebas.md          estrategia y cómo ejecutar las pruebas
│   ├── 07-plan-de-trabajo.md          reparto entre integrantes y pendientes
│   └── glosario.md                    términos y siglas del curso
└── pruebas/
    ├── pruebas_aceptacion.py     ← 28 pruebas automáticas (Playwright)
    └── resultados.md             ← último resultado
```

## Por dónde empezar

- **Para presentar:** [`docs/05-guia-de-demostracion.md`](docs/05-guia-de-demostracion.md)
- **Para justificar ante el profesor que se cumplió el ERS:** [`docs/02-matriz-de-trazabilidad.md`](docs/02-matriz-de-trazabilidad.md) y [`pruebas/resultados.md`](pruebas/resultados.md)
- **Para la siguiente reunión con Gabriela:** [`docs/04-supuestos-y-decisiones.md`](docs/04-supuestos-y-decisiones.md)

## Limitaciones conocidas

- Los datos viven en el navegador (`localStorage`), por lo que no se comparten entre computadoras.
- De los documentos adjuntos solo se registra el nombre del archivo.
- Las contraseñas son de demostración y no se cifran.
- Quedan fuera del alcance, según el ERS §2.11: la generación de cotizaciones, las notificaciones automáticas, el archivo de fotos y renders y el historial de cambios.

## Declaración de uso de IA

La construcción del prototipo, las pruebas y la documentación se hicieron con apoyo de Claude (Anthropic) a partir del ERS validado por el equipo. Los integrantes son responsables de revisar el contenido y de validar con Anémona Design Studio los supuestos indicados en `docs/04-supuestos-y-decisiones.md`.
