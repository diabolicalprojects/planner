// Servidor del planificador: sirve el build de Vite y una API mínima sobre
// Postgres. Sin framework: son tres rutas y un servidor de archivos estáticos.

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aplicarEsquema,
  cuantosProyectos,
  escribirDatos,
  leerDatos,
  leerProyectos,
  pool,
} from './base.js'
import { sembrar } from './semilla.js'
import {
  SECRETO_EFIMERO,
  apuntarFallo,
  castigo,
  cookieDeSesion,
  cookieVacia,
  COOKIE,
  firmarSesion,
  leerCookie,
  olvidarFallos,
  quien,
  sesionValida,
  verificarClave,
} from './sesion.js'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ESTATICO = join(AQUI, '..', 'dist')
const PUERTO = Number(process.env.PORT || 3000)

const CLAVE_HASH = process.env.CLAVE_HASH || ''
// Sin contraseña la API queda abierta de par en par, así que por defecto no
// sirve nada. Abrirla es una decisión que hay que tomar a mano, y sólo tiene
// sentido en una máquina que no mira a Internet.
const SIN_CANDADO = process.env.PERMITIR_SIN_CLAVE === '1'
const PROTEGIDO = Boolean(CLAVE_HASH)

const dentro = (req) => !PROTEGIDO || sesionValida(leerCookie(req, COOKIE))

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
    // Pública a propósito: es como la interfaz averigua si hay servidor detrás.
    // No devuelve ningún dato, sólo si el servidor está vivo y si pide clave.
    if (ruta === '/api/salud') {
      await pool.query('SELECT 1')
      return responder(res, 200, { ok: true, base: 'postgres', protegido: PROTEGIDO })
    }

    /* --- Sesión --------------------------------------------------------- */

    if (ruta === '/api/sesion' && req.method === 'GET') {
      return responder(res, 200, { protegido: PROTEGIDO, dentro: dentro(req) })
    }

    if (ruta === '/api/sesion' && req.method === 'POST') {
      if (!PROTEGIDO) return responder(res, 200, { dentro: true, protegido: false })

      const ip = quien(req)
      const espera = castigo(ip)
      if (espera > 0) {
        return responder(res, 429, {
          error: 'Demasiados intentos.',
          segundos: Math.ceil(espera / 1000),
        })
      }

      const cuerpo = await leerCuerpo(req, 4096)
      const clave = typeof cuerpo?.clave === 'string' ? cuerpo.clave : ''
      if (!clave || !(await verificarClave(clave, CLAVE_HASH))) {
        apuntarFallo(ip)
        return responder(res, 401, { error: 'La contraseña no es correcta.' })
      }

      olvidarFallos(ip)
      return responder(res, 200, { dentro: true }, { 'Set-Cookie': cookieDeSesion(req, firmarSesion()) })
    }

    if (ruta === '/api/sesion' && req.method === 'DELETE') {
      return responder(res, 200, { dentro: false }, { 'Set-Cookie': cookieVacia(req) })
    }

    /* --- De aquí abajo, sólo con la puerta abierta ----------------------- */

    if (ruta.startsWith('/api/')) {
      if (!PROTEGIDO && !SIN_CANDADO) {
        return responder(res, 503, {
          error:
            'El servidor no tiene contraseña configurada. Genera una con `npm run clave` ' +
            'y ponla en CLAVE_HASH.',
        })
      }
      if (!dentro(req)) {
        return responder(res, 401, { error: 'Hay que entrar primero.' })
      }
    }

    // Todo lo que guarda la app, de una vez: la interfaz trabaja con la
    // colección entera y así el guardado es una sola transacción.
    if (ruta === '/api/datos' && req.method === 'GET') {
      return responder(res, 200, await leerDatos())
    }

    if (ruta === '/api/datos' && req.method === 'PUT') {
      const cuerpo = await leerCuerpo(req)
      if (!cuerpo || !Array.isArray(cuerpo.proyectos)) {
        return responder(res, 400, { error: 'Se esperaba { proyectos: [...], cotizaciones: [...] }.' })
      }
      const guardados = await escribirDatos({
        proyectos: cuerpo.proyectos,
        cotizaciones: Array.isArray(cuerpo.cotizaciones) ? cuerpo.cotizaciones : [],
      })
      return responder(res, 200, { ok: true, guardados })
    }

    // Se mantiene por compatibilidad: hay copias y scripts que apuntan aquí.
    if (ruta === '/api/proyectos' && req.method === 'GET') {
      return responder(res, 200, { proyectos: await leerProyectos() })
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

  if (!PROTEGIDO) {
    console.warn(
      SIN_CANDADO
        ? '[planificador] PELIGRO: PERMITIR_SIN_CLAVE=1. La API está abierta a cualquiera que sepa la dirección. Esto sólo vale en una máquina que no mira a Internet.'
        : '[planificador] Falta CLAVE_HASH: la API no servirá nada. Genérala con `npm run clave`.',
    )
  } else if (SECRETO_EFIMERO) {
    console.warn(
      '[planificador] Falta SECRETO_SESION: se ha inventado una al arrancar, así que cada despliegue cerrará la sesión de todo el mundo. `npm run clave` la propone.',
    )
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
