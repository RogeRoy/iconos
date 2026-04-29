// ─────────────────────────────────────────────────────────────────────────
// htmlTokens.js — v3  (Fix: HIGHLIGHT captura par completo)
// ─────────────────────────────────────────────────────────────────────────
//
// CORRECCIÓN PRINCIPAL:
//   Bug anterior: <span style="background-color:yellow">texto</span>
//   Resultado bug:  [HIGHLIGHT_START]texto[SPAN_FINAL]   ← INCORRECTO
//   Resultado fix:  [HIGHLIGHT_START]texto[HIGHLIGHT_FINAL] ← CORRECTO
//
//   El bug ocurría porque el regex de HIGHLIGHT_START solo capturaba el
//   tag de apertura. El cierre </span> lo tomaba después SPAN_FINAL.
//   Al decodificar: <mark>texto</span> → HTML roto.
//
//   FIX: HIGHLIGHT captura el par COMPLETO en un solo regex:
//   /<span[^>]*background-color:\s*yellow[^>]*>([\s\S]*?)<\/span>/gi
//   Reemplaza TODO (apertura + contenido + cierre) de una vez.
//   Así el cierre </span> ya no está disponible para que SPAN_FINAL lo capture.
//
// CORRECCIÓN SECUNDARIA:
//   Las negritas generadas por document.execCommand('bold') producen:
//   <b style="color: rgb(58, 10, 10);">texto</b>
//   El color rgb(58,10,10) es casi negro — era el color del sistema anterior.
//   Al tokenizar se pierde el color inline (correcto, es más seguro).
//   Al decodificar se produce <strong> sin color — el CSS del sistema aplica
//   el color correcto vía la clase del contenedor (doc-p, doc-h2, etc.)
// ─────────────────────────────────────────────────────────────────────────

// ── TOKEN_MAP ─────────────────────────────────────────────────────────────
// Cada entrada tiene:
//   token      → nombre del token (sin corchetes)
//   encodeFrom → RegExp que captura el HTML del editor (null = solo decodifica)
//   decodeTo   → HTML semántico que se genera al decodificar
//
// ORDEN IMPORTANTE: las reglas más específicas van PRIMERO.
export const TOKEN_MAP = Object.freeze([

  // ── HIGHLIGHT (resaltado amarillo) ────────────────────────────────────
  // FIX: captura el par COMPLETO <span style="background-color:yellow">...</span>
  // usando un grupo de captura ([\s\S]*?) para el contenido entre los tags.
  // El resultado: [HIGHLIGHT_START]contenido[HIGHLIGHT_FINAL]
  // Así el </span> del highlight nunca llega a la regla SPAN_FINAL.
  {
    token:      'HIGHLIGHT',  // se expande a [HIGHLIGHT_START] y [HIGHLIGHT_FINAL]
    encodeFrom: /(<span[^>]*background-color:\s*yellow[^>]*>)([\s\S]*?)(<\/span>)/gi,
    decodeTo:   null,         // se maneja especialmente en encodeHtml
    // Al decodificar:
    decodePair: { start: '[HIGHLIGHT_START]', end: '[HIGHLIGHT_FINAL]',
                  htmlStart: '<mark style="background:yellow">', htmlEnd: '</mark>' }
  },

  // ── SPAN GENÉRICO (apertura) ──────────────────────────────────────────
  {
    token:      'SPAN_START',
    encodeFrom: /<span[^>]*>/gi,
    decodeTo:   '<span>',
  },
  {
    token:      'SPAN_FINAL',
    encodeFrom: /<\/span>/gi,
    decodeTo:   '</span>',
  },

  // ── NEGRITA ───────────────────────────────────────────────────────────
  // El editor genera <b style="color:rgb(58,10,10)"> — se elimina el style
  // inline para mayor seguridad. El CSS del sistema aplica el color correcto.
  {
    token:      'BOLD_START',
    encodeFrom: /<(b|strong)[^>]*>/gi,
    decodeTo:   '<strong>',
  },
  {
    token:      'BOLD_FINAL',
    encodeFrom: /<\/(b|strong)>/gi,
    decodeTo:   '</strong>',
  },

  // ── CURSIVA ───────────────────────────────────────────────────────────
  {
    token:      'ITALIC_START',
    encodeFrom: /<(i|em)[^>]*>/gi,
    decodeTo:   '<em>',
  },
  {
    token:      'ITALIC_FINAL',
    encodeFrom: /<\/(i|em)>/gi,
    decodeTo:   '</em>',
  },

  // ── SUBRAYADO ─────────────────────────────────────────────────────────
  // FIX ya existente: (?!l) evita capturar <ul>
  {
    token:      'UNDER_START',
    encodeFrom: /<u(?!l)[^>]*>/gi,
    decodeTo:   '<u>',
  },
  {
    token:      'UNDER_FINAL',
    encodeFrom: /<\/u(?!l)>/gi,
    decodeTo:   '</u>',
  },

  // ── TACHADO ───────────────────────────────────────────────────────────
  {
    token:      'STRIKE_START',
    encodeFrom: /<(s|del)[^>]*>/gi,
    decodeTo:   '<s>',
  },
  {
    token:      'STRIKE_FINAL',
    encodeFrom: /<\/(s|del)>/gi,
    decodeTo:   '</s>',
  },

  // ── LISTAS ────────────────────────────────────────────────────────────
  { token:'UL_START',  encodeFrom:/<ul[^>]*>/gi,   decodeTo:'<ul class="doc-ul">' },
  { token:'UL_FINAL',  encodeFrom:/<\/ul>/gi,       decodeTo:'</ul>' },
  { token:'OL_START',  encodeFrom:/<ol[^>]*>/gi,   decodeTo:'<ol class="doc-ol">' },
  { token:'OL_FINAL',  encodeFrom:/<\/ol>/gi,       decodeTo:'</ol>' },
  { token:'LI_START',  encodeFrom:/<li[^>]*>/gi,   decodeTo:'<li>' },
  { token:'LI_FINAL',  encodeFrom:/<\/li>/gi,       decodeTo:'</li>' },

  // ── BLOQUES ───────────────────────────────────────────────────────────
  { token:'P_START',   encodeFrom:/<p[^>]*>/gi,    decodeTo:'<p>' },
  { token:'P_FINAL',   encodeFrom:/<\/p>/gi,        decodeTo:'</p>' },
  { token:'DIV_START', encodeFrom:/<div[^>]*>/gi,  decodeTo:'<div>' },
  { token:'DIV_FINAL', encodeFrom:/<\/div>/gi,      decodeTo:'</div>' },
  { token:'BR',        encodeFrom:/<br\s*\/?>/gi,   decodeTo:'<br>' },
])

// ── encodeHtml(htmlStr) ───────────────────────────────────────────────────
// Convierte HTML crudo del editor a tokens seguros para la BD.
export function encodeHtml(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return ''
  let result = htmlStr

  for (const entry of TOKEN_MAP) {
    if (!entry.encodeFrom) continue  // entries sin encodeFrom se saltan

    if (entry.token === 'HIGHLIGHT') {
      // Caso especial: captura el par completo con grupo de captura $2
      // Reemplaza: <span style="background-color:yellow">CONTENIDO</span>
      // Por:       [HIGHLIGHT_START]CONTENIDO[HIGHLIGHT_FINAL]
      result = result.replace(
        entry.encodeFrom,
        (match, opening, content, closing) =>
          `[HIGHLIGHT_START]${content}[HIGHLIGHT_FINAL]`
      )
    } else {
      result = result.replace(entry.encodeFrom, `[${entry.token}]`)
    }
  }

  // Red de seguridad: eliminar cualquier tag HTML restante
  result = result.replace(/<[^>]+>/g, '')

  return result
}

// ── decodeHtml(tokenStr) ─────────────────────────────────────────────────
// Convierte tokens de la BD a HTML semántico para mostrar.
export function decodeHtml(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') return ''
  let result = tokenStr

  for (const entry of TOKEN_MAP) {
    if (entry.token === 'HIGHLIGHT') {
      // Manejar el par [HIGHLIGHT_START]...[HIGHLIGHT_FINAL]
      result = result.replace(/\[HIGHLIGHT_START\]/g, '<mark style="background:yellow">')
      result = result.replace(/\[HIGHLIGHT_FINAL\]/g,  '</mark>')
    } else if (entry.decodeTo !== null && entry.decodeTo !== undefined) {
      const pattern = new RegExp(`\\[${entry.token}\\]`, 'g')
      result = result.replace(pattern, entry.decodeTo)
    }
  }

  return result
}

// ── sanitizePlain(htmlStr) ───────────────────────────────────────────────
// Extrae texto plano eliminando todo HTML. Para títulos h1/h2/h3.
export function sanitizePlain(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return ''
  return htmlStr
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .trim()
}

export const htmlFromTokens = decodeHtml
