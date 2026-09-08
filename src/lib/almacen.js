// Persistencia. La app funciona de dos maneras y decide sola cuál:
//
//   · Con servidor (el despliegue): habla con /api y los datos viven en Postgres.
//   · Sin servidor (`npm run dev` a secas): guarda en el localStorage de este
//     navegador, como siempre.
//
// En los dos casos los datos salen enteros a un .json cuando quieras.

import { descargar } from './descargar.js'
import { sanear, sanearCotizacion } from './modelo.js'

const CLAVE = 'diabolical.planificador.v1'
const FORMATO = 'diabolical-planificador'
const VERSION = 1

let modo = null // 'api' | 'local'

// El servidor ha contestado 401: la sesión ya no vale. Se apunta aquí para que
// la interfaz pueda pedir la contraseña otra vez sin desmontarse ni perder lo
// que estuvieras escribiendo.
let caducada = false

export function sesionCaducada() {
  return caducada
}

export function sesionRenovada() {
  caducada = false
}

// El servidor ha contestado 503: está vivo, pero sin contraseña configurada no
// sirve nada. No es lo mismo que no haber entrado, y no se puede arreglar desde
// aquí: hay que tocar una variable de entorno.
let sinConfigurar = false

export function servidorSinClave() {
  return sinConfigurar
}

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

/** Normaliza lo que venga de donde venga: servidor, navegador o archivo. */
function ordenar(datos) {
  return {
    proyectos: Array.isArray(datos?.proyectos) ? datos.proyectos.map(sanear) : [],
    cotizaciones: Array.isArray(datos?.cotizaciones)
      ? datos.cotizaciones.map(sanearCotizacion)
      : [],
  }
}

export async function cargar() {
  if ((await detectarModo()) === 'api') {
    const res = await fetch('/api/datos')
    if (res.status === 503) {
      sinConfigurar = true
      throw new Error('El servidor no tiene contraseña configurada.')
    }
    if (res.status === 401) {
      caducada = true
      throw new Error('Hay que entrar antes de leer nada.')
    }
    if (!res.ok) throw new Error('No se pudieron leer los datos del servidor.')
    caducada = false
    return ordenar(await res.json())
  }

  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null
    const datos = JSON.parse(crudo)
    if (!Array.isArray(datos?.proyectos)) return null
    return ordenar(datos)
  } catch {
    return null
  }
}

export async function guardar(datos) {
  const cuerpo = { proyectos: datos.proyectos ?? [], cotizaciones: datos.cotizaciones ?? [] }

  if ((await detectarModo()) === 'api') {
    try {
      const res = await fetch('/api/datos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      // Un 401 aquí no es un fallo de red: es que la sesión ha caducado. Los
      // datos siguen en pantalla y se guardarán en cuanto se vuelva a entrar.
      caducada = res.status === 401
      return res.ok
    } catch {
      return false
    }
  }

  try {
    localStorage.setItem(CLAVE, JSON.stringify({ formato: FORMATO, version: VERSION, ...cuerpo }))
    return true
  } catch {
    return false
  }
}

export function exportar({ proyectos, cotizaciones }) {
  const contenido = JSON.stringify(
    {
      formato: FORMATO,
      version: VERSION,
      exportado: new Date().toISOString(),
      proyectos,
      cotizaciones,
    },
    null,
    2,
  )
  const sello = new Date().toISOString().slice(0, 10)
  return descargar(
    new Blob([contenido], { type: 'application/json' }),
    `diabolical-proyectos-${sello}.json`,
  )
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
  const cotizaciones = Array.isArray(datos?.cotizaciones)
    ? datos.cotizaciones.map(sanearCotizacion)
    : []
  // Decir cuántos se cayeron: callarlo es mentir sobre lo que se importó.
  return { proyectos, cotizaciones, descartados: saneados.length - proyectos.length }
}
