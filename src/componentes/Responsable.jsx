import { useEffect, useRef, useState } from 'react'
import { UserPlus } from '@phosphor-icons/react'
import { iniciales } from '../lib/modelo.js'

/**
 * Quién lleva una tarea. Cerrado es un disco con las iniciales; al pulsarlo se
 * abre un campo con autocompletado de la gente que ya aparece en la cartera.
 * No hay entidad "equipo" en este producto y no me la invento: es texto libre
 * con memoria.
 */
export default function Responsable({ valor, alCambiar, listaId }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(valor ?? '')
  const campo = useRef(null)

  useEffect(() => {
    setTexto(valor ?? '')
  }, [valor])

  useEffect(() => {
    if (editando) campo.current?.focus()
  }, [editando])

  function cerrar(guardando) {
    setEditando(false)
    if (guardando) alCambiar(texto.trim())
    else setTexto(valor ?? '')
  }

  if (editando) {
    return (
      <input
        ref={campo}
        className="responsable__campo"
        list={listaId}
        value={texto}
        placeholder="Nombre"
        maxLength={40}
        aria-label="Persona responsable de la tarea"
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => cerrar(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            cerrar(true)
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            cerrar(false)
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className={`responsable ${valor ? 'responsable--puesto' : ''}`.trim()}
      onClick={() => setEditando(true)}
      title={valor ? `Responsable: ${valor}` : 'Asignar responsable'}
      aria-label={valor ? `Responsable: ${valor}. Cambiar` : 'Asignar responsable'}
    >
      {valor ? <span aria-hidden="true">{iniciales(valor)}</span> : <UserPlus size={13} />}
    </button>
  )
}

/** Los mismos discos, apilados, para decir quién anda en un proyecto. */
export function Equipo({ nombres, max = 3 }) {
  if (!nombres.length) return null
  const visibles = nombres.slice(0, max)
  const resto = nombres.length - visibles.length
  return (
    <span className="equipo" title={nombres.join(', ')}>
      {visibles.map((nombre) => (
        <span className="equipo__disco" key={nombre} aria-hidden="true">
          {iniciales(nombre)}
        </span>
      ))}
      {resto > 0 ? <span className="equipo__disco equipo__disco--resto">+{resto}</span> : null}
      <span className="oculto">Responsables: {nombres.join(', ')}</span>
    </span>
  )
}
