import { useRef, useState } from 'react'
import { DotsSixVertical, Plus, X } from '@phosphor-icons/react'
import { Avance, Boton, Casilla } from './base.jsx'
import Responsable from './Responsable.jsx'

/**
 * Lista de tareas del proyecto, en orden de prioridad. El orden del array es el
 * orden: se arrastra por el asa de la izquierda, y con el teclado se mueve con
 * Alt y las flechas sobre el asa enfocada.
 *
 * La reordenación es en vivo: la fila se coloca en cuanto el puntero cruza el
 * centro de otra, en vez de esperar a soltar. Así ves el resultado mientras
 * decides, que es de lo que va priorizar.
 */
export default function Tareas({
  proyecto,
  progreso,
  gente,
  tareaNueva,
  setTareaNueva,
  anadirTarea,
  cambiarTarea,
  moverTarea,
  borrarTarea,
}) {
  const [arrastrando, setArrastrando] = useState(null)
  const lista = useRef(null)
  const gesto = useRef(null)
  const aviso = useRef(null)

  function anunciar(texto, posicion) {
    if (!aviso.current) return
    aviso.current.textContent = `${texto || 'La tarea'} ahora es la ${posicion} de ${proyecto.tareas.length}.`
  }

  /** Índice de la fila cuyo centro vertical está más cerca del puntero. */
  function indiceBajo(y) {
    const filas = [...(lista.current?.querySelectorAll('.tarea') ?? [])]
    for (let i = 0; i < filas.length; i++) {
      const caja = filas[i].getBoundingClientRect()
      if (y < caja.top + caja.height / 2) return i
    }
    return filas.length - 1
  }

  function alBajar(evento, indice, tarea) {
    if (evento.button !== 0) return
    evento.preventDefault()
    gesto.current = { id: tarea.id, indice }
    evento.currentTarget.setPointerCapture(evento.pointerId)
    setArrastrando(tarea.id)
  }

  function alMover(evento) {
    const g = gesto.current
    if (!g) return
    const destino = indiceBajo(evento.clientY)
    if (destino === -1 || destino === g.indice) return
    moverTarea(proyecto.id, g.indice, destino)
    g.indice = destino
  }

  function alSoltar() {
    const g = gesto.current
    gesto.current = null
    setArrastrando(null)
    if (!g) return
    const tarea = proyecto.tareas.find((t) => t.id === g.id)
    anunciar(tarea?.texto, g.indice + 1)
  }

  function alTeclear(evento, indice, tarea) {
    if (!evento.altKey || (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown')) return
    evento.preventDefault()
    const destino = indice + (evento.key === 'ArrowDown' ? 1 : -1)
    if (destino < 0 || destino >= proyecto.tareas.length) return
    moverTarea(proyecto.id, indice, destino)
    anunciar(tarea.texto, destino + 1)
    // El asa se desmonta y se vuelve a montar en su sitio nuevo: sin esto el
    // foco cae al body y no se puede encadenar un segundo movimiento.
    requestAnimationFrame(() => {
      lista.current?.querySelector(`[data-asa="${tarea.id}"]`)?.focus()
    })
  }

  return (
    <div className="bloque">
      <div className="bloque__cabecera">
        <span className="etiqueta-campo" id="rotulo-tareas">
          Tareas
        </span>
        {progreso ? (
          <span className="apoyo cifra">
            {progreso.hechas} de {progreso.total}
          </span>
        ) : null}
      </div>

      {progreso ? <Avance fraccion={progreso.fraccion} etiqueta="Avance del proyecto" /> : null}

      {proyecto.tareas.length > 0 ? (
        <>
          <ul className="tareas" aria-labelledby="rotulo-tareas" ref={lista} style={{ marginTop: 'var(--e3)' }}>
            {proyecto.tareas.map((tarea, indice) => (
              <li
                className={`tarea ${arrastrando === tarea.id ? 'tarea--arrastrando' : ''}`.trim()}
                key={tarea.id}
              >
                <button
                  type="button"
                  className="tarea__asa"
                  data-asa={tarea.id}
                  aria-label={`Reordenar ${tarea.texto || 'la tarea'}. Prioridad ${indice + 1} de ${
                    proyecto.tareas.length
                  }. Mueve con Alt y las flechas.`}
                  onPointerDown={(e) => alBajar(e, indice, tarea)}
                  onPointerMove={alMover}
                  onPointerUp={alSoltar}
                  onPointerCancel={alSoltar}
                  onKeyDown={(e) => alTeclear(e, indice, tarea)}
                >
                  <DotsSixVertical size={15} weight="bold" />
                </button>

                <span className="tarea__puesto cifra" aria-hidden="true">
                  {indice + 1}
                </span>

                <Casilla
                  checked={tarea.hecha}
                  onChange={(e) => cambiarTarea(proyecto.id, tarea.id, { hecha: e.target.checked })}
                  aria-label={`Marcar ${tarea.texto}`}
                />

                <input
                  className={`tarea__texto ${tarea.hecha ? 'tarea__texto--hecha' : ''}`.trim()}
                  value={tarea.texto}
                  onChange={(e) => cambiarTarea(proyecto.id, tarea.id, { texto: e.target.value })}
                  aria-label="Texto de la tarea"
                />

                <Responsable
                  valor={tarea.responsable}
                  listaId="gente-de-la-casa"
                  alCambiar={(nombre) => cambiarTarea(proyecto.id, tarea.id, { responsable: nombre })}
                />

                <button
                  type="button"
                  className="tarea__quitar"
                  onClick={() => borrarTarea(proyecto.id, tarea.id)}
                  aria-label={`Quitar la tarea ${tarea.texto}`}
                >
                  <X size={13} weight="bold" />
                </button>
              </li>
            ))}
          </ul>
          <p className="pista" style={{ marginTop: 6 }}>
            El orden es la prioridad. Arrastra por el asa, o muévelas con Alt y las flechas.
          </p>
        </>
      ) : (
        <p className="pista" style={{ marginTop: 'var(--e2)' }}>
          Sin tareas. El avance del proyecto sale de aquí.
        </p>
      )}

      <datalist id="gente-de-la-casa">
        {gente.map((nombre) => (
          <option value={nombre} key={nombre} />
        ))}
      </datalist>

      <form
        className="tarea-alta"
        onSubmit={(e) => {
          e.preventDefault()
          anadirTarea(proyecto.id, tareaNueva)
          setTareaNueva('')
        }}
      >
        <input
          className="campo"
          value={tareaNueva}
          onChange={(e) => setTareaNueva(e.target.value)}
          placeholder="Añadir una tarea"
          aria-label="Añadir una tarea"
          maxLength={160}
        />
        <Boton variante="principal" type="submit" disabled={!tareaNueva.trim()} aria-label="Añadir tarea">
          <Plus size={16} weight="bold" />
        </Boton>
      </form>

      <p ref={aviso} className="oculto" role="status" aria-live="polite" />
    </div>
  )
}
