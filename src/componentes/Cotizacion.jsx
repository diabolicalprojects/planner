import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CopySimple,
  DotsSixVertical,
  DownloadSimple,
  Kanban,
  Plus,
  TrashSimple,
  X,
} from '@phosphor-icons/react'
import { AreaCrece, Boton, Campo, CampoDinero, Tarjeta } from './base.jsx'
import Documento from './Documento.jsx'
import { descargar } from '../lib/descargar.js'
import {
  ESTADOS_COT,
  MARCAS,
  nuevoId,
  pesos,
  rotuloEstadoCot,
  totalesCotizacion,
} from '../lib/modelo.js'

const ANCHO_A4 = 794 // 210 mm a 96 ppp
const ALTO_A4 = 1123 // 297 mm a 96 ppp

/** Editor de la cotización, con la hoja al lado actualizándose mientras escribes. */
export default function Cotizacion({ cot, proyectos, acciones, volver }) {
  const {
    actualizarCotizacion,
    borrarCotizacion,
    duplicarCotizacion,
    convertirEnProyecto,
    verProyecto,
  } = acciones
  const [confirmando, setConfirmando] = useState(false)
  const [escala, setEscala] = useState(0.5)
  // 'quieto' | 'generando' | 'listo' | 'falla'
  const [descarga, setDescarga] = useState('quieto')
  const [altoHoja, setAltoHoja] = useState(ALTO_A4)
  // Sólo se sabe de verdad cuando el PDF existe; hasta entonces no se dice.
  const [paginas, setPaginas] = useState(null)
  // Sólo manda en pantalla estrecha; en escritorio conviven los dos paneles.
  const [pestana, setPestana] = useState('datos')
  const lienzo = useRef(null)
  const escenario = useRef(null)
  const vivo = useRef(true)

  useEffect(() => setConfirmando(false), [cot.id])
  // La cuenta caduca en cuanto se toca el documento.
  useEffect(() => setPaginas(null), [cot])

  useEffect(() => {
    vivo.current = true
    return () => {
      vivo.current = false
    }
  }, [])

  /**
   * La hoja mide 210 mm de verdad; en pantalla se encoge para caber sin que
   * cambie ni una medida del documento. Y se mide de alto para enseñarla
   * entera: con la altura fijada a una página, lo que se salía quedaba
   * recortado y no se descubría hasta abrir el PDF, que ya es tarde.
   *
   * Las dos medidas las vigila el mismo observador, atento tanto al hueco como
   * a la hoja. Hace falta: en el teléfono el mirador nace escondido detrás de
   * la pestaña «Datos», y un elemento escondido mide cero. Sin volver a medir
   * al aparecer, la hoja salía en blanco.
   */
  const medir = useCallback(() => {
    const ancho = lienzo.current?.clientWidth
    if (ancho) setEscala(Math.min(1, ancho / ANCHO_A4))
    const alto = escenario.current?.firstElementChild?.offsetHeight
    if (alto) setAltoHoja(alto)
  }, [])

  useLayoutEffect(() => {
    medir()
    const observador = new ResizeObserver(medir)
    const hoja = escenario.current?.firstElementChild
    if (lienzo.current) observador.observe(lienzo.current)
    if (hoja) observador.observe(hoja)
    return () => observador.disconnect()
  }, [medir])

  useLayoutEffect(medir, [medir, cot, pestana])

  // La tipografía llega después del primer pintado y mueve los renglones.
  useEffect(() => {
    document.fonts?.ready.then(medir)
  }, [medir])

  const cambiar = (cambios) => actualizarCotizacion(cot.id, cambios)
  const t = totalesCotizacion(cot)
  // Si ya se convirtió, el botón deja de crear y pasa a llevarte allí: dos
  // proyectos de la misma cotización sería contar el dinero dos veces.
  const yaEsProyecto = proyectos.find((p) => p.id === cot.proyectoId)

  /**
   * El PDF se arma aquí mismo, en el navegador: sale vectorial, con el texto
   * seleccionable y la tipografía dentro del archivo. La librería que lo hace
   * pesa más que toda la aplicación, así que no se carga hasta que alguien
   * pulsa el botón; quien sólo entra a mirar no la paga.
   */
  const descargarPdf = useCallback(async () => {
    setDescarga('generando')
    try {
      const { generarPdf, nombreArchivo } = await import('../lib/documentoPdf.jsx')
      const { blob, paginas: cuantas } = await generarPdf(cot)
      descargar(blob, nombreArchivo(cot))
      if (!vivo.current) return
      setPaginas(cuantas)
      setDescarga('listo')
      setTimeout(() => vivo.current && setDescarga('quieto'), 2400)
    } catch (error) {
      console.error('No se pudo armar el PDF', error)
      if (vivo.current) setDescarga('falla')
    }
  }, [cot])

  /* --- Componentes ------------------------------------------------------- */

  const anadirComponente = () =>
    cambiar({ componentes: [...cot.componentes, { id: nuevoId(), titulo: '', importe: 0, entregables: [] }] })

  const cambiarComponente = (id, campos) =>
    cambiar({ componentes: cot.componentes.map((c) => (c.id === id ? { ...c, ...campos } : c)) })

  const quitarComponente = (id) =>
    cambiar({ componentes: cot.componentes.filter((c) => c.id !== id) })

  const moverComponente = (desde, hasta) => {
    if (hasta < 0 || hasta >= cot.componentes.length) return
    const lista = [...cot.componentes]
    const [movido] = lista.splice(desde, 1)
    lista.splice(hasta, 0, movido)
    cambiar({ componentes: lista })
  }

  /* --- Bloques ----------------------------------------------------------- */

  const anadirBloque = () =>
    cambiar({ bloques: [...cot.bloques, { id: nuevoId(), titulo: '', texto: '' }] })

  const cambiarBloque = (id, campos) =>
    cambiar({ bloques: cot.bloques.map((b) => (b.id === id ? { ...b, ...campos } : b)) })

  const quitarBloque = (id) => cambiar({ bloques: cot.bloques.filter((b) => b.id !== id) })

  return (
    <div className="editor" data-pestana={pestana}>
      <div className="editor__pestanas" role="group" aria-label="Qué se enseña">
        <div className="segmentos">
          {[
            ['datos', 'Datos'],
            ['documento', 'Documento'],
          ].map(([id, rotulo]) => (
            <button
              type="button"
              key={id}
              className={`segmento ${pestana === id ? 'segmento--activo' : ''}`.trim()}
              aria-pressed={pestana === id}
              onClick={() => setPestana(id)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="editor__formulario">
        <Tarjeta className="aparece">
          <header className="detalle__cabecera">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="rotulo">{cot.folio}</p>
              <h2 className="titulo-seccion" style={{ marginTop: 4 }}>
                {cot.cliente || 'Cotización nueva'}
              </h2>

              <div className="detalle__meta">
                <div className="estados" role="group" aria-label="Estado de la cotización">
                  {ESTADOS_COT.map((e) => (
                    <button
                      type="button"
                      key={e.id}
                      className={`estado ${cot.estado === e.id ? 'estado--activo' : ''}`.trim()}
                      aria-pressed={cot.estado === e.id}
                      onClick={() => cambiar({ estado: e.id })}
                    >
                      {e.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Boton variante="icono" onClick={volver} aria-label="Volver a las cotizaciones">
              <ArrowLeft size={17} weight="bold" />
            </Boton>
          </header>

          <div className="editor__cuerpo">
            {/* --- Con quién firmas ------------------------------------- */}
            <section className="editor__seccion">
              <h3 className="editor__titulo">Quién la emite</h3>
              <p className="pista">
                Con la marca de la casa sale la banda negra con el logotipo. Como particular sale
                sólo tu nombre, sin rastro de DIABOLICAL.
              </p>
              <div className="estados" role="group" aria-label="Marca del documento">
                {MARCAS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className={`estado ${cot.marca === m.id ? 'estado--activo' : ''}`.trim()}
                    aria-pressed={cot.marca === m.id}
                    onClick={() => cambiar({ marca: m.id })}
                  >
                    {m.rotulo}
                  </button>
                ))}
              </div>

              <div className="detalle__par">
                <Campo
                  id="cot-emisor"
                  etiqueta="Nombre de quien firma"
                  value={cot.emisorNombre}
                  onChange={(e) => cambiar({ emisorNombre: e.target.value })}
                  placeholder="Armando Trejo"
                />
                <Campo
                  id="cot-cargo"
                  etiqueta="Cargo"
                  value={cot.emisorTitulo}
                  onChange={(e) => cambiar({ emisorTitulo: e.target.value })}
                  placeholder="Desarrollador freelance"
                />
              </div>
              <Campo
                id="cot-contacto"
                etiqueta="Contacto"
                value={cot.emisorContacto}
                onChange={(e) => cambiar({ emisorContacto: e.target.value })}
                placeholder="correo · teléfono · web"
              />
            </section>

            {/* --- A quién va ------------------------------------------- */}
            <section className="editor__seccion">
              <h3 className="editor__titulo">Para quién</h3>
              <Campo
                id="cot-cliente"
                etiqueta="Cliente"
                value={cot.cliente}
                onChange={(e) => cambiar({ cliente: e.target.value })}
                placeholder="Agencia de Medios Hidroforum"
              />
              <Campo
                id="cot-proyecto"
                etiqueta="Proyecto"
                value={cot.proyecto}
                onChange={(e) => cambiar({ proyecto: e.target.value })}
                placeholder="Lanzamiento políticz.mx"
              />
              <div className="detalle__par">
                <Campo
                  id="cot-atencion"
                  etiqueta="Atención"
                  value={cot.atencion}
                  onChange={(e) => cambiar({ atencion: e.target.value })}
                  placeholder="Dirección de Medios"
                />
                <Campo
                  id="cot-ubicacion"
                  etiqueta="Ubicación"
                  value={cot.ubicacion}
                  onChange={(e) => cambiar({ ubicacion: e.target.value })}
                  placeholder="Aguascalientes, Ags."
                />
              </div>

              <div className="bloque-campo">
                <label className="etiqueta-campo" htmlFor="cot-proyecto-id">
                  Enlazar con un proyecto de la cartera
                </label>
                <select
                  id="cot-proyecto-id"
                  className="campo"
                  value={cot.proyectoId}
                  onChange={(e) => cambiar({ proyectoId: e.target.value })}
                >
                  <option value="">Sin enlazar</option>
                  {proyectos.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.nombre || 'Proyecto sin nombre'}
                    </option>
                  ))}
                </select>
                <p className="pista">Opcional. Sirve para saber de dónde salió cada proyecto.</p>
              </div>
            </section>

            {/* --- Documento -------------------------------------------- */}
            <section className="editor__seccion">
              <h3 className="editor__titulo">El documento</h3>
              <div className="detalle__par">
                <Campo
                  id="cot-folio"
                  etiqueta="Folio"
                  value={cot.folio}
                  onChange={(e) => cambiar({ folio: e.target.value })}
                />
                <Campo
                  id="cot-fecha"
                  etiqueta="Fecha"
                  type="date"
                  value={cot.fecha}
                  onChange={(e) => cambiar({ fecha: e.target.value })}
                />
              </div>
              <div className="detalle__par">
                <Campo
                  id="cot-plazo"
                  etiqueta="Plazo de entrega"
                  value={cot.plazo}
                  onChange={(e) => cambiar({ plazo: e.target.value })}
                  placeholder="2 semanas naturales"
                />
                <Campo
                  id="cot-validez"
                  etiqueta="Validez"
                  value={cot.validez}
                  onChange={(e) => cambiar({ validez: e.target.value })}
                  placeholder="15 días hábiles"
                />
              </div>
            </section>

            {/* --- Alcance ---------------------------------------------- */}
            <section className="editor__seccion">
              <div className="editor__cabecera-seccion">
                <h3 className="editor__titulo">Alcance</h3>
                <Boton tamano="pequeno" onClick={anadirComponente}>
                  <Plus size={14} weight="bold" /> Componente
                </Boton>
              </div>

              {cot.componentes.length === 0 ? (
                <p className="pista">
                  Cada componente es una fila de la tabla: un título y sus entregables.
                </p>
              ) : null}

              {cot.componentes.map((c, i) => (
                <div className="componente" key={c.id}>
                  <div className="componente__barra">
                    <span className="componente__mover">
                      <button
                        type="button"
                        className="tarea__asa"
                        onClick={() => moverComponente(i, i - 1)}
                        disabled={i === 0}
                        aria-label="Subir el componente"
                      >
                        <DotsSixVertical size={14} weight="bold" />
                      </button>
                      <span className="tarea__puesto cifra">{i + 1}</span>
                    </span>
                    <input
                      className="campo componente__titulo"
                      value={c.titulo}
                      onChange={(e) => cambiarComponente(c.id, { titulo: e.target.value })}
                      placeholder="Diseño Web y Front-End"
                      aria-label="Título del componente"
                    />
                    <button
                      type="button"
                      className="tarea__quitar"
                      onClick={() => quitarComponente(c.id)}
                      aria-label="Quitar el componente"
                    >
                      <X size={13} weight="bold" />
                    </button>
                  </div>

                  <AreaCrece
                    style={{ minHeight: 76 }}
                    value={c.entregables.join('\n')}
                    onChange={(e) =>
                      cambiarComponente(c.id, {
                        entregables: e.target.value.split('\n').map((x) => x.trimStart()),
                      })
                    }
                    placeholder={'Un entregable por línea.\nSitio optimizado para móvil.\nIntegración de redes.'}
                    aria-label="Entregables del componente"
                  />

                  <CampoDinero
                    id={`cot-importe-${c.id}`}
                    etiqueta="Importe del componente (opcional)"
                    value={c.importe}
                    onChange={(e) => cambiarComponente(c.id, { importe: Number(e.target.value) })}
                    pista="Si dejas todos en cero, manda la inversión total de abajo."
                  />
                </div>
              ))}
            </section>

            {/* --- Dinero ------------------------------------------------ */}
            <section className="editor__seccion">
              <h3 className="editor__titulo">Inversión</h3>
              {t.desglosado ? (
                <p className="pista">
                  El total sale de la suma de los componentes: <b>{pesos(t.subtotal)}</b>.
                </p>
              ) : (
                <CampoDinero
                  id="cot-total"
                  etiqueta="Inversión total"
                  value={cot.totalManual}
                  onChange={(e) => cambiar({ totalManual: Number(e.target.value) })}
                  pista="Pesos mexicanos."
                />
              )}
              <label className="casilla">
                <input
                  type="checkbox"
                  checked={cot.conIva}
                  onChange={(e) => cambiar({ conIva: e.target.checked })}
                />
                <span className="casilla__caja" aria-hidden="true" />
                <span>Desglosar IVA del 16%</span>
              </label>
            </section>

            {/* --- Bloques ----------------------------------------------- */}
            <section className="editor__seccion">
              <div className="editor__cabecera-seccion">
                <h3 className="editor__titulo">Notas destacadas</h3>
                <Boton tamano="pequeno" onClick={anadirBloque}>
                  <Plus size={14} weight="bold" /> Nota
                </Boton>
              </div>
              <p className="pista">
                Los recuadros del documento: hosting, soporte, lo que se excluye. Van en dos columnas.
              </p>

              {cot.bloques.map((b) => (
                <div className="componente" key={b.id}>
                  <div className="componente__barra">
                    <input
                      className="campo componente__titulo"
                      value={b.titulo}
                      onChange={(e) => cambiarBloque(b.id, { titulo: e.target.value })}
                      placeholder="Recomendación de hosting"
                      aria-label="Título de la nota"
                    />
                    <button
                      type="button"
                      className="tarea__quitar"
                      onClick={() => quitarBloque(b.id)}
                      aria-label="Quitar la nota"
                    >
                      <X size={13} weight="bold" />
                    </button>
                  </div>
                  <AreaCrece
                    style={{ minHeight: 70 }}
                    value={b.texto}
                    onChange={(e) => cambiarBloque(b.id, { texto: e.target.value })}
                    placeholder="Hostinger, plan Business a 12 meses. Pago directo del cliente."
                    aria-label="Texto de la nota"
                  />
                </div>
              ))}
            </section>

            {/* --- Condiciones ------------------------------------------- */}
            <section className="editor__seccion">
              <h3 className="editor__titulo">Condiciones y notas</h3>
              <div className="bloque-campo">
                <label className="etiqueta-campo" htmlFor="cot-condiciones">
                  Condiciones
                </label>
                <AreaCrece
                  id="cot-condiciones"
                  value={cot.condiciones.join('\n')}
                  onChange={(e) =>
                    cambiar({ condiciones: e.target.value.split('\n').map((x) => x.trimStart()) })
                  }
                  placeholder={'Una condición por línea.\n50% de anticipo y 50% contra entrega.'}
                />
                <p className="pista">Una por línea. Salen como lista con viñeta.</p>
              </div>
              <Campo
                id="cot-notas"
                etiqueta="Notas al pie"
                area
                value={cot.notas}
                onChange={(e) => cambiar({ notas: e.target.value })}
                placeholder="Lo que no encaje en las condiciones."
              />
            </section>
          </div>

          <footer className="editor__pie">
            {confirmando ? (
              <>
                <span className="apoyo" style={{ flex: 1, minWidth: 200, color: 'var(--tinta)' }}>
                  Se borra la cotización <strong>{cot.folio}</strong>. No hay deshacer.
                </span>
                <Boton
                  variante="principal"
                  onClick={() => {
                    borrarCotizacion(cot.id)
                    volver()
                  }}
                >
                  Borrar de verdad
                </Boton>
                <Boton onClick={() => setConfirmando(false)}>Dejarlo</Boton>
              </>
            ) : (
              <>
                <span className="apoyo">
                  {rotuloEstadoCot(cot.estado).toLowerCase()} · {pesos(t.total)} MXN
                </span>
                <span style={{ display: 'flex', gap: 'var(--e2)', marginLeft: 'auto', flexWrap: 'wrap' }}>
                  {yaEsProyecto ? (
                    <Boton onClick={() => verProyecto(yaEsProyecto.id)}>
                      <ArrowUpRight size={15} weight="bold" /> Ver el proyecto
                    </Boton>
                  ) : (
                    <Boton
                      variante={cot.estado === 'aprobada' ? 'principal' : 'suave'}
                      onClick={() => convertirEnProyecto(cot)}
                    >
                      <Kanban size={15} weight="bold" /> Convertir en proyecto
                    </Boton>
                  )}
                  <Boton onClick={() => duplicarCotizacion(cot)}>
                    <CopySimple size={15} /> Nueva versión
                  </Boton>
                  <Boton onClick={() => setConfirmando(true)}>
                    <TrashSimple size={15} /> Borrar
                  </Boton>
                </span>
              </>
            )}
          </footer>
        </Tarjeta>
      </div>

      <div className="previsualizacion">
        <div className="previsualizacion__barra">
          <span className="rotulo">
            {descarga === 'falla'
              ? 'No se pudo generar el archivo'
              : paginas
                ? `Así queda · ${paginas} ${paginas === 1 ? 'página' : 'páginas'}`
                : 'Así queda el PDF'}
          </span>
          <Boton
            variante="principal"
            tamano="pequeno"
            onClick={descargarPdf}
            disabled={descarga === 'generando'}
            aria-busy={descarga === 'generando'}
          >
            {descarga === 'generando' ? (
              <>
                <span className="girando" aria-hidden="true" /> Generando…
              </>
            ) : descarga === 'listo' ? (
              <>
                <Check size={15} weight="bold" /> Descargado
              </>
            ) : (
              <>
                <DownloadSimple size={15} weight="bold" /> Descargar PDF
              </>
            )}
          </Boton>
        </div>

        <div
          className="previsualizacion__lienzo"
          ref={lienzo}
          style={{ height: escala * altoHoja }}
        >
          <div
            className="previsualizacion__escala"
            ref={escenario}
            style={{ transform: `scale(${escala})`, width: ANCHO_A4 }}
          >
            <Documento cot={cot} />
          </div>
        </div>
      </div>
    </div>
  )
}
