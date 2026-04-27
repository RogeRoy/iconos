// cssTokens.js — v2
// ─────────────────────────────────────────────────────────
// NUEVO: CSS_INDEX_MAP — índice numérico por clase
// Propósito: la BD guarda "2,6,9" en lugar de "doc-h2 noto-sans text-center"
// Esto previene inyección CSS porque números no pueden ser código ejecutable.
//
// JAVA equivalente:
//   enum CssClass { DOC_H1(1), DOC_H2(2), ... }
//
// FLUJO:
//   encodeCssToIndex("doc-h2 noto-sans text-center") → "2,6,9"
//   decodeCssFromIndex("2,6,9") → "doc-h2 noto-sans text-center"
// ─────────────────────────────────────────────────────────

// ── ÍNDICE MAESTRO DE CLASES CSS ─────────────────────────
// Cada clase tiene un número fijo. NUNCA reasignar un número
// ya que los registros en BD dependen de estos valores.
// Agregar clases nuevas al final con el siguiente número disponible.
//
// Estructura: [indice, nombre_clase, descripcion, categoria]
const CSS_INDEX_TABLE = [
  // ── ELEMENTOS (1-20) ─────────────────────────────────
  [1,  'doc-h1',        'Título nivel 1 — Georgia, guinda, 22px',          'ELEMENT'],
  [2,  'doc-h2',        'Título nivel 2 — Georgia, rosa, 17px',            'ELEMENT'],
  [3,  'doc-h3',        'Título nivel 3 — Noto Sans, verde, 13px CAPS',    'ELEMENT'],
  [4,  'doc-h3-bold',   'Título h3 con peso extra 900',                    'ELEMENT'],
  [5,  'doc-p',         'Párrafo de texto — 14px',                         'ELEMENT'],
  [6,  'doc-ul',        'Lista de viñetas — punto dorado',                 'ELEMENT'],
  [7,  'doc-ol',        'Lista numerada — número verde',                   'ELEMENT'],
  [8,  'doc-highlight', 'Aviso importante — caja amarilla borde naranja',  'ELEMENT'],
  [9,  'doc-note',      'Nota al margen — línea lateral guinda',           'ELEMENT'],
  [10, 'doc-hr',        'Separador horizontal — línea dorada',             'ELEMENT'],
  [11, 'doc-url',       'Enlace de internet',                              'ELEMENT'],
  [12, 'doc-mailto',    'Enlace de correo electrónico',                    'ELEMENT'],
  [13, 'doc-img-full',  'Imagen a ancho completo del contenedor',          'ELEMENT'],
  [14, 'doc-section',   'Contenedor de sección genérica',                  'ELEMENT'],

  // ── ALINEACIÓN DE TEXTO (21-30) ──────────────────────
  [21, 'text-left',    'Alinear texto a la izquierda',  'ALIGN'],
  [22, 'text-center',  'Centrar texto',                 'ALIGN'],
  [23, 'text-right',   'Alinear texto a la derecha',    'ALIGN'],
  [24, 'text-justify', 'Justificar texto ambos lados',  'ALIGN'],

  // ── ALINEACIÓN DE IMAGEN (31-40) ─────────────────────
  [31, 'img-left',   'Imagen alineada a la izquierda', 'IMG_ALIGN'],
  [32, 'img-center', 'Imagen centrada',                'IMG_ALIGN'],
  [33, 'img-right',  'Imagen alineada a la derecha',   'IMG_ALIGN'],

  // ── TIPOGRAFÍA (41-50) ───────────────────────────────
  [41, 'noto-sans', 'Fuente Noto Sans — sans-serif institucional', 'FONT'],
  [42, 'patria',    'Fuente Patria / Georgia — serif institucional','FONT'],
]

// ── Mapas derivados — se construyen UNA VEZ al importar ──

// índice → nombre de clase    (ej: 2 → "doc-h2")
export const IDX_TO_CLASS = new Map(CSS_INDEX_TABLE.map(([i, cls]) => [i, cls]))

// nombre de clase → índice    (ej: "doc-h2" → 2)
export const CLASS_TO_IDX = new Map(CSS_INDEX_TABLE.map(([i, cls]) => [cls, i]))

// Set de clases permitidas (lista blanca)
export const CSS_ALLOWED_CLASSES = new Set(CSS_INDEX_TABLE.map(([, cls]) => cls))

// Catálogo completo para UI (selector de estilos, documentación)
export const CSS_CATALOG = CSS_INDEX_TABLE.map(([idx, cls, desc, cat]) => ({ idx, cls, desc, cat }))

// ─────────────────────────────────────────────────────────
// encodeCssToIndex(classStr) → "2,6,9"   para guardar en BD
// ─────────────────────────────────────────────────────────
// Recibe: "doc-h2 noto-sans text-center"
// Retorna: "2,41,22"
// Clases no reconocidas → se descartan (seguridad)
export function encodeCssToIndex(classStr) {
  if (!classStr || typeof classStr !== 'string') return ''
  const indices = classStr
    .trim()
    .split(/\s+/)
    .map(cls => CLASS_TO_IDX.get(cls))   // undefined si no está en la lista
    .filter(idx => idx !== undefined)     // descartar clases no reconocidas
  return indices.join(',')
}

// ─────────────────────────────────────────────────────────
// decodeCssFromIndex("2,41,22") → "doc-h2 noto-sans text-center"
// ─────────────────────────────────────────────────────────
// Recibe: "2,41,22"   (lo que viene de la BD)
// Retorna: "doc-h2 noto-sans text-center"
// Índices no reconocidos → se descartan (seguridad)
export function decodeCssFromIndex(indexStr) {
  if (!indexStr || typeof indexStr !== 'string') return ''
  return indexStr
    .split(',')
    .map(s => IDX_TO_CLASS.get(Number(s.trim())))  // undefined si no existe
    .filter(cls => cls !== undefined)               // descartar índices inválidos
    .join(' ')
}

// ─────────────────────────────────────────────────────────
// encodeCss(str) → string filtrado (solo clases de la lista blanca)
// Para uso interno donde aún se necesita el nombre de clase (no el índice)
// ─────────────────────────────────────────────────────────
export function encodeCss(classStr) {
  if (!classStr || typeof classStr !== 'string') return ''
  return classStr
    .trim()
    .split(/\s+/)
    .filter(cls => CSS_ALLOWED_CLASSES.has(cls))
    .join(' ')
}

export const decodeCss = encodeCss  // idempotente

export function validateCss(str) {
  if (!str || typeof str !== 'string') return true
  return str.trim().split(/\s+/).every(cls => CSS_ALLOWED_CLASSES.has(cls))
}

// ─────────────────────────────────────────────────────────
// buildCss(tipo, align, font) → "doc-h2 noto-sans text-center"
// Construye el string de clases desde valores individuales.
// ─────────────────────────────────────────────────────────
export function buildCss(tipo, align, font) {
  const TYPE_CLASS = {
    h1:'doc-h1', h2:'doc-h2', h3:'doc-h3', p:'doc-p',
    ul:'doc-ul', ol:'doc-ol', 'ul-ol':'doc-ul',
    hl:'doc-highlight', note:'doc-note', hr:'doc-hr',
    url:'doc-url', mail:'doc-mailto', img:'doc-img-full',
  }
  const ALIGN_CLASS    = { left:'text-left', center:'text-center', right:'text-right', justify:'text-justify' }
  const IMG_ALIGN_CLASS = { left:'img-left', center:'img-center', right:'img-right' }

  const parts = []
  const base = TYPE_CLASS[tipo]; if (base) parts.push(base)
  if (tipo === 'img') {
    const ia = IMG_ALIGN_CLASS[align]; if (ia) parts.push(ia)
  } else {
    const ac = ALIGN_CLASS[align]; if (ac) parts.push(ac)
  }
  if (font && ['h1','h2','h3','p'].includes(tipo) && CSS_ALLOWED_CLASSES.has(font)) parts.push(font)
  return parts.join(' ')
}
