// Modelo de datos del planificador. Un proyecto es la única entidad;
// las tareas y las etiquetas viven dentro de él.

export const ESTADOS = [
  { id: 'idea', rotulo: 'IDEA' },
  { id: 'curso', rotulo: 'EN CURSO' },
  { id: 'pausa', rotulo: 'PAUSADO' },
  { id: 'entregado', rotulo: 'ENTREGADO' },
]

export const ESTADO_IDS = ESTADOS.map((e) => e.id)

/**
 * Un proyecto es de cliente (alguien lo cotizó y lo paga) o interno (un producto
 * propio que hay que sacar al mercado). El dinero de uno y otro no se mezcla.
 */
export const TIPOS = [
  { id: 'cliente', rotulo: 'De cliente' },
  { id: 'interno', rotulo: 'Interno' },
]

export const TIPO_IDS = TIPOS.map((t) => t.id)

export function esInterno(proyecto) {
  return proyecto?.tipo === 'interno'
}

/** Para un producto propio, el último estado no es una entrega: es un lanzamiento. */
export function rotuloEstado(id, tipo) {
  if (id === 'entregado' && tipo === 'interno') return 'LANZADO'
  return ESTADOS.find((e) => e.id === id)?.rotulo ?? 'SIN ESTADO'
}

/** La fecha clave se llama distinto según de quién sea el proyecto. */
export function rotuloFecha(tipo) {
  return tipo === 'interno' ? 'Lanzamiento' : 'Entrega'
}

export function rotuloImporte(tipo) {
  return tipo === 'interno' ? 'Inversión prevista' : 'Presupuesto'
}

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function nuevoId() {
  let salida = ''
  const valores = crypto.getRandomValues(new Uint8Array(10))
  for (const v of valores) salida += ALFABETO[v % ALFABETO.length]
  return salida
}

export function hoyISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Ficha vacía, lista para el formulario de alta. */
export function proyectoEnBlanco() {
  return {
    id: nuevoId(),
    nombre: '',
    tipo: 'cliente',
    cliente: '',
    estado: 'idea',
    inicio: hoyISO(),
    entrega: '',
    presupuesto: 0,
    cobrado: false,
    notas: '',
    enlace: '',
    etiquetas: [],
    tareas: [],
    creado: new Date().toISOString(),
    actualizado: new Date().toISOString(),
  }
}

/** Normaliza cualquier ficha (venga de un JSON importado o de una versión previa). */
export function sanear(bruto) {
  const base = proyectoEnBlanco()
  if (!bruto || typeof bruto !== 'object') return base
  const numero = Number(bruto.presupuesto)
  return {
    ...base,
    ...bruto,
    id: typeof bruto.id === 'string' && bruto.id ? bruto.id : base.id,
    nombre: String(bruto.nombre ?? '').slice(0, 120),
    tipo: TIPO_IDS.includes(bruto.tipo) ? bruto.tipo : 'cliente',
    cliente: String(bruto.cliente ?? '').slice(0, 80),
    estado: ESTADO_IDS.includes(bruto.estado) ? bruto.estado : 'idea',
    inicio: fechaValida(bruto.inicio) ? bruto.inicio : '',
    entrega: fechaValida(bruto.entrega) ? bruto.entrega : '',
    presupuesto: Number.isFinite(numero) && numero >= 0 ? numero : 0,
    cobrado: Boolean(bruto.cobrado),
    notas: String(bruto.notas ?? ''),
    enlace: String(bruto.enlace ?? ''),
    etiquetas: Array.isArray(bruto.etiquetas)
      ? [...new Set(bruto.etiquetas.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 8)
      : [],
    tareas: Array.isArray(bruto.tareas)
      ? bruto.tareas.slice(0, 200).map((t) => ({
          id: typeof t?.id === 'string' && t.id ? t.id : nuevoId(),
          texto: String(t?.texto ?? '').slice(0, 160),
          hecha: Boolean(t?.hecha),
          responsable: String(t?.responsable ?? '').trim().slice(0, 40),
        }))
      : [],
  }
}

/** Iniciales para el disco del responsable: una o dos, nunca más. */
export function iniciales(nombre) {
  const partes = String(nombre ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!partes.length) return ''
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

/** Toda la gente que ya aparece como responsable, para autocompletar. */
export function responsables(proyectos) {
  const vistos = new Map()
  for (const p of proyectos) {
    for (const t of p.tareas) {
      const nombre = t.responsable?.trim()
      if (nombre) vistos.set(nombre.toLowerCase(), nombre)
    }
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'))
}

/** Quién lleva algo abierto en este proyecto, sin repetir. */
export function equipoDe(proyecto) {
  const vistos = new Map()
  for (const t of proyecto.tareas) {
    const nombre = t.responsable?.trim()
    if (nombre) vistos.set(nombre.toLowerCase(), nombre)
  }
  return [...vistos.values()]
}

export function avance(proyecto) {
  const total = proyecto.tareas.length
  if (!total) return null
  const hechas = proyecto.tareas.filter((t) => t.hecha).length
  return { hechas, total, fraccion: hechas / total }
}

export function diasHasta(fechaISO) {
  if (!fechaValida(fechaISO)) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const destino = new Date(`${fechaISO}T00:00:00`)
  return Math.round((destino - hoy) / 86400000)
}

export function fechaValida(valor) {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
}

/** Un proyecto está vencido si la entrega ya pasó y aún no se entregó. */
export function vencido(proyecto) {
  if (proyecto.estado === 'entregado') return false
  const dias = diasHasta(proyecto.entrega)
  return dias !== null && dias < 0
}

/* Todo el dinero de la app está en pesos mexicanos. */
export const MONEDA = 'MXN'

const PESOS = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
  useGrouping: 'always',
})

const PESOS_LARGOS = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
  currencyDisplay: 'code',
})

/** $45,000 — la forma corta, para tarjetas y listas. */
export function pesos(valor) {
  return PESOS.format(Number(valor) || 0)
}

/** 45,000 MXN — cuando conviene decir la moneda en voz alta. */
export function pesosConMoneda(valor) {
  return PESOS_LARGOS.format(Number(valor) || 0).replace('MXN', '').trim() + ' MXN'
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' })
const DIA = new Intl.DateTimeFormat('es-MX', { day: '2-digit' })
const MES = new Intl.DateTimeFormat('es-MX', { month: 'short' })

export function fechaCorta(fechaISO) {
  if (!fechaValida(fechaISO)) return null
  return FECHA_CORTA.format(new Date(`${fechaISO}T00:00:00`))
    .replace(/\./g, '')
    .replace(/[-\s]+/g, ' ')
}

export function partesFecha(fechaISO) {
  if (!fechaValida(fechaISO)) return null
  const d = new Date(`${fechaISO}T00:00:00`)
  return { dia: DIA.format(d), mes: MES.format(d).replace(/\./g, '') }
}

/**
 * Totales de cartera: cada cifra viaja con su desviación, nunca sola.
 * La caja es SÓLO dinero de clientes. Lo que se gasta en producto propio es
 * inversión, no ingreso, y se cuenta aparte: sumarlos mentiría sobre lo que
 * hay por cobrar.
 */
export function totales(proyectos) {
  const deCliente = proyectos.filter((p) => !esInterno(p))
  const internos = proyectos.filter(esInterno)
  const vivos = proyectos.filter((p) => p.estado !== 'entregado')

  const presupuestado = deCliente.reduce((s, p) => s + p.presupuesto, 0)
  const cobrado = deCliente.filter((p) => p.cobrado).reduce((s, p) => s + p.presupuesto, 0)
  const entregadoSinCobrar = deCliente
    .filter((p) => p.estado === 'entregado' && !p.cobrado)
    .reduce((s, p) => s + p.presupuesto, 0)

  const venceEstaSemana = proyectos.filter((p) => {
    const d = diasHasta(p.entrega)
    return p.estado !== 'entregado' && d !== null && d >= 0 && d <= 7
  })

  const porLanzar = internos.filter((p) => p.estado !== 'entregado')

  return {
    presupuestado,
    cobrado,
    pendiente: presupuestado - cobrado,
    entregadoSinCobrar,
    proyectosDeCliente: deCliente.length,
    inversion: internos.reduce((s, p) => s + p.presupuesto, 0),
    internos: internos.length,
    porLanzar,
    activos: vivos.length,
    venceEstaSemana,
    vencidos: proyectos.filter(vencido),
  }
}

/* ===========================================================================
   Cotizaciones
   =========================================================================== */

export const ESTADOS_COT = [
  { id: 'borrador', rotulo: 'BORRADOR' },
  { id: 'enviada', rotulo: 'ENVIADA' },
  { id: 'aprobada', rotulo: 'APROBADA' },
  { id: 'rechazada', rotulo: 'RECHAZADA' },
]

export const ESTADO_COT_IDS = ESTADOS_COT.map((e) => e.id)

export function rotuloEstadoCot(id) {
  return ESTADOS_COT.find((e) => e.id === id)?.rotulo ?? 'BORRADOR'
}

/** Con marca de la casa o como particular: la misma cotización, dos caras. */
export const MARCAS = [
  { id: 'diabolical', rotulo: 'DIABOLICAL' },
  { id: 'particular', rotulo: 'Particular' },
]

export const IVA = 0.16

/** COT-2026-0907-V1 — el mismo formato que ya venías usando. */
export function nuevoFolio(fecha = new Date(), version = 1) {
  const a = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `COT-${a}-${m}${d}-V${version}`
}

export function cotizacionEnBlanco() {
  const hoy = new Date()
  return {
    id: nuevoId(),
    folio: nuevoFolio(hoy),
    version: 1,
    estado: 'borrador',
    marca: 'diabolical',

    // Quién la emite. En modo particular es lo único que aparece arriba.
    emisorNombre: '',
    emisorTitulo: '',
    emisorContacto: '',

    // A quién va.
    cliente: '',
    proyecto: '',
    atencion: '',
    ubicacion: '',

    fecha: hoyISO(),
    plazo: '',
    validez: '15 días hábiles',

    componentes: [],
    bloques: [],
    condiciones: [],

    // Si ningún componente lleva importe, manda éste.
    totalManual: 0,
    conIva: false,
    notas: '',

    // Enlace opcional con un proyecto de la cartera.
    proyectoId: '',

    creado: hoy.toISOString(),
    actualizado: hoy.toISOString(),
  }
}

export function sanearCotizacion(bruto) {
  const base = cotizacionEnBlanco()
  if (!bruto || typeof bruto !== 'object') return base
  const texto = (v, max) => String(v ?? '').slice(0, max)
  const numero = (v) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0
  }
  return {
    ...base,
    ...bruto,
    id: typeof bruto.id === 'string' && bruto.id ? bruto.id : base.id,
    folio: texto(bruto.folio, 40) || base.folio,
    version: numero(bruto.version) || 1,
    estado: ESTADO_COT_IDS.includes(bruto.estado) ? bruto.estado : 'borrador',
    marca: bruto.marca === 'particular' ? 'particular' : 'diabolical',
    emisorNombre: texto(bruto.emisorNombre, 80),
    emisorTitulo: texto(bruto.emisorTitulo, 80),
    emisorContacto: texto(bruto.emisorContacto, 160),
    cliente: texto(bruto.cliente, 120),
    proyecto: texto(bruto.proyecto, 160),
    atencion: texto(bruto.atencion, 120),
    ubicacion: texto(bruto.ubicacion, 120),
    fecha: fechaValida(bruto.fecha) ? bruto.fecha : base.fecha,
    plazo: texto(bruto.plazo, 80),
    validez: texto(bruto.validez, 80),
    componentes: Array.isArray(bruto.componentes)
      ? bruto.componentes.slice(0, 40).map((c) => ({
          id: typeof c?.id === 'string' && c.id ? c.id : nuevoId(),
          titulo: texto(c?.titulo, 120),
          importe: numero(c?.importe),
          entregables: Array.isArray(c?.entregables)
            ? c.entregables.slice(0, 20).map((e) => texto(e, 400)).filter(Boolean)
            : [],
        }))
      : [],
    bloques: Array.isArray(bruto.bloques)
      ? bruto.bloques.slice(0, 8).map((b) => ({
          id: typeof b?.id === 'string' && b.id ? b.id : nuevoId(),
          titulo: texto(b?.titulo, 80),
          texto: texto(b?.texto, 800),
        }))
      : [],
    condiciones: Array.isArray(bruto.condiciones)
      ? bruto.condiciones.slice(0, 20).map((c) => texto(c, 500)).filter(Boolean)
      : [],
    totalManual: numero(bruto.totalManual),
    conIva: Boolean(bruto.conIva),
    notas: texto(bruto.notas, 2000),
    proyectoId: texto(bruto.proyectoId, 40),
  }
}

/**
 * Los números de la cotización. Si algún componente lleva importe, el total
 * sale de la suma y el campo manual deja de mandar: dos fuentes de verdad para
 * la misma cifra es como se acaba enviando un documento que no cuadra.
 */
export function totalesCotizacion(cot) {
  const sumaComponentes = cot.componentes.reduce((s, c) => s + (c.importe || 0), 0)
  const desglosado = sumaComponentes > 0
  const subtotal = desglosado ? sumaComponentes : cot.totalManual
  const iva = cot.conIva ? Math.round(subtotal * IVA) : 0
  return { desglosado, subtotal, iva, total: subtotal + iva }
}

const FECHA_LARGA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

export function fechaLarga(fechaISO) {
  if (!fechaValida(fechaISO)) return ''
  return FECHA_LARGA.format(new Date(`${fechaISO}T00:00:00`))
}
