// Semilla: mete en Postgres los mismos proyectos de ejemplo que ve la app
// cuando corre sin servidor. Es el único sitio donde vive ese dato, así que no
// hay dos versiones que se puedan desincronizar.

import { proyectosDeEjemplo } from '../src/data/ejemplo.js'
import { aplicarEsquema, cuantosProyectos, escribirProyectos, pool } from './base.js'

export async function sembrar() {
  const proyectos = proyectosDeEjemplo()
  await escribirProyectos(proyectos)
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
