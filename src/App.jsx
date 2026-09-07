import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle,
  CloudSlash,
  MagnifyingGlass,
  Plus,
  RocketLaunch,
  Sparkle,
  Warning,
  X,
} from '@phosphor-icons/react'
import Acceso from './componentes/Acceso.jsx'
import Ayuda from './componentes/Ayuda.jsx'
import BarraInferior from './componentes/BarraInferior.jsx'
import Cotizacion from './componentes/Cotizacion.jsx'
import Cotizaciones from './componentes/Cotizaciones.jsx'
import Detalle from './componentes/Detalle.jsx'
import Lateral from './componentes/Lateral.jsx'
import Lista from './componentes/Lista.jsx'
import Resumen from './componentes/Resumen.jsx'
import Tablero from './componentes/Tablero.jsx'
import { Boton, Tarjeta } from './componentes/base.jsx'
import { exportar, importar } from './lib/almacen.js'
import { responsables } from './lib/modelo.js'
import { estadoSesion, salir } from './lib/sesion.js'
import { sesionRenovada } from './lib/almacen.js'
import { usarProyectos } from './lib/usarProyectos.js'

const TITULOS = {
  tablero: { titulo: 'Tablero', apoyo: 'Arrastra un proyecto para cambiarlo de estado.' },
  lista: { titulo: 'Proyectos', apoyo: 'Toda la cartera en una tabla, ordenable por cualquier columna.' },
  cotizaciones: {
    titulo: 'Cotizaciones',
    apoyo: 'Documentos con folio, alcance e inversión, listos para exportar a PDF.',
  },
  mas: { titulo: 'Más', apoyo: 'Tus datos, los atajos y de dónde sale todo esto.' },
  atajos: { titulo: 'Atajos', apoyo: 'Cómo usar el planificador sin tocar el ratón.' },
  acerca: { titulo: 'Acerca de', apoyo: 'Qué es esto y dónde viven tus datos.' },
}

export default function App() {
  // Primero la puerta. Hasta saber si hace falta contraseña no se pide ni un
  // dato: pedirlos sin sesión devolvería 401 y la cartera se vería vacía, que
  // es la peor manera de enterarse de que no has entrado.
  const [sesion, setSesion] = useState(null)

  useEffect(() => {
    let vivo = true
    estadoSesion().then((estado) => vivo && setSesion(estado))
    return () => {
      vivo = false
    }
  }, [])

  const dentro = Boolean(sesion?.dentro)
  const pila = usarProyectos({ activo: dentro })
  const { proyectos } = pila

  const [vista, setVista] = useState('tablero')
  const [abierto, setAbierto] = useState(null)
  const [cotAbierta, setCotAbierta] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [etiquetaActiva, setEtiquetaActiva] = useState(null)
  const [tipoFiltro, setTipoFiltro] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [porConfirmar, setPorConfirmar] = useState(null)

  const avisoRef = useRef(null)
  const pilaRef = useRef(proyectos)
  pilaRef.current = proyectos
  const abiertoRef = useRef(null)
  const archivoRef = useRef(null)
  const buscadorRef = useRef(null)

  const irA = useCallback(({ vista: destino }) => {
    setAbierto(null)
    setCotAbierta(null)
    setVista(destino)
  }, [])

  const abrir = useCallback((id) => setAbierto(id), [])

  const enBlanco = (p) =>
    p && !p.nombre.trim() && !p.cliente.trim() && !p.notas.trim() && !p.tareas.length && !p.presupuesto

  // Al salir de un proyecto que sigue en blanco se descarta: crearlo fue parte
  // del gesto de abrirlo, no una decisión que merezca dejar rastro.
  const volver = useCallback(() => {
    const actual = pilaRef.current.find((p) => p.id === abiertoRef.current)
    if (enBlanco(actual)) pila.borrar(actual.id)
    setAbierto(null)
  }, [pila])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return proyectos.filter((p) => {
      if (tipoFiltro && p.tipo !== tipoFiltro) return false
      if (etiquetaActiva && !p.etiquetas.includes(etiquetaActiva)) return false
      if (!texto) return true
      return (
        p.nombre.toLowerCase().includes(texto) ||
        p.cliente.toLowerCase().includes(texto) ||
        p.notas.toLowerCase().includes(texto) ||
        p.etiquetas.some((e) => e.includes(texto)) ||
        p.tareas.some((t) => t.responsable?.toLowerCase().includes(texto))
      )
    })
  }, [proyectos, busqueda, etiquetaActiva, tipoFiltro])

  const etiquetas = useMemo(() => [...new Set(proyectos.flatMap((p) => p.etiquetas))].sort(), [proyectos])
  const gente = useMemo(() => responsables(proyectos), [proyectos])

  const proyectoAbierto = abierto ? proyectos.find((p) => p.id === abierto) : null
  abiertoRef.current = abierto

  useEffect(() => {
    if (abierto && !proyectoAbierto) setAbierto(null)
  }, [abierto, proyectoAbierto])

  const nuevoProyecto = useCallback(() => {
    const ficha = pila.crear({ estado: 'idea' })
    setAbierto(ficha.id)
  }, [pila])

  const duplicar = useCallback(
    (proyecto) => {
      const copia = pila.duplicar(proyecto)
      setAbierto(copia.id)
    },
    [pila],
  )

  useEffect(() => {
    const atajos = (evento) => {
      const enCampo = ['INPUT', 'TEXTAREA'].includes(evento.target.tagName)
      const mando = evento.ctrlKey || evento.metaKey
      if (mando && evento.key.toLowerCase() === 'n') {
        evento.preventDefault()
        nuevoProyecto()
      } else if (mando && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        buscadorRef.current?.focus()
      } else if (mando && evento.key === '1') {
        evento.preventDefault()
        irA({ vista: 'tablero' })
      } else if (mando && evento.key === '2') {
        evento.preventDefault()
        irA({ vista: 'lista' })
      } else if (evento.key === 'Escape' && !enCampo) {
        if (abierto) volver()
        else if (vista !== 'tablero') irA({ vista: 'tablero' })
      }
    }
    window.addEventListener('keydown', atajos)
    return () => window.removeEventListener('keydown', atajos)
  }, [nuevoProyecto, irA, volver, abierto, vista])

  async function alElegirArchivo(evento) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    setMensaje({ tono: 'trabajo', texto: `Leyendo ${archivo.name}…` })
    const resultado = await importar(archivo)
    if (resultado.error) {
      setMensaje({ tono: 'error', texto: resultado.error })
      return
    }
    // Importar sustituye la cartera entera: no se hace sin decirlo antes.
    if (proyectos.length > 0) {
      setMensaje(null)
      setPorConfirmar({
        texto: `El archivo trae ${resultado.proyectos.length} proyectos y sustituye a los ${proyectos.length} que tienes ahora. No hay deshacer.`,
        accion: 'Sustituir la cartera',
        hacer: () => aplicarImportacion(resultado, archivo.name),
      })
      return
    }
    aplicarImportacion(resultado, archivo.name)
  }

  function aplicarImportacion(resultado, nombreArchivo) {
    pila.reemplazar({ proyectos: resultado.proyectos, cotizaciones: resultado.cotizaciones })
    setAbierto(null)
    setVista('tablero')
    setMensaje({
      tono: 'bien',
      texto:
        `Importados ${resultado.proyectos.length} proyectos desde ${nombreArchivo}.` +
        (resultado.descartados
          ? ` Se descartaron ${resultado.descartados} registros sin nombre ni cliente.`
          : ''),
    })
  }

  function pedirVaciar() {
    setMensaje(null)
    setPorConfirmar({
      texto: `Se borran los ${proyectos.length} proyectos de la cartera y sus tareas. No hay deshacer: exporta antes si quieres conservarlos.`,
      accion: 'Vaciar de verdad',
      hacer: () => {
        pila.vaciar()
        setAbierto(null)
        setMensaje({ tono: 'bien', texto: 'La cartera está vacía.' })
      },
    })
  }

  const cotizacionAbierta = cotAbierta
    ? pila.cotizaciones.find((c) => c.id === cotAbierta)
    : null

  const nuevaCotizacion = useCallback(() => {
    // La cotización nace ya firmada por quien firmó la última: se cambia en un
    // clic, pero lo normal es que sea la misma persona.
    const ultima = pila.cotizaciones[0]
    const cot = pila.crearCotizacion({
      marca: ultima?.marca ?? 'diabolical',
      emisorNombre: ultima?.emisorNombre ?? '',
      emisorTitulo: ultima?.emisorTitulo ?? '',
      emisorContacto: ultima?.emisorContacto ?? '',
    })
    setVista('cotizaciones')
    setCotAbierta(cot.id)
  }, [pila])

  const duplicarCot = useCallback(
    (original) => {
      const copia = pila.duplicarCotizacion(original)
      setCotAbierta(copia.id)
    },
    [pila],
  )

  const hayEjemplo = proyectos.some((p) => p.id.startsWith('MUESTRA'))
  const filtrado = Boolean(busqueda || etiquetaActiva || tipoFiltro)
  const exportarTodo = useCallback(() => {
    if (!pilaRef.current.length) {
      setMensaje({ tono: 'error', texto: 'No hay nada que exportar todavía.' })
      return
    }
    setMensaje({
      tono: 'bien',
      texto: `Descargado ${exportar({ proyectos: pilaRef.current, cotizaciones: pila.cotizaciones })}.`,
    })
  }, [pila.cotizaciones])

  const abrirArchivo = useCallback(() => archivoRef.current?.click(), [])

  const cabecera = TITULOS[vista]
  const enTrabajo = vista === 'tablero' || vista === 'lista'
  const enCotizaciones = vista === 'cotizaciones'
  // El botón principal sólo aparece donde hay algo que dar de alta. En «Más» o
  // en los atajos no viene a cuento, y dentro de un proyecto o de una cotización
  // tampoco: ahí la cabecera está para decirte dónde estás, no para sacarte.
  // En el teléfono, además, era el botón más grande de la pantalla mientras
  // editabas, a un dedo de perder el sitio.
  const hayAlta = (enTrabajo || enCotizaciones) && !proyectoAbierto && !cotizacionAbierta

  // Mientras se pregunta por la sesión no se enseña nada: un parpadeo del
  // planificador antes de mandarte a la puerta es peor que medio segundo en
  // blanco.
  if (!sesion) return null

  if (!dentro) {
    return <Acceso alEntrar={() => setSesion({ ...sesion, dentro: true })} />
  }

  return (
    <div className="marco">
      {/* La sesión se ha caducado con la aplicación abierta: la puerta vuelve
          por encima, sin desmontar nada, y lo que estuvieras escribiendo sigue
          donde estaba hasta que se pueda guardar. */}
      {pila.caducada ? (
        <div className="acceso__encima">
          <Acceso
            nota="La sesión ha caducado. Vuelve a entrar: lo que tienes en pantalla sigue ahí y se guardará solo."
            alEntrar={() => {
              sesionRenovada()
              pila.reintentarGuardado()
            }}
          />
        </div>
      ) : null}

      <Lateral
        vista={vista}
        irA={irA}
        cuantos={{
          activos: proyectos.filter((p) => p.estado !== 'entregado').length,
          total: proyectos.length,
          cotizaciones: pila.cotizaciones.length,
        }}
        alExportar={exportarTodo}
        alImportar={abrirArchivo}
        alSalir={sesion.protegido ? salir : null}
      />

      <main className="principal">
        <header className="cabecera">
          <div className="cabecera__texto">
            <h1 className="titulo-pagina">
              {cotizacionAbierta
                ? 'Cotización'
                : proyectoAbierto
                  ? proyectoAbierto.tipo === 'interno'
                    ? 'Producto propio'
                    : 'Proyecto'
                  : cabecera.titulo}
            </h1>
            <p>
              {cotizacionAbierta
                ? `${cotizacionAbierta.folio} · ${
                    cotizacionAbierta.marca === 'diabolical' ? 'con marca DIABOLICAL' : 'como particular'
                  }`
                : proyectoAbierto
                  ? proyectoAbierto.tipo === 'interno'
                    ? 'Sin cliente: lo lanzamos nosotros'
                    : proyectoAbierto.cliente || 'Sin cliente'
                  : cabecera.apoyo}
            </p>
          </div>

          <div className="cabecera__acciones">
            {enTrabajo && !proyectoAbierto ? (
              <div className="buscador">
                <MagnifyingGlass size={16} weight="bold" />
                <input
                  ref={buscadorRef}
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar proyecto o cliente"
                  aria-label="Buscar en la cartera"
                />
                {busqueda ? (
                  <button
                    type="button"
                    className="buscador__limpiar"
                    onClick={() => setBusqueda('')}
                    aria-label="Limpiar la búsqueda"
                  >
                    <X size={12} weight="bold" />
                  </button>
                ) : null}
              </div>
            ) : null}
            {!hayAlta ? null : enCotizaciones ? (
              <Boton variante="principal" onClick={nuevaCotizacion}>
                <Plus size={16} weight="bold" /> Nueva cotización
              </Boton>
            ) : (
              <Boton variante="principal" onClick={nuevoProyecto}>
                <Plus size={16} weight="bold" /> Nuevo proyecto
              </Boton>
            )}
          </div>
        </header>

        {porConfirmar ? (
          <div className="aviso aviso--fuerte" role="alertdialog" aria-label="Confirmar">
            <span className="aviso__icono">
              <Warning size={16} weight="fill" />
            </span>
            <span>{porConfirmar.texto}</span>
            <span className="aviso__acciones">
              <Boton
                tamano="pequeno"
                onClick={() => {
                  porConfirmar.hacer()
                  setPorConfirmar(null)
                }}
              >
                {porConfirmar.accion}
              </Boton>
              <Boton tamano="pequeno" onClick={() => setPorConfirmar(null)}>
                Dejarlo
              </Boton>
            </span>
          </div>
        ) : pila.falloAlGuardar ? (
          <div className="aviso aviso--fuerte" role="alert">
            <span className="aviso__icono">
              <CloudSlash size={16} weight="fill" />
            </span>
            <span>
              {pila.modo === 'api'
                ? 'No se pudo guardar en el servidor. Revisa la conexión y exporta el JSON ahora para no perder lo que lleves escrito.'
                : 'No se pudo guardar en este navegador. Puede ser una ventana privada o falta de espacio. Exporta el JSON ahora para no perder lo que lleves escrito.'}
            </span>
          </div>
        ) : mensaje ? (
          <div className={`aviso ${mensaje.tono === 'error' ? 'aviso--fuerte' : ''}`.trim()} role="status">
            <span className="aviso__icono">
              {mensaje.tono === 'error' ? <Warning size={16} weight="fill" /> : <CheckCircle size={16} weight="fill" />}
            </span>
            <span>{mensaje.texto}</span>
            <span className="aviso__acciones">
              <Boton tamano="pequeno" onClick={() => setMensaje(null)}>
                Cerrar
              </Boton>
            </span>
          </div>
        ) : hayEjemplo && enTrabajo && !proyectoAbierto ? (
          <div className="aviso" role="status">
            <span className="aviso__icono">
              <Sparkle size={16} weight="fill" />
            </span>
            <span>Estos son proyectos de ejemplo. Bórralos cuando metas los tuyos.</span>
            <span className="aviso__acciones">
              <Boton tamano="pequeno" onClick={pedirVaciar}>
                Vaciar la cartera
              </Boton>
            </span>
          </div>
        ) : null}

        {enTrabajo && !proyectoAbierto ? (
          <div className="filtros">
            {/* Ver sólo los productos propios es media razón para tenerlos aquí. */}
            <div className="segmentos" role="group" aria-label="Filtrar por tipo">
              {[
                { id: null, rotulo: 'Todos' },
                { id: 'cliente', rotulo: 'De cliente' },
                { id: 'interno', rotulo: 'Producto propio' },
              ].map((opcion) => (
                <button
                  type="button"
                  key={opcion.rotulo}
                  className={`segmento ${tipoFiltro === opcion.id ? 'segmento--activo' : ''}`.trim()}
                  aria-pressed={tipoFiltro === opcion.id}
                  onClick={() => setTipoFiltro(opcion.id)}
                >
                  {opcion.id === 'interno' ? <RocketLaunch size={13} weight="fill" /> : null}
                  {opcion.rotulo}
                </button>
              ))}
            </div>

            {etiquetas.map((etiqueta) => (
              <button
                type="button"
                key={etiqueta}
                className={`filtro ${etiquetaActiva === etiqueta ? 'filtro--activo' : ''}`.trim()}
                aria-pressed={etiquetaActiva === etiqueta}
                onClick={() => setEtiquetaActiva(etiquetaActiva === etiqueta ? null : etiqueta)}
              >
                {etiqueta}
              </button>
            ))}
            {filtrado ? (
              <button
                type="button"
                className="filtro"
                onClick={() => {
                  setBusqueda('')
                  setEtiquetaActiva(null)
                  setTipoFiltro(null)
                }}
              >
                Quitar filtros
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={`trabajo ${enTrabajo ? '' : 'trabajo--solo'}`.trim()}>
          <div className="lienzo">
            {pila.cargando ? (
              <Tarjeta>
                <div className="vacio">
                  <span className="vacio__icono cargando" aria-hidden="true" />
                  <p className="vacio__texto">Cargando la cartera…</p>
                </div>
              </Tarjeta>
            ) : proyectoAbierto ? (
              <Detalle
                proyecto={proyectoAbierto}
                acciones={{ ...pila, duplicar }}
                volver={volver}
                gente={gente}
              />
            ) : proyectos.length === 0 && enTrabajo ? (
              <Tarjeta>
                <div className="vacio">
                  <span className="vacio__icono">
                    <Plus size={26} />
                  </span>
                  <h2 className="titulo-seccion">Tu cartera está vacía</h2>
                  <p className="vacio__texto">
                    Cada encargo es un proyecto: cliente, fechas, presupuesto en pesos y sus tareas. Se
                    archiva en una de las cuatro columnas y se arrastra de una a otra según avanza. Todo se
                    guarda en este navegador.
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--e2)', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Boton variante="principal" onClick={nuevoProyecto}>
                      <Plus size={16} weight="bold" /> Crear el primero
                    </Boton>
                    <Boton onClick={pila.cargarEjemplo}>Cargar ejemplos</Boton>
                  </div>
                </div>
              </Tarjeta>
            ) : vista === 'tablero' ? (
              <Tablero
                proyectos={proyectos}
                visibles={visibles}
                abrir={abrir}
                actualizar={pila.actualizar}
                crear={nuevoProyecto}
                filtrado={filtrado}
                tipoFiltro={tipoFiltro}
                avisoRef={avisoRef}
              />
            ) : vista === 'lista' ? (
              <Lista visibles={visibles} abrir={abrir} />
            ) : enCotizaciones ? (
              cotizacionAbierta ? (
                <Cotizacion
                  cot={cotizacionAbierta}
                  proyectos={proyectos}
                  acciones={{ ...pila, duplicarCotizacion: duplicarCot }}
                  volver={() => setCotAbierta(null)}
                />
              ) : (
                <Cotizaciones
                  cotizaciones={pila.cotizaciones}
                  proyectos={proyectos}
                  abrir={setCotAbierta}
                  crear={nuevaCotizacion}
                />
              )
            ) : (
              <Ayuda
                tipo={vista}
                volver={() => irA({ vista: 'tablero' })}
                irA={irA}
                alExportar={exportarTodo}
                alImportar={abrirArchivo}
                alSalir={sesion.protegido ? salir : null}
              />
            )}
          </div>

          {enTrabajo ? (
            <aside className="raíl" aria-label="Resumen de la cartera">
              {filtrado ? (
                <p className="raíl__nota">
                  El resumen cuenta la cartera completa, no lo que filtras arriba.
                </p>
              ) : null}
              <Resumen proyectos={proyectos} abrir={abrir} />
            </aside>
          ) : null}
        </div>
      </main>

      <input
        ref={archivoRef}
        type="file"
        accept="application/json,.json"
        className="oculto"
        onChange={alElegirArchivo}
      />
      <p ref={avisoRef} className="oculto" role="status" aria-live="polite" />

      <BarraInferior vista={vista} irA={irA} />
    </div>
  )
}
