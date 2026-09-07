// Semilla: mete en Postgres los mismos proyectos de ejemplo que ve la app
// cuando corre sin servidor. Es el único sitio donde vive ese dato, así que no
// hay dos versiones que se puedan desincronizar.

import { readFile } from 'node:fs/promises'
import { proyectosDeEjemplo } from '../src/data/ejemplo.js'
import { sanear } from '../src/lib/modelo.js'
import { aplicarEsquema, cuantosProyectos, escribirProyectos, pool } from './base.js'

/**
 * De dónde salen los proyectos de la semilla, en orden de preferencia:
 *
 *   1. SEMILLA_JSON     — el JSON entero en una variable de entorno.
 *   2. SEMILLA_ARCHIVO  — la ruta a un .json dentro del contenedor.
 *   3. los ejemplos     — lo que trae el repositorio.
 *
 * Las dos primeras existen para poder sembrar datos reales sin escribirlos
 * nunca en el repositorio: las variables de entorno del servidor son privadas,
 * el código fuente no tiene por qué serlo.
 */
async function proyectosDeLaSemilla() {
  const crudo = process.env.SEMILLA_JSON
    ? process.env.SEMILLA_JSON
    : process.env.SEMILLA_ARCHIVO
      ? await readFile(process.env.SEMILLA_ARCHIVO, 'utf8')
      : null

  if (!crudo) return { proyectos: proyectosDeEjemplo(), origen: 'los ejemplos del repositorio' }

  const datos = JSON.parse(crudo)
  const lista = Array.isArray(datos) ? datos : datos?.proyectos
  if (!Array.isArray(lista)) {
    throw new Error('La semilla no contiene una lista de proyectos.')
  }
  return {
    proyectos: lista.map(sanear),
    origen: process.env.SEMILLA_JSON ? 'SEMILLA_JSON' : process.env.SEMILLA_ARCHIVO,
  }
}

export async function sembrar() {
  const { proyectos, origen } = await proyectosDeLaSemilla()
  await escribirProyectos(proyectos)
  console.log(`[semilla] ${proyectos.length} proyectos desde ${origen}.`)
  return proyectos.length
}

// Ejecutado a mano: `npm run semilla`. Avisa antes de pisar nada.
const esEjecucionDirecta = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))

if (esEjecucionDirecta) {
  const forzar = process.argv.includes('--forzar')

  try {
    if (!process.env.DATABASE_URL) {
      console.error('Falta DATABASE_URL.')
      process.exit(1)
    }

    await aplicarEsquema()
    const total = await cuantosProyectos()

    if (total > 0 && !forzar) {
      console.error(
        `La base ya tiene ${total} proyectos. La semilla los borraría todos.\n` +
          'Si es lo que quieres, vuelve a lanzarlo con --forzar.',
      )
      process.exit(1)
    }

    const puestos = await sembrar()
    console.log(`Sembrados ${puestos} proyectos de ejemplo.`)
  } catch (error) {
    console.error('No se pudo sembrar:', error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}
