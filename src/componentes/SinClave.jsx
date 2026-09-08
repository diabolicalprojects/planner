/**
 * El servidor está vivo pero no tiene contraseña configurada, así que no sirve
 * ni un dato. Es a propósito: antes la API estaba abierta y cualquiera con la
 * dirección podía leerse o borrarse la cartera entera.
 *
 * Lo que no puede ser es que eso se vea como una cartera vacía. Quien abre esto
 * y encuentra cero proyectos piensa que ha perdido su trabajo, no que falta una
 * variable de entorno. Los datos están donde estaban; lo que falta se dice con
 * su nombre y con lo que hay que teclear para arreglarlo.
 */
export default function SinClave() {
  return (
    <main className="acceso oscuro">
      <div className="acceso__caja">
        <img
          className="acceso__logo"
          src="/marca/LOGO-DIABOLICAL-HORIZONTAL-BLANCO.svg"
          alt="DIABOLICAL IA Services"
          width="352"
          height="90"
        />

        <p className="acceso__apoyo">Falta configurar el acceso</p>

        <p className="acceso__nota-alta">
          El servidor no tiene contraseña, así que no está sirviendo nada. Tus proyectos siguen
          enteros en la base de datos: lo que falta es decirle cuál es la contraseña.
        </p>

        <p className="acceso__paso">
          Genera el hash con <code>npm run clave</code> y ponlo en la variable{' '}
          <code>CLAVE_HASH</code> de la aplicación. Al volver a desplegar, esta pantalla se
          convierte en la de entrar.
        </p>
      </div>
    </main>
  )
}
