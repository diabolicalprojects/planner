/** Piezas base: tarjeta, botón, campo, casilla, distintivo y barra de avance. */

export function Tarjeta({ as: Etiqueta = 'section', className = '', negra = false, ...resto }) {
  return <Etiqueta className={`tarjeta ${negra ? 'tarjeta--negra' : ''} ${className}`.trim()} {...resto} />
}

export function Boton({ variante = 'suave', tamano, className = '', type = 'button', ...resto }) {
  const variantes = {
    suave: '',
    principal: 'boton--principal',
    contorno: 'boton--contorno',
    icono: 'boton--icono',
  }
  return (
    <button
      type={type}
      className={`boton ${variantes[variante] ?? ''} ${tamano === 'pequeno' ? 'boton--pequeno' : ''} ${className}`
        .replace(/\s+/g, ' ')
        .trim()}
      {...resto}
    />
  )
}

export function Campo({ etiqueta, pista, id, area = false, className = '', ...resto }) {
  const Control = area ? 'textarea' : 'input'
  return (
    <div className={`bloque-campo ${className}`.trim()}>
      {etiqueta ? (
        <label className="etiqueta-campo" htmlFor={id}>
          {etiqueta}
        </label>
      ) : null}
      <Control id={id} className={`campo ${area ? 'campo--area' : ''}`.trim()} {...resto} />
      {pista ? <p className="pista">{pista}</p> : null}
    </div>
  )
}

/**
 * Importe en pesos. El signo va fuera del campo para que lo que se escribe sea
 * sólo la cifra y no haya que pelearse con el formato al teclear.
 */
export function CampoDinero({ etiqueta, id, pista, ...resto }) {
  return (
    <div className="bloque-campo">
      <label className="etiqueta-campo" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="campo-dinero">
        <span className="campo-dinero__signo" aria-hidden="true">
          $
        </span>
        <input id={id} type="number" min="0" step="500" inputMode="numeric" className="campo cifra" {...resto} />
      </div>
      {pista ? <p className="pista">{pista}</p> : null}
    </div>
  )
}

export function Casilla({ etiqueta, className = '', ...resto }) {
  return (
    <label className={`casilla ${className}`.trim()}>
      <input type="checkbox" {...resto} />
      <span className="casilla__caja" aria-hidden="true" />
      {etiqueta ? <span>{etiqueta}</span> : null}
    </label>
  )
}

export function Chip({ variante = 'suave', punto = false, className = '', children }) {
  const variantes = { suave: '', negro: 'chip--negro', contorno: 'chip--contorno' }
  return (
    <span className={`chip ${variantes[variante] ?? ''} ${className}`.trim()}>
      {punto ? <span className="chip__punto" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export function Avance({ fraccion, etiqueta }) {
  const porcentaje = Math.round((fraccion ?? 0) * 100)
  return (
    <div
      className="avance"
      role="progressbar"
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta}
    >
      <div className="avance__relleno" style={{ width: `${porcentaje}%` }} />
    </div>
  )
}
