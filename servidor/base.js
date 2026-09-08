// Acceso a Postgres. Un solo lugar donde se traduce entre la fila de la base y
// la forma que usa la interfaz.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

import { estaCobrado } from '../src/lib/modelo.js'

const AQUI = dirname(fileURLToPath(import.meta.url))

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Dokploy conecta por la red interna de Docker: ahí no hay TLS ni hace falta.
  ssl: process.env.DATABASE_SSL === '1' ? { rejectUnauthorized: false } : false,
  max: 5,
})

export async function aplicarEsquema() {
  const sql = await readFile(join(AQUI, 'esquema.sql'), 'utf8')
  await pool.query(sql)
}

/** Cuenta cuántos proyectos hay. Sirve para decidir si sembrar o no. */
export async function cuantosProyectos() {
  const { rows } = await pool.query('SELECT count(*)::int AS total FROM proyectos')
  return rows[0].total
}

const aISO = (valor) => {
  if (!valor) return ''
  if (typeof valor === 'string') return valor.slice(0, 10)
  // node-postgres devuelve DATE como Date en hora local: se toma la fecha civil.
  const d = new Date(valor)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export async function leerProyectos() {
  const { rows } = await pool.query(`
    SELECT p.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', t.id,
                 'texto', t.texto,
                 'hecha', t.hecha,
                 'responsable', t.responsable
               ) ORDER BY t.orden
             ) FILTER (WHERE t.id IS NOT NULL),
             '[]'
           ) AS tareas
      FROM proyectos p
      LEFT JOIN tareas t ON t.proyecto_id = p.id
     GROUP BY p.id
     ORDER BY p.creado DESC
  `)

  return rows.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    tipo: f.tipo,
    cliente: f.cliente,
    estado: f.estado,
    inicio: aISO(f.inicio),
    entrega: aISO(f.entrega),
    presupuesto: f.presupuesto,
    // `cobrado` no sube: se calcula de los pagos. En la tabla se queda como
    // valor derivado, para poder mirarla a pelo sin sumar JSON a mano.
    pagos: f.pagos ?? [],
    notas: f.notas,
    enlace: f.enlace,
    etiquetas: f.etiquetas ?? [],
    tareas: f.tareas ?? [],
    creado: f.creado?.toISOString?.() ?? String(f.creado),
    actualizado: f.actualizado?.toISOString?.() ?? String(f.actualizado),
  }))
}

export async function leerCotizaciones() {
  const { rows } = await pool.query('SELECT * FROM cotizaciones ORDER BY creado DESC')
  return rows.map((f) => ({
    id: f.id,
    folio: f.folio,
    version: f.version,
    estado: f.estado,
    marca: f.marca,
    emisorNombre: f.emisor_nombre,
    emisorTitulo: f.emisor_titulo,
    emisorContacto: f.emisor_contacto,
    cliente: f.cliente,
    proyecto: f.proyecto,
    atencion: f.atencion,
    ubicacion: f.ubicacion,
    fecha: aISO(f.fecha),
    plazo: f.plazo,
    validez: f.validez,
    componentes: f.componentes ?? [],
    bloques: f.bloques ?? [],
    condiciones: f.condiciones ?? [],
    totalManual: f.total_manual,
    conIva: f.con_iva,
    notas: f.notas,
    proyectoId: f.proyecto_id,
    creado: f.creado?.toISOString?.() ?? String(f.creado),
    actualizado: f.actualizado?.toISOString?.() ?? String(f.actualizado),
  }))
}

/** Todo lo que guarda la app, en una sola lectura. */
export async function leerDatos() {
  const [proyectos, cotizaciones] = await Promise.all([leerProyectos(), leerCotizaciones()])
  return { proyectos, cotizaciones }
}

async function escribirCotizacionesEn(cliente, cotizaciones) {
  await cliente.query('DELETE FROM cotizaciones')
  for (const c of cotizaciones) {
    await cliente.query(
      `INSERT INTO cotizaciones
         (id, folio, version, estado, marca, emisor_nombre, emisor_titulo, emisor_contacto,
          cliente, proyecto, atencion, ubicacion, fecha, plazo, validez,
          componentes, bloques, condiciones, total_manual, con_iva, notas, proyecto_id,
          creado, actualizado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
               $16::jsonb,$17::jsonb,$18::jsonb,$19,$20,$21,$22,
               COALESCE($23::timestamptz, now()), now())`,
      [
        c.id,
        c.folio ?? '',
        Number.isFinite(Number(c.version)) ? Math.max(1, Math.trunc(c.version)) : 1,
        ['borrador', 'enviada', 'aprobada', 'rechazada'].includes(c.estado) ? c.estado : 'borrador',
        c.marca === 'particular' ? 'particular' : 'diabolical',
        c.emisorNombre ?? '',
        c.emisorTitulo ?? '',
        c.emisorContacto ?? '',
        c.cliente ?? '',
        c.proyecto ?? '',
        c.atencion ?? '',
        c.ubicacion ?? '',
        c.fecha || null,
        c.plazo ?? '',
        c.validez ?? '',
        JSON.stringify(c.componentes ?? []),
        JSON.stringify(c.bloques ?? []),
        JSON.stringify(c.condiciones ?? []),
        Number.isFinite(Number(c.totalManual)) ? Math.max(0, Math.trunc(c.totalManual)) : 0,
        Boolean(c.conIva),
        c.notas ?? '',
        c.proyectoId ?? '',
        c.creado || null,
      ],
    )
  }
}

/**
 * Sustituye la cartera entera dentro de una transacción. Esta app es de una
 * sola persona y la interfaz ya trabaja con la lista completa; hacerlo en un
 * golpe atómico es más simple y no deja estados a medias.
 */
export async function escribirProyectos(proyectos) {
  return escribirDatos({ proyectos, cotizaciones: null })
}

/**
 * Escribe proyectos y cotizaciones en una sola transacción. Pasar `null` en
 * cotizaciones deja esa tabla como está: así la semilla y el endpoint viejo
 * siguen funcionando sin borrar documentos.
 */
export async function escribirDatos({ proyectos, cotizaciones }) {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    await cliente.query('DELETE FROM proyectos')

    for (const p of proyectos) {
      await cliente.query(
        `INSERT INTO proyectos
           (id, nombre, tipo, cliente, estado, inicio, entrega, presupuesto,
            pagos, cobrado, notas, enlace, etiquetas, creado, actualizado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
                 COALESCE($14::timestamptz, now()), now())`,
        [
          p.id,
          p.nombre ?? '',
          p.tipo === 'interno' ? 'interno' : 'cliente',
          p.cliente ?? '',
          p.estado ?? 'idea',
          p.inicio || null,
          p.entrega || null,
          Number.isFinite(Number(p.presupuesto)) ? Math.max(0, Math.trunc(p.presupuesto)) : 0,
          JSON.stringify(Array.isArray(p.pagos) ? p.pagos : []),
          estaCobrado(p),
          p.notas ?? '',
          p.enlace ?? '',
          Array.isArray(p.etiquetas) ? p.etiquetas : [],
          p.creado || null,
        ],
      )

      const tareas = Array.isArray(p.tareas) ? p.tareas : []
      for (const [orden, t] of tareas.entries()) {
        await cliente.query(
          `INSERT INTO tareas (id, proyecto_id, texto, hecha, responsable, orden)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [t.id, p.id, t.texto ?? '', Boolean(t.hecha), t.responsable ?? '', orden],
        )
      }
    }

    if (cotizaciones) await escribirCotizacionesEn(cliente, cotizaciones)

    await cliente.query('COMMIT')
    return proyectos.length
  } catch (error) {
    await cliente.query('ROLLBACK')
    throw error
  } finally {
    cliente.release()
  }
}
