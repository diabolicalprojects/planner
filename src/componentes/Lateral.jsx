import {
  ArrowSquareOut,
  FileText,
  Info,
  Kanban,
  Keyboard,
  ListBullets,
  SignOut,
  UploadSimple,
} from '@phosphor-icons/react'

const VISTAS = [
  { id: 'tablero', etiqueta: 'Tablero', Icono: Kanban },
  { id: 'lista', etiqueta: 'Proyectos', Icono: ListBullets },
  { id: 'cotizaciones', etiqueta: 'Cotizaciones', Icono: FileText },
]

const AYUDA = [
  { id: 'atajos', etiqueta: 'Atajos', Icono: Keyboard },
  { id: 'acerca', etiqueta: 'Acerca de', Icono: Info },
]

/**
 * Navegación permanente. Sustituye a la barra de menús: lo que antes había que
 * desplegar para encontrar, ahora se ve siempre.
 */
export default function Lateral({ vista, irA, cuantos, alExportar, alImportar, alSalir }) {
  const fila = ({ id, etiqueta, Icono }, cuenta) => (
    <button
      type="button"
      key={id}
      className={`enlace-nav ${vista === id ? 'enlace-nav--activo' : ''}`.trim()}
      aria-current={vista === id ? 'page' : undefined}
      onClick={() => irA({ vista: id })}
    >
      <Icono size={19} weight={vista === id ? 'fill' : 'regular'} />
      {etiqueta}
      {cuenta !== undefined ? <span className="enlace-nav__cuenta cifra">{cuenta}</span> : null}
    </button>
  )

  return (
    <aside className="lateral oscuro">
      <div className="lateral__marca">
        <img
          className="lateral__logo"
          src="/marca/ICONO-DIABOLICAL-BLANCO.svg"
          alt=""
          width="34"
          height="32"
        />
        <span className="lateral__nombre">
          <b>DIABOLICAL</b>
          <span>IA Services</span>
        </span>
      </div>

      <nav className="lateral__grupo" aria-label="Vistas">
        <p className="lateral__rotulo">Cartera</p>
        {fila(VISTAS[0], cuantos.activos)}
        {fila(VISTAS[1], cuantos.total)}
        {fila(VISTAS[2], cuantos.cotizaciones)}
      </nav>

      <div className="lateral__grupo lateral__grupo--pie">
        <p className="lateral__rotulo">Tus datos</p>
        <button type="button" className="enlace-nav" onClick={alExportar}>
          <ArrowSquareOut size={19} />
          Exportar JSON
        </button>
        <button type="button" className="enlace-nav" onClick={alImportar}>
          <UploadSimple size={19} />
          Importar JSON
        </button>
        {AYUDA.map((entrada) => fila(entrada))}
        {alSalir ? (
          <button type="button" className="enlace-nav" onClick={alSalir}>
            <SignOut size={19} />
            Salir
          </button>
        ) : null}
      </div>
    </aside>
  )
}
