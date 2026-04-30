// ─────────────────────────────────────────────────────────────────────────
// utils/buildJson.js
// ─────────────────────────────────────────────────────────────────────────
//
// ¿QUÉ HACE ESTE ARCHIVO?
//   Convierte el estado interno del builder (secciones/subsegmentos/elementos)
//   al formato JSON que espera la API para guardar en la base de datos.
//
// ¿POR QUÉ ESTÁ AQUÍ Y NO EN BuilderPanel.jsx?
//   Antes buildJson() vivía dentro de BuilderPanel.jsx, mezclada con el
//   código de la interfaz (JSX). Eso es una mala práctica porque:
//   - Una función de "transformación de datos" no tiene nada que ver con
//     cómo se ve la pantalla.
//   - Si necesitas testear buildJson(), tendrías que montar toda la UI.
//   - Si otro componente necesita la misma lógica, no puede reutilizarla.
//
//   En Java sería como tener la lógica de un Service dentro de un Servlet.
//   Lo correcto es separar responsabilidades.
//
// CORRECCIONES EN ESTA VERSIÓN:
//
//   1. section_subsegment_num CORREGIDO
//      ANTES (incorrecto): se usaba el mismo valor que section_subsegment
//      (el número de columna: 1, 2, 3...)
//      DESPUÉS (correcto): indica el TOTAL de columnas del segmento
//        - layout 'full'   → subsegment_num = 0  (no hay columnas)
//        - layout 'half'   → subsegment_num = 2  (siempre 2 columnas)
//        - layout 'thirds' → subsegment_num = 3  (siempre 3 columnas)
//
//      ¿Por qué importa?
//      Cuando el backend devuelve los datos y apiToBuilder.js los reconstruye,
//      usa section_subsegment_num para saber el layout del segmento.
//      Si ese campo era incorrecto, el layout se reconstruía mal.
//
//   2. genId() usa crypto.randomUUID()
//      ANTES: `elem_${Date.now()}_${Math.random()}` — puede colisionar si
//      se generan dos IDs en el mismo milisegundo.
//      DESPUÉS: crypto.randomUUID() — genera un UUID v4 garantizado único
//      (standard del navegador, sin dependencias externas).
//
// ─────────────────────────────────────────────────────────────────────────

import { findType } from '../components/editor/elementTypes'
import { buildCss }  from './cssTokens'

// ── Generador de ID único ─────────────────────────────────────────────
// crypto.randomUUID() está disponible en todos los navegadores modernos
// y en Node.js ≥ 19. Genera un UUID v4 como:
//   "110e8400-e29b-41d4-a716-446655440000"
//
// En el contexto de Vite (que usa Node.js), también funciona en desarrollo.
// Si corriera en un entorno muy antiguo, crypto puede no existir —
// el || fallback garantiza que siempre funcione.
export function genId(prefix = 'elem') {
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`  // fallback seguro
  return `${prefix}_${uuid}`
}

// ── buildJson(secciones) ──────────────────────────────────────────────
//
// PARÁMETRO:
//   secciones → array del estado del builder. Cada sección tiene:
//     { id, nombre, layout, elementos, subsegmentos }
//     layout puede ser: 'full' | 'half' | 'thirds'
//
// RETORNA:
//   {
//     bulletin: { bull_name, bull_status, updated_by },
//     bulletin_sections: [ ...filas planas para la BD ],
//     bulletin_path: [ ...recursos (imágenes, urls, mails) ]
//   }
//
// ESTRUCTURA DE LA BD (bulletin_sections):
//   section_segment        → número del segmento (1, 2, 3...)
//   section_subsegment     → número de columna DENTRO del segmento (0 si es full)
//   section_subsegment_num → TOTAL de columnas del segmento (0, 2 o 3)  ← CORREGIDO
//   section_order          → orden global de aparición en el documento
//   section_content        → texto plano del elemento
//   section_css            → clases CSS (ej: "doc-h1 text-center")
//   section_html           → tag HTML del elemento (ej: "h1", "p", "img")
//
export function buildJson(secciones) {
  const sections = []
  let order = 1  // contador global de orden (se incrementa por cada elemento)

  secciones.forEach((sec, si) => {
    const segN    = si + 1                        // número del segmento (1-based)
    const segName = sec.nombre || `SEG-${segN}`
    const layout  = sec.layout || 'full'

    // ── CORRECCIÓN: calcular subsegment_num según layout ──────────────
    // subsegment_num = cuántas columnas TIENE este segmento en total
    //   'full'   → 0 (no usa columnas, todos los elementos son directos)
    //   'half'   → 2 (siempre 2 columnas)
    //   'thirds' → 3 (siempre 3 columnas)
    const subsegmentNum =
      layout === 'half'   ? 2 :
      layout === 'thirds' ? 3 : 0

    // ── Función interna: construye UNA fila para bulletin_sections ────
    // Recibe el elemento del builder y los datos de posición (subN, subName).
    const makeRow = (elem, subN, subName) => {
      const info = findType(elem.tipo)

      // Detectar si el elemento necesita un recurso (path_id):
      // Las imágenes, URLs y correos tienen un recurso asociado en bulletin_resource.
      let path_id   = null
      let path_desc = null

      if (elem.tipo === 'url' && elem.contenido) {
        path_id   = 0               // 0 = "quiero que se asigne un resource_id"
        path_desc = elem.contenido  // La URL real va en resource_desc
      }
      if (elem.tipo === 'mail' && elem.contenido) {
        path_id   = 0
        path_desc = `mailto:${elem.contenido}`
      }
      if (elem.tipo === 'img' && elem.contenido) {
        path_id   = 0
        path_desc = elem.contenido  // nombre del archivo
      }

      // Construir las clases CSS del elemento (ej: "doc-h1 text-center")
      const cssClases = buildCss(elem.tipo, elem.align || info.defAlign || 'left', elem.font || '')

      return {
        section_order:          order++,
        section_segment:        segN,
        section_subsegment:     subN,           // columna actual (0 si es full)
        section_subsegment_num: subsegmentNum,  // ← CORRECCIÓN: total de columnas

        seg_name: segName,
        sub_name: subN > 0 ? (subName || `Columna ${subN}`) : null,

        type:  elem.tipo,
        align: elem.align || info.defAlign || '',

        section_css:  cssClases,
        section_html: elem.html || info.htmlTag || 'div',

        // Para URL: si hay anchorText (texto del link), va en section_content
        // Para los demás: el contenido normal
        section_content: (elem.tipo === 'url' && elem.anchorText)
          ? elem.anchorText
          : (elem.contenido || ''),

        path_id,
        path_desc,

        // Campos _meta para que useGuardarBoletin.js sepa el tipo y alineación
        // sin tener que decodificar el CSS. Son campos internos, no van a la BD.
        _meta_type:     elem.tipo,
        _meta_align:    elem.align || info.defAlign || '',
        _meta_seg_name: segName,
        _meta_sub_name: subN > 0 ? (subName || `Columna ${subN}`) : null,

        // Si el elemento tiene _bdId (vino de la BD al cargar para editar),
        // lo guardamos para que useGuardarBoletin pueda hacer PATCH en lugar de POST.
        _bdId:        elem._bdId        || null,
        _bdResourceId: elem._bdResourceId || null,
      }
    }

    // ── Según el layout, generar las filas ────────────────────────────
    if (layout === 'full') {
      // Layout de una columna: todos los elementos son directos de la sección
      // section_subsegment = 0 significa "no pertenece a ninguna columna"
      ;(sec.elementos || []).forEach(e => sections.push(makeRow(e, 0, null)))
    } else {
      // Layout de 2 o 3 columnas: cada subsegmento es una columna numerada
      // section_subsegment = 1, 2, 3 según la columna
      ;(sec.subsegmentos || []).forEach((sub, si2) => {
        const subN = si2 + 1  // columna 1-based
        ;(sub.elementos || []).forEach(e => sections.push(makeRow(e, subN, sub.nombre)))
      })
    }
  })

  // ── Armar el JSON final ───────────────────────────────────────────────
  return {
    bulletin: {
      bull_name:  'Documento',
      bull_status: true,
      updated_by: 'SISTEMA',
    },

    // Mapear al formato exacto de bulletin_sections
    bulletin_sections: sections.map(s => ({
      section_segment:        s.section_segment,
      section_subsegment:     s.section_subsegment,
      section_subsegment_num: s.section_subsegment_num,  // ← CORRECCIÓN incluida
      bull_id:                null,   // se asigna en useGuardarBoletin con BULLETIN_ID_HARDCODE
      path_id:                s.path_id,
      section_content:        s.section_content,
      section_css:            s.section_css,
      section_html:           s.section_html,
      section_order:          s.section_order,
      section_status:         true,
      updated_by:             'SISTEMA',

      // Campos _meta (uso interno, no van a la BD)
      _meta_seg_name: s._meta_seg_name,
      _meta_sub_name: s._meta_sub_name,
      _meta_type:     s._meta_type,
      _meta_align:    s._meta_align,

      // _bdId: si existe, useGuardarBoletin usará PATCH en lugar de POST
      _bdId:         s._bdId,
      _bdResourceId: s._bdResourceId,
    })),

    // Recursos (imágenes, URLs, correos) que necesitan registro en bulletin_resource
    bulletin_path: sections
      .filter(s => s.path_id !== null)
      .map(s => ({ path_id: null, path_desc: s.path_desc })),
  }
}
