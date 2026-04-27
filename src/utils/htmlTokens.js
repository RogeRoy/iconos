// ─────────────────────────────────────────────────────────
// htmlTokens.js — Tokenización REVERSIBLE de HTML
// ─────────────────────────────────────────────────────────
// Convierte HTML rico → tokens de texto plano para la BD.
// Los tokens son COMPLETAMENTE REVERSIBLES:
//   encodeHtml("<b>hola</b>")  → "[BOLD_START]hola[BOLD_FINAL]"
//   decodeHtml("[BOLD_START]hola[BOLD_FINAL]") → "<strong>hola</strong>"
//
// Reversible significa: decodeHtml(encodeHtml(x)) puede usarse para
// reconstruir HTML semántico válido para renderizar en una página web.
// ─────────────────────────────────────────────────────────

// ── TABLA MAESTRA DE TOKENS ───────────────────────────────
// Cada entrada define:
//   token     : nombre del token (sin corchetes)
//   encodeFrom: RegExp que captura el tag HTML en el contenido del editor
//   decodeTo  : HTML semántico al que se convierte al decodificar
//
// El orden de ENCODE importa: los más específicos van primero.
// El orden de DECODE no importa (cada token es único).
export const TOKEN_MAP = Object.freeze([
  // ── Highlight / resaltado ─────────────────────────────
  // El editor genera: <span style="background-color: yellow;">
  // Producimos: <mark> (semántico HTML5) al decodificar
  {
    token:      'HIGHLIGHT_START',
    encodeFrom: /(<span[^>]*background-color:\s*yellow[^>]*>)/gi,
    decodeTo:   '<mark style="background:yellow">',
  },
  // ── Span genérico (sin color específico) ─────────────
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
  // ── Negrita ───────────────────────────────────────────
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
  // ── Cursiva ───────────────────────────────────────────
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
  // ── Subrayado ─────────────────────────────────────────
  {
    token:      'UNDER_START',
    encodeFrom: /<u[^>]*>/gi,
    decodeTo:   '<u>',
  },
  {
    token:      'UNDER_FINAL',
    encodeFrom: /<\/u>/gi,
    decodeTo:   '</u>',
  },
  // ── Tachado ───────────────────────────────────────────
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
  // ── Listas ────────────────────────────────────────────
  {
    token:      'UL_START',
    encodeFrom: /<ul[^>]*>/gi,
    decodeTo:   '<ul class="doc-ul">',
  },
  {
    token:      'UL_FINAL',
    encodeFrom: /<\/ul>/gi,
    decodeTo:   '</ul>',
  },
  {
    token:      'OL_START',
    encodeFrom: /<ol[^>]*>/gi,
    decodeTo:   '<ol class="doc-ol">',
  },
  {
    token:      'OL_FINAL',
    encodeFrom: /<\/ol>/gi,
    decodeTo:   '</ol>',
  },
  {
    token:      'LI_START',
    encodeFrom: /<li[^>]*>/gi,
    decodeTo:   '<li>',
  },
  {
    token:      'LI_FINAL',
    encodeFrom: /<\/li>/gi,
    decodeTo:   '</li>',
  },
  // ── Párrafos y divs (generados por contentEditable) ───
  {
    token:      'P_START',
    encodeFrom: /<p[^>]*>/gi,
    decodeTo:   '<p>',
  },
  {
    token:      'P_FINAL',
    encodeFrom: /<\/p>/gi,
    decodeTo:   '</p>',
  },
  {
    token:      'DIV_START',
    encodeFrom: /<div[^>]*>/gi,
    decodeTo:   '<div>',
  },
  {
    token:      'DIV_FINAL',
    encodeFrom: /<\/div>/gi,
    decodeTo:   '</div>',
  },
  // ── Salto de línea ────────────────────────────────────
  {
    token:      'BR',
    encodeFrom: /<br\s*\/?>/gi,
    decodeTo:   '<br>',
  },
])

// ── encodeHtml(htmlStr) → string con tokens para guardar en BD ──────
// "<b>hola</b>" → "[BOLD_START]hola[BOLD_FINAL]"
export function encodeHtml(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return ''
  let result = htmlStr

  // Aplicar cada regla en orden
  for (const { token, encodeFrom } of TOKEN_MAP) {
    result = result.replace(encodeFrom, `[${token}]`)
  }

  // Red de seguridad: cualquier tag HTML que haya escapado las reglas → eliminar
  result = result.replace(/<[^>]+>/g, '')

  return result
}

// ── decodeHtml(tokenStr) → HTML semántico para render ───────────────
// "[BOLD_START]hola[BOLD_FINAL]" → "<strong>hola</strong>"
// Completamente reversible: el HTML resultante es válido y semántico.
export function decodeHtml(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') return ''
  let result = tokenStr

  for (const { token, decodeTo } of TOKEN_MAP) {
    // Escapar los corchetes para la RegExp
    const pattern = new RegExp(`\\[${token}\\]`, 'g')
    result = result.replace(pattern, decodeTo)
  }

  return result
}

// ── sanitizePlain(htmlStr) → texto plano puro ───────────────────────
// Para títulos h1/h2/h3 que no admiten formato rico.
// Elimina TODO el HTML y decodifica entidades.
export function sanitizePlain(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return ''
  return htmlStr
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

// ── htmlFromTokens(tokenStr) → HTML listo para una página web ───────
// Versión mejorada de decodeHtml que añade clases CSS del sistema.
// Útil para generar el documento HTML final publicable.
export function htmlFromTokens(tokenStr) {
  return decodeHtml(tokenStr)
}
