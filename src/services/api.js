// ─────────────────────────────────────────────────────────────────────────
// services/api.js — Cliente HTTP para la API del sistema de boletines
// ─────────────────────────────────────────────────────────────────────────
//
// FLUJO DE GUARDADO (orden obligatorio):
//   1. POST /__upload          → guarda imagen en public/assets/section_images/
//      (servidor Vite en desarrollo — escribe el archivo físicamente en disco)
//   2. POST /bulletin-resources → registra el recurso en BD → obtiene resource_id
//   3. POST /bulletin/sections/batch → guarda las secciones con los resource_id
// ─────────────────────────────────────────────────────────────────────────

import axios from 'axios'

// ═══════════════════════════════════════════════════════════════════════
// ⚠ HARDCODE DE DESARROLLO — cambiar antes de pasar a producción
// ═══════════════════════════════════════════════════════════════════════

// Token JWT — para cambiar: modifica SOLO esta cadena
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJtaWxsYSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzQxNjE4MiwiZXhwIjoxNzc3NDQ0OTgyfQ.LTneEA7Dmv9wEMsASnjjx9nZqvGBJC5OvMokkRRj61w'

// ID del boletín activo — por ahora fijo en 3
export const BULLETIN_ID_HARDCODE = 3

// URL del servidor backend
const BASE_URL = 'http://localhost:3001'

// ── Instancia Axios con headers por defecto ───────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  },
})

// ── Interceptor de errores HTTP ───────────────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    const status    = err.response?.status
    const serverMsg = err.response?.data?.message || err.response?.data?.error || null
    const metodo    = err.config?.method?.toUpperCase() || 'REQUEST'
    const url       = err.config?.url || '?'

    if      (status === 401) console.error(`[API 401] Token inválido/expirado → ${metodo} ${url}`)
    else if (status === 403) console.error(`[API 403] Sin permisos → ${metodo} ${url}`)
    else if (status === 404) console.error(`[API 404] Ruta no encontrada → ${metodo} ${url}`)
    else if (status >= 500)  console.error(`[API ${status}] Error servidor → ${metodo} ${url}`, serverMsg)
    else if (!err.response)  console.error(`[API RED] Sin conexión → verifica ${BASE_URL}`)
    else                     console.error(`[API ${status}] → ${metodo} ${url}`, serverMsg)

    return Promise.reject(err)
  }
)

// ═══════════════════════════════════════════════════════════════════════
// PASO 0: Guardar imagen FÍSICAMENTE en disco
// ═══════════════════════════════════════════════════════════════════════
//
// POST /__upload  (servidor Vite — NO es la API de producción)
//
// El browser no puede escribir en el sistema de archivos por razones de
// seguridad. Esta función le pide al servidor Vite (Node.js) que lo haga.
// El plugin uploadImagePlugin en vite.config.js recibe la petición y
// escribe el archivo en: public/assets/section_images/{bull_id}/{filename}
//
// Nombre del archivo generado:
//   secimg_{nombreOriginal}_{bull_id}_{yyyyMMdd_HHmmss}.{ext}
//   Ejemplo: secimg_Logo CONAMED_1_20260428_143055.png
//
// PARÁMETROS:
//   file    → objeto File del browser (viene del <input type="file">)
//   bullId  → ID del boletín (para crear la subcarpeta correspondiente)
//
// RETORNA:
//   { ok, url, filename, path }
//   url      → URL relativa: "/assets/section_images/1/secimg_Logo_1_....png"
//   filename → nombre final del archivo con fecha
//   path     → ruta absoluta en el disco del servidor
export async function guardarImagenFisica(file, bullId) {
  // ── Generar el nombre con el formato acordado ─────────────────────────
  //   secimg_{nombreBase}_{bullId}_{yyyyMMdd_HHmmss}.{ext}
  const ext        = file.name.split('.').pop().toLowerCase() || 'jpg'
  const nombreBase = file.name.replace(/\.[^/.]+$/, '')  // quitar extensión
  const fecha      = getSufijoDeFecha()                  // _20260428_143055
  const filename   = `secimg_${nombreBase}_${bullId}${fecha}.${ext}`

  console.log(`[IMG] Preparando imagen: ${filename}`)
  console.log(`[IMG] Destino: public/assets/section_images/${bullId}/`)

  // ── Construir el FormData ─────────────────────────────────────────────
  // FormData es el formato estándar del browser para enviar archivos por HTTP.
  // Es el mismo formato que usa un <form enctype="multipart/form-data">.
  const form = new FormData()
  form.append('image',    file, filename)      // el archivo binario con su nuevo nombre
  form.append('filename', filename)            // nombre final para que Vite lo use al escribir
  form.append('bull_id',  String(bullId))      // subcarpeta donde guardar

  // ── Enviar al servidor Vite (no a la API de producción) ───────────────
  // /__upload es un endpoint especial de desarrollo manejado por vite.config.js
  // No lleva el header Authorization porque no es la API real
  const res = await fetch('/__upload', {
    method:  'POST',
    body:    form,
    // NO poner Content-Type — el browser lo pone automáticamente con el boundary correcto
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(`Error al guardar imagen: ${errData.error}`)
  }

  const data = await res.json()
  console.log(`[IMG] ✅ Imagen guardada físicamente: ${data.path}`)
  console.log(`[IMG]    Accesible en: http://localhost:5173${data.url}`)

  return data  // { ok: true, url, filename, path }
}

// ── Función auxiliar de fecha ─────────────────────────────────────────
// Genera sufijo: _20260428_143055
function getSufijoDeFecha() {
  const n = new Date()
  const p = x => String(x).padStart(2, '0')
  return `_${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`
}

// ── Función pública para generar el nombre (usada en useGuardarBoletin) ─
export function generarNombreImagen(file, bulletinId) {
  const ext        = file.name.split('.').pop().toLowerCase() || 'jpg'
  const nombreBase = file.name.replace(/\.[^/.]+$/, '')
  return `secimg_${nombreBase}_${bulletinId}${getSufijoDeFecha()}.${ext}`
}

// ═══════════════════════════════════════════════════════════════════════
// PASO 1: Registrar recursos en bulletin_resource
// ═══════════════════════════════════════════════════════════════════════
// POST http://localhost:3001/bulletin-resources
// Retorna: { success: true, inserted_ids: [12, 13, 14] }
export async function registrarRecursos(recursos) {
  const res = await api.post('/bulletin-resources', recursos)
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// PASO 2: Guardar secciones del boletín
// ═══════════════════════════════════════════════════════════════════════
// POST http://localhost:3001/bulletin/sections/batch
export async function guardarSeccionesBatch(secciones) {
  const res = await api.post('/bulletin/sections/batch', { data: secciones })
  return res.data
}

// ── Mantenidas por compatibilidad ─────────────────────────────────────
export async function guardarBoletin(flatJson) {
  return guardarSeccionesBatch(flatJson?.bulletin_sections || [])
}
export async function actualizarBoletin(bulletinId, flatJson) {
  const res = await api.put(`/bulletins/${bulletinId}`, flatJson)
  return res.data
}
export async function obtenerBoletin(bulletinId) {
  const res = await api.get(`/bulletins/${bulletinId}`)
  return res.data
}
export async function buscarBoletines(keyword) {
  const res = await api.get('/bulletins/search', { params: { q: keyword } })
  return res.data
}
