// Persistencia. La app funciona de dos maneras y decide sola cuál:
//
//   · Con servidor (el despliegue): habla con /api y los datos viven en Postgres.
//   · Sin servidor (`npm run dev` a secas): guarda en el localStorage de este
//     navegador, como siempre.
//
// En los dos casos los datos salen enteros a un .json cuando quieras.

import { sanear } from './modelo.js'

const CLAVE = 'diabolical.planificador.v1'
const FORMATO = 'diabolical-planificador'
const VERSION = 1

let modo = null // 'api' | 'local'

/**
 * Pregunta una sola vez si hay servidor detrás. No basta con que la respuesta
 * sea 200: el servidor de desarrollo de Vite devuelve el index.html para
 * cualquier ruta que no reconoce, y eso pasaría por un backend sano. Hay que
 * ver el JSON y su marca.
 */
export async function detectarModo() {
  if (modo) return modo
  try {
    const corte = AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined
    const res = await fetch('/api/salud', { signal: corte, headers: { Accept: 'application/json' } })
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
      modo = 'local'
      return modo
    }
    const salud = await res.json()
    modo = salud?.ok === true ? 'api' : 'local'
  } catch {
    modo = 'local'
  }
  return modo
}

export function modoActual() {
  return modo
}

export async function cargar() {
  if ((await detectarModo()) === 'api') {
    const res = await fetch('/api/proyectos')
    if (!res.ok) throw new Error('No se pudo leer la cartera del servidor.')
    const datos = await res.json()
    return (datos.proyectos ?? []).map(sanear)
  }

  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null
    const datos = JSON.parse(crudo)
    if (!Array.isArray(datos?.proyectos)) return null
    return datos.proyectos.map(sanear)
  } catch {
    return null
  }
}

export async function guardar(proyectos) {
  if ((await detectarModo()) === 'api') {
    try {
      const res = await fetch('/api/proyectos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proyectos }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  try {
    localStorage.setItem(CLAVE, JSON.stringify({ formato: FORMATO, version: VERSION, proyectos }))
    return true
  } catch {
    return false
  }
}

export function exportar(proyectos) {
  const contenido = JSON.stringify(
    { formato: FORMATO, version: VERSION, exportado: new Date().toISOString(), proyectos },
    null,
    2,
  )
  const blob = new Blob([contenido], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const sello = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `diabolical-proyectos-${sello}.json`
  a.click()
  URL.revokeObjectURL(url)
  return a.download
}

/**
 * Lee un .json exportado. Devuelve { proyectos } o { error } con un motivo
 * legible: el usuario tiene que saber por qué su archivo no entró.
 */
export async function importar(archivo) {
  let texto
  try {
    texto = await archivo.text()
  } catch {
    return { error: 'No se ha podido leer el archivo.' }
  }
  let datos
  try {
    datos = JSON.parse(texto)
  } catch {
    return { error: 'El archivo no es un JSON válido.' }
  }
  const lista = Array.isArray(datos) ? datos : datos?.proyectos
  if (!Array.isArray(lista)) {
    return { error: 'El JSON no contiene una lista de proyectos.' }
  }
  const saneados = lista.map(sanear)
  const proyectos = saneados.filter((p) => p.nombre || p.cliente)
  if (!proyectos.length) {
    return { error: 'El archivo no tiene ningún proyecto con nombre o cliente.' }
  }
  // Decir cuántos se cayeron: callarlo es mentir sobre lo que se importó.
  return { proyectos, descartados: saneados.length - proyectos.length }
}
