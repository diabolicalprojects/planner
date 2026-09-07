// El acceso, visto desde el navegador.
//
// La sesión vive en una cookie que este código no puede leer (`HttpOnly`), y es
// mejor así: lo que el navegador puede leer, lo puede leer cualquier script que
// se cuele en la página. Aquí sólo se pregunta al servidor si la puerta está
// abierta y se le pide que la abra o la cierre.

import { detectarModo } from './almacen.js'

/**
 * ¿Hace falta contraseña y estamos dentro?
 *
 * Sin servidor detrás —`npm run dev` a secas— no hay a quién preguntar ni nada
 * que proteger: los datos están en el navegador de quien mira la pantalla.
 */
export async function estadoSesion() {
  if ((await detectarModo()) !== 'api') return { protegido: false, dentro: true }
  try {
    const res = await fetch('/api/sesion', { headers: { Accept: 'application/json' } })
    if (!res.ok) return { protegido: true, dentro: false }
    const dato = await res.json()
    return { protegido: Boolean(dato?.protegido), dentro: Boolean(dato?.dentro) }
  } catch {
    // Sin respuesta no se puede afirmar que estemos dentro. Ante la duda, fuera.
    return { protegido: true, dentro: false, sinRespuesta: true }
  }
}

/** Devuelve `{ ok: true }` o `{ error, segundos? }` con un motivo legible. */
export async function entrar(clave) {
  let res
  try {
    res = await fetch('/api/sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave }),
    })
  } catch {
    return { error: 'No se ha podido hablar con el servidor. Comprueba la conexión.' }
  }

  if (res.ok) return { ok: true }

  const dato = await res.json().catch(() => null)
  if (res.status === 429) {
    const minutos = Math.max(1, Math.ceil((dato?.segundos ?? 300) / 60))
    return {
      error: `Demasiados intentos seguidos. Vuelve a probar en ${minutos} ${
        minutos === 1 ? 'minuto' : 'minutos'
      }.`,
    }
  }
  if (res.status === 503) {
    return { error: dato?.error ?? 'El servidor todavía no tiene contraseña configurada.' }
  }
  return { error: dato?.error ?? 'La contraseña no es correcta.' }
}

export async function salir() {
  try {
    await fetch('/api/sesion', { method: 'DELETE' })
  } catch {
    // Da igual: lo que decide es la cookie, y si no se ha podido borrar aquí,
    // caduca sola. Recargar deja la pantalla en su sitio de todas formas.
  }
  window.location.reload()
}
