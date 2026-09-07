// Servidor del planificador: sirve el build de Vite y una API mínima sobre
// Postgres. Sin framework: son tres rutas y un servidor de archivos estáticos.

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aplicarEsquema,
  cuantosProyectos,
  escribirProyectos,
  leerProyectos,
  pool,
} from './base.js'
import { sembrar } from './semilla.js'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ESTATICO = join(AQUI, '..', 'dist')
const PUERTO = Number(process.env.PORT || 3000)

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

function responder(res, codigo, cuerpo, cabeceras = {}) {
  const texto = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...cabeceras,
  })
  res.end(texto)
}

async function leerCuerpo(req, limite = 4 * 1024 * 1024) {
  const trozos = []
  let total = 0
  for await (const trozo of req) {
    total += trozo.length
    if (total > limite) throw new Error('El cuerpo de la petición es demasiado grande.')
    trozos.push(trozo)
  }
  if (!total) return null
  return JSON.parse(Buffer.concat(trozos).toString('utf8'))
}

async function servirEstatico(req, res, ruta) {
  // Nada de salir de dist con ../, venga como venga la ruta.
  const limpia = normalize(ruta).replace(/^(\.\.[/\\])+/, '')
  let archivo = join(ESTATICO, limpia)

  try {
    const info = await stat(archivo)
    if (info.isDirectory()) archivo = join(archivo, 'index.html')
  } catch {
    // Ruta de la SPA: cualquier cosa que no sea un archivo cae en el index.
    archivo = join(ESTATICO, 'index.html')
  }

  try {
    const contenido = await readFile(archivo)
    const tipo = TIPOS[extname(archivo)] ?? 'application/octet-stream'
    const inmutable = archivo.includes(`${join('dist', 'assets')}`) || /\/assets\//.test(archivo)
    res.writeHead(200, {
      'Content-Type': tipo,
      'Cache-Control': inmutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    })
    res.end(contenido)
  } catch {
    responder(res, 404, { error: 'No encontrado.' })
  }
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const ruta = url.pathname

  try {
    if (ruta === '/api/salud') {
      await pool.query('SELECT 1')
      return responder(res, 200, { ok: true, base: 'postgres' })
    }

    if (ruta === '/api/proyectos' && req.method === 'GET') {
      return responder(res, 200, { proyectos: await leerProyectos() })
    }

    if (ruta === '/api/proyectos' && req.method === 'PUT') {
      const cuerpo = await leerCuerpo(req)
      if (!cuerpo || !Array.isArray(cuerpo.proyectos)) {
        return responder(res, 400, { error: 'Se esperaba { proyectos: [...] }.' })
      }
      const guardados = await escribirProyectos(cuerpo.proyectos)
      return responder(res, 200, { ok: true, guardados })
    }

    if (ruta.startsWith('/api/')) {
      return responder(res, 404, { error: 'Ruta desconocida.' })
    }

    return servirEstatico(req, res, ruta)
  } catch (error) {
    console.error('[planificador]', error)
    return responder(res, 500, { error: 'Error del servidor.' })
  }
})

async function arrancar() {
  if (!process.env.DATABASE_URL) {
    console.error('[planificador] Falta DATABASE_URL. El servidor necesita Postgres.')
    process.exit(1)
  }

  await aplicarEsquema()
  console.log('[planificador] Esquema aplicado.')

  // Sembrar sólo si se pide Y la base está vacía: nunca pisar datos reales.
  if (process.env.SEMBRAR === '1') {
    const total = await cuantosProyectos()
    if (total === 0) {
      const puestos = await sembrar()
      console.log(`[planificador] Base vacía: sembrados ${puestos} proyectos de ejemplo.`)
    } else {
      console.log(`[planificador] SEMBRAR=1 pero ya hay ${total} proyectos. No se toca nada.`)
    }
  }

  servidor.listen(PUERTO, () => {
    console.log(`[planificador] Escuchando en el puerto ${PUERTO}.`)
  })
}

for (const senal of ['SIGTERM', 'SIGINT']) {
  process.on(senal, () => {
    servidor.close(() => pool.end().then(() => process.exit(0)))
  })
}

arrancar().catch((error) => {
  console.error('[planificador] No se pudo arrancar:', error)
  process.exit(1)
})
