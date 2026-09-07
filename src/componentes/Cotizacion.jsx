import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, CopySimple, DotsSixVertical, Plus, Printer, TrashSimple, X } from '@phosphor-icons/react'
import { Boton, Campo, CampoDinero, Tarjeta } from './base.jsx'
import Documento from './Documento.jsx'
import {
  ESTADOS_COT,
  MARCAS,
  nuevoId,
  pesos,
  rotuloEstadoCot,
  totalesCotizacion,
} from '../lib/modelo.js'

const ANCHO_A4 = 794 // 210 mm a 96 ppp

/** Editor de la cotización, con la hoja al lado actualizándose mientras escribes. */
export default function Cotizacion({ cot, proyectos, acciones, volver }) {
  const { actualizarCotizacion, borrarCotizacion, duplicarCotizacion } = acciones
  const [confirmando, setConfirmando] = useState(false)
  const [escala, setEscala] = useState(0.5)
  const lienzo = useRef(null)
  const hoja = useRef(null)

  useEffect(() => setConfirmando(false), [cot.id])

  // La hoja mide 210 mm de verdad; en pantalla se encoge para caber sin que
  // cambie ni una medida del documento.
  useLayoutEffect(() => {
    const medir = () => {
      const ancho = lienzo.current?.clientWidth
      if (ancho) setEscala(Math.min(1, ancho / ANCHO_A4))
    }
    medir()
    const observador = new ResizeObserver(medir)
    if (lienzo.current) observador.observe(lienzo.current)
    return () => observador.disconnect()
  }, [])

  const cambiar = (cambios) => actualizarCotizacion(cot.id, cambios)
  const t = totalesCotizacion(cot)

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
    <div className="editor">
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

                  <textarea
                    className="campo campo--area"
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
                  <textarea
                    className="campo campo--area"
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
                <textarea
                  id="cot-condiciones"
                  className="campo campo--area"
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
          <span className="rotulo">Así se imprime</span>
          <Boton variante="principal" tamano="pequeno" onClick={() => window.print()}>
            <Printer size={15} weight="bold" /> Exportar PDF
          </Boton>
        </div>

        <div
          className="previsualizacion__lienzo"
          ref={lienzo}
          style={{ height: escala * 1123 }}
        >
          <div
            className="previsualizacion__escala"
            ref={hoja}
            style={{ transform: `scale(${escala})`, width: ANCHO_A4 }}
          >
            <Documento cot={cot} />
          </div>
        </div>
      </div>
    </div>
  )
}
