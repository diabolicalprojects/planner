import { DotsThree, FileText, Kanban, ListBullets } from '@phosphor-icons/react'

const PESTANAS = [
  { id: 'tablero', etiqueta: 'Tablero', Icono: Kanban },
  { id: 'lista', etiqueta: 'Proyectos', Icono: ListBullets },
  { id: 'cotizaciones', etiqueta: 'Cotizaciones', Icono: FileText },
  // Los tres puntos rellenos se funden en un borrón: no hay nada que rellenar
  // ahí. Ese icono engorda, no se llena. La pastilla blanca ya dice cuál es.
  { id: 'mas', etiqueta: 'Más', Icono: DotsThree, pesoActivo: 'bold' },
]

// «Más» es la pestaña, pero lo que hay debajo son varias páginas: estar en
// cualquiera de ellas tiene que dejarla marcada.
const BAJO_MAS = new Set(['mas', 'atajos', 'acerca'])

/**
 * La navegación del teléfono. La barra lateral negra es una pieza de escritorio:
 * apilada arriba se comía un tercio de la pantalla y se iba con el desplazamiento,
 * así que para cambiar de vista había que subir del todo primero.
 *
 * Abajo y fija, cae donde llega el pulgar y no se mueve nunca. Es el mismo objeto
 * negro de esquinas redondeadas que la lateral, en horizontal.
 */
export default function BarraInferior({ vista, irA }) {
  return (
    <nav className="barra-inferior oscuro" aria-label="Vistas">
      {PESTANAS.map(({ id, etiqueta, Icono, pesoActivo = 'fill' }) => {
        const activa = id === 'mas' ? BAJO_MAS.has(vista) : vista === id
        return (
          <button
            type="button"
            key={id}
            className={`pestana ${activa ? 'pestana--activa' : ''}`.trim()}
            aria-current={activa ? 'page' : undefined}
            onClick={() => irA({ vista: id })}
          >
            <span className="pestana__icono">
              <Icono size={21} weight={activa ? pesoActivo : 'regular'} />
            </span>
            <span className="pestana__rotulo">{etiqueta}</span>
          </button>
        )
      })}
    </nav>
  )
}
