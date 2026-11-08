# 3. Modelo de datos

Entidades y relaciones que usa el prototipo (`prototipo/js/app.js`, función `seed()`). El modelo es conceptual: describe **qué** información se guarda, no **cómo** se guardaría en una base de datos definitiva.

## Diagrama entidad-relación

```mermaid
erDiagram
    POTENCIAL_CLIENTE |o--o| CLIENTE : "se convierte en"
    CLIENTE ||--o{ PROYECTO : "tiene"
    PROYECTO ||--o{ ACTIVIDAD : "incluye"
    PROYECTO ||--o{ PROVEEDOR_PROYECTO : "considera o selecciona"
    PROVEEDOR ||--o{ PROVEEDOR_PROYECTO : "participa en"
    PROYECTO ||--o{ MATERIAL_PROYECTO : "usa"
    MATERIAL ||--o{ MATERIAL_PROYECTO : "se usa en"
    PROVEEDOR }o--o{ MATERIAL : "ofrece"
    PROYECTO ||--o{ COTIZACION : "tiene referencia"

    POTENCIAL_CLIENTE {
        string nombre "obligatorio"
        string telefono "al menos uno"
        string correo "al menos uno"
        string nacionalidad
        string servicio "catálogo de tipos"
        string estado "seguimiento"
        string notas
    }
    CLIENTE {
        string nombre "obligatorio"
        string tipoId "Cédula o Pasaporte"
        string numId "único por tipo"
        string telefono
        string correo
        string nacionalidad
    }
    PROYECTO {
        string nombre "obligatorio"
        string tipo "catálogo"
        string descripcion "obligatorio"
        date fechaInicio "obligatorio"
        string ubicacion
        number area "m2"
        string estado "transiciones"
    }
    ACTIVIDAD {
        string nombre
        string responsable
        date fecha "prevista"
        string estado
        bool entregable
    }
    PROVEEDOR {
        string nombre
        list categorias
        string contacto
        string telefono
        string ofrece
    }
    MATERIAL {
        string nombre
        string modelo
        string categoria
        string unidad
        number precioRef
    }
    PROVEEDOR_PROYECTO {
        string condicion "Considerado o Seleccionado"
    }
    MATERIAL_PROYECTO {
        number cantidad
        number precioUnit
        string nota
    }
    COTIZACION {
        string codigo
        date fecha
        number monto
        string estado
        string enlace
        string archivo
    }
```

**Cómo leer las relaciones:** `||--o{` significa «uno a cero o muchos». Por ejemplo, un cliente tiene cero o muchos proyectos, y cada proyecto pertenece exactamente a un cliente (RN-01).

## Diagrama de estados del proyecto (RF-08)

```mermaid
stateDiagram-v2
    [*] --> PorIniciar
    PorIniciar --> EnDiseno
    PorIniciar --> Cancelado
    EnDiseno --> EnEjecucion
    EnDiseno --> EnPausa
    EnDiseno --> Finalizado
    EnDiseno --> Cancelado
    EnEjecucion --> EnPausa
    EnEjecucion --> Finalizado
    EnEjecucion --> Cancelado
    EnPausa --> EnDiseno
    EnPausa --> EnEjecucion
    EnPausa --> Cancelado
    Finalizado --> [*]
    Cancelado --> [*]
```

Todo proyecto nuevo inicia en **Por iniciar**. **Finalizado** y **Cancelado** son estados finales. Las transiciones son una **propuesta del equipo** y deben validarse con Anémona (ver supuestos).

## Catálogos

| Catálogo | Valores |
|---|---|
| Tipos de servicio (RF-07) | Anteproyecto, Diseño de interiores, Mobiliario a medida, Remodelación, Gestión de construcción (de la minuta) |
| Estados de seguimiento de potenciales clientes | Nuevo, Contactado, Reunión agendada, Cotización enviada, No continuó |
| Estados de actividad | Pendiente, En proceso, Completada |
| Categorías de proveedor | Iluminación, Mobiliario, Ebanistería, Construcción, Acabados, Materiales, Electrodomésticos, Otros servicios |
| Responsables | Gabriela Núñez, María José, Colaborador externo |
