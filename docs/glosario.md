# Glosario

| Término | Significado |
|---|---|
| **ERS / SRS** | Especificación de Requisitos de Software (*Software Requirements Specification*). Es el documento que describe qué debe hacer el sistema; sigue la estructura de IEEE 830. |
| **Elicitación** | Actividad de descubrir los requisitos con los stakeholders, mediante entrevistas, minutas, cuestionarios, etc. |
| **Stakeholder** | Parte interesada: persona u organización afectada por el sistema o con interés en él. |
| **RF** | Requisito Funcional: algo que el sistema debe *hacer*, por ejemplo registrar un proyecto. |
| **RNF / NFR** | Requisito No Funcional: una *cualidad* del sistema, como usabilidad, privacidad o integridad. |
| **RN** | Regla de Negocio: una política de la empresa que el sistema debe respetar, por ejemplo «todo proyecto tiene un cliente». |
| **IE** | Interfaz Externa: forma en que el sistema se relaciona con otros sistemas o documentos. |
| **CU** | Caso de Uso: describe paso a paso la interacción entre un actor y el sistema para lograr un objetivo. |
| **Actor** | Quien interactúa con el sistema: la propietaria o el personal interno. |
| **Flujo alterno** | Camino del caso de uso cuando algo no sale como se esperaba, por ejemplo un dato inválido o un duplicado. |
| **CA — Criterio de aceptación** | Condición verificable que debe cumplirse para aceptar un requisito como terminado. |
| **Matriz de trazabilidad** | Tabla que conecta cada requisito con su origen, su implementación y su prueba. |
| **Prototipo funcional** | Versión del sistema que se puede usar de verdad (registrar, editar, consultar) para validar requisitos antes de construir el producto final. |
| **Prueba de aceptación** | Prueba que verifica un criterio de aceptación desde el punto de vista del usuario. |
| **Validación** | Confirmar con el cliente que los requisitos describen lo que realmente necesita («¿construimos el producto correcto?»). |
| **Verificación** | Confirmar que el sistema cumple lo especificado («¿construimos el producto correctamente?»). |
| **MoSCoW** | Técnica de priorización: *Must* (debe), *Should* (debería), *Could* (podría) y *Won't* (no esta vez). |
| **Potencial cliente** | Persona interesada que aún no ha firmado contrato ni pagado el primer depósito. |
| **Proveedor considerado / seleccionado** | Considerado: alternativa evaluada para un proyecto. Seleccionado: alternativa elegida. |
| **Plan de acción** | Lista de actividades y entregables sugeridos para un tipo de servicio, con plazos. |
| **Entregable** | Resultado que se entrega al cliente, por ejemplo un mood board, planos o renders. |
| **localStorage** | Almacenamiento del navegador donde el modo demostración guarda los datos. |
| **Playwright** | Herramienta que controla un navegador para automatizar pruebas. |
| **Base de datos** | Almacén organizado de los datos del sistema. El prototipo usa **SQLite**, que guarda toda la base en un solo archivo. |
| **SQL** | Lenguaje para definir y consultar bases de datos (`CREATE TABLE`, `SELECT`, `INSERT`…). |
| **Llave primaria / foránea (PK / FK)** | La PK identifica cada fila de una tabla. La FK apunta a la PK de otra tabla y asegura que la relación exista; por ejemplo, un proyecto apunta a un cliente real. |
| **Restricción `UNIQUE` / `CHECK`** | Reglas de la base de datos: UNIQUE impide valores repetidos y CHECK limita los valores permitidos. |
| **API REST** | Forma en que la interfaz se comunica con el servidor: peticiones HTTP (GET, POST, PUT, DELETE) a rutas como `/api/clientes` que intercambian datos en formato JSON. |
| **JSON** | Formato de texto para intercambiar datos, por ejemplo `{"nombre": "Laura"}`. |
| **Servidor / cliente** | El servidor guarda los datos y aplica las reglas; el cliente (el navegador) muestra la interfaz. |
| **Sesión / cookie** | Al ingresar, el servidor entrega un identificador secreto (token) que el navegador guarda en una cookie y envía en cada petición. |
| **Hash de contraseña (PBKDF2)** | Transformación irreversible de la contraseña. La base guarda el hash, nunca la contraseña real. |
| **Códigos HTTP** | 200/201 correcto · 400 datos inválidos · 401 sin sesión · 403 sin permiso · 404 no existe. |
