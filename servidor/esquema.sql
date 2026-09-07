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
