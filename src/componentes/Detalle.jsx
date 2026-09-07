import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowSquareOut, CopySimple, RocketLaunch, TrashSimple } from '@phosphor-icons/react'
import { Boton, Campo, CampoDinero, Casilla, Chip, Tarjeta } from './base.jsx'
import Tareas from './Tareas.jsx'
import {
  ESTADOS,
  TIPOS,
  avance,
  diasHasta,
  esInterno,
  fechaCorta,
  pesos,
  rotuloEstado,
  rotuloFecha,
  rotuloImporte,
  vencido,
} from '../lib/modelo.js'

const ACTUALIZADA = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

/**
 * Detalle del proyecto. No hay modo lectura y modo edición: los campos están
 * vivos y lo que escribes ya está guardado.
 */
export default function Detalle({ proyecto, acciones, volver, gente = [] }) {
  const { actualizar, borrar, duplicar, anadirTarea, cambiarTarea, moverTarea, borrarTarea } =
    acciones
  const [confirmando, setConfirmando] = useState(false)
  const [tareaNueva, setTareaNueva] = useState('')
  const [etiquetasTexto, setEtiquetasTexto] = useState(proyecto.etiquetas.join(', '))

  useEffect(() => {
    setConfirmando(false)
    setTareaNueva('')
    setEtiquetasTexto(proyecto.etiquetas.join(', '))
  }, [proyecto.id])

  useEffect(() => {
    if (!proyecto.nombre) document.getElementById('campo-nombre')?.focus()
  }, [proyecto.id, proyecto.nombre])

  const progreso = avance(proyecto)
  const dias = diasHasta(proyecto.entrega)
  const tarde = vencido(proyecto)
  const interno = esInterno(proyecto)

  const ajustarAlto = (nodo) => {
    if (!nodo) return
    nodo.style.height = 'auto'
    nodo.style.height = `${nodo.scrollHeight}px`
  }

  function guardarEtiquetas(texto) {
    const etiquetas = [
      ...new Set(
        texto
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      ),
    ].slice(0, 8)
    actualizar(proyecto.id, { etiquetas })
  }

  return (
    <Tarjeta className="detalle aparece">
      <header className="detalle__cabecera">
        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="oculto" htmlFor="campo-nombre">
            Nombre del proyecto
          </label>
          <textarea
            id="campo-nombre"
            rows={1}
            className="detalle__titulo"
            value={proyecto.nombre}
            ref={ajustarAlto}
            placeholder="Nombre del proyecto"
            maxLength={120}
            onChange={(e) => {
              ajustarAlto(e.target)
              actualizar(proyecto.id, { nombre: e.target.value })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.target.blur()
              }
            }}
          />
        </div>
        <Boton variante="icono" className="detalle__cerrar" onClick={volver} aria-label="Volver al tablero">
          <ArrowLeft size={17} weight="bold" />
        </Boton>

        <div className="detalle__meta">
          <div className="estados" role="group" aria-label="Estado del proyecto">
            {ESTADOS.map((estado) => (
              <button
                type="button"
                key={estado.id}
                className={`estado ${proyecto.estado === estado.id ? 'estado--activo' : ''}`.trim()}
                aria-pressed={proyecto.estado === estado.id}
                onClick={() => actualizar(proyecto.id, { estado: estado.id })}
              >
                {rotuloEstado(estado.id, proyecto.tipo)}
              </button>
            ))}
          </div>

          <div className="estados" role="group" aria-label="Tipo de proyecto">
            {TIPOS.map((tipo) => (
              <button
                type="button"
                key={tipo.id}
                className={`estado ${proyecto.tipo === tipo.id ? 'estado--activo' : ''}`.trim()}
                aria-pressed={proyecto.tipo === tipo.id}
                onClick={() => actualizar(proyecto.id, { tipo: tipo.id })}
              >
                {tipo.id === 'interno' ? <RocketLaunch size={13} weight="fill" /> : null}
                {tipo.rotulo}
              </button>
            ))}
          </div>

          {tarde ? (
            <Chip variante="negro">
              {interno ? 'Lanzamiento pasado hace' : 'Vencido hace'} {Math.abs(dias)} d
            </Chip>
          ) : null}
        </div>

      </header>

      <div className="detalle__cuerpo">
        <div className="detalle__columna">
          {interno ? (
            <p className="nota-tipo">
              <RocketLaunch size={16} weight="fill" />
              <span>
                Producto propio de la casa. No lo cotiza nadie: la inversión que anotes no entra en
                la caja de clientes, y la fecha es la de salida al mercado.
              </span>
            </p>
          ) : (
            <Campo
              id="campo-cliente"
              etiqueta="Cliente"
              value={proyecto.cliente}
              onChange={(e) => actualizar(proyecto.id, { cliente: e.target.value })}
              placeholder="Quién encarga el trabajo"
              maxLength={80}
            />
          )}

          <div className="detalle__par">
            <Campo
              id="campo-inicio"
              etiqueta="Inicio"
              type="date"
              value={proyecto.inicio}
              onChange={(e) => actualizar(proyecto.id, { inicio: e.target.value })}
            />
            <Campo
              id="campo-entrega"
              etiqueta={rotuloFecha(proyecto.tipo)}
              type="date"
              value={proyecto.entrega}
              onChange={(e) => actualizar(proyecto.id, { entrega: e.target.value })}
              pista={
                proyecto.entrega
                  ? tarde
                    ? `${Math.abs(dias)} días de retraso`
                    : dias === 0
                      ? interno
                        ? 'Se lanza hoy'
                        : 'Se entrega hoy'
                      : `Quedan ${dias} días`
                  : interno
                    ? 'Sin fecha de lanzamiento'
                    : 'Sin fecha comprometida'
              }
            />
          </div>

          {interno ? (
            <CampoDinero
              id="campo-presupuesto"
              etiqueta={rotuloImporte(proyecto.tipo)}
              value={proyecto.presupuesto}
              onChange={(e) => actualizar(proyecto.id, { presupuesto: Number(e.target.value) })}
              pista="Pesos mexicanos. Es gasto propio, no cuenta como ingreso."
            />
          ) : (
            <div className="detalle__par">
              <CampoDinero
                id="campo-presupuesto"
                etiqueta={rotuloImporte(proyecto.tipo)}
                value={proyecto.presupuesto}
                onChange={(e) => actualizar(proyecto.id, { presupuesto: Number(e.target.value) })}
                pista="Pesos mexicanos"
              />
              <div className="bloque-campo">
                <span className="etiqueta-campo">Cobro</span>
                <div className={`cobro ${proyecto.cobrado ? 'cobro--hecho' : ''}`.trim()}>
                  <Casilla
                    checked={proyecto.cobrado}
                    onChange={(e) => actualizar(proyecto.id, { cobrado: e.target.checked })}
                    etiqueta={proyecto.cobrado ? 'Cobrado' : 'Pendiente'}
                  />
                  <span className="apoyo cifra">{pesos(proyecto.presupuesto)}</span>
                </div>
              </div>
            </div>
          )}

          <Campo
            id="campo-enlace"
            etiqueta="Enlace"
            type="url"
            value={proyecto.enlace}
            onChange={(e) => actualizar(proyecto.id, { enlace: e.target.value })}
            placeholder="https://"
          />
          {proyecto.enlace ? (
            <p style={{ marginTop: -8 }}>
              <a
                href={proyecto.enlace}
                target="_blank"
                rel="noreferrer"
                className="apoyo"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--tinta)' }}
              >
                Abrir el enlace <ArrowSquareOut size={13} weight="bold" />
              </a>
            </p>
          ) : null}

          <Campo
            id="campo-etiquetas"
            etiqueta="Etiquetas"
            value={etiquetasTexto}
            onChange={(e) => setEtiquetasTexto(e.target.value)}
            onBlur={(e) => guardarEtiquetas(e.target.value)}
            placeholder="web, ia, branding"
            pista="Separadas por comas. Sirven para filtrar la cartera."
          />
          {proyecto.etiquetas.length > 0 ? (
            <p style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: -8 }}>
              {proyecto.etiquetas.map((etiqueta) => (
                <Chip key={etiqueta}>{etiqueta}</Chip>
              ))}
            </p>
          ) : null}
        </div>

        <div className="detalle__columna">
          <Tareas
            proyecto={proyecto}
            progreso={progreso}
            gente={gente}
            tareaNueva={tareaNueva}
            setTareaNueva={setTareaNueva}
            anadirTarea={anadirTarea}
            cambiarTarea={cambiarTarea}
            moverTarea={moverTarea}
            borrarTarea={borrarTarea}
          />

          <Campo
            id="campo-notas"
            etiqueta="Notas"
            area
            value={proyecto.notas}
            onChange={(e) => actualizar(proyecto.id, { notas: e.target.value })}
            placeholder="Lo que hay que recordar antes de la próxima llamada."
          />
        </div>
      </div>

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--e3)',
          flexWrap: 'wrap',
          padding: 'var(--e4) var(--e5)',
          borderTop: '1px solid var(--linea)',
        }}
      >
        {confirmando ? (
          <>
            <span className="apoyo" style={{ flex: 1, minWidth: 220, color: 'var(--tinta)' }}>
              Se borra <strong>{proyecto.nombre || 'este proyecto'}</strong> y sus {proyecto.tareas.length}{' '}
              {proyecto.tareas.length === 1 ? 'tarea' : 'tareas'}. No hay deshacer.
            </span>
            <Boton
              variante="principal"
              onClick={() => {
                borrar(proyecto.id)
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
              {proyecto.entrega
                ? `${rotuloFecha(proyecto.tipo)} ${fechaCorta(proyecto.entrega)} · `
                : ''}
              Actualizado {ACTUALIZADA.format(new Date(proyecto.actualizado))}
            </span>
            <span style={{ display: 'flex', gap: 'var(--e2)', marginLeft: 'auto', flexWrap: 'wrap' }}>
              <Boton onClick={() => duplicar(proyecto)}>
                <CopySimple size={15} /> Duplicar
              </Boton>
              <Boton onClick={() => setConfirmando(true)}>
                <TrashSimple size={15} /> Borrar
              </Boton>
              <Boton variante="principal" onClick={volver}>
                Volver al tablero
              </Boton>
            </span>
          </>
        )}
      </footer>
    </Tarjeta>
  )
}
