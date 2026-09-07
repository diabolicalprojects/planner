import {
  ArrowSquareOut,
  CaretRight,
  Info,
  Keyboard,
  SignOut,
  UploadSimple,
} from '@phosphor-icons/react'
import { Boton, Tarjeta } from './base.jsx'

const ATAJOS = [
  ['Ctrl + N', 'Nuevo proyecto'],
  ['Ctrl + 1', 'Ir al tablero'],
  ['Ctrl + 2', 'Ir a la lista de proyectos'],
  ['Ctrl + K', 'Ir al buscador'],
  ['Esc', 'Volver al tablero'],
  ['Intro', 'Abrir el proyecto enfocado'],
  ['Alt + ← →', 'Mover el proyecto de columna'],
  ['Alt + ↑ ↓', 'Subir o bajar la tarea enfocada'],
]

export default function Ayuda({ tipo, volver, irA, alExportar, alImportar, alSalir }) {
  // El menú de la pestaña «Más» del teléfono. En la barra lateral del escritorio
  // estas mismas entradas están siempre a la vista; aquí son una página, porque
  // en un teléfono no cabe una barra lateral permanente.
  if (tipo === 'mas') {
    const filas = [
      { rotulo: 'Exportar JSON', apoyo: 'Baja toda la cartera a un archivo', Icono: ArrowSquareOut, hacer: alExportar },
      { rotulo: 'Importar JSON', apoyo: 'Devuelve una copia a esta máquina', Icono: UploadSimple, hacer: alImportar },
      { rotulo: 'Atajos', apoyo: 'Cómo usarlo con teclado', Icono: Keyboard, hacer: () => irA({ vista: 'atajos' }) },
      { rotulo: 'Acerca de', apoyo: 'Qué es esto y dónde viven tus datos', Icono: Info, hacer: () => irA({ vista: 'acerca' }) },
      ...(alSalir
        ? [{ rotulo: 'Salir', apoyo: 'Cerrar la sesión en este dispositivo', Icono: SignOut, hacer: alSalir }]
        : []),
    ]

    return (
      <Tarjeta className="menu aparece">
        {filas.map(({ rotulo, apoyo, Icono, hacer }) => (
          <button type="button" className="menu__fila" key={rotulo} onClick={hacer}>
            <span className="menu__icono">
              <Icono size={19} />
            </span>
            <span className="menu__texto">
              <span className="menu__rotulo">{rotulo}</span>
              <span className="menu__apoyo">{apoyo}</span>
            </span>
            <CaretRight size={15} weight="bold" className="menu__flecha" />
          </button>
        ))}
      </Tarjeta>
    )
  }

  if (tipo === 'atajos') {
    return (
      <Tarjeta className="aparece">
        <div className="pagina-texto">
          <h2 className="titulo-seccion">Atajos de teclado</h2>
          <p>
            Todo se puede hacer sin ratón. Enfoca un proyecto con el tabulador y muévelo de columna
            con Alt y las flechas; dentro de un proyecto, enfoca el asa de una tarea y súbela o bájala
            igual. Hace lo mismo que arrastrar, y cada cambio se anuncia para lectores de pantalla.
          </p>
          <dl className="atajos">
            {ATAJOS.map(([tecla, que]) => (
              <div className="atajo" key={tecla}>
                <dt>
                  <kbd>{tecla}</kbd>
                </dt>
                <dd>
                  <span>{que}</span>
                </dd>
              </div>
            ))}
          </dl>
          <Boton variante="principal" onClick={volver} style={{ alignSelf: 'flex-start' }}>
            Volver al tablero
          </Boton>
        </div>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta className="aparece">
      <div className="pagina-texto">
        <img
          src="/marca/LOGO-DIABOLICAL-HORIZONTAL-NEGRO.svg"
          alt="DIABOLICAL IA Services"
          width="260"
          height="66"
          style={{ height: 'auto', maxWidth: 260 }}
        />
        <h2 className="titulo-seccion">Tu planificador, en tu máquina</h2>
        <p>
          Corre en local, sin cuentas ni servidor. Cada proyecto se guarda en el almacenamiento de este
          navegador en cuanto lo escribes. Todos los importes están en <strong>pesos mexicanos</strong>.
        </p>
        <p>
          Los datos son tuyos y salen enteros. <strong>Exportar JSON</strong> baja un archivo con toda la
          cartera, e <strong>Importar JSON</strong> la devuelve aquí o en otro ordenador. Guarda ese
          archivo de vez en cuando: si vacías los datos del navegador, la cartera se va con ellos.
        </p>
        <p className="apoyo">
          React y Vite, sin backend. Tipografía Manrope e iconos Phosphor, servidos desde el propio
          proyecto para que funcione sin conexión.
        </p>
        <Boton variante="principal" onClick={volver} style={{ alignSelf: 'flex-start' }}>
          Volver al tablero
        </Boton>
      </div>
    </Tarjeta>
  )
}
