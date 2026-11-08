# 5. Guía de demostración

Guion para presentar el prototipo en clase o ante Anémona (unos 12–15 minutos). Sigue la historia de un cliente real del estudio: alguien escribe por WhatsApp, contrata, se crea su proyecto y se le da seguimiento.

**Antes de empezar:**

1. Ejecutar `python servidor/servidor.py` (o doble clic en `iniciar-windows.bat`) y abrir **http://localhost:8000**.
2. Comprobar que la barra lateral diga «Base de datos SQLite conectada».
3. Ingresar como `gabriela` y pulsar **«Restablecer datos de ejemplo»** (menú lateral, abajo).
4. Dejar activada la casilla «Mostrar trazabilidad (RF)».
5. Tener a mano un PDF cualquiera para el paso de cotizaciones.

---

### 1. Acceso — RF-17 (1 min)
1. Salir e intentar entrar con una contraseña incorrecta. El sistema rechaza el acceso.
2. Entrar como `gabriela`.

> **Qué decir:** «Solo el personal autenticado ve datos de clientes y proyectos (RNF-03).»

### 2. Pantalla de inicio (1 min)
Mostrar los indicadores y la lista **Urgente y próximo**: hay una actividad atrasada (en rojo) y un entregable dentro de 4 días.

> **Qué decir:** «Esto responde a lo que Gabriela dijo en la entrevista que quiere ver al iniciar el día: proyectos activos, tareas pendientes, entregables próximos y urgencias.»

### 3. Un potencial cliente escribe — RF-01 y RF-02 (2 min)
1. **Potenciales clientes → Registrar.** Escribir solo el nombre y guardar. El sistema marca los campos faltantes y **conserva el nombre** (RNF-04).
2. Completar el teléfono y el servicio, y guardar. Aparece en la lista.
3. Intentar registrar otra persona con el teléfono `8890-1122`. El sistema avisa que ya existe Sofía Rojas y no crea un duplicado (CU-01, flujo alterno).
4. Abrir a Carlos Vargas y cambiar su estado a «Reunión agendada».

### 4. Firma el contrato — RF-03 (1,5 min)
1. En Sofía Rojas, pulsar **Convertir a cliente**.
2. Escribir la cédula `1-1234-0567`. El sistema la rechaza porque ya pertenece a Laura Méndez.
3. Cambiarla a `4-0222-0333`, marcar «contrato firmado y primer depósito» y convertir. La ficha del cliente conserva su teléfono y correo.

> **Qué decir:** «La regla viene de la minuta: es cliente cuando firma y paga el primer depósito.»

### 5. Se crea el proyecto con su plan de acción — RF-05, RF-07 y RF-13 (2 min)
1. Desde la ficha de Sofía, pulsar **+ Nuevo proyecto**: tipo «Diseño de interiores», con la casilla **Cargar el plan de acción** marcada.
2. Se abre el proyecto con 8 actividades ya fechadas: reunión inicial, mood board, revisión, etc.

> **Qué decir:** «Gabriela pidió que cada tipo de servicio tuviera un plan de pasos y entregables, para que cualquier integrante sepa qué hacer.»

### 6. Seguimiento — RF-08, RF-11, RF-12 y RF-16 (3 min)
Abrir **Apartamento Escazú** (proyecto de ejemplo completo):
- **Estado:** cambiar a «En ejecución». Mostrar que «Por iniciar» aparece deshabilitado, porque las transiciones están controladas.
- **Proveedores:** Luz & Forma está *seleccionado* e Iluminarte *considerado* (dos alternativas de iluminación, como describió Gabriela).
- **Materiales:** cantidades, precio y costo total.
- **Cotizaciones:** referencia al documento de Canva. Registrar una nueva **adjuntando un PDF** y abrirla desde el enlace: el documento queda guardado en la base de datos. El sistema no genera cotizaciones (IE-01).

Luego abrir **Anteproyecto casa de playa**: no tiene proveedores ni materiales y es válido (RNF-05).

### 7. Calendario — RF-14 (1,5 min)
1. **Calendario**: actividades por día, con colores por estado. Filtrar por «María José».
2. Clic en una actividad, cambiar la fecha y guardar. Se mueve en el calendario.
3. Clic de nuevo y pulsar **Abrir proyecto →**.

### 8. Proveedores y búsqueda — RF-09, RF-10 y RF-15 (1,5 min)
1. **Proveedores → Iluminación**: las alternativas disponibles. Abrir una ficha: proyectos en los que participa y «otras alternativas en la misma categoría».
2. En la barra superior buscar `escazú`. Aparecen los dos proyectos de esa ubicación. Luego buscar `iluminación` para ver proveedores y materiales a la vez.

### 9. Permisos y base de datos — RF-17 y RNF-02 (1,5 min)
1. Salir y entrar como `mariajose`. Mostrar que ve el cliente y el proyecto creados por Gabriela: los datos están en la base, no en el navegador.
2. Salir, entrar como `consulta` e intentar «Registrar cliente». El sistema bloquea la acción e informa que el rol no está autorizado. El servidor también lo rechaza si alguien intenta saltarse la interfaz.
3. (Opcional) Abrir `servidor/db/anemona.db` con DB Browser for SQLite y mostrar las tablas.

### 10. Cierre (1 min)
Mostrar **Acerca del prototipo** (tecnología, matriz de trazabilidad y supuestos) y mencionar las pruebas automáticas:

- **59 ejecuciones de pruebas de aceptación** (31 pruebas en dos modos);
- **29 pruebas de API y base de datos**.

Todas aprobadas (`pruebas/resultados.md`).

---

## Revisión de usabilidad con el estudio (RNF-01)

El RNF-01 exige que una persona del estudio registre un cliente y le asocie un proyecto **sin ayuda del equipo**. Procedimiento:

1. Enviar el enlace del prototipo a Gabriela o María José.
2. Pedirle, sin más instrucciones: «Registre un cliente nuevo y créele un proyecto de remodelación.»
3. Anotar el tiempo, las dudas y los errores en esta tabla:

| Fecha | Participante | ¿Lo completó sin ayuda? | Tiempo | Dudas u observaciones |
|---|---|---|---|---|
| | | | | |
