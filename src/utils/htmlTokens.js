// ─────────────────────────────────────────────────────────
// htmlTokens.js — Sanitización de HTML antes de guardar en BD
// ─────────────────────────────────────────────────────────
//
// PROBLEMA:
//   El editor rico (contenteditable) genera HTML como:
//   "<b>texto</b>", "<em>algo</em>", "<u>otro</u>"
//   Si guardamos eso directo en la BD → inyección HTML / XSS.
//
// SOLUCIÓN:
//   Reemplazar cada tag HTML por un token corto, seguro y reversible.
//   "<b>"  → "[BOLD_START]"
//   "</b>" → "[BOLD_FINAL]"
//   Así la BD recibe texto plano con tokens, no HTML crudo.
//   El render del documento los vuelve a convertir a HTML.
//
// REGLA: el token siempre en INGLÉS, MAYÚSCULAS, con sufijo
//   _START para apertura, _FINAL para cierre.
// ─────────────────────────────────────────────────────────

// ── Enumeración de tokens ──────────────────────────────────
// Cada entrada: [tag_regex_apertura, tag_regex_cierre, TOKEN_NAME]
// El orden importa: los más específicos primero.
export const FORMAT_TOKENS = Object.freeze({
  // Formato básico
  BOLD:        { open: '<b>',              close: '</b>',         },
  BOLD_STRONG: { open: '<strong>',         close: '</strong>',    },
  ITALIC:      { open: '<em>',             close: '</em>',        },
  ITALIC_I:    { open: '<i>',              close: '</i>',         },
  UNDERLINE:   { open: '<u>',              close: '</u>',         },
  STRIKE:      { open: '<s>',              close: '</s>',         },
  STRIKE_DEL:  { open: '<del>',            close: '</del>',       },
  // Highlight (resaltado) — el monolito usa hiliteColor=yellow → span style
  HIGHLIGHT:   { open: /(<span[^>]*background[^>]*yellow[^>]*>)/gi, close: '</span>', isRegex: true },
  // Listas
  UL:          { open: '<ul>',             close: '</ul>',        },
  OL:          { open: '<ol>',             close: '</ol>',        },
  LI:          { open: '<li>',             close: '</li>',        },
  // Párrafos y divs generados por contenteditable
  P_TAG:       { open: '<p>',              close: '</p>',         },
  DIV_TAG:     { open: '<div>',            close: '</div>',       },
  BR_TAG:      { open: /<br\s*\/?>/gi,     close: null, isRegex: true },
  // Span genérico (sin estilo específico)
  SPAN_TAG:    { open: /<span[^>]*>/gi,    close: '</span>', isRegex: true },
})

// ── Tabla plana de reemplazo (orden determina prioridad) ──
// Formato: { pattern, replacement, isRegex }
const ENCODE_TABLE = [
  // Highlight primero (patrón más específico)
  { pattern: /(<span[^>]*background[^>]*yellow[^>]*>)/gi, replacement: '[HIGHLIGHT_START]', isRegex: true },
  // Spans genéricos
  { pattern: /<span[^>]*>/gi,   replacement: '[SPAN_START]',   isRegex: true },
  { pattern: /<\/span>/gi,      replacement: '[SPAN_FINAL]',   isRegex: true },
  // Negrita
  { pattern: /<strong>/gi,      replacement: '[BOLD_START]',   isRegex: true },
  { pattern: /<\/strong>/gi,    replacement: '[BOLD_FINAL]',   isRegex: true },
  { pattern: /<b>/gi,           replacement: '[BOLD_START]',   isRegex: true },
  { pattern: /<\/b>/gi,         replacement: '[BOLD_FINAL]',   isRegex: true },
  // Cursiva
  { pattern: /<em>/gi,          replacement: '[ITALIC_START]', isRegex: true },
  { pattern: /<\/em>/gi,        replacement: '[ITALIC_FINAL]', isRegex: true },
  { pattern: /<i>/gi,           replacement: '[ITALIC_START]', isRegex: true },
  { pattern: /<\/i>/gi,         replacement: '[ITALIC_FINAL]', isRegex: true },
  // Subrayado
  { pattern: /<u>/gi,           replacement: '[UNDER_START]',  isRegex: true },
  { pattern: /<\/u>/gi,         replacement: '[UNDER_FINAL]',  isRegex: true },
  // Tachado
  { pattern: /<(s|del)>/gi,     replacement: '[STRIKE_START]', isRegex: true },
  { pattern: /<\/(s|del)>/gi,   replacement: '[STRIKE_FINAL]', isRegex: true },
  // Listas
  { pattern: /<ul[^>]*>/gi,     replacement: '[UL_START]',     isRegex: true },
  { pattern: /<\/ul>/gi,        replacement: '[UL_FINAL]',     isRegex: true },
  { pattern: /<ol[^>]*>/gi,     replacement: '[OL_START]',     isRegex: true },
  { pattern: /<\/ol>/gi,        replacement: '[OL_FINAL]',     isRegex: true },
  { pattern: /<li[^>]*>/gi,     replacement: '[LI_START]',     isRegex: true },
  { pattern: /<\/li>/gi,        replacement: '[LI_FINAL]',     isRegex: true },
  // Párrafos y divs
  { pattern: /<p[^>]*>/gi,      replacement: '[P_START]',      isRegex: true },
  { pattern: /<\/p>/gi,         replacement: '[P_FINAL]',      isRegex: true },
  { pattern: /<div[^>]*>/gi,    replacement: '[DIV_START]',    isRegex: true },
  { pattern: /<\/div>/gi,       replacement: '[DIV_FINAL]',    isRegex: true },
  // Salto de línea
  { pattern: /<br\s*\/?>/gi,    replacement: '[BR]',           isRegex: true },
  // Cualquier tag HTML restante → eliminar (seguridad extra)
  { pattern: /<[^>]+>/g,        replacement: '',               isRegex: true },
]

// ── Tabla de decodificación (inversa de ENCODE_TABLE) ──
const DECODE_TABLE = [
  { token: '[HIGHLIGHT_START]', html: '<span style="background:yellow">' },
  { token: '[SPAN_START]',      html: '<span>' },
  { token: '[SPAN_FINAL]',      html: '</span>' },
  { token: '[BOLD_START]',      html: '<strong>' },
  { token: '[BOLD_FINAL]',      html: '</strong>' },
  { token: '[ITALIC_START]',    html: '<em>' },
  { token: '[ITALIC_FINAL]',    html: '</em>' },
  { token: '[UNDER_START]',     html: '<u>' },
  { token: '[UNDER_FINAL]',     html: '</u>' },
  { token: '[STRIKE_START]',    html: '<s>' },
  { token: '[STRIKE_FINAL]',    html: '</s>' },
  { token: '[UL_START]',        html: '<ul class="doc-ul">' },
  { token: '[UL_FINAL]',        html: '</ul>' },
  { token: '[OL_START]',        html: '<ol class="doc-ol">' },
  { token: '[OL_FINAL]',        html: '</ol>' },
  { token: '[LI_START]',        html: '<li>' },
  { token: '[LI_FINAL]',        html: '</li>' },
  { token: '[P_START]',         html: '<p>' },
  { token: '[P_FINAL]',         html: '</p>' },
  { token: '[DIV_START]',       html: '<div>' },
  { token: '[DIV_FINAL]',       html: '</div>' },
  { token: '[BR]',              html: '<br>' },
]

// ── encodeHtml(htmlStr) → string con tokens ────────────────
// Convierte HTML rico a texto seguro con tokens para guardar en BD.
// Input:  "<b>hola</b> mundo"
// Output: "[BOLD_START]hola[BOLD_FINAL] mundo"
export function encodeHtml(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return ''
  let result = htmlStr
  for (const { pattern, replacement } of ENCODE_TABLE) {
    result = result.replace(pattern, replacement)
  }
  return result
}

// ── decodeHtml(tokenStr) → HTML seguro para render ────────
// Convierte tokens de vuelta a HTML para mostrar en preview/documento.
// Input:  "[BOLD_START]hola[BOLD_FINAL] mundo"
// Output: "<strong>hola</strong> mundo"
export function decodeHtml(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') return ''
  let result = tokenStr
  for (const { token, html } of DECODE_TABLE) {
    // Escapamos los corchetes para usarlos en RegExp
    const escaped = token.replace(/\[/g, '\\[').replace(/\]/g, '\\]')
    result = result.replace(new RegExp(escaped, 'g'), html)
  }
  return result
}

// ── sanitizePlain(htmlStr) → texto plano ──────────────────
// Elimina TODO el HTML y devuelve solo el texto visible.
// Útil para section_content cuando el tipo es título (h1/h2/h3).
export function sanitizePlain(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return ''
  return htmlStr
    .replace(/<[^>]+>/g, '')    // quitar todos los tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}
