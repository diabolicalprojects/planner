import { useLayoutEffect, useRef, useState } from 'react'
import { CalendarBlank, Plus, RocketLaunch, WarningCircle } from '@phosphor-icons/react'
import { Avance, Boton, Chip } from './base.jsx'
import { Equipo } from './Responsable.jsx'
import {
  ESTADOS,
  avance,
  equipoDe,
  esInterno,
  fechaCorta,
  pesos,
  rotuloEstado,
  vencido,
} from '../lib/modelo.js'

const UMBRAL = 5

/**
 * Tablero por estado. Se arrastra la tarjeta de una columna a otra; con el
 * teclado, Alt y las flechas hacen lo mismo sobre la tarjeta enfocada.
 */
export default function Tablero({ proyectos, visibles, abrir, actualizar, crear, filtrado, tipoFiltro, avisoRef }) {
  const [arrastre, setArrastre] = useState(null)
  const columnas = useRef({})
  const gesto = useRef(null)
  const raiz = useRef(null)
  const porEnfocar = useRef(null)

  // Al mover con el teclado la tarjeta se desmonta de una columna y se monta en
  // otra: sin esto el foco cae al body y el segundo movimiento es imposible.
  useLayoutEffect(() => {
    if (!porEnfocar.current) return
    const destino = raiz.current?.querySelector(`[data-proyecto="${porEnfocar.current}"]`)
    porEnfocar.current = null
    destino?.focus()
  })

  function columnaBajoPuntero(x, y) {
    for (const estado of Object.keys(columnas.current)) {
      const caja = columnas.current[estado]?.getBoundingClientRect()
      if (caja && x >= caja.left && x <= caja.right && y >= caja.top && y <= caja.bottom) return estado
    }
    return null
  }

  function anunciar(proyecto, estado) {
    if (!avisoRef?.current) return
    const destino = ESTADOS.find((e) => e.id === estado)
    avisoRef.current.textContent = `${proyecto?.nombre || 'El proyecto'} pasa a ${destino?.rotulo.toLowerCase()}.`
  }

  function alBajar(evento, proyecto) {
    if (evento.button !== 0) return
    gesto.current = {
      id: proyecto.id,
      estado: proyecto.estado,
      x0: evento.clientX,
      y0: evento.clientY,
      movido: false,
      nodo: evento.currentTarget,
    }
    evento.currentTarget.setPointerCapture(evento.pointerId)
  }

  function alMover(evento) {
    const g = gesto.current
    if (!g) return
    if (!g.movido && Math.hypot(evento.clientX - g.x0, evento.clientY - g.y0) < UMBRAL) return

    if (!g.movido) {
      g.movido = true
      const caja = g.nodo.getBoundingClientRect()
      g.offsetX = g.x0 - caja.left
      g.offsetY = g.y0 - caja.top
      g.ancho = caja.width
    }

    setArrastre({
      id: g.id,
      x: evento.clientX - g.offsetX,
      y: evento.clientY - g.offsetY,
      ancho: g.ancho,
      sobre: columnaBajoPuntero(evento.clientX, evento.clientY),
    })
  }

  function alSoltar(evento) {
    const g = gesto.current
    gesto.current = null
    if (!g) return
    if (g.movido) {
      const destino = columnaBajoPuntero(evento.clientX, evento.clientY)
      if (destino && destino !== g.estado) {
        actualizar(g.id, { estado: destino })
        anunciar(
          proyectos.find((p) => p.id === g.id),
          destino,
        )
      }
      setArrastre(null)
      return
    }
    setArrastre(null)
    abrir(g.id)
  }

  function alTeclear(evento, proyecto) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      abrir(proyecto.id)
      return
    }
    if (!evento.altKey || (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight')) return
    evento.preventDefault()
    const actual = ESTADOS.findIndex((e) => e.id === proyecto.estado)
    const destino = ESTADOS[actual + (evento.key === 'ArrowRight' ? 1 : -1)]
    if (!destino) return
    porEnfocar.current = proyecto.id
    actualizar(proyecto.id, { estado: destino.id })
    anunciar(proyecto, destino.id)
  }

  const volando = proyectos.find((p) => p.id === arrastre?.id)

  return (
    <div className="tablero" ref={raiz}>
      {ESTADOS.map((estado) => {
        const enColumna = visibles.filter((p) => p.estado === estado.id)
        return (
          <section
            key={estado.id}
            className={`columna ${arrastre?.sobre === estado.id ? 'columna--destino' : ''}`.trim()}
            ref={(nodo) => {
              columnas.current[estado.id] = nodo
            }}
            aria-label={estado.rotulo}
          >
            <header className="columna__cabecera">
              <span className={`columna__punto columna__punto--${estado.id}`} aria-hidden="true" />
              <h2 className="columna__titulo">{rotuloEstado(estado.id, tipoFiltro)}</h2>
              <span className="columna__cuenta cifra">{enColumna.length}</span>
            </header>

            {enColumna.map((proyecto) => (
              <article
                key={proyecto.id}
                data-proyecto={proyecto.id}
                role="button"
                tabIndex={0}
                className={`proyecto ${arrastre?.id === proyecto.id ? 'proyecto--fantasma' : ''}`.trim()}
                onPointerDown={(e) => alBajar(e, proyecto)}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                onKeyDown={(e) => alTeclear(e, proyecto)}
                aria-label={`${proyecto.nombre || 'Proyecto sin nombre'}. Abrir con Intro, mover con Alt y flechas.`}
              >
                <ContenidoProyecto proyecto={proyecto} />
              </article>
            ))}

            {enColumna.length === 0 ? (
              <p className="columna__vacia">
                {filtrado ? 'Nada con este filtro' : 'Sin proyectos aquí'}
              </p>
            ) : null}

            {estado.id === 'idea' && !filtrado ? (
              <Boton tamano="pequeno" variante="contorno" onClick={crear}>
                <Plus size={14} weight="bold" /> Nuevo proyecto
              </Boton>
            ) : null}
          </section>
        )
      })}

      {arrastre && volando ? (
        <div
          className="proyecto proyecto--volando"
          style={{ transform: `translate(${arrastre.x}px, ${arrastre.y}px)`, width: `${arrastre.ancho}px` }}
          aria-hidden="true"
        >
          <ContenidoProyecto proyecto={volando} />
        </div>
      ) : null}
    </div>
  )
}

function ContenidoProyecto({ proyecto }) {
  const progreso = avance(proyecto)
  const tarde = vencido(proyecto)
  const interno = esInterno(proyecto)
  // Un producto propio no se cobra: enseñar "sin cobrar" ahí sería ruido.
  const porCobrar = !interno && proyecto.estado === 'entregado' && !proyecto.cobrado

  return (
    <>
      <div className="proyecto__cabecera">
        <div>
          <h3 className="proyecto__nombre">{proyecto.nombre || 'Proyecto sin nombre'}</h3>
          <p className="proyecto__cliente">
            {interno ? (
              <span className="proyecto__interno">
                <RocketLaunch size={12} weight="fill" /> Producto propio
              </span>
            ) : (
              proyecto.cliente || 'Sin cliente'
            )}
          </p>
        </div>
      </div>

      {progreso ? (
        <div className="proyecto__avance">
          <div className="proyecto__avance-texto">
            <span>{Math.round(progreso.fraccion * 100)}%</span>
            <span className="cifra">
              {progreso.hechas}/{progreso.total} tareas
            </span>
          </div>
          <Avance
            fraccion={progreso.fraccion}
            etiqueta={`${progreso.hechas} de ${progreso.total} tareas hechas`}
          />
        </div>
      ) : null}

      {tarde || porCobrar ? (
        <p className="proyecto__sellos">
          {tarde ? (
            <Chip variante="negro">
              <WarningCircle size={12} weight="fill" /> Vencido
            </Chip>
          ) : null}
          {porCobrar ? <Chip variante="contorno">Sin cobrar</Chip> : null}
        </p>
      ) : null}

      <div className="proyecto__pie">
        <span className="proyecto__importe cifra">
          {pesos(proyecto.presupuesto)}
          {interno ? <small className="proyecto__inv"> inv.</small> : null}
        </span>
        <Equipo nombres={equipoDe(proyecto)} />
        {proyecto.entrega ? (
          <span className="proyecto__fecha" title={interno ? 'Lanzamiento' : 'Entrega'}>
            {interno ? <RocketLaunch size={13} /> : <CalendarBlank size={13} />}
            <span className="cifra">{fechaCorta(proyecto.entrega)}</span>
          </span>
        ) : null}
      </div>
    </>
  )
}
