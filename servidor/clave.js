// Genera el hash de la contraseña de acceso.
//
//   npm run clave
//
// La contraseña se teclea aquí y no sale de esta máquina: no viaja por los
// argumentos (que quedan en el historial del intérprete y en la lista de
// procesos) ni se escribe en ningún archivo. Lo único que se copia a Dokploy es
// el hash, que no sirve para entrar.

import { hashClave } from './sesion.js'

function leerOculto(pregunta) {
  return new Promise((resolver, rechazar) => {
    const entrada = process.stdin

    // Sin terminal (una tubería, un contenedor) se lee tal cual llegue.
    if (!entrada.isTTY) {
      let texto = ''
      entrada.setEncoding('utf8')
      entrada.on('data', (t) => (texto += t))
      entrada.on('end', () => resolver(texto.replace(/\r?\n$/, '')))
      entrada.on('error', rechazar)
      return
    }

    process.stdout.write(pregunta)
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
        resolver(clave)
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

const clave = await leerOculto('Contraseña de acceso: ')

if (clave.length < 12) {
  console.error(
    '\nDemasiado corta. Doce caracteres es el suelo: esta contraseña es lo único\n' +
      'que separa tu cartera de clientes de Internet entero.\n',
  )
  process.exit(1)
}

const confirmar = process.stdin.isTTY ? await leerOculto('Otra vez, para confirmar: ') : clave
if (confirmar !== clave) {
  console.error('\nNo coinciden. No se ha generado nada.\n')
  process.exit(1)
}

const hash = await hashClave(clave)

console.log(`
Listo. En Dokploy, en las variables de entorno de la aplicación:

CLAVE_HASH=${hash}

Y una más, para que las sesiones sobrevivan a los despliegues. Sin ella el
servidor se inventa una al arrancar y cada redespliegue echa a todo el mundo:

SECRETO_SESION=${(await import('node:crypto')).randomBytes(48).toString('base64')}

El hash no sirve para entrar: guarda la contraseña donde guardes las demás.
`)
