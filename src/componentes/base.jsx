import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

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

/**
 * Un área de texto que crece con lo que se escribe.
 *
 * Con alto fijo el texto largo se lee por una mirilla de tres renglones: en el
 * escritorio molesta y en un teléfono, donde una nota de cinco líneas es lo
 * normal, hace el campo inservible. Aquí no hay barra interior que perseguir,
 * el campo es tan alto como su contenido.
 */
export function AreaCrece({ className = '', ...resto }) {
  const nodo = useRef(null)

  const ajustar = useCallback(() => {
    const n = nodo.current
    if (!n) return
    n.style.height = 'auto'
    // Escondido (otra pestaña, otra vista) mide cero: dejarlo así lo aplastaría.
    if (n.scrollHeight > 0) n.style.height = `${n.scrollHeight}px`
  }, [])

  useLayoutEffect(ajustar, [ajustar, resto.value])

  // Al cambiar el ancho, el texto se recoloca y cambian los renglones. Se vigila
  // el contenedor, no el propio campo: vigilarlo a él sería medir lo que uno
  // mismo acaba de mover.
  useEffect(() => {
    const padre = nodo.current?.parentElement
    if (!padre) return
    const observador = new ResizeObserver(ajustar)
    observador.observe(padre)
    return () => observador.disconnect()
  }, [ajustar])

  return (
    <textarea
      ref={nodo}
      className={`campo campo--area ${className}`.trim()}
      onInput={ajustar}
      {...resto}
    />
  )
}

export function Campo({ etiqueta, pista, id, area = false, className = '', ...resto }) {
  return (
    <div className={`bloque-campo ${className}`.trim()}>
      {etiqueta ? (
        <label className="etiqueta-campo" htmlFor={id}>
          {etiqueta}
        </label>
      ) : null}
      {area ? (
        <AreaCrece id={id} {...resto} />
      ) : (
        <input id={id} className="campo" {...resto} />
      )}
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
      <div className="avance__relleno" style={{ transform: `scaleX(${porcentaje / 100})` }} />
    </div>
  )
}
