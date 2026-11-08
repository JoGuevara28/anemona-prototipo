# anemona · design studio — Prototipo funcional

Prototipo funcional del sistema de información especificado en el **ERS v1.0 de Anémona Design Studio**. El ERS se entregó aparte en el curso y no se incluye aquí porque contiene datos de contacto de la empresa.

**Curso:** IC5821 Requerimientos de Software · Escuela de Ingeniería en Computación, TEC
**Grupo:** 01 · **Profesor:** Mario Chacón Rivas
**Integrantes:** Jorge Guevara Chavarría (2022437473) · José Gabriel Pérez Tullocks (2022437445)

---

## ¿Qué es esto?

Anémona Design Studio es un estudio de arquitectura y diseño de interiores. Hoy guarda su información en hojas de Excel, el iPad, WhatsApp y notas del teléfono. Este prototipo reúne en un solo sistema, con **base de datos**:

- potenciales clientes y clientes;
- proyectos, con sus actividades y su calendario;
- proveedores y materiales;
- cotizaciones de cada proyecto.

La interfaz sigue la identidad visual del estudio: crema, negro, madera y tonos tierra. Ver [`docs/09-guia-de-estilo.md`](docs/09-guia-de-estilo.md).

| | |
|---|---|
| Requisitos funcionales cubiertos | **17 de 17** (RF-01 a RF-17) |
| Requisitos no funcionales verificados | **5 de 5** (RNF-01 a RNF-05) |
| Reglas de negocio aplicadas | RN-01, RN-02, RN-03 e IE-01, **en la interfaz, en el servidor y en la base de datos** |
| Pruebas de aceptación (interfaz) | **59 de 59 aprobadas** (31 pruebas × 2 modos) → [`pruebas/resultados.md`](pruebas/resultados.md) |
| Pruebas de API y base de datos | **29 de 29 aprobadas** → `pruebas/pruebas_api.py` |

## Lenguajes y tecnologías

| Capa | Tecnología | Para qué |
|---|---|---|
| Interfaz | **HTML5, CSS3 y JavaScript** (sin frameworks) | Pantallas, formularios, validaciones inmediatas |
| Servidor | **Python 3** (solo la biblioteca estándar) | API REST, reglas de negocio, sesiones, contraseñas cifradas |
| Base de datos | **SQLite** (lenguaje **SQL**) | Datos persistentes con llaves foráneas, campos únicos y restricciones |
| Pruebas | **Python** + **Playwright** · `unittest` | Pruebas de aceptación en navegador real y pruebas de API |
| Documentación | Markdown + diagramas **Mermaid** | Se ven directamente en GitHub |

No hay que instalar nada para usar el prototipo: Python ya trae SQLite. El detalle está en [`docs/08-arquitectura.md`](docs/08-arquitectura.md).

## Cómo usarlo

### Opción A — Con base de datos (recomendada)

Requisito: **Python 3.9 o superior** (se verifica con `python --version`).

```bash
python servidor/servidor.py
```

Luego abra **http://localhost:8000** en el navegador. En Windows también puede hacer doble clic en `iniciar-windows.bat`; en Mac o Linux, ejecutar `./iniciar.sh`.

- La base de datos se crea sola en `servidor/db/anemona.db` con los datos de ejemplo.
- `python servidor/servidor.py --reiniciar` borra la base y vuelve a los datos de ejemplo.
- `python servidor/servidor.py --host 0.0.0.0` permite abrirlo desde otro dispositivo de la misma red, por ejemplo para que Gabriela lo pruebe desde su computadora en una reunión.

### Opción B — Modo demostración (sin servidor)

Abra `prototipo/index.html` con doble clic. Funciona igual, pero los datos se guardan solo en ese navegador. La barra lateral indica en qué modo está.

### Usuarios de demostración

| Usuario | Contraseña | Rol | Para qué sirve |
|---|---|---|---|
| `gabriela` | `anemona2026` | Propietaria | Acceso completo |
| `mariajose` | `anemona2026` | Arquitecta | Acceso completo (la minuta indica los mismos permisos) |
| `consulta` | `consulta` | Solo consulta | Demostrar el bloqueo por rol (RF-17) |

## Estructura del repositorio

```
├── README.md
├── iniciar-windows.bat / iniciar.sh   ← arrancan el servidor con doble clic
├── prototipo/                     ← interfaz (HTML, CSS, JavaScript)
│   ├── index.html
│   ├── css/styles.css             ← estilo visual de Anémona
│   └── js/app.js                  ← pantallas, validaciones y conexión con la API
├── servidor/                      ← servidor y base de datos (Python + SQLite)
│   ├── servidor.py                ← servidor web y rutas de la API REST
│   ├── logica.py                  ← reglas de negocio y acceso a datos
│   └── db/esquema.sql             ← definición de tablas y restricciones
├── pruebas/
│   ├── pruebas_aceptacion.py      ← 31 pruebas de aceptación (Playwright)
│   ├── pruebas_api.py             ← 29 pruebas de API y base de datos
│   └── resultados.md              ← último resultado
└── docs/
    ├── 01-resumen-del-caso.md         problema, stakeholders, alcance
    ├── 02-matriz-de-trazabilidad.md   RF/RNF/RN → CU → código → prueba
    ├── 03-modelo-de-datos.md          diagrama entidad-relación y estados
    ├── 04-supuestos-y-decisiones.md   lo que hay que validar con Anémona
    ├── 05-guia-de-demostracion.md     guion para presentar
    ├── 06-plan-de-pruebas.md          estrategia y cómo ejecutar las pruebas
    ├── 07-plan-de-trabajo.md          reparto entre integrantes y pendientes
    ├── 08-arquitectura.md             capas, API REST, seguridad
    ├── 09-guia-de-estilo.md           colores y tipografía de la marca
    └── glosario.md                    términos y siglas
```

## Por dónde empezar

- **Para presentar:** [`docs/05-guia-de-demostracion.md`](docs/05-guia-de-demostracion.md)
- **Para demostrar que se cumplió el ERS:** [`docs/02-matriz-de-trazabilidad.md`](docs/02-matriz-de-trazabilidad.md) y [`pruebas/resultados.md`](pruebas/resultados.md)
- **Para entender cómo está construido:** [`docs/08-arquitectura.md`](docs/08-arquitectura.md)
- **Para la reunión con Gabriela:** [`docs/04-supuestos-y-decisiones.md`](docs/04-supuestos-y-decisiones.md)

## Limitaciones conocidas

- Es un prototipo: el servidor está pensado para uso local o en una red de confianza, no para publicarse en internet sin HTTPS.
- La base SQLite es adecuada para un estudio pequeño. Para muchos usuarios simultáneos convendría PostgreSQL, y el esquema SQL se puede trasladar.
- Quedan fuera del alcance, según el ERS §2.11: la generación de cotizaciones, las notificaciones automáticas, el archivo de fotos y renders y el historial de cambios.

## Declaración de uso de IA

La construcción del prototipo, las pruebas y la documentación se hicieron con apoyo de Claude (Anthropic) a partir del ERS validado por el equipo. Los integrantes son responsables de revisar el contenido y de validar con Anémona Design Studio los supuestos indicados en `docs/04-supuestos-y-decisiones.md`.
