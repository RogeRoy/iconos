// ─────────────────────────────────────────────────────────────────────────
// services/api.js — Cliente HTTP para la API del sistema de boletines
// ─────────────────────────────────────────────────────────────────────────
//
// ARQUITECTURA:
//   Este archivo es el único punto de contacto entre el frontend React
//   y el backend. Todos los demás componentes importan de aquí.
//   Ningún componente hace fetch() o axios directamente.
//
// BASE URL: http://localhost:3001/
// AUTH: JWT Bearer Token (ver TOKEN abajo)
//
// FLUJO DE GUARDADO (orden obligatorio):
//   1. Registrar recursos (imágenes/urls/mails) → POST /bulletin-resources
//      Obtener los resource_id generados por la BD
//   2. Guardar las imágenes en public/assets/section_images/{bull_id}/
//      con el nombre: secimg_{original}_{bull_id}_{fecha}.{ext}
//   3. Guardar las secciones del documento → POST /bulletin/sections/batch
//      Incluyendo los resource_id obtenidos en el paso 1
// ─────────────────────────────────────────────────────────────────────────

import axios from 'axios'

// ═══════════════════════════════════════════════════════════════════════
// ⚠ HARDCODE DE DESARROLLO — cambiar antes de pasar a producción
// ═══════════════════════════════════════════════════════════════════════

// Token JWT de autenticación.
// Para cambiar el token: modifica SOLO esta cadena de texto.
// En producción esto debe venir de un login, no estar aquí.
// Cuando el token expire verás errores 401 Unauthorized en la consola.
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJtaWxsYSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzMxOTE2OSwiZXhwIjoxNzc3MzQ3OTY5fQ.gVrgJJStfoqLO1gl9Mkb6sK3fo9t0kaezVFrcpJbxyI'

// ID del boletín activo.
// En producción esto vendrá del flujo de creación/edición del boletín.
// Por ahora está fijo en 1 para desarrollo.
export const BULLETIN_ID_HARDCODE = 1

// ═══════════════════════════════════════════════════════════════════════
// FIN HARDCODE
// ═══════════════════════════════════════════════════════════════════════

// URL base del servidor backend
const BASE_URL = 'http://localhost:3001'

// ── Instancia de Axios ──────────────────────────────────────────────────
// axios.create() devuelve un objeto que funciona igual que axios pero
// con configuración predefinida. Así no hay que repetir headers en cada llamada.
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,                                  // 15 segundos máximo de espera
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,            // token JWT en cada petición
  },
})

// ── Interceptor de respuesta (Error Handling global) ───────────────────
// Los interceptores son funciones que se ejecutan automáticamente
// antes/después de cada petición o respuesta.
//
// Este interceptor captura TODOS los errores HTTP (4xx y 5xx)
// y los transforma en mensajes más útiles para mostrar al usuario.
//
// OWASP A09 - Security Logging: registramos el error sin datos sensibles.
api.interceptors.response.use(
  // Respuesta exitosa (2xx): pasar sin modificar
  res => res,

  // Error (4xx, 5xx, timeout, red):
  err => {
    // Extraer el código de estado HTTP (404, 500, etc.)
    const status = err.response?.status

    // Extraer el mensaje del servidor (si lo envió)
    const serverMsg = err.response?.data?.message
      || err.response?.data?.error
      || null

    // Construir un mensaje legible para el desarrollador
    const metodo = err.config?.method?.toUpperCase() || 'REQUEST'
    const url    = err.config?.url || '?'

    if (status === 401) {
      // 401 = token expirado o inválido
      console.error(`[API 401] Token inválido o expirado → ${metodo} ${url}`)
      console.error('  Actualiza la constante TOKEN en services/api.js')
    } else if (status === 403) {
      // 403 = no tiene permisos para esta acción
      console.error(`[API 403] Sin permisos → ${metodo} ${url}`)
    } else if (status === 404) {
      // 404 = endpoint no existe en el servidor
      console.error(`[API 404] Ruta no encontrada → ${metodo} ${url}`)
    } else if (status >= 500) {
      // 500+ = error en el servidor backend
      console.error(`[API ${status}] Error del servidor → ${metodo} ${url}`)
      if (serverMsg) console.error('  Mensaje del servidor:', serverMsg)
    } else if (!err.response) {
      // Sin respuesta = servidor apagado, CORS, o sin internet
      console.error(`[API RED] Sin conexión → ${metodo} ${url}`)
      console.error('  Verifica que el servidor está corriendo en', BASE_URL)
    } else {
      console.error(`[API ${status}] Error → ${metodo} ${url}`, serverMsg || err.message)
    }

    // Re-lanzar el error para que el código que llamó pueda manejarlo
    // con try/catch (no "tragarse" el error silenciosamente)
    return Promise.reject(err)
  }
)

// ═══════════════════════════════════════════════════════════════════════
// PASO 1: Registrar recursos (imágenes, URLs, correos)
// ═══════════════════════════════════════════════════════════════════════
//
// POST http://localhost:3001/bulletin-resources
//
// La tabla bulletin_resource guarda la descripción de cada recurso
// (nombre de imagen, URL, correo) y genera un resource_id único.
// Ese ID se usa después al guardar las secciones.
//
// PARÁMETRO:
//   recursos → array de objetos: [{ resource_desc: "nombre.png" }, ...]
//
// RETORNA:
//   { success: true, inserted_ids: [12, 13, 14] }
//   Los IDs están en el mismo orden que el array enviado:
//   recursos[0] → inserted_ids[0], recursos[1] → inserted_ids[1], etc.
//
// MANEJO DE ERRORES:
//   Si falla, lanza el error para que useGuardarBoletin lo maneje.
export async function registrarRecursos(recursos) {
  // recursos = [{ resource_desc: "Logo.png" }, { resource_desc: "https://..." }]
  const res = await api.post('/bulletin-resources', recursos)
  // res.data = { success: true, inserted_ids: [12, 13, 14] }
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// PASO 2: Guardar imagen en el servidor
// ═══════════════════════════════════════════════════════════════════════
//
// Las imágenes se guardan en: public/assets/section_images/{bull_id}/
// con el nombre: secimg_{nombreOriginal}_{bull_id}_{yyyyMMdd_HHmmss}.{ext}
//
// PARÁMETROS:
//   file      → objeto File del navegador (viene del input type="file")
//   bullId    → ID del boletín (BULLETIN_ID_HARDCODE por ahora)
//
// RETORNA:
//   { filename, localPath, url }
//   filename  → nombre final del archivo (con fecha)
//   localPath → ruta en el proyecto: public/assets/section_images/{bullId}/
//   url       → URL relativa para usar en <img src="">
//
// NOTA IMPORTANTE:
//   Esta función guarda la imagen localmente en el proyecto React (en /public/).
//   El archivo quedará disponible en: http://localhost:5173/assets/section_images/...
//   En producción, el backend debería manejar esto con una API de upload.
export async function guardarImagenLocal(file, bullId) {
  // ── Extraer la extensión del archivo original ────────────────────────
  // file.name podría ser "logo CONAMED.png" o "foto.JPG"
  // split('.').pop() toma la última parte después del último punto
  // toLowerCase() normaliza a minúsculas: "JPG" → "jpg"
  const ext = file.name.split('.').pop().toLowerCase() || 'jpg'

  // ── Generar el nombre del archivo con fecha ──────────────────────────
  // Formato: secimg_{nombreOriginal}_{bullId}_{yyyyMMdd_HHmmss}.{ext}
  // Ejemplo: secimg_logo.png_1_20260427_143055.png
  const nombreBase = file.name.replace(/\.[^/.]+$/, '')  // quitar extensión del nombre
  const fecha      = getSufijoDeFecha()                  // _20260427_143055
  const filename   = `secimg_${nombreBase}_${bullId}${fecha}.${ext}`

  // ── Ruta de destino ──────────────────────────────────────────────────
  // En React + Vite, los archivos en /public/ son accesibles como URLs estáticas.
  // La carpeta public/assets/section_images/{bullId}/ debe existir.
  const localPath = `public/assets/section_images/${bullId}/`
  const url       = `/assets/section_images/${bullId}/${filename}`

  // ── Nota sobre el guardado real ──────────────────────────────────────
  // El navegador NO puede escribir archivos en el sistema de archivos directamente.
  // Esta función simula el guardado: devuelve el nombre y la ruta esperada.
  // El archivo real se guardaría en producción a través de la API del backend.
  // Por ahora, la imagen se mostrará en el preview usando URL.createObjectURL(file).
  console.log(`[IMG] Imagen para guardar: ${localPath}${filename}`)

  return { filename, localPath, url, ext }
}

// ═══════════════════════════════════════════════════════════════════════
// PASO 3: Guardar secciones del boletín
// ═══════════════════════════════════════════════════════════════════════
//
// POST http://localhost:3001/bulletin/sections/batch
//
// Envía un array de secciones con la estructura exacta que espera la BD.
// Cada sección debe incluir su resource_id si tiene imagen/url/mail.
//
// PARÁMETRO:
//   secciones → array de objetos con la estructura de bulletin_sections
//
// RETORNA:
//   Respuesta del servidor (varía según implementación del backend)
export async function guardarSeccionesBatch(secciones) {
  // El endpoint espera el array dentro del campo "data"
  const res = await api.post('/bulletin/sections/batch', { data: secciones })
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────
// Funciones auxiliares (mantener compatibilidad con código anterior)
// ─────────────────────────────────────────────────────────────────────────

// Función auxiliar de fecha (se usa en guardarImagenLocal)
function getSufijoDeFecha() {
  const n = new Date()
  const p = x => String(x).padStart(2, '0')
  return `_${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`
}

// Genera el nombre de imagen con el formato esperado
export function generarNombreImagen(file, bulletinId) {
  const ext      = file.name.split('.').pop().toLowerCase() || 'jpg'
  const nombreBase = file.name.replace(/\.[^/.]+$/, '')
  const fecha    = getSufijoDeFecha()
  return `secimg_${nombreBase}_${bulletinId}${fecha}.${ext}`
}

// Mantenidas por compatibilidad con hooks que las importan
export async function guardarBoletin(flatJson) {
  // Por ahora usa guardarSeccionesBatch internamente
  // En el futuro, aquí iría POST /bulletins para crear el boletín primero
  const secciones = flatJson?.bulletin_sections || []
  return guardarSeccionesBatch(secciones)
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
