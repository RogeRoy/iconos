// ─────────────────────────────────────────────────────────
// services/api.js — Cliente HTTP con Axios
// ─────────────────────────────────────────────────────────
//
// RESPONSABILIDADES:
//   1. guardarBoletin(flatJson) → POST /api/bulletins
//      Solo envía el JSON plano (sin imágenes).
//      Las imágenes van por separado con guardarImagen().
//
//   2. obtenerBoletin(id) → GET /api/bulletins/:id
//
//   3. actualizarBoletin(id, flatJson) → PUT /api/bulletins/:id
//
//   4. darDeBajaBoletin(id) → PATCH /api/bulletins/:id/status
//      Baja lógica: bull_status = false
//
//   5. buscarBoletines(keyword) → GET /api/bulletins/search?q=keyword
//
//   6. guardarImagen(file, bulletinId, consecutivo) → POST /api/images
//      Guarda en public/assets/ con nombre:
//      document-image-{bulletinId}-{consecutivo}.{ext}
// ─────────────────────────────────────────────────────────
import axios from 'axios'

// URL base de la API — en producción viene de .env
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Instancia de axios con configuración compartida
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Interceptor: log de errores en desarrollo ─────────────
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Error de red'
    console.error(`[API Error] ${err.config?.method?.toUpperCase()} ${err.config?.url} → ${msg}`)
    return Promise.reject(err)
  }
)

// ─────────────────────────────────────────────────────────
// guardarBoletin — crea un boletín nuevo
// Envía SOLO el JSON (sin archivos).
// Las imágenes ya deben estar subidas antes de llamar esto.
// ─────────────────────────────────────────────────────────
export async function guardarBoletin(flatJson) {
  const res = await api.post('/bulletins', flatJson)
  return res.data  // { bull_id, message, ... }
}

// ─────────────────────────────────────────────────────────
// obtenerBoletin — trae un boletín por ID
// ─────────────────────────────────────────────────────────
export async function obtenerBoletin(bulletinId) {
  const res = await api.get(`/bulletins/${bulletinId}`)
  return res.data
}

// ─────────────────────────────────────────────────────────
// actualizarBoletin — modifica un boletín existente
// ─────────────────────────────────────────────────────────
export async function actualizarBoletin(bulletinId, flatJson) {
  const res = await api.put(`/bulletins/${bulletinId}`, flatJson)
  return res.data
}

// ─────────────────────────────────────────────────────────
// darDeBajaBoletin — baja lógica (bull_status = false)
// No elimina el registro; solo lo marca como inactivo.
// ─────────────────────────────────────────────────────────
export async function darDeBajaBoletin(bulletinId) {
  const res = await api.patch(`/bulletins/${bulletinId}/status`, {
    bull_status: false,
    updated_by: 'SISTEMA',
  })
  return res.data
}

// ─────────────────────────────────────────────────────────
// buscarBoletines — búsqueda por palabra clave
// Usa FNS_BULLETINES_BYWORD del SQL
// ─────────────────────────────────────────────────────────
export async function buscarBoletines(keyword) {
  const res = await api.get('/bulletins/search', { params: { q: keyword } })
  return res.data  // array de boletines
}

// ─────────────────────────────────────────────────────────
// guardarImagen — guarda imagen en public/assets/
//
// Nombre del archivo generado:
//   document-image-{bulletinId}-{consecutivo}.{ext}
//   Ejemplo: document-image-42-1.png
//
// No envía la imagen al servidor de imágenes externo.
// La guarda localmente en public/assets/ del proyecto.
// En producción, el backend la almacena en el servidor.
// ─────────────────────────────────────────────────────────
export async function guardarImagen(file, bulletinId, consecutivo) {
  // Extraer extensión del archivo original
  const ext = file.name.split('.').pop().toLowerCase() || 'jpg'
  const nombreArchivo = `document-image-${bulletinId}-${consecutivo}.${ext}`

  // FormData para enviar el archivo binario
  const form = new FormData()
  form.append('image', file, nombreArchivo)        // el archivo con nombre final
  form.append('bulletin_id', String(bulletinId))   // metadata para el backend
  form.append('filename', nombreArchivo)           // nombre deseado

  const res = await api.post('/images', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  // El backend retorna la URL pública donde quedó guardada
  return {
    url: res.data.url || `/assets/${nombreArchivo}`,
    filename: nombreArchivo,
    ext,
  }
}

// ─────────────────────────────────────────────────────────
// guardarImagenLocal — versión offline / sin backend
// Guarda la imagen en public/assets/ usando la File API del navegador.
// Útil para desarrollo sin servidor.
// ─────────────────────────────────────────────────────────
export function generarNombreImagen(file, bulletinId, consecutivo) {
  const ext = file.name.split('.').pop().toLowerCase() || 'jpg'
  return `document-image-${bulletinId || 'draft'}-${consecutivo}.${ext}`
}
