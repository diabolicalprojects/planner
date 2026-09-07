// Acceso al planificador. Una contraseña compartida, comprobada en el servidor.
//
// Un formulario de acceso que sólo apunta algo en el navegador no protege nada:
// la API seguiría abierta y cualquiera podría leerse o borrarse la cartera con
// una línea de `curl`. Aquí la contraseña se comprueba contra un hash que vive
// en una variable de entorno, y lo que viaja después es una cookie firmada que
// el navegador no puede leer ni fabricar.
//
// Sin dependencias: `node:crypto` trae todo lo que hace falta.

import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const derivar = promisify(scrypt)

/* --- La contraseña -------------------------------------------------------- */

// Coste de scrypt. N=16384 tarda unos 60 ms en un servidor modesto: nada para
// quien entra una vez, mucho para quien prueba contraseñas a lo bruto.
const N = 16384
const R = 8
const P = 1
const LARGO = 64

/** Devuelve la cadena que se guarda en la variable de entorno. */
export async function hashClave(clave) {
  const sal = randomBytes(32)
  const llave = await derivar(clave.normalize('NFKC'), sal, LARGO, { N, r: R, p: P })
  return ['scrypt', N, R, P, sal.toString('base64'), llave.toString('base64')].join('$')
}

/**
 * ¿Es esta la contraseña? Comparación en tiempo constante: comparar con `===`
 * tarda más cuanto más acierta, y eso se puede medir desde fuera.
 */
export async function verificarClave(clave, guardado) {
  try {
    const [tipo, n, r, p, salB64, llaveB64] = String(guardado).split('$')
    if (tipo !== 'scrypt') return false
    const esperada = Buffer.from(llaveB64, 'base64')
    const calculada = await derivar(clave.normalize('NFKC'), Buffer.from(salB64, 'base64'), esperada.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    })
    return timingSafeEqual(esperada, calculada)
  } catch {
    return false
  }
}

/* --- La sesión ------------------------------------------------------------- */

export const COOKIE = 'dbl_sesion'
const DIAS = 14
export const DURACION = DIAS * 24 * 60 * 60 * 1000

// Si no se fija, se inventa una al arrancar: las sesiones se caen en cada
// despliegue, que es molesto pero nunca inseguro. Se avisa por consola.
const SECRETO = process.env.SECRETO_SESION || randomBytes(48).toString('base64')
export const SECRETO_EFIMERO = !process.env.SECRETO_SESION

const b64 = (b) => Buffer.from(b).toString('base64url')
const firma = (texto) => createHmac('sha256', SECRETO).update(texto).digest('base64url')

/** Un vale con fecha de caducidad, firmado. No lleva dentro nada privado. */
export function firmarSesion(ahora = Date.now()) {
  const cuerpo = b64(JSON.stringify({ exp: ahora + DURACION }))
  return `${cuerpo}.${firma(cuerpo)}`
}

export function sesionValida(vale) {
  if (typeof vale !== 'string' || !vale.includes('.')) return false
  const [cuerpo, dada] = vale.split('.')
  const esperada = Buffer.from(firma(cuerpo))
  const recibida = Buffer.from(String(dada))
  if (esperada.length !== recibida.length) return false
  if (!timingSafeEqual(esperada, recibida)) return false
  try {
    const { exp } = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'))
    return typeof exp === 'number' && Date.now() < exp
  } catch {
    return false
  }
}

/** Lee una cookie de la petición sin traerse una librería para ello. */
export function leerCookie(req, nombre) {
  const crudo = req.headers.cookie
  if (!crudo) return null
  for (const trozo of crudo.split(';')) {
    const corte = trozo.indexOf('=')
    if (corte === -1) continue
    if (trozo.slice(0, corte).trim() === nombre) {
      return decodeURIComponent(trozo.slice(corte + 1).trim())
    }
  }
  return null
}

/**
 * `Secure` sólo cuando la conexión es de verdad segura. Detrás de Traefik, que
 * termina el TLS, la petición llega en claro al proceso: quien sabe si hubo
 * https es la cabecera que pone el proxy.
 */
function esSegura(req) {
  const reenviado = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim()
  return reenviado === 'https' || Boolean(req.socket?.encrypted)
}

export function cookieDeSesion(req, vale) {
  const partes = [
    `${COOKIE}=${vale}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(DURACION / 1000)}`,
  ]
  if (esSegura(req)) partes.push('Secure')
  return partes.join('; ')
}

export function cookieVacia(req) {
  const partes = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (esSegura(req)) partes.push('Secure')
  return partes.join('; ')
}

/* --- Freno a la fuerza bruta ------------------------------------------------ */

const INTENTOS = 8
const CASTIGO = 5 * 60 * 1000
const fallos = new Map()

function limpiar(ahora) {
  for (const [ip, dato] of fallos) {
    if (ahora - dato.visto > CASTIGO * 2) fallos.delete(ip)
  }
}

/** Quién llama. Detrás del proxy, la IP de verdad viene en la cabecera. */
export function quien(req) {
  const reenviado = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return reenviado || req.socket?.remoteAddress || 'desconocido'
}

/** Devuelve los milisegundos que quedan de castigo, o 0 si puede probar. */
export function castigo(ip) {
  const dato = fallos.get(ip)
  if (!dato || dato.hasta <= Date.now()) return 0
  return dato.hasta - Date.now()
}

export function apuntarFallo(ip) {
  const ahora = Date.now()
  limpiar(ahora)
  const dato = fallos.get(ip) ?? { cuenta: 0, hasta: 0, visto: ahora }
  dato.cuenta += 1
  dato.visto = ahora
  if (dato.cuenta >= INTENTOS) {
    dato.hasta = ahora + CASTIGO
    dato.cuenta = 0
  }
  fallos.set(ip, dato)
}

export function olvidarFallos(ip) {
  fallos.delete(ip)
}
