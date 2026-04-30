// ─────────────────────────────────────────────────────────────────────────
// hooks/useGuardarBoletin.js — v6  (agrega PATCH inteligente y baja lógica)
// ─────────────────────────────────────────────────────────────────────────
//
// CAMBIOS EN ESTA VERSIÓN:
//
//   1. PATCH inteligente: si la sección tiene _bdId, hace PATCH (actualizar),
//      si no tiene _bdId, hace POST batch (crear nueva).
//      ANTES: siempre hacía POST, duplicando secciones al editar un boletín.
//      AHORA: detecta automáticamente si la sección es nueva o existente.
//
//   2. darDeBaja(elemsBdData, updatedBy): nueva función exportada.
//      Recibe datos de la BD y hace PATCH con section_status = false.
//      No necesita pasar por el proceso completo de guardado.
//
// ─────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import {
  registrarRecursos,
  guardarSeccionesBatch,
  actualizarSeccion,       // ← NUEVO: PATCH /bulletin-sections
  darDeBajaSeccion,        // ← NUEVO: baja lógica
  guardarImagenFisica,
  BULLETIN_ID_HARDCODE,
} from '../services/api'
import { encodeHtml, sanitizePlain } from '../utils/htmlTokens'
import { buildCss, encodeCssToIndex } from '../utils/cssTokens'
import { devLog, devLogGroup, devSeparator } from '../utils/devLog'

const RICH_TYPES        = ['p', 'ul', 'ol', 'ul-ol', 'hl', 'note']
const PLAIN_TYPES       = ['h1', 'h2', 'h3']
const TIPOS_CON_RECURSO = ['img', 'url', 'mail']

// ── HTML_TAG_MAP ──────────────────────────────────────────────────────
// Mapeo del tipo interno del builder al tag HTML que va a la BD.
const HTML_TAG_MAP = {
  h1: 'h1', h2: 'h2', h3: 'h3', p: 'p',
  ul: 'ul', ol: 'ol', 'ul-ol': 'ul',
  hl:   'div',
  note: 'blockquote',
  hr:   'hr',
  url:  'a', mail: 'a', img: 'img',
}

// ── procesarSeccion ───────────────────────────────────────────────────
// Transforma UNA sección del buildJson al formato que espera la BD.
// Igual que antes, pero ahora también incluye section_id si viene de BD.
function procesarSeccion(sec, resourceId, urlImagen = null) {
  const tipo  = sec._meta_type  || ''
  const align = sec._meta_align || 'left'

  // Tokenizar el HTML del editor
  const htmlCrudo = sec.section_html || ''
  let   htmlToken = ''

  if (PLAIN_TYPES.includes(tipo)) {
    htmlToken = sanitizePlain(htmlCrudo)
  } else if (RICH_TYPES.includes(tipo)) {
    htmlToken = encodeHtml(htmlCrudo)
  } else {
    htmlToken = htmlCrudo
  }

  // Codificar CSS a índices numéricos
  const cssClases  = buildCss(tipo, align, '')
  const cssIndices = encodeCssToIndex(cssClases)
  const htmlTag    = HTML_TAG_MAP[tipo] || 'div'

  return {
    // Si la sección tiene _bdId, incluirlo para que el PATCH funcione
    // Si no tiene _bdId, no incluirlo (el POST no necesita section_id)
    ...(sec._bdId ? { section_id: sec._bdId } : {}),

    section_segment:        sec.section_segment,
    section_subsegment:     sec.section_subsegment,
    section_subsegment_num: sec.section_subsegment_num || 0,  // ← incluir el corregido
    bull_id:                BULLETIN_ID_HARDCODE,

    resource_id:   resourceId || null,
    section_order: sec.section_order,

    // Para imágenes: section_content guarda la URL relativa del front
    section_content: (tipo === 'img' && urlImagen) ? urlImagen : (sec.section_content || ''),
    section_format:  htmlToken,
    section_css:     cssIndices,
    section_htmltag: htmlTag,
    section_status:  true,
    updated_by:      'milla',

    // Campos temporales para debug (no van a la BD real)
    _temp_format_crudo: htmlCrudo,
    _temp_css_clases:   cssClases,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// useGuardarBoletin — el hook principal
// ─────────────────────────────────────────────────────────────────────────
export function useGuardarBoletin() {
  const [cargando,  setCargando]  = useState(false)
  const [error,     setError]     = useState(null)
  const [resultado, setResultado] = useState(null)

  const guardar = useCallback(async (flatJson, imagenesArchivos = {}) => {
    setCargando(true)
    setError(null)
    setResultado(null)

    try {
      const secciones = flatJson?.bulletin_sections || []

      // Log del estado inicial: qué recibió el hook antes de procesar
      devSeparator('INICIO — JSON recibido del builder (antes de procesar)')
      devLogGroup('GUARD', 'flatJson completo recibido del BuilderPanel', [
        { label: 'bulletin', valor: flatJson?.bulletin },
        { label: 'Total bulletin_sections', valor: secciones.length },
        { label: 'bulletin_sections (array completo)', valor: secciones },
        { label: 'bulletin_path (recursos)', valor: flatJson?.bulletin_path },
      ])

      // ═══════════════════════════════════════════════════════════════
      // PASO 1: Guardar imágenes físicamente + registrar recursos
      // ═══════════════════════════════════════════════════════════════
      devSeparator('PASO 1 — Guardar imágenes + registrar recursos')

      const seccionesConRecurso = secciones.filter(sec =>
        TIPOS_CON_RECURSO.includes(sec._meta_type) && sec.section_content
      )

      const urlImagenPorClave = {}
      for (const sec of seccionesConRecurso) {
        if (sec._meta_type === 'img') {
          const archivo = imagenesArchivos[sec.section_content]
          if (archivo) {
            try {
              const info  = await guardarImagenFisica(archivo, BULLETIN_ID_HARDCODE)
              const clave = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`
              urlImagenPorClave[clave] = info.url
            } catch (imgErr) {
              devLog('IMG', `⚠ No se pudo guardar ${sec.section_content}: ${imgErr.message}`)
            }
          }
        }
      }

      const recursosParaRegistrar = seccionesConRecurso.map(sec => {
        const clave = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`
        if (sec._meta_type === 'img') {
          return { resource_desc: urlImagenPorClave[clave] || sec.section_content }
        }
        return { resource_desc: sec.section_content }
      })

      const resourceIdPorClave = {}
      if (recursosParaRegistrar.length > 0) {
        const respRecursos = await registrarRecursos(recursosParaRegistrar)
        seccionesConRecurso.forEach((sec, i) => {
          const clave = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`
          resourceIdPorClave[clave] = respRecursos.inserted_ids[i]
        })
      }

      // ═══════════════════════════════════════════════════════════════
      // PASO 2: Tokenizar HTML y codificar CSS
      // ═══════════════════════════════════════════════════════════════
      devSeparator('PASO 2 — Tokenizar HTML y codificar CSS')

      const seccionesProcesadas = secciones.map(sec => {
        const clave      = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`
        const resourceId = resourceIdPorClave[clave] || null
        const urlImagen  = sec._meta_type === 'img' ? (urlImagenPorClave[clave] || null) : null
        return procesarSeccion(sec, resourceId, urlImagen)
      })

      // ═══════════════════════════════════════════════════════════════
      // PASO 3: Guardar — NUEVO: PATCH para existentes, POST para nuevas
      // ═══════════════════════════════════════════════════════════════
      devSeparator('PASO 3 — PATCH (existentes) / POST batch (nuevas)')

      // Separar secciones según si ya existen en la BD o son nuevas
      const seccionesExistentes = seccionesProcesadas.filter(s => s.section_id)
      const seccionesNuevas     = seccionesProcesadas.filter(s => !s.section_id)

      devLog('GUARD', `Existentes (PATCH): ${seccionesExistentes.length}`)
      devLog('GUARD', `Nuevas (POST batch): ${seccionesNuevas.length}`)

      // Log del JSON completo que se va a enviar
      // Esto aparece en la consola del navegador (DevTools > Console)
      // y en la terminal donde corre "npm run dev"
      devLogGroup('GUARD', 'JSON completo a enviar — secciones procesadas', [
        { label: 'Total secciones', valor: seccionesProcesadas.length },
        { label: 'Existentes (PATCH)', valor: seccionesExistentes.length },
        { label: 'Nuevas (POST)', valor: seccionesNuevas.length },
        { label: 'Payload PATCH (cada una se envía individual)', valor: seccionesExistentes },
        { label: 'Payload POST batch { data: [...] }', valor: { data: seccionesNuevas } },
      ])

      const resultados = []

      // PATCH batch: todas las secciones existentes en UN SOLO request
      // El endpoint espera: { "sections": [ {...}, {...}, ... ] }
      // Un solo PATCH en lugar de N PATCHes separados.
      if (seccionesExistentes.length > 0) {
        devLog('GUARD', `PATCH batch — ${seccionesExistentes.length} secciones en 1 request`, {
          sections: seccionesExistentes
        })

        // actualizarSeccion ahora recibe el array completo
        // y arma el payload { sections: [...] } internamente
        const respPatch = await actualizarSeccion(seccionesExistentes)
        resultados.push(respPatch)

        devLog('GUARD', 'Respuesta PATCH batch recibida:', respPatch)
      }

      // POST batch: crear las secciones nuevas
      if (seccionesNuevas.length > 0) {
        devLog('GUARD', 'POST batch — payload completo:', { data: seccionesNuevas })

        const respPost = await guardarSeccionesBatch(seccionesNuevas)
        resultados.push(respPost)

        devLog('GUARD', 'Respuesta POST batch recibida:', respPost)
      }

      devLog('GUARD', 'Guardado completo — todos los resultados:', resultados)
      setResultado(resultados)
      return resultados

    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || 'Error desconocido al guardar'
      devLog('GUARD', `❌ Error al guardar: ${msg}`)
      setError(msg)
      throw err
    } finally {
      setCargando(false)
    }
  }, [])

  // ── darDeBaja ─────────────────────────────────────────────────────
  // Función separada para hacer baja lógica de una sección.
  // No pasa por todo el proceso de tokenización — solo cambia el status.
  //
  // PARÁMETRO bdData: el objeto con los datos de la BD (viene de elem._bdId, etc.)
  // Ejemplo: { section_id: 65, section_segment: 3, ... todos los campos ... }
  const darDeBaja = useCallback(async (bdData, updatedBy = 'SISTEMA') => {
    setCargando(true)
    setError(null)
    try {
      const resp = await darDeBajaSeccion(bdData, updatedBy)
      devLog('BAJA', `✅ Sección ${bdData.section_id} dada de baja`)
      return resp
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al dar de baja'
      setError(msg)
      throw err
    } finally {
      setCargando(false)
    }
  }, [])

  const limpiar = useCallback(() => {
    setError(null)
    setResultado(null)
  }, [])

  return { guardar, darDeBaja, cargando, error, resultado, limpiar }
}
