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
  guardarImagenFisica,     // POST /__upload → escribe el archivo en disco real
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
function procesarSeccion(sec, resourceId, urlImagen = null) {
  // urlImagen → URL relativa del front para imágenes
  //   ej: "/assets/section_images/1/secimg_Logo_1_20260428_143055.png"
  //   La pantalla de visualización usará esto como <img src="...">
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
      { label: 'section_format_crudo ANTES  (HTML del editor) ', valor: htmlCrudo },
      { label: 'section_format DESPUÉS (tokens/acrónimos → BD)     ', valor: htmlToken },
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

  // ── Determinar el htmltag semántico del elemento ──────────────────────
  // Mapear el tipo interno del builder al tag HTML real de la BD
  const HTML_TAG_MAP = {
    h1: 'h1', h2: 'h2', h3: 'h3', p: 'p',
    ul: 'ul', ol: 'ol', 'ul-ol': 'ul',
    hl: 'div',           // aviso importante = div con clase doc-highlight
    note: 'blockquote',  // nota al margen = blockquote
    hr: 'hr',
    url: 'a', mail: 'a', img: 'img',
  }
  const htmlTag = HTML_TAG_MAP[tipo] || 'div'

  // ── Armar el objeto con la estructura exacta de bulletin_sections ──────
  //
  // CAMPOS DE LA TABLA bulletin_sections:
  //   section_content  → texto plano (sin HTML, para búsquedas y lectores de pantalla)
  //   section_format   → HTML con tokens/acrónimos (ej: "[BOLD_START]texto[BOLD_FINAL]")
  //                      Este es el campo que contiene el contenido con formato.
  //                      Se llama "format" porque almacena el formato del texto.
  //   section_css      → índices numéricos del mapa de clases (ej: "5,24")
  //   section_htmltag  → tag HTML del elemento (ej: "h1", "p", "ul", "a")
  //
  // CAMPOS TEMPORALES (no van a la BD — solo para referencia/debug):
  //   section_format_temp → el HTML crudo original, antes de tokenizar
  //   section_css_temp    → las clases CSS legibles, antes de indexar
  return {
    // ── Posición en el documento ──────────────────────────────────────
    section_segment:        sec.section_segment,
    section_subsegment:     sec.section_subsegment,
    section_subsegment_num: sec.section_subsegment || 0,
    bull_id:                BULLETIN_ID_HARDCODE,   // hardcode = 1 (temporal)

    // ── Recurso asociado ──────────────────────────────────────────────
    // null para texto, títulos, listas, separadores
    // resource_id para imágenes, URLs y correos
    resource_id:            resourceId || null,

    // ── Orden de aparición ────────────────────────────────────────────
    section_order:          sec.section_order,

    // ── CONTENIDO PLANO (para búsqueda, accesibilidad) ───────────────
    // Texto sin ningún HTML ni tokens. Solo las palabras.
    // Ejemplo: "El texto en negrita importante"
    // Para imágenes: section_content guarda la URL del front
    // (/assets/section_images/1/secimg_Logo_1_...png)
    // La pantalla de visualización usará: <img src={section_content}>
    // Para los demás tipos: el texto plano del elemento
    section_content:        (tipo === 'img' && urlImagen) ? urlImagen : (sec.section_content || ''),

    // ── FORMATO CON TOKENS (va a la BD con acrónimos sustituidos) ────
    // Este es el campo que antes se llamaba section_html.
    // Contiene el HTML del editor ya tokenizado con acrónimos.
    //
    // Ejemplos según el tipo:
    //   h1/h2/h3 → texto plano sin acrónimos (sanitizePlain)
    //              "Registro para la entrega de uniformes"
    //   p/hl/note → acrónimos del editor
    //              "[BOLD_START]entrega[BOLD_FINAL] de uniformes"
    //   ul/ol     → acrónimos de listas
    //              "[UL_START][LI_START]primer punto[LI_FINAL][UL_FINAL]"
    //   url/mail  → el valor tal cual (texto plano seguro)
    //              "https://www.conamed.gob.mx"
    //   img       → nombre del archivo
    //              "secimg_logo_1_20260427_143055.png"
    //   hr        → vacío (el separador no tiene contenido)
    section_format:         htmlToken,

    // ── ESTILOS CSS (índices numéricos) ───────────────────────────────
    // "doc-h1 text-center" → "1,22"  (índices del mapa CSS)
    section_css:            cssIndices,

    // ── TAG HTML DEL ELEMENTO ─────────────────────────────────────────
    // El tag semántico que se usará para renderizar en la página web.
    // Ejemplos: "h1", "p", "ul", "blockquote", "a", "img", "hr"
    section_htmltag:        htmlTag,

    section_status:         true,
    updated_by:             'milla',

    // ── Solo para debug — NO van a la BD ─────────────────────────────
    _temp_format_crudo:     htmlCrudo,   // HTML original antes de tokenizar
    _temp_css_clases:       cssClases,   // clases CSS antes de indexar
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
      // PASO 1: Guardar imágenes físicamente + registrar todos los recursos
      // ═══════════════════════════════════════════════════════════════════
      //
      // OBJETIVO:
      //   La pantalla de visualización del documento necesita mostrar imágenes.
      //   Para eso la imagen debe estar en la carpeta del propio proyecto React
      //   (public/assets/section_images/{bull_id}/) y la BD debe guardar la URL
      //   relativa (/assets/section_images/1/secimg_Logo_1_....png).
      //   Cuando la página de visualización haga <img src="{url_de_bd}">,
      //   el browser la encontrará porque está en el mismo front.
      //
      // ORDEN CORRECTO:
      //   1a. Guardar imagen en disco → obtener la URL final real
      //   1b. Usar esa URL como resource_desc en bulletin_resource
      //   1c. POST /bulletin-resources → obtener resource_id
      //   Con este orden, la URL en la BD siempre corresponde al archivo real.
      devSeparator('PASO 1 — Guardar imágenes + registrar recursos')

      // Filtrar secciones que necesitan recurso (img, url, mail)
      const seccionesConRecurso = secciones.filter(sec =>
        TIPOS_CON_RECURSO.includes(sec._meta_type) && sec.section_content
      )
      devLog('GUARD', `Secciones con recurso: ${seccionesConRecurso.length}`)

      // ── PASO 1a: Guardar cada imagen físicamente en el front ──────────
      // Para cada sección de tipo imagen:
      //   1. Enviamos el File al servidor Vite (/__upload via vite.config.js)
      //   2. Vite escribe el archivo en: public/assets/section_images/{bull_id}/
      //   3. Obtenemos la URL relativa: /assets/section_images/1/secimg_Logo_1_....png
      //   4. Guardamos esa URL para usarla como resource_desc en la BD
      //
      // Mapa: clave_seccion → URL de la imagen guardada
      // Ejemplo: "2_1_8" → "/assets/section_images/1/secimg_Logo_1_20260428_143055.png"
      const urlImagenPorClave = {}

      for (const sec of seccionesConRecurso) {
        if (sec._meta_type === 'img') {
          // sec.section_content tiene el nombre original del archivo
          // imagenesArchivos es el mapa elemId→File que viene de BuilderPanel
          const archivo = imagenesArchivos[sec.section_content]
          if (archivo) {
            try {
              // guardarImagenFisica hace POST /__upload → Vite escribe el archivo
              // Retorna: { ok, url, filename, path }
              //   url = "/assets/section_images/1/secimg_Logo_1_20260428_143055.png"
              //   Este es el valor que va a la BD como resource_desc
              const info = await guardarImagenFisica(archivo, BULLETIN_ID_HARDCODE)

              // Guardar la URL para este sección específica
              const clave = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`
              urlImagenPorClave[clave] = info.url

              devLog('IMG', `✅ Imagen en disco: ${info.filename}`)
              devLog('IMG', `   URL para la BD: ${info.url}`)

            } catch (imgErr) {
              // Si falla el guardado físico, no interrumpir — continuar sin URL
              devLog('IMG', `⚠ No se pudo guardar ${sec.section_content}: ${imgErr.message}`)
            }
          }
        }
      }

      // ── PASO 1b: Construir el array de recursos para la BD ────────────
      // resource_desc es lo que queda registrado en bulletin_resource:
      //   - Para imágenes: la URL relativa del front (/assets/section_images/1/secimg_...)
      //     → la pantalla de visualización usará esto como <img src="...">
      //   - Para URLs:    el link tal cual (https://www.conamed.gob.mx)
      //   - Para correos: la dirección (orientacion@conamed.gob.mx)
      const recursosParaRegistrar = seccionesConRecurso.map(sec => {
        const clave = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`

        if (sec._meta_type === 'img') {
          // Usar la URL guardada en el paso 1a (o el nombre original como fallback)
          const urlFinal = urlImagenPorClave[clave] || sec.section_content
          return { resource_desc: urlFinal }
        }

        // URL o mail: el contenido tal cual ya es el recurso
        return { resource_desc: sec.section_content }
      })

      devLog('GUARD', 'resource_desc que van a la BD:', recursosParaRegistrar)

      // ── PASO 1c: Registrar recursos en bulletin_resource ──────────────
      // POST /bulletin-resources con el array de { resource_desc }
      // Respuesta: { success: true, inserted_ids: [12, 13, 14] }
      // Los IDs vienen en el mismo orden que los recursos enviados.
      const resourceIdPorClave = {}

      if (recursosParaRegistrar.length > 0) {
        const respRecursos = await registrarRecursos(recursosParaRegistrar)
        devLog('GUARD', '✅ resource_ids obtenidos:', respRecursos.inserted_ids)

        // Mapear clave_seccion → resource_id
        // Así sabremos qué resource_id asignar a cada sección al armar el batch
        seccionesConRecurso.forEach((sec, i) => {
          const clave = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`
          resourceIdPorClave[clave] = respRecursos.inserted_ids[i]
        })
      }

      // Renombrar para compatibilidad con el resto del código
      const resourceIdPorIdx = resourceIdPorClave

      // ═══════════════════════════════════════════════════════════════════
      // PASO 2: Tokenizar HTML y codificar CSS en cada sección
      // ═══════════════════════════════════════════════════════════════════
      devSeparator('PASO 2 — Tokenizar HTML y codificar CSS')

      const seccionesProcesadas = secciones.map(sec => {
        const clave      = `${sec.section_segment}_${sec.section_subsegment}_${sec.section_order}`
        const resourceId = resourceIdPorIdx[clave] || null
        // Para imágenes: pasar la URL relativa del front para que quede
        // en section_content y la pantalla de visualización la use como <img src>
        const urlImagen  = sec._meta_type === 'img' ? (urlImagenPorClave[clave] || null) : null

        return procesarSeccion(sec, resourceId, urlImagen)
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
