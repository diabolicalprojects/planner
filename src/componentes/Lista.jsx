import { useState } from 'react'
import { ArrowDown, ArrowUp, RocketLaunch } from '@phosphor-icons/react'
import { Chip, Tarjeta } from './base.jsx'
import {
  cobradoDe,
  esInterno,
  estaCobrado,
  fechaCorta,
  pesos,
  porCobrarDe,
  rotuloEstado,
  vencido,
} from '../lib/modelo.js'

const COLUMNAS = [
  { id: 'nombre', rotulo: 'Proyecto' },
  { id: 'estado', rotulo: 'Estado', movil: false },
  { id: 'entrega', rotulo: 'Fecha', movil: false },
  { id: 'cobro', rotulo: 'Cobro', movil: false, orden: 'porCobrar' },
  { id: 'presupuesto', rotulo: 'Importe', derecha: true },
]

/** La misma cartera en tabla, para cuando lo que quieres es comparar cifras. */
export default function Lista({ visibles, abrir }) {
  const [orden, setOrden] = useState({ campo: 'entrega', asc: true })

  const ordenados = [...visibles].sort((a, b) => {
    const campo = orden.campo
    // Lo que falta por cobrar no es un campo de la ficha: se calcula de los
    // cobros, así que se ordena antes de mirar las propiedades.
    if (campo === 'porCobrar') {
      const [x, y] = [porCobrarDe(a), porCobrarDe(b)]
      return orden.asc ? x - y : y - x
    }
    let x = a[campo]
    let y = b[campo]
    if (campo === 'presupuesto') return orden.asc ? x - y : y - x
    x = String(x ?? '')
    y = String(y ?? '')
    // Los proyectos sin fecha se van siempre al final, no al principio.
    if (campo === 'entrega') {
      if (!x) return 1
      if (!y) return -1
    }
    return orden.asc ? x.localeCompare(y, 'es') : y.localeCompare(x, 'es')
  })

  function ordenarPor(columna) {
    const campo = columna.orden ?? columna.id
    setOrden((actual) => ({ campo, asc: actual.campo === campo ? !actual.asc : true }))
  }

  return (
    <Tarjeta className="lista">
      <div className="lista__fila lista__cabecera" role="row">
        {COLUMNAS.map((columna) => {
          const campo = columna.orden ?? columna.id
          const activa = orden.campo === campo
          return (
            <span
              key={columna.id}
              className={`${columna.derecha ? 'lista__derecha' : ''} ${
                columna.movil === false ? 'lista__oculto-movil' : ''
              }`.trim()}
              role="columnheader"
              aria-sort={activa ? (orden.asc ? 'ascending' : 'descending') : 'none'}
            >
              <button
                type="button"
                className="rotulo lista__orden"
                onClick={() => ordenarPor(columna)}
                aria-label={`Ordenar por ${columna.rotulo}${
                  activa ? (orden.asc ? ', ahora ascendente' : ', ahora descendente') : ''
                }`}
              >
                {columna.rotulo}
                {activa ? (
                  orden.asc ? (
                    <ArrowUp size={11} weight="bold" />
                  ) : (
                    <ArrowDown size={11} weight="bold" />
                  )
                ) : null}
              </button>
            </span>
          )
        })}
      </div>

      {ordenados.map((proyecto) => (
        <button type="button" key={proyecto.id} className="lista__fila" onClick={() => abrir(proyecto.id)}>
          <span className="lista__proyecto">
            <span className="lista__nombre">{proyecto.nombre || 'Proyecto sin nombre'}</span>
            <span className="lista__cliente">
              {esInterno(proyecto) ? (
                <span className="proyecto__interno">
                  <RocketLaunch size={11} weight="fill" /> Producto propio
                </span>
              ) : (
                proyecto.cliente || 'Sin cliente'
              )}
            </span>
          </span>

          <span className="lista__oculto-movil">
            <Chip punto>{rotuloEstado(proyecto.estado, proyecto.tipo)}</Chip>
          </span>

          <span className="lista__oculto-movil apoyo cifra">
            {proyecto.entrega ? (
              vencido(proyecto) ? (
                <Chip variante="negro">{fechaCorta(proyecto.entrega)}</Chip>
              ) : (
                fechaCorta(proyecto.entrega)
              )
            ) : (
              'Sin fecha'
            )}
          </span>

          <span className="lista__oculto-movil">
            {esInterno(proyecto) ? (
              <span className="apoyo">Inversión</span>
            ) : (
              <Chip variante={estaCobrado(proyecto) ? 'suave' : 'contorno'}>
                {estaCobrado(proyecto)
                  ? 'Cobrado'
                  : cobradoDe(proyecto) > 0
                    ? `Faltan ${pesos(porCobrarDe(proyecto))}`
                    : 'Pendiente'}
              </Chip>
            )}
          </span>

          <span className="lista__importe cifra">{pesos(proyecto.presupuesto)}</span>
        </button>
      ))}

      {ordenados.length === 0 ? (
        <p className="columna__vacia" style={{ padding: 'var(--e6)' }}>
          Ningún proyecto coincide con la búsqueda.
        </p>
      ) : null}
    </Tarjeta>
  )
}
