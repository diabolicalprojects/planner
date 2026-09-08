import { useEffect, useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { Avance, Boton } from './base.jsx'
import { cobradoDe, fechaCorta, hoyISO, pesos, porCobrarDe } from '../lib/modelo.js'

/**
 * Los cobros de un proyecto.
 *
 * Antes esto era una casilla: cobrado sí o no. Con eso, un proyecto de $136,300
 * con el 50% de anticipo en la cuenta salía como pendiente entero, y la caja de
 * la cartera —la cifra por la que se abre esta aplicación— decía una mentira del
 * tamaño de medio proyecto. Las propias cotizaciones dicen «50% de anticipo y
 * 50% contra entrega»: el modelo tenía que saber contar hasta dos.
 */
export default function Cobros({ proyecto, anadirPago, borrarPago }) {
  const cobrado = cobradoDe(proyecto)
  const falta = porCobrarDe(proyecto)
  const proporcion = proyecto.presupuesto > 0 ? Math.min(1, cobrado / proyecto.presupuesto) : 0

  const [abierto, setAbierto] = useState(false)
  const [importe, setImporte] = useState('')
  const [fecha, setFecha] = useState(hoyISO())

  // Al cambiar de proyecto, el formulario a medio escribir no se queda pegado.
  useEffect(() => {
    setAbierto(false)
    setImporte('')
    setFecha(hoyISO())
  }, [proyecto.id])

  function apuntar(evento) {
    evento.preventDefault()
    anadirPago(proyecto.id, { importe, fecha })
    setImporte('')
    setAbierto(false)
  }

  return (
    <div className="bloque-campo">
      <span className="etiqueta-campo">Cobros</span>

      <div className="cobros">
        <p className="cobros__resumen">
          <span className="cifra">
            <b>{pesos(cobrado)}</b> de {pesos(proyecto.presupuesto)}
          </span>
          <span className="apoyo">
            {proyecto.presupuesto === 0
              ? 'sin presupuesto'
              : falta === 0
                ? 'cobrado del todo'
                : `faltan ${pesos(falta)}`}
          </span>
        </p>

        <Avance fraccion={proporcion} etiqueta="Proporción cobrada de este proyecto" />

        {proyecto.pagos.length > 0 ? (
          <ul className="cobros__lista">
            {proyecto.pagos.map((pago) => (
              <li className="cobro" key={pago.id}>
                <span className="cobro__importe cifra">{pesos(pago.importe)}</span>
                <span className="cobro__fecha apoyo">
                  {[fechaCorta(pago.fecha), pago.nota].filter(Boolean).join(' · ') || 'sin fecha'}
                </span>
                <button
                  type="button"
                  className="tarea__quitar"
                  onClick={() => borrarPago(proyecto.id, pago.id)}
                  aria-label={`Quitar el cobro de ${pesos(pago.importe)}`}
                >
                  <X size={13} weight="bold" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {abierto ? (
          <form className="cobros__alta" onSubmit={apuntar}>
            <div className="campo-dinero">
              <span className="campo-dinero__signo" aria-hidden="true">
                $
              </span>
              <input
                className="campo cifra"
                type="number"
                min="1"
                step="500"
                inputMode="numeric"
                value={importe}
                autoFocus
                onChange={(e) => setImporte(e.target.value)}
                aria-label="Importe del cobro"
              />
            </div>
            <input
              className="campo"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              aria-label="Fecha del cobro"
            />
            <Boton type="submit" variante="principal" tamano="pequeno" disabled={!Number(importe)}>
              Apuntar
            </Boton>
            <Boton tamano="pequeno" onClick={() => setAbierto(false)}>
              Dejarlo
            </Boton>
          </form>
        ) : (
          <div className="cobros__acciones">
            <Boton tamano="pequeno" onClick={() => setAbierto(true)}>
              <Plus size={14} weight="bold" /> Apuntar cobro
            </Boton>
            {/* El caso normal —te pagan lo que falta— en un solo gesto. */}
            {falta > 0 ? (
              <Boton
                tamano="pequeno"
                onClick={() => anadirPago(proyecto.id, { importe: falta, fecha: hoyISO() })}
              >
                Cobrar {pesos(falta)}
              </Boton>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
