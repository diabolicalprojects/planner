import { fechaLarga, pesos, rotuloEstadoCot, totalesCotizacion } from '../lib/modelo.js'

/**
 * La cotización tal y como sale impresa. Es una hoja A4 de verdad: lo que se ve
 * en pantalla es exactamente lo que sale en el PDF, porque es el mismo nodo.
 *
 * Dos caras según `marca`:
 *   · diabolical — banda negra con el logotipo y pie de la casa.
 *   · particular — cabecera tipográfica con el nombre de quien la firma.
 */
export default function Documento({ cot }) {
  const t = totalesCotizacion(cot)
  const conMarca = cot.marca === 'diabolical'
  const hayImportes = t.desglosado

  return (
    <article className={`hoja ${conMarca ? 'hoja--marca' : 'hoja--particular'}`}>
      <header className="hoja__cabecera">
        {conMarca ? (
          <div className="hoja__marca">
            <img src="/marca/LOGO-DIABOLICAL-HORIZONTAL-BLANCO.svg" alt="DIABOLICAL IA Services" />
          </div>
        ) : (
          <div className="hoja__emisor-alto">
            <p className="hoja__emisor-nombre">{cot.emisorNombre || 'Tu nombre'}</p>
            {cot.emisorTitulo ? <p className="hoja__emisor-titulo">{cot.emisorTitulo}</p> : null}
          </div>
        )}

        <div className="hoja__titulo">
          <p className="hoja__tipo">Cotización</p>
          <p className="hoja__folio">{cot.folio}</p>
        </div>
      </header>

      <section className="hoja__datos">
        <div className="hoja__bloque-dato">
          <p className="hoja__rotulo">Para</p>
          <p className="hoja__cliente">{cot.cliente || 'Nombre del cliente'}</p>
          {cot.proyecto ? (
            <p className="hoja__linea">
              <span>Proyecto</span> {cot.proyecto}
            </p>
          ) : null}
          {cot.atencion ? (
            <p className="hoja__linea">
              <span>Atención</span> {cot.atencion}
            </p>
          ) : null}
          {cot.ubicacion ? (
            <p className="hoja__linea">
              <span>Ubicación</span> {cot.ubicacion}
            </p>
          ) : null}
        </div>

        <div className="hoja__bloque-dato">
          <p className="hoja__rotulo">Documento</p>
          <dl className="hoja__ficha">
            <dt>Fecha</dt>
            <dd>{fechaLarga(cot.fecha) || '—'}</dd>
            {cot.plazo ? (
              <>
                <dt>Plazo</dt>
                <dd>{cot.plazo}</dd>
              </>
            ) : null}
            {cot.validez ? (
              <>
                <dt>Validez</dt>
                <dd>{cot.validez}</dd>
              </>
            ) : null}
            <dt>Estado</dt>
            <dd>{rotuloEstadoCot(cot.estado).toLowerCase()}</dd>
          </dl>
        </div>
      </section>

      <section className="hoja__alcance">
        <p className="hoja__rotulo">Alcance</p>
        {cot.componentes.length === 0 ? (
          <p className="hoja__vacio">Todavía no has añadido componentes.</p>
        ) : (
          <table className="hoja__tabla">
            <thead>
              <tr>
                <th>Componente</th>
                <th>Entregables</th>
                {hayImportes ? <th className="hoja__derecha">Importe</th> : null}
              </tr>
            </thead>
            <tbody>
              {cot.componentes.map((c) => (
                <tr key={c.id}>
                  <td className="hoja__componente">{c.titulo || 'Sin título'}</td>
                  <td>
                    {c.entregables.length ? (
                      <ul className="hoja__entregables">
                        {c.entregables.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="hoja__vacio">—</span>
                    )}
                  </td>
                  {hayImportes ? (
                    <td className="hoja__derecha hoja__importe">{c.importe ? pesos(c.importe) : '—'}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="hoja__totales">
        <div className="hoja__suma">
          {cot.conIva ? (
            <>
              <p>
                <span>Subtotal</span>
                <b>{pesos(t.subtotal)}</b>
              </p>
              <p>
                <span>IVA 16%</span>
                <b>{pesos(t.iva)}</b>
              </p>
            </>
          ) : null}
          <p className="hoja__total">
            <span>Inversión total</span>
            <b>
              {pesos(t.total)} <small>MXN</small>
            </b>
          </p>
        </div>
      </section>

      {cot.bloques.length > 0 ? (
        <section className="hoja__notas">
          {cot.bloques.map((b) => (
            <div className="hoja__nota" key={b.id}>
              <p className="hoja__rotulo">{b.titulo || 'Nota'}</p>
              <p className="hoja__nota-texto">{b.texto}</p>
            </div>
          ))}
        </section>
      ) : null}

      {cot.condiciones.length > 0 ? (
        <section className="hoja__condiciones">
          <p className="hoja__rotulo">Condiciones</p>
          <ul>
            {cot.condiciones.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {cot.notas ? (
        <section className="hoja__condiciones">
          <p className="hoja__rotulo">Notas</p>
          <p className="hoja__nota-texto">{cot.notas}</p>
        </section>
      ) : null}

      <footer className="hoja__pie">
        <div className="hoja__firma">
          <span className="hoja__raya-firma" />
          <p className="hoja__firmante">{cot.emisorNombre || 'Nombre de quien firma'}</p>
          {cot.emisorTitulo ? <p className="hoja__cargo">{cot.emisorTitulo}</p> : null}
          {cot.emisorContacto ? <p className="hoja__contacto">{cot.emisorContacto}</p> : null}
        </div>

        {conMarca ? (
          <div className="hoja__sello">
            <img src="/marca/ICONO-DIABOLICAL-NEGRO.svg" alt="" width="26" height="24" />
            <span>
              DIABOLICAL <b>IA SERVICES</b>
            </span>
          </div>
        ) : null}
      </footer>
    </article>
  )
}
