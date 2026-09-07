/* ===========================================================================
   La cotización como PDF de verdad: vectorial, con el texto seleccionable y
   las tipografías incrustadas. No es una foto de la pantalla.

   Este módulo es gemelo de `componentes/Documento.jsx` y de `estilos/documento.css`.
   Los dos dibujan el MISMO documento con las MISMAS medidas; lo único que
   cambia es el lenguaje. Para que no se separen, todas las medidas salen de
   milímetros convertidos aquí abajo, exactamente los mismos milímetros que
   están escritos en el CSS. Si tocas uno, toca el otro.

   Se carga sólo cuando alguien pide el PDF: pesa más que la aplicación entera
   y no tiene por qué viajar en el arranque, y menos por datos móviles.
   =========================================================================== */

import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { fechaLarga, pesos, rotuloEstadoCot, totalesCotizacion } from './modelo.js'

/* --- Medidas ---------------------------------------------------------------
   El PDF piensa en puntos (1/72 de pulgada) y el CSS en milímetros. Una sola
   función traduce, para que en el resto del archivo se lea el mismo número
   que en la hoja de estilos. */
const mm = (n) => n * 2.834645669

const ANCHO_A4 = 595.28
const MARGEN = mm(14)
const HUECO = mm(5.5) // el aire entre secciones: el mismo `gap` de la hoja
const TOPE = 28 // margen superior de la segunda página en adelante

const NEGRO = '#14161a'
const TINTA_MEDIA = '#5c636e'
const TINTA_SUAVE = '#616873'
const LINEA = '#e3e8ef'
const HUNDIDO = '#f3f5f8'
const SOBRE_NEGRO_SUAVE = '#a8aeb9'

const raiz = (ruta) => `${import.meta.env.BASE_URL}${ruta}`.replace(/([^:])\/{2,}/g, '$1/')

/* --- Tipografía -------------------------------------------------------------
   Manrope estática en los tres pesos que usa el documento. Van servidas desde
   la propia aplicación: el PDF tiene que salir igual sin conexión. */
let registrada = false

function registrarTipografia() {
  if (registrada) return
  registrada = true
  Font.register({
    family: 'Manrope',
    fonts: [
      { src: raiz('fuentes/Manrope-400.ttf'), fontWeight: 400 },
      { src: raiz('fuentes/Manrope-700.ttf'), fontWeight: 700 },
      { src: raiz('fuentes/Manrope-800.ttf'), fontWeight: 800 },
    ],
  })
  // Sin esto parte las palabras con guiones a mitad de renglón. En un
  // documento que se manda a un cliente eso se lee como un error.
  Font.registerHyphenationCallback((palabra) => [palabra])
}

/* --- Estilos --------------------------------------------------------------- */

const e = StyleSheet.create({
  hoja: {
    paddingTop: TOPE,
    paddingBottom: MARGEN,
    paddingHorizontal: MARGEN,
    backgroundColor: '#ffffff',
    color: NEGRO,
    fontFamily: 'Manrope',
    fontSize: 9.5,
    lineHeight: 1.5,
  },

  /* --- Cabecera --- */
  bandaMarca: {
    marginTop: -TOPE,
    marginHorizontal: -MARGEN,
    paddingTop: mm(9),
    paddingBottom: mm(7),
    paddingHorizontal: MARGEN,
    backgroundColor: NEGRO,
    color: '#ffffff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bandaParticular: {
    marginTop: MARGEN - TOPE,
    paddingBottom: mm(5),
    borderBottomWidth: 2,
    borderBottomColor: NEGRO,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  logo: { height: mm(11), width: mm(11) * (705 / 180) },
  emisorNombre: { fontSize: 15, fontWeight: 800, letterSpacing: -0.45, lineHeight: 1.1 },
  emisorTitulo: {
    marginTop: mm(1),
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    color: TINTA_MEDIA,
  },
  titulo: { textAlign: 'right' },
  tipo: { fontSize: 15, fontWeight: 800, letterSpacing: -0.45, lineHeight: 1.1 },
  folio: { marginTop: mm(1), fontSize: 8, fontWeight: 700, letterSpacing: 0.8 },

  /* --- Rótulos --- */
  rotulo: {
    fontSize: 7,
    fontWeight: 800,
    letterSpacing: 1.12,
    textTransform: 'uppercase',
    color: TINTA_MEDIA,
    marginBottom: mm(2.5),
  },

  /* --- Datos --- */
  seccion: { marginTop: HUECO },
  datos: { marginTop: HUECO, flexDirection: 'row' },
  columnaPara: { flexGrow: 1.15, flexBasis: 0, paddingRight: mm(8) },
  columnaFicha: { flexGrow: 1, flexBasis: 0 },
  cliente: { fontSize: 12, fontWeight: 800, letterSpacing: -0.24, lineHeight: 1.25 },
  linea: { marginTop: mm(1.5), flexDirection: 'row' },
  lineaRotulo: { width: mm(19), fontWeight: 700, color: TINTA_MEDIA },
  lineaValor: { flexGrow: 1, flexBasis: 0 },
  fichaFila: { flexDirection: 'row', marginBottom: mm(1.2) },
  fichaUltima: { flexDirection: 'row' },
  fichaClave: { width: mm(16), fontWeight: 700, color: TINTA_MEDIA },
  fichaValor: { flexGrow: 1, flexBasis: 0 },

  /* --- Alcance --- */
  cabeceraTabla: {
    flexDirection: 'row',
    paddingBottom: mm(2),
    borderBottomWidth: 1.5,
    borderBottomColor: NEGRO,
  },
  encabezado: {
    fontSize: 7,
    fontWeight: 800,
    letterSpacing: 0.98,
    textTransform: 'uppercase',
    color: TINTA_MEDIA,
  },
  fila: {
    flexDirection: 'row',
    paddingVertical: mm(3),
    borderBottomWidth: 1,
    borderBottomColor: LINEA,
  },
  colTitulo: { width: mm(38), paddingRight: mm(5) },
  colEntregables: { flexGrow: 1, flexBasis: 0 },
  colImporte: { width: mm(26), paddingLeft: mm(4), textAlign: 'right' },
  componente: { fontWeight: 800, letterSpacing: -0.1 },
  importe: { fontWeight: 800 },
  vinetaFila: { flexDirection: 'row', marginBottom: mm(1.4) },
  vinetaUltima: { flexDirection: 'row' },
  vineta: {
    width: mm(1.4),
    height: mm(1.4),
    marginTop: mm(1.55),
    marginRight: mm(2.6),
    backgroundColor: NEGRO,
  },
  vinetaTexto: { flexGrow: 1, flexBasis: 0 },
  vacio: { color: TINTA_SUAVE },

  /* --- Totales --- */
  totales: { marginTop: HUECO, flexDirection: 'row', justifyContent: 'flex-end' },
  suma: { width: mm(78) },
  sumaFila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: mm(1.5) },
  sumaRotulo: { color: TINTA_MEDIA },
  sumaCifra: { fontWeight: 800 },
  total: {
    marginTop: mm(1.5),
    paddingVertical: mm(3.5),
    paddingHorizontal: mm(4),
    backgroundColor: NEGRO,
    borderRadius: mm(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRotulo: {
    color: '#ffffffb8',
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  totalCifra: { color: '#ffffff', fontSize: 15, fontWeight: 800, letterSpacing: -0.45 },
  totalMoneda: { fontSize: 8, fontWeight: 700, color: '#ffffffb3' },

  /* --- Notas --- */
  notas: { marginTop: HUECO, flexDirection: 'row', flexWrap: 'wrap' },
  nota: { padding: mm(4), backgroundColor: HUNDIDO, borderRadius: mm(2) },
  notaTexto: { fontSize: 8.5 },

  /* --- Pie --- */
  relleno: { flexGrow: 1 },
  pie: {
    paddingTop: mm(4),
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  rayaFirma: { width: mm(62), borderTopWidth: 1, borderTopColor: NEGRO, marginBottom: mm(2) },
  firmante: { fontSize: 10, fontWeight: 800, letterSpacing: -0.2 },
  cargo: {
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: TINTA_MEDIA,
  },
  contacto: { marginTop: mm(1), fontSize: 8.5, color: TINTA_MEDIA },
  sello: { flexDirection: 'row', alignItems: 'center' },
  selloIcono: { height: 18, width: 18 * (194 / 180), marginRight: mm(2.5) },
  selloTexto: { fontSize: 7.5, fontWeight: 700, letterSpacing: 0.75, color: TINTA_MEDIA },
  selloFuerte: { fontWeight: 800, color: NEGRO },

  paginacion: {
    position: 'absolute',
    bottom: mm(6),
    right: MARGEN,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: TINTA_SUAVE,
  },
})

const ANCHO_NOTA = (ANCHO_A4 - MARGEN * 2 - mm(5)) / 2

/**
 * Lista con viñeta cuadrada dibujada, no el punto del visor.
 *
 * Dos cuidados que en CSS salen gratis y aquí no:
 *  · `wrap={false}` — si no, el cuadrito se queda al pie de una página y su
 *    texto aparece al principio de la siguiente.
 *  · el último renglón no arrastra margen inferior, porque en la hoja esa
 *    separación es un `gap` y los `gap` no sobran por debajo.
 */
function Puntos({ items, estilo }) {
  return items.map((texto, i) => (
    <View
      key={i}
      wrap={false}
      style={i === items.length - 1 ? e.vinetaUltima : e.vinetaFila}
    >
      <View style={e.vineta} />
      <Text style={[e.vinetaTexto, estilo]}>{texto}</Text>
    </View>
  ))
}

/* --- El documento ----------------------------------------------------------- */

export function HojaPdf({ cot }) {
  const t = totalesCotizacion(cot)
  const conMarca = cot.marca === 'diabolical'
  const hayImportes = t.desglosado
  const firma = conMarca ? 'DIABOLICAL IA Services' : cot.emisorNombre || 'Cotización'

  const paraDatos = [
    ['Proyecto', cot.proyecto],
    ['Atención', cot.atencion],
    ['Ubicación', cot.ubicacion],
  ].filter(([, valor]) => valor)

  const fichaDatos = [
    ['Fecha', fechaLarga(cot.fecha) || '—'],
    ['Plazo', cot.plazo],
    ['Validez', cot.validez],
    ['Estado', rotuloEstadoCot(cot.estado).toLowerCase()],
  ].filter(([, valor]) => valor)

  return (
    <Document
      title={`Cotización ${cot.folio}`}
      author={cot.emisorNombre || firma}
      subject={cot.proyecto || cot.cliente || 'Cotización'}
      creator={firma}
      producer={firma}
    >
      <Page size="A4" style={e.hoja}>
        {/* --- Cabecera --- */}
        <View style={conMarca ? e.bandaMarca : e.bandaParticular}>
          {conMarca ? (
            <Image style={e.logo} src={raiz('marca/LOGO-DIABOLICAL-HORIZONTAL-BLANCO@2x.png')} />
          ) : (
            <View>
              <Text style={e.emisorNombre}>{cot.emisorNombre || 'Tu nombre'}</Text>
              {cot.emisorTitulo ? <Text style={e.emisorTitulo}>{cot.emisorTitulo}</Text> : null}
            </View>
          )}

          <View style={e.titulo}>
            <Text style={e.tipo}>Cotización</Text>
            <Text style={[e.folio, { color: conMarca ? SOBRE_NEGRO_SUAVE : TINTA_MEDIA }]}>
              {cot.folio}
            </Text>
          </View>
        </View>

        {/* --- Para quién / el documento --- */}
        <View style={e.datos}>
          <View style={e.columnaPara}>
            <Text style={e.rotulo}>Para</Text>
            <Text style={e.cliente}>{cot.cliente || 'Nombre del cliente'}</Text>
            {paraDatos.map(([clave, valor]) => (
              <View style={e.linea} key={clave}>
                <Text style={e.lineaRotulo}>{clave}</Text>
                <Text style={e.lineaValor}>{valor}</Text>
              </View>
            ))}
          </View>

          <View style={e.columnaFicha}>
            <Text style={e.rotulo}>Documento</Text>
            {fichaDatos.map(([clave, valor], i) => (
              <View
                style={i === fichaDatos.length - 1 ? e.fichaUltima : e.fichaFila}
                key={clave}
              >
                <Text style={e.fichaClave}>{clave}</Text>
                <Text style={e.fichaValor}>{valor}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- Alcance --- */}
        <View style={e.seccion}>
          <Text style={e.rotulo}>Alcance</Text>
          {cot.componentes.length === 0 ? (
            <Text style={e.vacio}>Todavía no has añadido componentes.</Text>
          ) : (
            <View>
              <View style={e.cabeceraTabla}>
                <Text style={[e.encabezado, e.colTitulo]}>Componente</Text>
                <Text style={[e.encabezado, e.colEntregables]}>Entregables</Text>
                {hayImportes ? <Text style={[e.encabezado, e.colImporte]}>Importe</Text> : null}
              </View>

              {cot.componentes.map((c) => (
                <View style={e.fila} key={c.id} wrap={false}>
                  <Text style={[e.colTitulo, e.componente]}>{c.titulo || 'Sin título'}</Text>
                  <View style={e.colEntregables}>
                    {c.entregables.length ? (
                      <Puntos items={c.entregables} />
                    ) : (
                      <Text style={e.vacio}>—</Text>
                    )}
                  </View>
                  {hayImportes ? (
                    <Text style={[e.colImporte, e.importe]}>
                      {c.importe ? pesos(c.importe) : '—'}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* --- Inversión --- */}
        <View style={e.totales} wrap={false}>
          <View style={e.suma}>
            {cot.conIva ? (
              <>
                <View style={e.sumaFila}>
                  <Text style={e.sumaRotulo}>Subtotal</Text>
                  <Text style={e.sumaCifra}>{pesos(t.subtotal)}</Text>
                </View>
                <View style={e.sumaFila}>
                  <Text style={e.sumaRotulo}>IVA 16%</Text>
                  <Text style={e.sumaCifra}>{pesos(t.iva)}</Text>
                </View>
              </>
            ) : null}
            <View style={e.total}>
              <Text style={e.totalRotulo}>Inversión total</Text>
              <Text style={e.totalCifra}>
                {pesos(t.total)} <Text style={e.totalMoneda}>MXN</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* --- Notas destacadas, en dos columnas --- */}
        {cot.bloques.length > 0 ? (
          <View style={e.notas}>
            {cot.bloques.map((b, i) => (
              <View
                key={b.id}
                wrap={false}
                style={[
                  e.nota,
                  { width: ANCHO_NOTA },
                  i % 2 === 0 ? { marginRight: mm(5) } : null,
                  i > 1 ? { marginTop: mm(5) } : null,
                ]}
              >
                <Text style={e.rotulo}>{b.titulo || 'Nota'}</Text>
                <Text style={e.notaTexto}>{b.texto}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* --- Condiciones --- */}
        {cot.condiciones.length > 0 ? (
          <View style={e.seccion}>
            <Text style={e.rotulo}>Condiciones</Text>
            <Puntos items={cot.condiciones} estilo={e.notaTexto} />
          </View>
        ) : null}

        {cot.notas ? (
          <View style={e.seccion}>
            <Text style={e.rotulo}>Notas</Text>
            <Text style={e.notaTexto}>{cot.notas}</Text>
          </View>
        ) : null}

        {/* El pie baja al fondo de la hoja cuando sobra sitio y sigue al
            contenido cuando no lo hay. */}
        <View style={e.relleno} />

        <View style={e.pie} wrap={false}>
          <View>
            <View style={e.rayaFirma} />
            <Text style={e.firmante}>{cot.emisorNombre || 'Nombre de quien firma'}</Text>
            {cot.emisorTitulo ? <Text style={e.cargo}>{cot.emisorTitulo}</Text> : null}
            {cot.emisorContacto ? <Text style={e.contacto}>{cot.emisorContacto}</Text> : null}
          </View>

          {conMarca ? (
            <View style={e.sello}>
              <Image style={e.selloIcono} src={raiz('marca/ICONO-DIABOLICAL-NEGRO@2x.png')} />
              <Text style={e.selloTexto}>
                DIABOLICAL <Text style={e.selloFuerte}>IA SERVICES</Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Sólo aparece si de verdad hay más de una página. */}
        <Text
          style={e.paginacion}
          fixed
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `${pageNumber} / ${totalPages}` : ''
          }
        />
      </Page>
    </Document>
  )
}

/* --- Salida ----------------------------------------------------------------- */

/** Un nombre de archivo que sobrevive a Windows, a macOS y al correo. */
export function nombreArchivo(cot) {
  const limpio = [cot.folio, cot.cliente || cot.proyecto]
    .filter(Boolean)
    .join(' · ')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
  return `${limpio || 'Cotizacion'}.pdf`
}

/**
 * Cuántas hojas trae el PDF, leídas del archivo ya hecho.
 *
 * Parece un rodeo y no lo es: el reparto en páginas ocurre dentro de la
 * librería y no queda expuesto en ninguna parte, y contarlas mirando la vista
 * previa sería mentir, porque la previa es HTML y no corta por donde corta el
 * PDF. Si el archivo no se deja leer, esto devuelve null y la interfaz
 * sencillamente no dice ningún número, que es mejor que decir uno falso.
 */
async function contarPaginas(blob) {
  try {
    const bytes = new TextDecoder('latin1').decode(await blob.arrayBuffer())
    const cuantas = bytes.match(/\/Type\s*\/Page(?![sA-Za-z])/g)?.length ?? 0
    return cuantas > 0 ? cuantas : null
  } catch {
    return null
  }
}

/** El PDF como Blob, y cuántas hojas ocupó. */
export async function generarPdf(cot) {
  registrarTipografia()
  const blob = await pdf(<HojaPdf cot={cot} />).toBlob()
  return { blob, paginas: await contarPaginas(blob) }
}
