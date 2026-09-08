// Genera el hash de la contraseña de acceso.
//
//   npm run clave          (o: node servidor/clave.js)
//
// La contraseña se teclea aquí y no sale de esta máquina: no viaja por los
// argumentos —que quedan en el historial del intérprete y en la lista de
// procesos— ni se escribe en ningún archivo. Lo único que se copia a Dokploy es
// el hash, que no sirve para entrar.

import { createInterface } from 'node:readline'
import { randomBytes } from 'node:crypto'

import { hashClave } from './sesion.js'

/*
 * Leer una contraseña por consola es más frágil de lo que parece, y en Windows
 * más. Hay dos mundos:
 *
 *  · Consola de verdad (PowerShell, cmd): `isTTY` es cierto y se puede pedir el
 *    modo crudo, que es lo que permite leer tecla a tecla sin pintar nada.
 *
 *  · Todo lo demás (Git Bash, y `npm run` según cómo herede la entrada): `isTTY`
 *    llega sin definir aunque haya una persona delante tecleando. La primera
 *    versión de este archivo tomaba eso por «me están pasando datos por una
 *    tubería» y esperaba un fin de fichero que nunca llegaba: ni prompt, ni eco,
 *    ni forma de escribir. Parecía colgado y en realidad estaba escuchando.
 *    Aquí se lee por líneas, que es lo que sí llega. A cambio no se puede
 *    ocultar el texto, y eso se avisa antes en vez de dejar creer que lo está.
 */
const HAY_CONSOLA = (() => {
  if (process.stdin.isTTY !== true) return false
  // No basta con que lo diga: hay entornos que se declaran consola y luego
  // rechazan el modo crudo. Se prueba de verdad, que sale gratis.
  try {
    process.stdin.setRawMode(true)
    process.stdin.setRawMode(false)
    return true
  } catch {
    return false
  }
})()

/** Consola de verdad: modo crudo, tecla a tecla, sin pintar lo tecleado. */
function preguntarOculto(rotulo) {
  return new Promise((resolver) => {
    const entrada = process.stdin
    process.stdout.write(rotulo)
    entrada.setRawMode(true)
    entrada.resume()
    entrada.setEncoding('utf8')

    let clave = ''
    const alTeclear = (tecla) => {
      // Ctrl+C y Ctrl+D: salir sin dejar nada a medias.
      if (tecla === '\u0003' || tecla === '\u0004') {
        entrada.setRawMode(false)
        entrada.pause()
        process.stdout.write('\n')
        process.exit(1)
      }
      if (tecla === '\r' || tecla === '\n') {
        entrada.setRawMode(false)
        entrada.pause()
        entrada.removeListener('data', alTeclear)
        process.stdout.write('\n')
        resolver(clave.trim())
        return
      }
      if (tecla === '\u007f' || tecla === '\b') {
        clave = clave.slice(0, -1)
        return
      }
      clave += tecla
    }

    entrada.on('data', alTeclear)
  })
}

/*
 * Lo demás: una sola consola de líneas para las dos preguntas —abrir una segunda
 * sobre la misma entrada la deja muda— y una cola por delante.
 *
 * La cola no sobra: cuando la entrada viene por una tubería, las dos líneas
 * llegan de golpe y `readline` las anuncia antes de que la segunda pregunta haya
 * tenido tiempo de escuchar. Sin cola, la segunda respuesta se pierde en el aire
 * y el programa se queda esperando algo que ya pasó.
 */
const lineas = HAY_CONSOLA
  ? null
  : createInterface({ input: process.stdin, output: process.stdout, terminal: false })

const dichas = []
const esperando = []
let cerrada = false

lineas?.on('line', (texto) => {
  const siguiente = esperando.shift()
  if (siguiente) siguiente(texto.trim())
  else dichas.push(texto.trim())
})

lineas?.on('close', () => {
  cerrada = true
  // Lo que quedara esperando ya no va a llegar nunca.
  while (esperando.length) esperando.shift()('')
})

function preguntarVisible(rotulo) {
  process.stdout.write(rotulo)
  if (dichas.length) {
    const texto = dichas.shift()
    process.stdout.write(`${texto}
`)
    return Promise.resolve(texto)
  }
  if (cerrada) return Promise.resolve('')
  return new Promise((resolver) => esperando.push(resolver))
}

const preguntar = HAY_CONSOLA ? preguntarOculto : preguntarVisible

if (!HAY_CONSOLA) {
  console.log(
    '\nEsta terminal no deja ocultar lo que escribes: la contraseña se verá en\n' +
      'pantalla mientras la tecleas. Si prefieres que no se vea, cierra esto y\n' +
      'ejecútalo en PowerShell:  node servidor/clave.js\n',
  )
}

function abortar(motivo) {
  console.error(`\n${motivo}\n`)
  lineas?.close()
  process.exit(1)
}

const clave = await preguntar('Contraseña de acceso: ')

if (clave.length < 12) {
  abortar(
    'Demasiado corta: hacen falta doce caracteres o más. Esta contraseña es lo\n' +
      'único que separa tu cartera de clientes de Internet entero, así que una\n' +
      'frase larga que puedas teclear de memoria vale más que ocho símbolos raros.',
  )
}

const confirmacion = await preguntar('Otra vez, para confirmar: ')
if (confirmacion !== clave) abortar('No coinciden. No se ha generado nada.')

const hash = await hashClave(clave)
const secreto = randomBytes(48).toString('base64')
lineas?.close()

console.log(`
Listo. En Dokploy, en las variables de entorno de la aplicación, AÑADE estas dos
líneas a las que ya haya. No borres DATABASE_URL.

CLAVE_HASH=${hash}

SECRETO_SESION=${secreto}

La segunda es con lo que se firman las sesiones: sin ella el servidor se inventa
una al arrancar y cada despliegue echa a todo el mundo.

Del hash no se saca la contraseña: esas dos líneas se pueden pegar en un chat.
La contraseña, no. Guárdala donde guardes las demás.
`)
