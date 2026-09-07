import { useRef, useState } from 'react'
import { ArrowRight, Warning } from '@phosphor-icons/react'
import { entrar } from '../lib/sesion.js'

/**
 * La puerta.
 *
 * Es la única pantalla de toda la aplicación que va en negro. El planificador
 * vive sobre gris claro; esto es de fuera, y cruzarlo se nota. La marca, que en
 * el resto del sistema aparece del tamaño de un sello, aquí se dice entera.
 *
 * Lo que hay detrás no es decorado: la contraseña se comprueba en el servidor y
 * lo que queda es una cookie firmada. Un formulario que sólo apuntara algo en el
 * navegador dejaría la API abierta, y entonces esto sería un cartel, no una
 * puerta.
 */
export default function Acceso({ alEntrar, nota = null }) {
  const [clave, setClave] = useState('')
  const [error, setError] = useState(null)
  const [mayusculas, setMayusculas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const campo = useRef(null)

  async function enviar(evento) {
    evento.preventDefault()
    if (enviando) return
    if (!clave) {
      setError('Escribe la contraseña.')
      campo.current?.focus()
      return
    }
    setEnviando(true)
    setError(null)

    const resultado = await entrar(clave)
    if (resultado.ok) {
      alEntrar()
      return
    }

    // Vaciar el campo es lo que dice que el intento llegó y se rechazó: con el
    // mismo texto puesto y el mismo mensaje debajo, el segundo fallo no se
    // distingue del primero.
    setEnviando(false)
    setError(resultado.error)
    setClave('')
    campo.current?.focus()
  }

  return (
    <main className="acceso oscuro">
      <form className="acceso__caja" onSubmit={enviar}>
        <img
          className="acceso__logo"
          src="/marca/LOGO-DIABOLICAL-HORIZONTAL-BLANCO.svg"
          alt="DIABOLICAL IA Services"
          width="352"
          height="90"
        />

        <p className="acceso__apoyo">Planificador de proyectos</p>

        {/* Volver a ver la puerta con la aplicación abierta asusta: hay que
            decir por qué y, sobre todo, que no se ha perdido nada. */}
        {nota ? <p className="acceso__nota-alta">{nota}</p> : null}

        <div className="acceso__bloque">
          <label className="acceso__etiqueta" htmlFor="acceso-clave">
            Contraseña
          </label>
          <input
            id="acceso-clave"
            ref={campo}
            className="acceso__campo"
            type="password"
            name="clave"
            value={clave}
            autoComplete="current-password"
            autoFocus
            enterKeyHint="go"
            spellCheck="false"
            onChange={(e) => setClave(e.target.value)}
            onKeyUp={(e) => setMayusculas(e.getModifierState?.('CapsLock') ?? false)}
            aria-describedby={error ? 'acceso-error' : undefined}
            aria-invalid={error ? true : undefined}
          />
          {mayusculas ? (
            <p className="acceso__nota">Bloq Mayús está activado.</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="acceso__boton"
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando ? (
            <>
              <span className="girando" aria-hidden="true" /> Entrando…
            </>
          ) : (
            <>
              Entrar <ArrowRight size={16} weight="bold" />
            </>
          )}
        </button>

        {error ? (
          <p className="acceso__error" id="acceso-error" role="alert">
            <Warning size={15} weight="fill" />
            {error}
          </p>
        ) : null}
      </form>
    </main>
  )
}
