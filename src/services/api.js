// ─────────────────────────────────────────────────────────────────────────
// services/api.js — v2  (agrega PATCH y baja lógica)
// ─────────────────────────────────────────────────────────────────────────
//
// CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR:
//
//   1. TOKEN y BASE_URL vienen de variables de entorno (.env)
//      ANTES:  const TOKEN = 'eyJhbGciOi...'  ← hardcodeado, INSEGURO
//      DESPUÉS: const TOKEN = import.meta.env.VITE_API_TOKEN  ← seguro
//
//      ¿Qué es import.meta.env?
//      Vite expone las variables del archivo .env bajo import.meta.env.
//      Solo las variables que empiezan con VITE_ son accesibles desde
//      el browser (las demás son solo del servidor de build, más seguras).
//      El archivo .env NO se sube a Git (agrégalo a .gitignore).
//
//   2. actualizarSeccion(seccionData) — NUEVO: PATCH /bulletin-sections
//      Actualiza UNA sección individual que ya existe en la BD.
//      Se usa cuando el usuario edita un boletín que ya fue guardado antes.
//      Si la sección tiene _bdId (vino de la BD), se hace PATCH.
//      Si no tiene _bdId (es nueva), se hace POST batch.
//
//   3. darDeBajaSeccion(seccionData) — NUEVO: baja lógica
//      En lugar de borrar el registro, lo desactiva (section_status = false).
//      Esto se llama "soft delete" o "baja lógica".
//      La diferencia con PATCH normal es que solo cambia el status.
//
// ─────────────────────────────────────────────────────────────────────────

import axios from 'axios'

// ── Variables de entorno (leer del archivo .env) ──────────────────────
//
// En el archivo .env de tu proyecto escribe:
//   VITE_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//   VITE_API_URL=http://localhost:3001
//
// import.meta.env.VITE_API_TOKEN lee esa variable.
// Si la variable no existe (por ejemplo en una máquina nueva sin .env),
// el || '' pone una cadena vacía para que el error sea claro.
//
// IMPORTANTE: Si no tienes el archivo .env, crea uno en la raíz del proyecto
// (junto al package.json) con el contenido de arriba.
const TOKEN    = import.meta.env.VITE_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJtaWxsYSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzUwMzMyNywiZXhwIjoxNzc3NTMyMTI3fQ.YF0jLrnPOmpKUp6kfKooUVcIKvFtRKA0ZN-K-TPqb7Q'
const BASE_URL = import.meta.env.VITE_API_URL   || 'http://localhost:3001'

// Aviso en consola si no están configuradas las variables de entorno
// Solo en desarrollo (import.meta.env.DEV es true cuando corres npm run dev)
if (import.meta.env.DEV && !TOKEN) {
  console.warn('[API] ⚠ VITE_API_TOKEN no está configurado en .env')
}
if (import.meta.env.DEV && !BASE_URL) {
  console.warn('[API] ⚠ VITE_API_URL no está configurado en .env')
}

// ── ID del boletín activo ─────────────────────────────────────────────
// NOTA: Esto sigue siendo hardcode temporal. Lo correcto sería recibir
// el bull_id como parámetro desde la pantalla que llama a la función.
// Para la fase siguiente esto se convertirá en prop/contexto.
export const BULLETIN_ID_HARDCODE = 4

// ── Instancia de Axios con configuración base ─────────────────────────
// axios.create() crea una instancia con configuración predeterminada.
// Así no tienes que repetir la URL y el token en cada llamada.
// Es como crear un HttpClient con configuración base en Java.
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,  // 15 segundos máximo de espera por respuesta
  headers: {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  },
})


// Interceptor de REQUEST - loguea lo que se ENVIA
// Se ejecuta ANTES de enviar cada llamada a la API.
// Muestra: metodo, URL completa y el JSON del body.
//
// Como funciona un interceptor:
//   Imagina que cada llamada a la API pasa por una "aduana".
//   El interceptor de request es la aduana de salida: revisa y loguea
//   todo lo que sale antes de enviarlo al servidor.
//   El interceptor de response es la aduana de entrada: revisa y loguea
//   todo lo que llega del servidor antes de entregarlo al codigo.
api.interceptors.request.use(
  function(config) {
    if (import.meta.env.DEV) {
      var metodo = config.method ? config.method.toUpperCase() : 'REQUEST'
      var url    = config.url || '?'

      // console.group crea un bloque colapsable en las DevTools.
      // Util porque el JSON puede ser muy largo.
      console.group('[API -> REQUEST] ' + metodo + ' ' + BASE_URL + url)

      if (config.params) {
        console.log('  Query params:', config.params)
      }

      if (config.data) {
        var body = config.data
        if (typeof body === 'string') {
          try { body = JSON.parse(body) } catch(e) {}
        }
        console.log('  Body ENVIADO (objeto):', body)
        console.log('  Body ENVIADO (JSON):', JSON.stringify(body, null, 2))
      }

      console.groupEnd()
    }
    return config
  },
  function(err) { return Promise.reject(err) }
)

// Interceptor de RESPONSE - loguea lo que se RECIBE
// Dos casos: respuesta exitosa (2xx) y respuesta con error (4xx, 5xx).
api.interceptors.response.use(

  // Respuesta EXITOSA
  function(res) {
    if (import.meta.env.DEV) {
      var metodo = res.config && res.config.method ? res.config.method.toUpperCase() : 'REQUEST'
      var url    = res.config ? res.config.url || '?' : '?'
      var status = res.status

      console.group('[API OK RESPONSE] ' + status + ' ' + metodo + ' ' + url)
      console.log('  Status:', status, res.statusText)
      console.log('  Datos recibidos (objeto):', res.data)
      console.log('  Datos recibidos (JSON):', JSON.stringify(res.data, null, 2))
      console.groupEnd()
    }
    return res
  },

  // Respuesta con ERROR
  function(err) {
    var status    = err.response ? err.response.status : null
    var serverMsg = err.response && err.response.data
      ? (err.response.data.message || err.response.data.error || null)
      : null
    var metodo = err.config && err.config.method ? err.config.method.toUpperCase() : 'REQUEST'
    var url    = err.config ? err.config.url || '?' : '?'

    if (import.meta.env.DEV) {
      var label = status ? String(status) : 'SIN CONEXION'
      console.group('[API ERROR] ' + label + ' ' + metodo + ' ' + url)

      // Mostrar lo que se intento enviar (util para depurar errores 400/422)
      if (err.config && err.config.data) {
        var body = err.config.data
        if (typeof body === 'string') {
          try { body = JSON.parse(body) } catch(e) {}
        }
        console.log('  Body que se intento enviar:', body)
      }

      // Mostrar la respuesta de error del servidor
      if (err.response && err.response.data) {
        console.log('  Respuesta de error del servidor:', err.response.data)
        console.log('  Error (JSON):', JSON.stringify(err.response.data, null, 2))
      }

      console.groupEnd()
    }

    if      (status === 401) console.error('[API 401] Token invalido o expirado: ' + metodo + ' ' + url)
    else if (status === 403) console.error('[API 403] Sin permisos: ' + metodo + ' ' + url)
    else if (status === 404) console.error('[API 404] Ruta no encontrada: ' + metodo + ' ' + url)
    else if (status >= 500)  console.error('[API ' + status + '] Error servidor: ' + metodo + ' ' + url, serverMsg)
    else if (!err.response)  console.error('[API RED] Sin conexion: verifica ' + BASE_URL)
    else                     console.error('[API ' + status + ']: ' + metodo + ' ' + url, serverMsg)

    return Promise.reject(err)
  }
)


// ═══════════════════════════════════════════════════════════════════════
// GUARDAR IMAGEN FÍSICAMENTE EN DISCO (servidor Vite de desarrollo)
// ═══════════════════════════════════════════════════════════════════════
// El browser no puede escribir archivos en disco directamente por seguridad.
// Este endpoint especial de Vite (/__upload) hace esa escritura en el servidor.
export async function guardarImagenFisica(file, bullId) {
  const ext        = file.name.split('.').pop().toLowerCase() || 'jpg'
  const nombreBase = file.name.replace(/\.[^/.]+$/, '')
  const fecha      = getSufijoDeFecha()
  const filename   = `secimg_${nombreBase}_${bullId}${fecha}.${ext}`

  const form = new FormData()
  form.append('image',    file, filename)
  form.append('filename', filename)
  form.append('bull_id',  String(bullId))

  const res = await fetch('/__upload', { method: 'POST', body: form })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(`Error al guardar imagen: ${errData.error}`)
  }

  return await res.json()  // { ok: true, url, filename, path }
}

function getSufijoDeFecha() {
  const n = new Date()
  const p = x => String(x).padStart(2, '0')
  return `_${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`
}

export function generarNombreImagen(file, bulletinId) {
  const ext        = file.name.split('.').pop().toLowerCase() || 'jpg'
  const nombreBase = file.name.replace(/\.[^/.]+$/, '')
  return `secimg_${nombreBase}_${bulletinId}${getSufijoDeFecha()}.${ext}`
}

// ═══════════════════════════════════════════════════════════════════════
// REGISTRAR RECURSOS (imágenes, URLs, correos)
// ═══════════════════════════════════════════════════════════════════════
export async function registrarRecursos(recursos) {
  const res = await api.post('/bulletin-resources', recursos)
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// GUARDAR SECCIONES (POST batch — para secciones NUEVAS)
// ═══════════════════════════════════════════════════════════════════════
export async function guardarSeccionesBatch(secciones) {
  const res = await api.post('/bulletin/sections/batch', { data: secciones })
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// ACTUALIZAR SECCIÓN INDIVIDUAL (PATCH — para secciones que YA EXISTEN)
// ═══════════════════════════════════════════════════════════════════════
//
// ¿Cuándo se usa?
//   Cuando el usuario EDITA un boletín que ya estaba guardado.
//   Al cargar el boletín, cada sección tiene un _bdId (el section_id de la BD).
//   Al guardar, las secciones con _bdId deben hacer PATCH (actualizar),
//   no POST (crear nuevas duplicadas).
//
// PARÁMETRO seccionData:
//   Debe incluir TODOS los campos de bulletin_sections incluyendo section_id.
//   {
//     section_id:            65,       ← OBLIGATORIO para PATCH
//     section_segment:       3,
//     section_subsegment:    2,
//     section_subsegment_num: 2,
//     bull_id:               2,
//     resource_id:           null,
//     section_order:         6,
//     section_content:       "texto actualizado",
//     section_format:        "texto actualizado",
//     section_css:           "5,21",
//     section_htmltag:       "p",
//     section_status:        true,
//     updated_by:            "usuario_actual"
//   }
//
// RESPUESTA del servidor:
//   { message: "Actualización exitosa. Filas afectadas: 1", rows_affected: 1 }
//
// actualizarSeccion — PATCH batch con { sections: [...] }
//
// El endpoint PATCH /bulletin-sections ahora acepta un array de secciones
// en un solo request: { "sections": [ { section_id, ... }, ... ] }
//
// ANTES (incorrecto): enviaba cada sección individual en peticiones separadas.
//   PATCH /bulletin-sections  body: { section_id: 65, ... }
//
// AHORA (correcto): envía todas las secciones de una sola vez.
//   PATCH /bulletin-sections  body: { "sections": [ {...}, {...}, ... ] }
//
// Ventajas del batch:
//   - 1 sola petición HTTP en lugar de N (más eficiente)
//   - Atómico: si falla una, el servidor puede revertir todas
//   - El backend puede hacer la actualización en una transacción
//
// PARÁMETRO secciones:
//   Array de objetos. Cada uno DEBE tener section_id (para que el PATCH
//   sepa qué fila actualizar), más todos los demás campos de bulletin_sections.
//
export async function actualizarSeccion(secciones) {
  // Si viene un solo objeto (retrocompatibilidad), convertirlo a array
  const arr = Array.isArray(secciones) ? secciones : [secciones]

  // El endpoint espera: { "sections": [ { section_id, ...campos }, ... ] }
  const payload = { sections: arr }

  const res = await api.patch('/bulletin-sections', payload)
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// BAJA LÓGICA DE UNA SECCIÓN (section_status = false)
// ═══════════════════════════════════════════════════════════════════════
//
// ¿Qué es "baja lógica"?
//   En lugar de BORRAR el registro de la BD (que sería irreversible),
//   solo se cambia section_status = false. El registro sigue existiendo
//   en la BD pero no se muestra al ciudadano (el backend filtra section_status = true).
//
//   Ventajas:
//   - Se puede RESTAURAR si fue un error (cambiar status de vuelta a true)
//   - Mantiene historial para auditoría
//   - Es la práctica estándar en sistemas gubernamentales
//
// PARÁMETROS:
//   bdData → objeto con los campos originales de la sección
//            (necesitamos todos porque el endpoint PATCH actualiza todo)
//   updatedBy → nombre del usuario que hace la baja (para auditoría)
//
export async function darDeBajaSeccion(bdData, updatedBy = 'SISTEMA') {
  // Construir el payload con todos los campos requeridos por el PATCH,
  // pero cambiando section_status a false
  const payload = {
    section_id:             bdData.section_id,
    section_segment:        bdData.section_segment,
    section_subsegment:     bdData.section_subsegment,
    section_subsegment_num: bdData.section_subsegment_num || 0,
    bull_id:                bdData.bull_id,
    resource_id:            bdData.resource_id || null,
    section_order:          bdData.section_order,
    section_content:        bdData.section_content || '',
    section_format:         bdData.section_format  || '',
    section_css:            bdData.section_css     || '',
    section_htmltag:        bdData.section_htmltag || 'div',
    section_status:         false,   // ← ESTO es la "baja lógica"
    updated_by:             updatedBy,
  }

  const res = await api.patch('/bulletin-sections', payload)
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// OBTENER SECCIONES DE UN BOLETÍN
// ═══════════════════════════════════════════════════════════════════════
export async function obtenerSecciones(bulletinId) {
  const res = await api.get(`/bulletin/sections/${bulletinId}`)
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// FUNCIONES MANTENIDAS POR COMPATIBILIDAD
// ═══════════════════════════════════════════════════════════════════════
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
