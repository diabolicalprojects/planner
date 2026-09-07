import { CalendarBlank, Coins, RocketLaunch, WarningCircle } from '@phosphor-icons/react'
import { Avance, Tarjeta } from './base.jsx'
import {
  diasHasta,
  esInterno,
  partesFecha,
  pesos,
  pesosConMoneda,
  totales,
  vencido,
} from '../lib/modelo.js'

/** Ninguna cifra va sola: cada total lleva la desviación que lo explica. */
export default function Resumen({ proyectos, abrir }) {
  const t = totales(proyectos)
  const proporcionCobrada = t.presupuestado > 0 ? t.cobrado / t.presupuestado : 0

  const proximas = proyectos
    .filter((p) => p.estado !== 'entregado' && p.entrega)
    .sort((a, b) => a.entrega.localeCompare(b.entrega))
    .slice(0, 4)

  const proximoLanzamiento = t.porLanzar
    .filter((p) => p.entrega)
    .sort((a, b) => a.entrega.localeCompare(b.entrega))[0]

  return (
    <>
      <div className="indicadores">
        <div className="indicador indicador--negro">
          <p className="indicador__cifra cifra">{t.activos}</p>
          <p className="indicador__rotulo">{t.activos === 1 ? 'Proyecto abierto' : 'Proyectos abiertos'}</p>
        </div>
        <div className="indicador">
          <p className="indicador__cifra cifra">{t.vencidos.length}</p>
          <p className="indicador__rotulo">{t.vencidos.length === 1 ? 'Vencido' : 'Vencidos'}</p>
        </div>
      </div>

      <Tarjeta>
        <div className="panel">
          <div className="panel__cabecera">
            <h2 className="titulo-tarjeta">Caja</h2>
            <span className="rotulo">MXN</span>
          </div>

          <p className="caja__total">
            <span className="caja__importe cifra">{pesos(t.presupuestado)}</span>
            <span className="caja__moneda">presupuestado</span>
          </p>
          {/* La caja es dinero de clientes. Decirlo evita que se lea como si la
              inversión en producto propio fuera un ingreso. */}
          <p className="apoyo" style={{ marginTop: 4 }}>
            en {t.proyectosDeCliente} {t.proyectosDeCliente === 1 ? 'proyecto' : 'proyectos'} de cliente
          </p>

          <div className="caja__barra">
            <Avance fraccion={proporcionCobrada} etiqueta="Proporción cobrada de la cartera" />
          </div>

          <p className="caja__reparto">
            <span>
              Cobrado <b className="cifra">{pesos(t.cobrado)}</b>
            </span>
            <span className="apoyo">{Math.round(proporcionCobrada * 100)}%</span>
          </p>
          <p className="caja__reparto" style={{ marginTop: 4 }}>
            <span className="apoyo">
              Pendiente <b className="cifra">{pesos(t.pendiente)}</b>
            </span>
          </p>

          <p className="caja__aviso">
            <Coins size={16} />
            <span>
              {t.entregadoSinCobrar > 0 ? (
                <>
                  <b className="cifra">{pesosConMoneda(t.entregadoSinCobrar)}</b> ya entregados sin cobrar
                </>
              ) : (
                'Nada entregado sin cobrar'
              )}
            </span>
          </p>
        </div>
      </Tarjeta>

      {t.internos > 0 ? (
        <Tarjeta>
          <div className="panel">
            <div className="panel__cabecera">
              <h2 className="titulo-tarjeta">Producto propio</h2>
              <span className="rotulo">
                {t.internos} {t.internos === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            <p className="caja__total">
              <span className="caja__importe cifra">{pesos(t.inversion)}</span>
              <span className="caja__moneda">de inversión</span>
            </p>
            <p className="apoyo" style={{ marginTop: 4 }}>
              Gasto propio, fuera de la caja de clientes
            </p>

            <p className="caja__aviso">
              <RocketLaunch size={16} />
              <span>
                {t.porLanzar.length === 0 ? (
                  'Todo lanzado'
                ) : proximoLanzamiento ? (
                  <>
                    <b>{t.porLanzar.length}</b> por lanzar · el próximo en{' '}
                    <b className="cifra">{diasHasta(proximoLanzamiento.entrega)}</b> días
                  </>
                ) : (
                  <>
                    <b>{t.porLanzar.length}</b> por lanzar, ninguno con fecha todavía
                  </>
                )}
              </span>
            </p>
          </div>
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <div className="panel">
          <div className="panel__cabecera">
            <h2 className="titulo-tarjeta">Próximas fechas</h2>
            {t.venceEstaSemana.length > 0 ? (
              <span className="rotulo">{t.venceEstaSemana.length} esta semana</span>
            ) : null}
          </div>

          {proximas.length === 0 ? (
            <p className="apoyo">Ningún proyecto abierto tiene fecha.</p>
          ) : (
            <ul className="entregas">
              {proximas.map((p) => {
                const dias = diasHasta(p.entrega)
                const tarde = vencido(p)
                const interno = esInterno(p)
                const fecha = partesFecha(p.entrega)
                return (
                  <li key={p.id}>
                    <button type="button" className="entrega" onClick={() => abrir(p.id)}>
                      <span className={`entrega__dia ${tarde ? 'entrega__dia--tarde' : ''}`.trim()}>
                        <b className="cifra">{fecha.dia}</b>
                        <span>{fecha.mes}</span>
                      </span>
                      <span className="entrega__texto">
                        <span className="entrega__nombre">{p.nombre || 'Proyecto sin nombre'}</span>
                        <span className="entrega__plazo">
                          {interno ? <RocketLaunch size={11} weight="fill" /> : <CalendarBlank size={11} />}
                          {tarde ? (
                            <>
                              <WarningCircle size={11} weight="fill" /> {Math.abs(dias)} días de retraso
                            </>
                          ) : dias === 0 ? (
                            interno ? (
                              'Se lanza hoy'
                            ) : (
                              'Se entrega hoy'
                            )
                          ) : (
                            `${interno ? 'Lanzamiento' : 'Entrega'} en ${dias} días`
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Tarjeta>
    </>
  )
}
