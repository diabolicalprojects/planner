import { useCallback, useEffect, useRef, useState } from 'react'
import { cargar, detectarModo, guardar, modoActual, sesionCaducada } from './almacen.js'
import { cotizacionEnBlanco, nuevoId, proyectoEnBlanco, sanear, sanearCotizacion } from './modelo.js'
import { proyectosDeEjemplo } from '../data/ejemplo.js'

/**
 * Estado de la cartera. Carga al arrancar (del servidor si lo hay, del
 * navegador si no) y escribe en cuanto algo cambia, con un respiro de 400 ms
 * para no golpear la base en cada tecla.
 */
export function usarProyectos({ activo = true } = {}) {
  const [proyectos, setProyectos] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modo, setModo] = useState(null)
  const [guardadoEn, setGuardadoEn] = useState(null)
  const [falloAlGuardar, setFalloAlGuardar] = useState(false)
  const [caducada, setCaducada] = useState(false)
  const [reintento, setReintento] = useState(0)
  const listoParaGuardar = useRef(false)

  useEffect(() => {
    // Con la puerta cerrada no hay nada que leer: el servidor contestaría 401 y
    // dejaría la cartera vacía en pantalla, que se lee como «no tienes nada».
    if (!activo) return undefined
    let vivo = true
    ;(async () => {
      const cual = await detectarModo()
      try {
        const guardados = await cargar()
        if (!vivo) return
        // Sin servidor y sin nada guardado es la primera vez: se enseñan los
        // ejemplos. Con servidor, una base vacía es una base vacía y punto: no
        // se le meten datos inventados a nadie.
        setProyectos(guardados?.proyectos ?? (cual === 'api' ? [] : proyectosDeEjemplo()))
        setCotizaciones(guardados?.cotizaciones ?? [])
      } catch {
        if (!vivo) return
        setProyectos([])
        setCotizaciones([])
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
  }, [activo])

  useEffect(() => {
    if (!listoParaGuardar.current || !activo) return undefined
    const id = setTimeout(async () => {
      const bien = await guardar({ proyectos, cotizaciones })
      setFalloAlGuardar(!bien)
      setCaducada(!bien && sesionCaducada())
      if (bien) setGuardadoEn(Date.now())
    }, 400)
    return () => clearTimeout(id)
  }, [proyectos, cotizaciones, activo, reintento])

  /** Volver a intentar el guardado que se quedó a medias, sin tocar los datos. */
  const reintentarGuardado = useCallback(() => {
    setCaducada(false)
    setReintento((n) => n + 1)
  }, [])

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

  const reemplazar = useCallback(({ proyectos: ps, cotizaciones: cs }) => {
    setProyectos((ps ?? []).map(sanear))
    setCotizaciones((cs ?? []).map(sanearCotizacion))
  }, [])

  /* --- Cotizaciones ------------------------------------------------------ */

  const crearCotizacion = useCallback((parcial = {}) => {
    const cot = { ...cotizacionEnBlanco(), ...parcial }
    setCotizaciones((lista) => [cot, ...lista])
    return cot
  }, [])

  const actualizarCotizacion = useCallback((id, cambios) => {
    setCotizaciones((lista) =>
      lista.map((c) =>
        c.id === id ? { ...c, ...cambios, actualizado: new Date().toISOString() } : c,
      ),
    )
  }, [])

  const borrarCotizacion = useCallback((id) => {
    setCotizaciones((lista) => lista.filter((c) => c.id !== id))
  }, [])

  /**
   * Duplicar una cotización sube la versión y renueva el folio: una cotización
   * v2 es un documento distinto que el cliente tiene que poder distinguir del
   * que ya le mandaste.
   */
  const duplicarCotizacion = useCallback((original) => {
    const version = (original.version || 1) + 1
    const copia = sanearCotizacion({
      ...original,
      id: nuevoId(),
      version,
      folio: String(original.folio || '').replace(/V\d+$/, `V${version}`) || original.folio,
      estado: 'borrador',
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString(),
      componentes: original.componentes.map((c) => ({ ...c, id: nuevoId() })),
      bloques: original.bloques.map((b) => ({ ...b, id: nuevoId() })),
    })
    setCotizaciones((lista) => {
      const pos = lista.findIndex((c) => c.id === original.id)
      if (pos === -1) return [copia, ...lista]
      return [...lista.slice(0, pos + 1), copia, ...lista.slice(pos + 1)]
    })
    return copia
  }, [])

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

  /**
   * Cambia una tarea de sitio dentro de su proyecto. El orden del array ES el
   * orden de prioridad: la base lo guarda en la columna `orden` y lo devuelve
   * igual, así que no hace falta ningún campo extra.
   */
  const moverTarea = useCallback((id, desde, hasta) => {
    setProyectos((lista) =>
      lista.map((p) => {
        if (p.id !== id) return p
        if (desde === hasta || desde < 0 || hasta < 0) return p
        if (desde >= p.tareas.length || hasta >= p.tareas.length) return p
        const tareas = [...p.tareas]
        const [movida] = tareas.splice(desde, 1)
        tareas.splice(hasta, 0, movida)
        return { ...p, tareas, actualizado: new Date().toISOString() }
      }),
    )
  }, [])

  const borrarTarea = useCallback((id, tareaId) => {
    setProyectos((lista) =>
      lista.map((p) => (p.id === id ? { ...p, tareas: p.tareas.filter((t) => t.id !== tareaId) } : p)),
    )
  }, [])

  return {
    proyectos,
    cotizaciones,
    crearCotizacion,
    actualizarCotizacion,
    borrarCotizacion,
    duplicarCotizacion,
    cargando,
    modo: modo ?? modoActual(),
    guardadoEn,
    falloAlGuardar,
    caducada,
    reintentarGuardado,
    crear,
    actualizar,
    borrar,
    duplicar,
    reemplazar,
    anadirTarea,
    cambiarTarea,
    moverTarea,
    borrarTarea,
    cargarEjemplo: () => setProyectos(proyectosDeEjemplo()),
    vaciar: () => {
      setProyectos([])
      setCotizaciones([])
    },
  }
}
