// ─────────────────────────────────────────────────────────────────────────
// apiToBuilder.js — Convierte datos del API al estado interno del builder
// ─────────────────────────────────────────────────────────────────────────
//
// PROBLEMA QUE RESUELVE:
//   El API devuelve un array plano de filas (una por elemento):
//   [
//     { section_segment:1, section_subsegment:0, section_htmltag:'h1', section_content:'Título', ... },
//     { section_segment:1, section_subsegment:0, section_htmltag:'p',  section_content:'Párrafo', ... },
//     { section_segment:2, section_subsegment:1, section_htmltag:'img', ... },
//     { section_segment:2, section_subsegment:2, section_htmltag:'p',   ... },
//   ]
//
//   El builder necesita un array de secciones anidadas:
//   [
//     { id:'sec_...', layout:'full',   elementos:[ {tipo:'h1',...}, {tipo:'p',...} ] },
//     { id:'sec_...', layout:'thirds', subsegmentos:[
//         { id:'sub_...', elementos:[ {tipo:'img',...} ] },
//         { id:'sub_...', elementos:[ {tipo:'p',...}   ] },
//     ]},
//   ]
//
// FLUJO:
//   filas planas del API
//     → agrupar por section_segment
//       → detectar layout (full / half / thirds) por section_subsegment_num
//         → construir secciones con elementos o subsegmentos
//           → decodificar section_css y section_format al estado del builder
// ─────────────────────────────────────────────────────────────────────────

import { decodeCssFromIndex } from './cssTokens'
import { decodeHtml, sanitizePlain } from './htmlTokens'

// ── Generador de IDs únicos ───────────────────────────────────────────
// Usa timestamp + random para evitar colisiones al cargar múltiples veces
let _counter = 0
function genId(prefix = 'elem') {
  return `${prefix}_${Date.now()}_${++_counter}_${Math.floor(Math.random() * 1000)}`
}

// ── Mapeo: section_htmltag → tipo interno del builder ─────────────────
// El builder usa tipos cortos ('h1', 'p', 'hl', 'note', 'img', etc.)
// La BD guarda tags HTML ('h1', 'p', 'div', 'blockquote', 'img', etc.)
const HTMLTAG_TO_TIPO = {
  h1: 'h1', h2: 'h2', h3: 'h3',
  p: 'p',
  div: 'p',        // puede ser 'hl' — se refina por CSS (ver detectarTipo)
  ul: 'ul', ol: 'ol', 'ul-ol': 'ul-ol',
  blockquote: 'note',
  hr: 'hr',
  a: 'url',        // puede ser 'mail' — se refina por CSS
  img: 'img',
  span: 'p',       // tags no soportados → párrafo como fallback
  footer: 'p',
  table: 'p',
}

// ── Tipos que tienen contenido rico (HTML decodificable) ──────────────
const RICOS = ['p', 'ul', 'ol', 'ul-ol', 'hl', 'note']
// ── Tipos de texto plano (solo section_content) ───────────────────────
const PLANOS = ['h1', 'h2', 'h3']

// ── detectarTipo ──────────────────────────────────────────────────────
// Determina el tipo interno del builder mirando htmltag + clases CSS.
// Las clases CSS son más confiables que el tag para distinguir
// hl (aviso) de p (párrafo) y mail de url.
function detectarTipo(sec) {
  const tag    = sec.section_htmltag || 'p'
  const css    = sec.section_css     || ''
  const tipo   = HTMLTAG_TO_TIPO[tag] || 'p'

  // Decodificar las clases CSS para ver si hay doc-highlight, doc-note, doc-mailto
  let clasesStr = ''
  if (/^[\d,\s]+$/.test(css.trim())) {
    clasesStr = decodeCssFromIndex(css)   // "8,21" → "doc-highlight text-left"
  } else {
    clasesStr = css                        // "doc-highlight text-left" (legacy)
  }

  if (clasesStr.includes('doc-highlight')) return 'hl'
  if (clasesStr.includes('doc-note'))      return 'note'
  if (clasesStr.includes('doc-mailto'))    return 'mail'

  return tipo
}

// ── detectarAlign ─────────────────────────────────────────────────────
// Extrae la alineación del section_css decodificado.
// Ejemplo: "doc-h1 text-center" → "center"
function detectarAlign(sec) {
  const css = sec.section_css || ''
  let clasesStr = /^[\d,\s]+$/.test(css.trim())
    ? decodeCssFromIndex(css)
    : css

  if (clasesStr.includes('text-center'))  return 'center'
  if (clasesStr.includes('text-right'))   return 'right'
  if (clasesStr.includes('text-justify')) return 'justify'
  if (clasesStr.includes('text-left'))    return 'left'

  // Fallback: mirar section_format que en datos legacy puede ser la alineación
  const fmt = sec.section_format || ''
  if (['left','center','right','justify'].includes(fmt)) return fmt

  return 'left'
}

// ── detectarFont ──────────────────────────────────────────────────────
// Extrae la fuente del section_css si existe.
function detectarFont(sec) {
  const css = sec.section_css || ''
  const clasesStr = /^[\d,\s]+$/.test(css.trim())
    ? decodeCssFromIndex(css)
    : css
  if (clasesStr.includes('noto-sans')) return 'noto-sans'
  if (clasesStr.includes('patria'))    return 'patria'
  return ''
}

// ── seccionRowToElemento ──────────────────────────────────────────────
// Convierte UNA fila del API a UN elemento del builder.
//
// Decodificación inversa:
//   section_css    "1,22"          → "doc-h1 text-center"  (clases CSS)
//   section_format "[BOLD_START]x" → "<strong>x</strong>"  (HTML formateado)
//   section_content "Título"       → contenido plano
export function seccionRowToElemento(sec) {
  const tipo  = detectarTipo(sec)
  const align = detectarAlign(sec)
  const font  = detectarFont(sec)
  const fmt   = sec.section_format || ''

  // ── Reconstruir el HTML del editor (campo 'html') ─────────────────
  // El builder guarda el HTML crudo en elem.html para los tipos ricos.
  // El API devuelve section_format con tokens.
  // decodeHtml() convierte los tokens de vuelta a HTML renderizable.
  let html     = ''
  let contenido = sec.section_content || ''

  if (RICOS.includes(tipo)) {
    // Tiene formato rico: decodificar tokens de section_format
    if (fmt.includes('[') && fmt.includes(']')) {
      html = decodeHtml(fmt)    // "[BOLD_START]texto[BOLD_FINAL]" → "<strong>texto</strong>"
    } else if (fmt && !['left','center','right','justify'].includes(fmt)
               && !['h1','h2','h3','p','div','a','img','hr','blockquote','ul','ol','ul-ol'].includes(fmt)) {
      // section_format tiene contenido HTML legacy o texto directo
      html = fmt
    } else {
      // Fallback: usar section_content como HTML plano
      html = contenido
    }
  } else if (PLANOS.includes(tipo)) {
    // Títulos: solo texto plano
    contenido = sec.section_content || sanitizePlain(fmt)
    html      = ''
  } else if (tipo === 'img') {
    // Imagen: section_content es la URL o nombre del archivo
    contenido = sec.resource_desc || sec.section_content || ''
    html      = ''
  } else if (tipo === 'url') {
    // URL: section_content puede ser el anchor text, resource_desc la URL
    contenido = sec.resource_desc || sec.section_content || ''
    html      = ''
  } else if (tipo === 'mail') {
    contenido = sec.resource_desc || sec.section_content || ''
    html      = ''
  }

  // ── Reconstruir cssClases ─────────────────────────────────────────
  const css = sec.section_css || ''
  const cssClases = /^[\d,\s]+$/.test(css.trim())
    ? decodeCssFromIndex(css)
    : css

  return {
    id:        genId('elem'),
    tipo,
    contenido,
    html,
    align,
    font,
    cssClases,
    // Datos originales de la BD (para edición/actualización posterior)
    _bdId:        sec.section_id,
    _bdResourceId: sec.resource_id,
    _bdOrder:     sec.section_order,
  }
}

// ── apiRowsToSecciones ────────────────────────────────────────────────
// Convierte el array plano del API al array de secciones del builder.
// Esta es la función principal que se llama al cargar un boletín para editar.
//
// PARÁMETRO:
//   rows → array de objetos bulletin_sections del API GET /bulletin/sections/{id}
//
// RETORNA:
//   array de secciones en el formato del estado del builder
export function apiRowsToSecciones(rows) {
  if (!rows || !rows.length) return []

  // 1. Filtrar activas y ordenar por segmento → orden
  const activas = rows
    .filter(r => r.section_status !== false)
    .sort((a, b) =>
      a.section_segment !== b.section_segment
        ? a.section_segment - b.section_segment
        : a.section_order   - b.section_order
    )

  // 2. Agrupar por section_segment
  const mapSegmentos = new Map()
  activas.forEach(row => {
    const k = row.section_segment
    if (!mapSegmentos.has(k)) mapSegmentos.set(k, [])
    mapSegmentos.get(k).push(row)
  })

  const secciones = []

  // 3. Procesar cada segmento
  mapSegmentos.forEach((items, segNum) => {
    // Detectar el layout del segmento:
    //   section_subsegment_num indica cuántas columnas tiene el segmento.
    //   Los items con section_subsegment > 0 son columnas.
    const subsNums = [...new Set(items.map(r => r.section_subsegment))].filter(n => n > 0)
    const subNum   = items[0]?.section_subsegment_num || 0

    // Determinar layout
    let layout = 'full'
    if (subsNums.length >= 3 || subNum >= 3) layout = 'thirds'
    else if (subsNums.length === 2 || subNum === 2) layout = 'half'

    const secId = genId('sec')

    if (layout === 'full') {
      // ── Segmento de columna única ─────────────────────────────────
      // Todos los items son elementos directos de la sección
      const elementos = items.map(row => seccionRowToElemento(row))

      secciones.push({
        id:          secId,
        nombre:      `SEG-${segNum}`,
        cssClases:   'doc-section',
        layout:      'full',
        elementos,
        subsegmentos: [],
        // ID original del boletín para actualizaciones
        _bull_id:    items[0]?.bull_id,
        _segNum:     segNum,
      })

    } else {
      // ── Segmento con columnas (half o thirds) ─────────────────────
      // Los items con section_subsegment > 0 son columnas
      // Los items con section_subsegment = 0 son directos (poco común)
      const subsegmentos = subsNums.map(subNum2 => {
        const itemsDeSub = items
          .filter(r => r.section_subsegment === subNum2)
          .sort((a, b) => a.section_order - b.section_order)

        return {
          id:        genId('sub'),
          nombre:    `Columna ${subNum2}`,
          elementos: itemsDeSub.map(row => seccionRowToElemento(row)),
          _subNum:   subNum2,
        }
      })

      // Items directos del segmento (section_subsegment = 0)
      const elementosDirectos = items
        .filter(r => r.section_subsegment === 0)
        .map(row => seccionRowToElemento(row))

      secciones.push({
        id:          secId,
        nombre:      `SEG-${segNum}`,
        cssClases:   'doc-section',
        layout,
        elementos:   elementosDirectos,
        subsegmentos,
        _bull_id:    items[0]?.bull_id,
        _segNum:     segNum,
      })
    }
  })

  return secciones
}
