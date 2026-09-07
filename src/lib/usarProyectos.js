import { useCallback, useEffect, useRef, useState } from 'react'
import { cargar, detectarModo, guardar, modoActual } from './almacen.js'
import { nuevoId, proyectoEnBlanco, sanear } from './modelo.js'
import { proyectosDeEjemplo } from '../data/ejemplo.js'

/**
 * Estado de la cartera. Carga al arrancar (del servidor si lo hay, del
 * navegador si no) y escribe en cuanto algo cambia, con un respiro de 400 ms
 * para no golpear la base en cada tecla.
 */
export function usarProyectos() {
  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modo, setModo] = useState(null)
  const [guardadoEn, setGuardadoEn] = useState(null)
  const [falloAlGuardar, setFalloAlGuardar] = useState(false)
  const listoParaGuardar = useRef(false)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const cual = await detectarModo()
      try {
        const guardados = await cargar()
        if (!vivo) return
        // Sin servidor y sin nada guardado es la primera vez: se enseñan los
        // ejemplos. Con servidor, una base vacía es una base vacía y punto: no
        // se le meten datos inventados a nadie.
        setProyectos(guardados ?? (cual === 'api' ? [] : proyectosDeEjemplo()))
      } catch {
        if (!vivo) return
        setProyectos([])
        setFalloAlGuardar(true)
      } finally {
        if (!vivo) return
        setModo(cual)
        setCargando(false)
        // Sólo a partir de aquí se puede escribir: guardar antes de haber
        // cargado vaciaría la base con el estado inicial.
        listoParaGuardar.current = true
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (!listoParaGuardar.current) return
    const id = setTimeout(async () => {
      const bien = await guardar(proyectos)
      setFalloAlGuardar(!bien)
      if (bien) setGuardadoEn(Date.now())
    }, 400)
    return () => clearTimeout(id)
  }, [proyectos])

  const crear = useCallback((parcial = {}) => {
    const ficha = { ...proyectoEnBlanco(), ...parcial }
    setProyectos((lista) => [ficha, ...lista])
    return ficha
  }, [])

  const actualizar = useCallback((id, cambios) => {
    setProyectos((lista) =>
      lista.map((p) =>
        p.id === id ? { ...p, ...cambios, actualizado: new Date().toISOString() } : p,
      ),
    )
  }, [])

  const borrar = useCallback((id) => {
    setProyectos((lista) => lista.filter((p) => p.id !== id))
  }, [])

  /** Recibe la ficha entera y devuelve la copia ya creada, sin esperar al render. */
  const duplicar = useCallback((original) => {
    const copia = sanear({
      ...original,
      id: nuevoId(),
      nombre: `${original.nombre} (copia)`,
      cobrado: false,
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString(),
      tareas: original.tareas.map((t) => ({ ...t, id: nuevoId() })),
    })
    setProyectos((lista) => {
      const posicion = lista.findIndex((p) => p.id === original.id)
      if (posicion === -1) return [copia, ...lista]
      return [...lista.slice(0, posicion + 1), copia, ...lista.slice(posicion + 1)]
    })
    return copia
  }, [])

  const reemplazar = useCallback((lista) => setProyectos(lista.map(sanear)), [])

  const anadirTarea = useCallback((id, texto) => {
    const limpio = texto.trim()
    if (!limpio) return
    setProyectos((lista) =>
      lista.map((p) =>
        p.id === id
          ? {
              ...p,
              tareas: [...p.tareas, { id: nuevoId(), texto: limpio, hecha: false, responsable: '' }],
            }
          : p,
      ),
    )
  }, [])

  const cambiarTarea = useCallback((id, tareaId, cambios) => {
    setProyectos((lista) =>
      lista.map((p) =>
        p.id === id
          ? { ...p, tareas: p.tareas.map((t) => (t.id === tareaId ? { ...t, ...cambios } : t)) }
          : p,
      ),
    )
  }, [])

  const borrarTarea = useCallback((id, tareaId) => {
    setProyectos((lista) =>
      lista.map((p) => (p.id === id ? { ...p, tareas: p.tareas.filter((t) => t.id !== tareaId) } : p)),
    )
  }, [])

  return {
    proyectos,
    cargando,
    modo: modo ?? modoActual(),
    guardadoEn,
    falloAlGuardar,
    crear,
    actualizar,
    borrar,
    duplicar,
    reemplazar,
    anadirTarea,
    cambiarTarea,
    borrarTarea,
    cargarEjemplo: () => setProyectos(proyectosDeEjemplo()),
    vaciar: () => setProyectos([]),
  }
}
