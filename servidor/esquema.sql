-- Esquema del planificador. Se aplica solo al arrancar el servidor: crear si no
-- existe es idempotente, así que un despliegue nuevo no necesita ningún paso a
-- mano y uno repetido no toca nada.

CREATE TABLE IF NOT EXISTS proyectos (
  id           TEXT PRIMARY KEY,
  nombre       TEXT        NOT NULL DEFAULT '',
  -- 'cliente' (alguien lo cotizó y lo paga) o 'interno' (producto propio).
  tipo         TEXT        NOT NULL DEFAULT 'cliente',
  cliente      TEXT        NOT NULL DEFAULT '',
  estado       TEXT        NOT NULL DEFAULT 'idea',
  inicio       DATE,
  -- Fecha de entrega para un encargo, de lanzamiento para un producto propio.
  entrega      DATE,
  -- Pesos mexicanos, enteros. Presupuesto si es de cliente, inversión si es interno.
  presupuesto  INTEGER     NOT NULL DEFAULT 0,
  cobrado      BOOLEAN     NOT NULL DEFAULT FALSE,
  notas        TEXT        NOT NULL DEFAULT '',
  enlace       TEXT        NOT NULL DEFAULT '',
  etiquetas    TEXT[]      NOT NULL DEFAULT '{}',
  creado       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT proyectos_tipo_valido   CHECK (tipo IN ('cliente', 'interno')),
  CONSTRAINT proyectos_estado_valido CHECK (estado IN ('idea', 'curso', 'pausa', 'entregado')),
  CONSTRAINT proyectos_presupuesto_no_negativo CHECK (presupuesto >= 0)
);

CREATE TABLE IF NOT EXISTS tareas (
  id          TEXT PRIMARY KEY,
  proyecto_id TEXT    NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  texto       TEXT    NOT NULL DEFAULT '',
  hecha       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Persona responsable. Texto libre: aquí no hay entidad "equipo".
  responsable TEXT    NOT NULL DEFAULT '',
  -- El orden en que se ven dentro del proyecto.
  orden       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS tareas_por_proyecto ON tareas (proyecto_id, orden);
CREATE INDEX IF NOT EXISTS proyectos_por_estado ON proyectos (estado);
CREATE INDEX IF NOT EXISTS proyectos_por_entrega ON proyectos (entrega);

-- Cotizaciones. Los componentes, bloques y condiciones son listas anidadas que
-- sólo se leen y escriben con el documento entero, así que van en JSONB: darles
-- tablas propias añadiría cuatro joins sin ganar ninguna consulta.
CREATE TABLE IF NOT EXISTS cotizaciones (
  id             TEXT PRIMARY KEY,
  folio          TEXT        NOT NULL DEFAULT '',
  version        INTEGER     NOT NULL DEFAULT 1,
  estado         TEXT        NOT NULL DEFAULT 'borrador',
  -- 'diabolical' (con marca de la casa) o 'particular' (sin ella).
  marca          TEXT        NOT NULL DEFAULT 'diabolical',

  emisor_nombre  TEXT        NOT NULL DEFAULT '',
  emisor_titulo  TEXT        NOT NULL DEFAULT '',
  emisor_contacto TEXT       NOT NULL DEFAULT '',

  cliente        TEXT        NOT NULL DEFAULT '',
  proyecto       TEXT        NOT NULL DEFAULT '',
  atencion       TEXT        NOT NULL DEFAULT '',
  ubicacion      TEXT        NOT NULL DEFAULT '',

  fecha          DATE,
  plazo          TEXT        NOT NULL DEFAULT '',
  validez        TEXT        NOT NULL DEFAULT '',

  componentes    JSONB       NOT NULL DEFAULT '[]',
  bloques        JSONB       NOT NULL DEFAULT '[]',
  condiciones    JSONB       NOT NULL DEFAULT '[]',

  total_manual   INTEGER     NOT NULL DEFAULT 0,
  con_iva        BOOLEAN     NOT NULL DEFAULT FALSE,
  notas          TEXT        NOT NULL DEFAULT '',
  -- Enlace opcional con un proyecto de la cartera. Sin clave foránea a
  -- propósito: borrar un proyecto no debe llevarse por delante su cotización.
  proyecto_id    TEXT        NOT NULL DEFAULT '',

  creado         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT cotizaciones_marca_valida CHECK (marca IN ('diabolical', 'particular')),
  CONSTRAINT cotizaciones_estado_valido
    CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada'))
);

CREATE INDEX IF NOT EXISTS cotizaciones_por_proyecto ON cotizaciones (proyecto_id);
