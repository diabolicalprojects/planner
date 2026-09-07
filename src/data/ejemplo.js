// Proyectos de muestra para que la primera apertura no sea una pantalla vacía.
// Son inventados: la app los marca como ejemplo y se borran de un botón.
// Los importes están en pesos mexicanos. Hay de los dos tipos: encargos de
// cliente y productos propios pendientes de lanzar.

import { sanear } from '../lib/modelo.js'

function desplazar(dias) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

const FICHAS = [
  {
    id: 'MUESTRA01',
    tipo: 'cliente',
    nombre: 'Landing y reservas para el club',
    cliente: 'X3 Padel Club',
    estado: 'curso',
    inicio: desplazar(-21),
    entrega: desplazar(6),
    presupuesto: 48000,
    cobrado: false,
    enlace: 'https://x3padel.example/landing',
    etiquetas: ['web', 'landing'],
    notas: 'Falta el bloque de ligas con el calendario real. El video del hero está pendiente de que envíen el bruto.',
    tareas: [
      { id: 'M0101', texto: 'Maquetar hero con video', hecha: true , responsable: 'Ana Rueda' },
      { id: 'M0102', texto: 'Sección de ligas', hecha: true , responsable: 'Ana Rueda' },
      { id: 'M0103', texto: 'Integrar WhatsApp de reservas', hecha: true , responsable: 'Beto Salas' },
      { id: 'M0104', texto: 'Revisión de textos con el cliente', hecha: false , responsable: 'Ana Rueda' },
      { id: 'M0105', texto: 'Subida a producción', hecha: false , responsable: 'Beto Salas' },
    ],
  },
  {
    id: 'MUESTRA02',
    tipo: 'cliente',
    nombre: 'Agente de atención por WhatsApp',
    cliente: 'Hidroforum',
    estado: 'curso',
    inicio: desplazar(-9),
    entrega: desplazar(18),
    presupuesto: 76000,
    cobrado: false,
    enlace: '',
    etiquetas: ['ia', 'automatizacion'],
    notas: 'Base de conocimiento montada con el catálogo de 2026. Falta decidir el traspaso a una persona fuera de horario.',
    tareas: [
      { id: 'M0201', texto: 'Cargar catálogo en la base de conocimiento', hecha: true , responsable: 'Beto Salas' },
      { id: 'M0202', texto: 'Flujo de escalado a persona', hecha: false , responsable: 'Carla Ontiveros' },
      { id: 'M0203', texto: 'Pruebas con 20 consultas reales', hecha: false , responsable: 'Carla Ontiveros' },
    ],
  },
  {
    id: 'MUESTRA03',
    tipo: 'cliente',
    nombre: 'Identidad y papelería',
    cliente: 'Maestras Estudio',
    estado: 'entregado',
    inicio: desplazar(-64),
    entrega: desplazar(-12),
    presupuesto: 33000,
    cobrado: true,
    enlace: '',
    etiquetas: ['branding'],
    notas: 'Entregado el manual y los archivos vectoriales. Cobrado por transferencia.',
    tareas: [
      { id: 'M0301', texto: 'Propuestas de marca', hecha: true , responsable: 'Ana Rueda' },
      { id: 'M0302', texto: 'Manual de uso', hecha: true , responsable: 'Ana Rueda' },
      { id: 'M0303', texto: 'Entrega de vectoriales', hecha: true , responsable: 'Ana Rueda' },
    ],
  },
  {
    id: 'MUESTRA04',
    tipo: 'cliente',
    nombre: 'Rediseño de la tienda',
    cliente: 'Powercalisthenics',
    estado: 'pausa',
    inicio: desplazar(-38),
    entrega: '',
    presupuesto: 58000,
    cobrado: false,
    enlace: '',
    etiquetas: ['web', 'tienda'],
    notas: 'Parado a petición del cliente hasta que cierren el catálogo de temporada. Retomar en cuanto confirmen.',
    tareas: [
      { id: 'M0401', texto: 'Auditoría de la tienda actual', hecha: true , responsable: 'Carla Ontiveros' },
      { id: 'M0402', texto: 'Árbol de categorías nuevo', hecha: false },
    ],
  },
  {
    id: 'MUESTRA05',
    tipo: 'cliente',
    nombre: 'Facturas por correo a hoja de cálculo',
    cliente: 'Nails Bilbao',
    estado: 'entregado',
    inicio: desplazar(-30),
    entrega: desplazar(-4),
    presupuesto: 18000,
    cobrado: false,
    enlace: '',
    etiquetas: ['automatizacion'],
    notas: 'Entregado y funcionando. Factura enviada, aún sin cobrar.',
    tareas: [
      { id: 'M0501', texto: 'Lectura del buzón', hecha: true , responsable: 'Beto Salas' },
      { id: 'M0502', texto: 'Extracción de importes', hecha: true , responsable: 'Beto Salas' },
      { id: 'M0503', texto: 'Volcado a la hoja', hecha: true , responsable: 'Beto Salas' },
    ],
  },
  {
    id: 'MUESTRA06',
    tipo: 'cliente',
    nombre: 'Videos cortos para redes',
    cliente: 'Gym Aranda',
    estado: 'idea',
    inicio: desplazar(-2),
    entrega: '',
    presupuesto: 24000,
    cobrado: false,
    enlace: '',
    etiquetas: ['video', 'ia'],
    notas: 'Han preguntado por 8 videos al mes generados con IA. Falta cerrar alcance y precio.',
    tareas: [],
  },
  {
    id: 'MUESTRA07',
    tipo: 'interno',
    nombre: 'Kit de agentes para PyMEs',
    cliente: '',
    estado: 'curso',
    inicio: desplazar(-45),
    entrega: desplazar(27),
    presupuesto: 90000,
    cobrado: false,
    enlace: '',
    etiquetas: ['ia', 'producto'],
    notas: 'Producto propio: tres agentes preconfigurados que se venden por suscripción. Falta cerrar precios y la página de venta antes de anunciarlo.',
    tareas: [
      { id: 'M0701', texto: 'Definir los tres agentes del kit', hecha: true , responsable: 'Carla Ontiveros' },
      { id: 'M0702', texto: 'Precios y planes', hecha: false },
      { id: 'M0703', texto: 'Página de venta', hecha: false , responsable: 'Ana Rueda' },
      { id: 'M0704', texto: 'Documentación de instalación', hecha: false , responsable: 'Beto Salas' },
      { id: 'M0705', texto: 'Anuncio en redes y correo', hecha: false },
    ],
  },
  {
    id: 'MUESTRA08',
    tipo: 'interno',
    nombre: 'Plantillas de automatización',
    cliente: '',
    estado: 'idea',
    inicio: desplazar(-6),
    entrega: '',
    presupuesto: 35000,
    cobrado: false,
    enlace: '',
    etiquetas: ['automatizacion', 'producto'],
    notas: 'Empaquetar las automatizaciones que ya repetimos en cada encargo y venderlas sueltas. Sin fecha todavía.',
    tareas: [
      { id: 'M0801', texto: 'Listar las que más se repiten', hecha: false },
    ],
  },
]

export function proyectosDeEjemplo() {
  return FICHAS.map(sanear)
}
