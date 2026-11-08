-- =====================================================================
--  Base de datos del prototipo Anémona Design Studio (SQLite 3)
--  IC5821 Requerimientos de Software · Grupo 01
--
--  Las restricciones de la base de datos refuerzan las reglas del ERS:
--    RN-01 / RNF-02  todo proyecto pertenece a un cliente existente (FK)
--    RN-02           proveedores y materiales son opcionales por proyecto
--    RN-03           tipos de servicio y estados son catálogos cerrados
--    CU-03 / CU-04   la identificación de un cliente es única
-- =====================================================================
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- acceso (RF-17)
CREATE TABLE usuario (
    id            TEXT PRIMARY KEY,
    usuario       TEXT NOT NULL UNIQUE,
    nombre        TEXT NOT NULL,
    iniciales     TEXT NOT NULL,
    rol           TEXT NOT NULL,
    puede_editar  INTEGER NOT NULL CHECK (puede_editar IN (0, 1)),
    clave_hash    TEXT NOT NULL,           -- PBKDF2-SHA256, nunca la contraseña en texto plano
    clave_sal     TEXT NOT NULL
);

CREATE TABLE sesion (
    token       TEXT PRIMARY KEY,
    usuario_id  TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    expira      TEXT NOT NULL              -- fecha y hora ISO-8601
);

-- ---------------------------------------------------------------- catálogos (RN-03)
CREATE TABLE tipo_servicio (
    nombre  TEXT PRIMARY KEY,
    orden   INTEGER NOT NULL
);

CREATE TABLE estado_proyecto (
    nombre  TEXT PRIMARY KEY,
    orden   INTEGER NOT NULL,
    activo  INTEGER NOT NULL CHECK (activo IN (0, 1))   -- cuenta como "proyecto activo" en Inicio
);

-- Transiciones permitidas entre estados (RF-08). Cambiar una regla = cambiar una fila.
CREATE TABLE transicion_estado (
    desde  TEXT NOT NULL REFERENCES estado_proyecto(nombre),
    hasta  TEXT NOT NULL REFERENCES estado_proyecto(nombre),
    PRIMARY KEY (desde, hasta),
    CHECK (desde <> hasta)
);

CREATE TABLE categoria (
    nombre  TEXT PRIMARY KEY,
    orden   INTEGER NOT NULL
);

-- Plan de acción sugerido por tipo de servicio (Minuta 01, tema 3)
CREATE TABLE plan_actividad (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_servicio      TEXT NOT NULL REFERENCES tipo_servicio(nombre),
    orden              INTEGER NOT NULL,
    nombre             TEXT NOT NULL,
    dias_desde_inicio  INTEGER NOT NULL CHECK (dias_desde_inicio >= 0),
    entregable         INTEGER NOT NULL DEFAULT 0 CHECK (entregable IN (0, 1)),
    responsable        TEXT NOT NULL
);

-- ---------------------------------------------------------------- personas (RF-01 a RF-04)
CREATE TABLE cliente (
    id                 TEXT PRIMARY KEY,
    nombre             TEXT NOT NULL CHECK (trim(nombre) <> ''),
    tipo_id            TEXT NOT NULL CHECK (tipo_id IN ('Cédula', 'Pasaporte')),
    num_id             TEXT NOT NULL,
    num_id_normal      TEXT NOT NULL,      -- sin guiones ni espacios, para comparar
    telefono           TEXT NOT NULL DEFAULT '',
    correo             TEXT NOT NULL DEFAULT '',
    nacionalidad       TEXT NOT NULL DEFAULT '',
    origen_potencial   TEXT,               -- potencial cliente del que proviene (si aplica)
    creado             TEXT NOT NULL,
    actualizado        TEXT NOT NULL,
    UNIQUE (tipo_id, num_id_normal),
    CHECK (telefono <> '' OR correo <> '')
);

CREATE TABLE potencial_cliente (
    id            TEXT PRIMARY KEY,
    nombre        TEXT NOT NULL CHECK (trim(nombre) <> ''),
    telefono      TEXT NOT NULL DEFAULT '',
    correo        TEXT NOT NULL DEFAULT '',
    nacionalidad  TEXT NOT NULL DEFAULT '',
    servicio      TEXT NOT NULL REFERENCES tipo_servicio(nombre),
    estado        TEXT NOT NULL CHECK (estado IN ('Nuevo', 'Contactado', 'Reunión agendada', 'Cotización enviada', 'No continuó')),
    notas         TEXT NOT NULL DEFAULT '',
    convertido_a  TEXT REFERENCES cliente(id),
    creado        TEXT NOT NULL,
    actualizado   TEXT NOT NULL,
    CHECK (telefono <> '' OR correo <> '')
);

-- ---------------------------------------------------------------- proyectos (RF-05 a RF-08)
CREATE TABLE proyecto (
    id            TEXT PRIMARY KEY,
    cliente_id    TEXT NOT NULL REFERENCES cliente(id) ON DELETE RESTRICT,
    nombre        TEXT NOT NULL CHECK (trim(nombre) <> ''),
    tipo          TEXT NOT NULL REFERENCES tipo_servicio(nombre),
    descripcion   TEXT NOT NULL CHECK (trim(descripcion) <> ''),
    fecha_inicio  TEXT NOT NULL,
    ubicacion     TEXT NOT NULL DEFAULT '',
    area          REAL CHECK (area IS NULL OR area >= 0),
    estado        TEXT NOT NULL DEFAULT 'Por iniciar' REFERENCES estado_proyecto(nombre),
    creado        TEXT NOT NULL,
    actualizado   TEXT NOT NULL
);
CREATE INDEX idx_proyecto_cliente ON proyecto(cliente_id);

-- ---------------------------------------------------------------- actividades (RF-13, RF-14)
CREATE TABLE actividad (
    id           TEXT PRIMARY KEY,
    proyecto_id  TEXT NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    nombre       TEXT NOT NULL CHECK (trim(nombre) <> ''),
    responsable  TEXT NOT NULL,
    fecha        TEXT NOT NULL,
    estado       TEXT NOT NULL CHECK (estado IN ('Pendiente', 'En proceso', 'Completada')),
    entregable   INTEGER NOT NULL DEFAULT 0 CHECK (entregable IN (0, 1))
);
CREATE INDEX idx_actividad_fecha ON actividad(fecha);
CREATE INDEX idx_actividad_proyecto ON actividad(proyecto_id);

-- ---------------------------------------------------------------- proveedores y materiales (RF-09 a RF-12)
CREATE TABLE proveedor (
    id        TEXT PRIMARY KEY,
    nombre    TEXT NOT NULL CHECK (trim(nombre) <> ''),
    contacto  TEXT NOT NULL DEFAULT '',
    telefono  TEXT NOT NULL,
    correo    TEXT NOT NULL DEFAULT '',
    ofrece    TEXT NOT NULL,
    notas     TEXT NOT NULL DEFAULT ''
);

CREATE TABLE proveedor_categoria (
    proveedor_id  TEXT NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
    categoria     TEXT NOT NULL REFERENCES categoria(nombre),
    PRIMARY KEY (proveedor_id, categoria)
);

CREATE TABLE material (
    id           TEXT PRIMARY KEY,
    nombre       TEXT NOT NULL CHECK (trim(nombre) <> ''),
    modelo       TEXT NOT NULL DEFAULT '',
    categoria    TEXT NOT NULL REFERENCES categoria(nombre),
    unidad       TEXT NOT NULL,
    precio_ref   REAL CHECK (precio_ref IS NULL OR precio_ref >= 0),
    descripcion  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE material_proveedor (
    material_id   TEXT NOT NULL REFERENCES material(id) ON DELETE CASCADE,
    proveedor_id  TEXT NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, proveedor_id)
);

CREATE TABLE proyecto_proveedor (
    id            TEXT PRIMARY KEY,
    proyecto_id   TEXT NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    proveedor_id  TEXT NOT NULL REFERENCES proveedor(id) ON DELETE RESTRICT,
    condicion     TEXT NOT NULL CHECK (condicion IN ('Considerado', 'Seleccionado')),
    UNIQUE (proyecto_id, proveedor_id)
);

CREATE TABLE proyecto_material (
    id           TEXT PRIMARY KEY,
    proyecto_id  TEXT NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    material_id  TEXT NOT NULL REFERENCES material(id) ON DELETE RESTRICT,
    cantidad     REAL NOT NULL CHECK (cantidad > 0),
    precio_unit  REAL NOT NULL CHECK (precio_unit >= 0),   -- precio pactado para este proyecto
    nota         TEXT NOT NULL DEFAULT ''
);

-- ---------------------------------------------------------------- cotizaciones (RF-16, IE-01)
CREATE TABLE cotizacion (
    id              TEXT PRIMARY KEY,
    proyecto_id     TEXT NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    codigo          TEXT NOT NULL CHECK (trim(codigo) <> ''),
    fecha           TEXT NOT NULL,
    monto           REAL CHECK (monto IS NULL OR monto >= 0),
    estado          TEXT NOT NULL CHECK (estado IN ('Enviada', 'Aceptada', 'Rechazada')),
    enlace          TEXT NOT NULL DEFAULT '',
    archivo_nombre  TEXT NOT NULL DEFAULT '',
    archivo_tipo    TEXT NOT NULL DEFAULT '',
    archivo_datos   BLOB,
    CHECK (enlace <> '' OR archivo_nombre <> '')
);
