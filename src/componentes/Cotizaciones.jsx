import { FileText, Plus } from '@phosphor-icons/react'
import { Boton, Chip, Tarjeta } from './base.jsx'
import { fechaCorta, pesos, rotuloEstadoCot, totalesCotizacion } from '../lib/modelo.js'

/** La lista de cotizaciones, ordenada por lo más reciente. */
export default function Cotizaciones({ cotizaciones, proyectos, abrir, crear }) {
  if (cotizaciones.length === 0) {
    return (
      <Tarjeta>
        <div className="vacio">
          <span className="vacio__icono">
            <FileText size={26} />
          </span>
          <h2 className="titulo-seccion">Todavía no hay cotizaciones</h2>
          <p className="vacio__texto">
            Una cotización es un documento con su folio, su alcance y su inversión. Se exporta a PDF
            con la marca de la casa o como particular, según a quién se la mandes.
          </p>
          <Boton variante="principal" onClick={crear}>
            <Plus size={16} weight="bold" /> Crear la primera
          </Boton>
        </div>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta className="lista">
      <div className="lista__fila lista__cabecera lista__fila--cot" role="row">
        <span className="rotulo">Cotización</span>
        <span className="rotulo lista__oculto-movil">Estado</span>
        <span className="rotulo lista__oculto-movil">Marca</span>
        <span className="rotulo lista__oculto-movil">Fecha</span>
        <span className="rotulo lista__derecha">Total</span>
      </div>

      {cotizaciones.map((c) => {
        const t = totalesCotizacion(c)
        const proyecto = proyectos.find((p) => p.id === c.proyectoId)
        return (
          <button
            type="button"
            key={c.id}
            className="lista__fila lista__fila--cot"
            onClick={() => abrir(c.id)}
          >
            <span className="lista__proyecto">
              <span className="lista__nombre">{c.cliente || c.proyecto || 'Sin nombre'}</span>
              <span className="lista__cliente">
                {c.folio}
                {/* Sin cliente, el proyecto ya es el título: repetirlo debajo es
                    decir dos veces lo mismo en dos renglones seguidos. */}
                {c.proyecto && c.cliente ? ` · ${c.proyecto}` : ''}
                {proyecto ? ' · enlazada' : ''}
              </span>
            </span>

            <span className="lista__oculto-movil">
              <Chip punto>{rotuloEstadoCot(c.estado)}</Chip>
            </span>

            <span className="lista__oculto-movil">
              <Chip variante={c.marca === 'diabolical' ? 'negro' : 'contorno'}>
                {c.marca === 'diabolical' ? 'DIABOLICAL' : 'Particular'}
              </Chip>
            </span>

            <span className="lista__oculto-movil apoyo cifra">{fechaCorta(c.fecha) || '—'}</span>

            <span className="lista__importe cifra">{pesos(t.total)}</span>
          </button>
        )
      })}
    </Tarjeta>
  )
}
