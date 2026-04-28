// ─────────────────────────────────────────────────────────────────────────
// useGuardarBoletin.js — v5
// Hook de React que orquesta el proceso completo de guardado
// ─────────────────────────────────────────────────────────────────────────
//
// ¿QUÉ ES UN HOOK EN REACT?
//   Un hook es una función especial que empieza con "use" y permite
//   a los componentes tener estado (useState) y efectos secundarios.
//   Este hook encapsula toda la lógica de la API para que los componentes
//   solo llamen a guardar() y reciban el estado: cargando/error/resultado.
//
// FLUJO COMPLETO DE GUARDADO (3 pasos):
//
//   PASO 1: Registrar recursos en bulletin_resource
//     ├─ Identificar qué secciones tienen imagen, url o mail
//     ├─ Crear un array de { resource_desc } para cada una
//     ├─ POST /bulletin-resources → obtener inserted_ids
//     └─ Guardar la imagen en public/assets/section_images/{bullId}/
//
//   PASO 2: Tokenizar HTML y codificar CSS
//     ├─ section_html  → tokens (ej: [BOLD_START]texto[BOLD_FINAL])
//     ├─ section_css   → índices numéricos (ej: "5,24")
//     └─ Agregar campos _temp para referencia (no van a BD)
//
//   PASO 3: Guardar secciones con resource_ids
//     ├─ Armar el array con la estructura exacta de bulletin_sections
//     └─ POST /bulletin/sections/batch
// ─────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import {
  registrarRecursos,       // POST /bulletin-resources
  guardarSeccionesBatch,   // POST /bulletin/sections/batch
  guardarImagenLocal,      // guarda imagen en public/assets/
  BULLETIN_ID_HARDCODE,    // const = 1 (hardcode temporal)
} from '../services/api'
import { encodeHtml, sanitizePlain } from '../utils/htmlTokens'
import { buildCss, encodeCssToIndex } from '../utils/cssTokens'
import { devLog, devLogGroup, devSeparator } from '../utils/devLog'

// ── Tipos que tienen HTML rico (se tokenizan con encodeHtml) ──────────────
const RICH_TYPES  = ['p', 'ul', 'ol', 'ul-ol', 'hl', 'note']

// ── Tipos de texto plano (se limpian con sanitizePlain) ───────────────────
const PLAIN_TYPES = ['h1', 'h2', 'h3']

// ── Tipos que tienen recurso (necesitan resource_id en la BD) ─────────────
const TIPOS_CON_RECURSO = ['img', 'url', 'mail']

// ─────────────────────────────────────────────────────────────────────────
// procesarSeccion — transforma una sección para guardar en la BD
// ─────────────────────────────────────────────────────────────────────────
// PARÁMETROS:
//   sec         → objeto de sección del buildJson
//   resourceId  → el resource_id de la BD (null si no tiene recurso)
//
// RETORNA: objeto con los campos exactos de bulletin_sections
function procesarSeccion(sec, resourceId) {
  const tipo  = sec._meta_type  || ''
  const align = sec._meta_align || 'left'

  // ── CAMPO section_html: tokenizar el contenido HTML ────────────────────
  // El campo section_html contiene HTML crudo del editor (ej: "<b>texto</b>")
  // Lo convertimos a tokens seguros para la BD.
  const htmlCrudo = sec.section_html || ''
  let   htmlToken = ''

  if (PLAIN_TYPES.includes(tipo)) {
    // Títulos: solo texto plano sin ningún HTML
    htmlToken = sanitizePlain(htmlCrudo)
  } else if (RICH_TYPES.includes(tipo)) {
    // Párrafos, listas, avisos, notas: convertir tags HTML a tokens
    htmlToken = encodeHtml(htmlCrudo)
  } else {
    // url, mail, img, hr: el "html" es el tag (ej: "a", "img", "hr")
    // No tokenizar — ya son valores seguros
    htmlToken = htmlCrudo
  }

  // Log: mostrar antes y después de tokenizar (browser + terminal npm)
  if (RICH_TYPES.includes(tipo) || PLAIN_TYPES.includes(tipo)) {
    devLogGroup('TOKEN', `SEG=${sec.section_segment} tipo=${tipo} orden=${sec.section_order}`, [
      { label: 'section_html ANTES  (HTML crudo) ', valor: htmlCrudo },
      { label: 'section_html DESPUÉS (tokens)     ', valor: htmlToken },
    ])
  }

  // ── CAMPO section_css: codificar clases a índices numéricos ────────────
  // Construir el string de clases CSS desde tipo + alineación
  const cssClases  = buildCss(tipo, align, '')
  // Convertir "doc-p text-justify" → "5,24" (índices del mapa)
  const cssIndices = encodeCssToIndex(cssClases)

  // Log: mostrar antes y después de codificar CSS (browser + terminal npm)
  devLogGroup('CSS', `SEG=${sec.section_segment} tipo=${tipo} orden=${sec.section_order}`, [
    { label: 'section_css ANTES  (clases)  ', valor: cssClases  },
    { label: 'section_css DESPUÉS (índices) ', valor: cssIndices },
  ])

  // ── Armar el objeto con la estructura exacta de bulletin_sections ──────
  return {
    // Campos de posición en el documento
    section_segment:         sec.section_segment,
    section_subsegment:      sec.section_subsegment,
    section_subsegment_num:  sec.section_subsegment || 0,  // mismos que subsegment por ahora
    bull_id:                 BULLETIN_ID_HARDCODE,          // hardcode = 1

    // Recurso asociado (imagen, URL o mail)
    // null si la sección es texto, título, lista, etc.
    resource_id:             resourceId || null,

    // Orden de aparición en el documento
    section_order:           sec.section_order,

    // Contenido: texto con tokens (ya no HTML crudo)
    section_content:         sec.section_content || '',
    section_format:          align,            // "left", "center", "right", "justify"

    // Estilos: índices numéricos en BD (ej: "5,24")
    // También guardamos el string de clases como referencia
    section_css:             cssIndices,
    section_css_temp:        cssClases,        // referencia humana, no va a la BD real

    // Tag HTML semántico del elemento
    section_htmltag:         sec.section_html && ['h1','h2','h3','p','ul','ol','div','a','img','hr','blockquote'].includes(sec.section_html)
                               ? sec.section_html
                               : (tipo === 'hl' ? 'div' : tipo === 'note' ? 'blockquote' : tipo),

    // Contenido codificado con tokens (reemplaza section_html en la BD)
    // También guardamos el HTML crudo como referencia
    section_html_temp:       htmlCrudo,        // referencia, no va a la BD real

    section_status:          true,
    updated_by:              'SISTEMA',
  }
}

// ─────────────────────────────────────────────────────────────────────────
// useGuardarBoletin — el hook principal
// ─────────────────────────────────────────────────────────────────────────
export function useGuardarBoletin() {
  // Estados del hook que los componentes pueden leer
  const [cargando,  setCargando]  = useState(false)  // true mientras espera la API
  const [error,     setError]     = useState(null)   // mensaje de error o null
  const [resultado, setResultado] = useState(null)   // respuesta exitosa del servidor

  const guardar = useCallback(async (flatJson, imagenesArchivos = {}) => {
    setCargando(true)
    setError(null)
    setResultado(null)

    try {
      const secciones = flatJson?.bulletin_sections || []

      // ═══════════════════════════════════════════════════════════════════
      // PASO 1: Identificar secciones con recursos y registrarlos en la BD
      // ═══════════════════════════════════════════════════════════════════
      devSeparator('PASO 1 — Registrar recursos en bulletin_resource')

      // Filtrar las secciones que tienen imagen, URL o correo
      // Estas necesitan un resource_id en la tabla bulletin_resource
      const seccionesConRecurso = secciones.filter(sec =>
        TIPOS_CON_RECURSO.includes(sec._meta_type) && sec.section_content
      )

      devLog('GUARD', `Secciones con recurso: ${seccionesConRecurso.length}`, null)

      // Construir el array para el endpoint POST /bulletin-resources
      // Cada elemento necesita: { resource_desc: "descripción del recurso" }
      // Para imágenes: usamos el nombre del archivo final
      // Para URLs y mails: usamos el contenido tal cual
      const recursosParaRegistrar = seccionesConRecurso.map(sec => {
        if (sec._meta_type === 'img') {
          // Imagen: calcular el nombre con el formato acordado
          // secimg_{original}_{bullId}_{fecha}.{ext}
          const archivo = imagenesArchivos[sec.section_content]  // File del browser
          if (archivo) {
            const info = guardarImagenLocal(archivo, BULLETIN_ID_HARDCODE)
            // guardarImagenLocal es async, pero para el resource_desc solo necesitamos el nombre
            // Usamos el generarNombreImagen sincrónico aquí
            const ext      = archivo.name.split('.').pop().toLowerCase() || 'jpg'
            const base     = archivo.name.replace(/\.[^/.]+$/, '')
            const n        = new Date(); const p = x => String(x).padStart(2, '0')
            const fecha    = `_${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`
            const filename = `secimg_${base}_${BULLETIN_ID_HARDCODE}${fecha}.${ext}`
            return { resource_desc: filename }
          }
          return { resource_desc: sec.section_content }  // fallback: nombre original
        }
        // URL o mail: usar el contenido directamente
        return { resource_desc: sec.section_content }
      })

      devLog('GUARD', 'Recursos a registrar', recursosParaRegistrar)

      // Mapa que relaciona índice en el array → resource_id de la BD
      // Después usaremos esto para asignar el resource_id a cada sección
      const resourceIdPorIdx = {}

      if (recursosParaRegistrar.length > 0) {
        // POST /bulletin-resources con el array de recursos
        // Respuesta esperada: { success: true, inserted_ids: [12, 13, 14] }
        const respRecursos = await registrarRecursos(recursosParaRegistrar)
        devLog('GUARD', '✅ Recursos registrados', respRecursos)

        // Mapear: sección i → inserted_ids[i]
        // El servidor devuelve los IDs en el mismo orden que los enviamos
        seccionesConRecurso.forEach((sec, i) => {
          resourceIdPorIdx[`${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`] = respRecursos.inserted_ids[i]
        })
      }

      // ── Guardar imágenes en public/assets/section_images/{bullId}/ ────
      for (const sec of seccionesConRecurso) {
        if (sec._meta_type === 'img') {
          const archivo = imagenesArchivos[sec.section_content]
          if (archivo) {
            const info = await guardarImagenLocal(archivo, BULLETIN_ID_HARDCODE)
            devLog('IMG', `Imagen guardada: ${info.filename}`, `Ruta: ${info.localPath}`)
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // PASO 2: Tokenizar HTML y codificar CSS en cada sección
      // ═══════════════════════════════════════════════════════════════════
      devSeparator('PASO 2 — Tokenizar HTML y codificar CSS')

      const seccionesProcesadas = secciones.map(sec => {
        // Obtener el resource_id para esta sección (si tiene recurso)
        const clave      = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`
        const resourceId = resourceIdPorIdx[clave] || null

        return procesarSeccion(sec, resourceId)
      })

      // ═══════════════════════════════════════════════════════════════════
      // PASO 3: Enviar secciones procesadas al endpoint batch
      // ═══════════════════════════════════════════════════════════════════
      devSeparator('PASO 3 — POST /bulletin/sections/batch')
      devLog('GUARD', 'Secciones para la BD', seccionesProcesadas)

      const respGuardado = await guardarSeccionesBatch(seccionesProcesadas)
      devLog('GUARD', '✅ Secciones guardadas', respGuardado)

      setResultado(respGuardado)
      return respGuardado

    } catch (err) {
      // ── Manejo de errores (Error Handling) ─────────────────────────────
      // err.response existe si el servidor respondió (4xx, 5xx)
      // err.message existe para errores de red o código
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || 'Error desconocido al guardar'

      devLog('GUARD', `❌ Error al guardar: ${msg}`)
      setError(msg)
      throw err  // re-lanzar para que el componente también lo sepa

    } finally {
      // finally siempre se ejecuta, con o sin error
      // Sirve para limpiar recursos o desactivar el estado de carga
      setCargando(false)
    }
  }, [])  // [] = la función no cambia entre renders (useCallback con deps vacías)

  const limpiar = useCallback(() => {
    setError(null)
    setResultado(null)
  }, [])

  return { guardar, cargando, error, resultado, limpiar }
}
