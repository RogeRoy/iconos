// ─────────────────────────────────────────────────────────────────────────
// htmlTokens.js — Tokenización REVERSIBLE de HTML rico
// ─────────────────────────────────────────────────────────────────────────
//
// PARA QUÉ SIRVE:
//   El editor rico (RichEditor, TextEditor) guarda HTML como:
//   "<b style='color:red'>hola</b> <i>mundo</i>"
//   Si ese HTML llega directo a la base de datos → riesgo de inyección XSS.
//
//   Este módulo convierte ese HTML a tokens de texto plano seguros:
//   "[BOLD_START]hola[BOLD_FINAL] [ITALIC_START]mundo[ITALIC_FINAL]"
//
//   La base de datos nunca recibe HTML, solo texto con corchetes.
//   Cuando necesitas mostrar el contenido, decodificas los tokens de vuelta a HTML.
//
// FLUJO COMPLETO:
//   Editor  → encodeHtml()  → BASE DE DATOS   (texto plano con tokens)
//   BD      → decodeHtml()  → Pantalla/página  (HTML semántico)
//
// REGLA DE NOMENCLATURA:
//   Cada par de tokens: [NOMBRE_START] para apertura, [NOMBRE_FINAL] para cierre.
//   Excepción: [BR] no tiene par porque es un elemento vacío (no envuelve contenido).
// ─────────────────────────────────────────────────────────────────────────

// ── TOKEN_MAP — tabla maestra ──────────────────────────────────────────
//
// Cada entrada del array tiene tres campos:
//
//   token      → el nombre del token (sin corchetes).
//                En la BD se guarda como [BOLD_START], [BOLD_FINAL], etc.
//
//   encodeFrom → expresión regular (RegExp) que busca el tag HTML en el editor.
//                Se aplica al HTML crudo que genera el contentEditable del navegador.
//
//   decodeTo   → el HTML que se genera al decodificar (reversión del token).
//                Debe ser HTML semántico válido, sin atributos inline peligrosos.
//
// ORDEN IMPORTANTE EN ENCODE:
//   Las reglas se aplican en orden de arriba hacia abajo.
//   Las más específicas DEBEN ir primero.
//   Ejemplo: HIGHLIGHT_START antes de SPAN_START, porque <span style="background-color:yellow">
//   también matchea el regex genérico de span. Si SPAN_START fuera primero,
//   capturaría el highlight como span genérico y perdería la información de color.
//
// ORDEN EN DECODE:
//   No importa, porque cada token [NOMBRE] es único y no hay ambigüedad.

export const TOKEN_MAP = Object.freeze([

  // ─────────────────────────────────────────────────────────────────────
  // CATEGORÍA 1: FORMATO DE TEXTO INLINE
  // Tags que van dentro de un párrafo para dar estilo a palabras o frases.
  // ─────────────────────────────────────────────────────────────────────

  // ── HIGHLIGHT (resaltado amarillo) ────────────────────────────────────
  // El editor genera:  <span style="background-color: yellow;">texto</span>
  // Guardamos como:    [HIGHLIGHT_START]texto[HIGHLIGHT_FINAL]
  // Recuperamos como:  <mark style="background:yellow">texto</mark>
  //
  // ⚠ IMPORTANTE: HIGHLIGHT tiene su propio par de cierre [HIGHLIGHT_FINAL]
  //   porque al decodificar genera <mark>, no <span>.
  //   Si usáramos [SPAN_FINAL] para cerrarlo, el HTML resultante sería:
  //   <mark>texto</span>  ← HTML ROTO (apertura mark, cierre span).
  //   Con [HIGHLIGHT_FINAL] → <mark>texto</mark> ← HTML correcto.
  //
  // ⚠ DEBE IR PRIMERO: antes que el regex genérico de SPAN_START,
  //   porque ambos capturan elementos <span>, pero este es más específico.
  {
    token:      'HIGHLIGHT_START',
    encodeFrom: /(<span[^>]*background-color:\s*yellow[^>]*>)/gi,
    decodeTo:   '<mark style="background:yellow">',
  },
  {
    // Par de cierre exclusivo para highlight.
    // Captura el </span> que cierra el highlight.
    // ⚠ Este regex captura TODOS los </span>, igual que SPAN_FINAL.
    //   La diferencia está en el decodeTo: este produce </mark>.
    //   El orden de decodificación no importa porque los tokens son únicos.
    //
    // PERO en encode sí hay que tener cuidado: si un highlight tiene un span
    // anidado dentro, el primer </span> que encuentre cerraría el highlight.
    // En la práctica el editor no genera eso, así que es seguro.
    token:      'HIGHLIGHT_FINAL',
    encodeFrom: null,    // ← null = no se usa en encode (solo en decode)
    decodeTo:   '</mark>',
  },

  // ── SPAN GENÉRICO ────────────────────────────────────────────────────
  // El editor a veces envuelve texto en <span> con atributos de estilo.
  // Guardamos el contenido pero eliminamos los atributos peligrosos.
  // Ejemplo: <span style="font-size:200px;color:red"> → [SPAN_START]
  {
    token:      'SPAN_START',
    encodeFrom: /<span[^>]*>/gi,   // captura <span> con cualquier atributo
    decodeTo:   '<span>',          // al decodificar: span sin atributos (seguro)
  },
  {
    token:      'SPAN_FINAL',
    encodeFrom: /<\/span>/gi,
    decodeTo:   '</span>',
  },

  // ── NEGRITA ──────────────────────────────────────────────────────────
  // El editor puede generar <b> (antiguo) o <strong> (semántico moderno).
  // También puede generar <b style="color:rgb(58,10,10)"> con estilos inline.
  // Unificamos ambos en [BOLD_START] y al decodificar siempre producimos <strong>.
  {
    token:      'BOLD_START',
    encodeFrom: /<(b|strong)[^>]*>/gi,   // captura <b> y <strong> con cualquier atributo
    decodeTo:   '<strong>',
  },
  {
    token:      'BOLD_FINAL',
    encodeFrom: /<\/(b|strong)>/gi,      // captura </b> y </strong>
    decodeTo:   '</strong>',
  },

  // ── CURSIVA ───────────────────────────────────────────────────────────
  // El editor genera <i> (antiguo) o <em> (semántico moderno).
  // Unificamos en [ITALIC_START] → decodificamos a <em>.
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
  // El editor genera <u>. Sin atributos problemáticos.
  //
  // ⚠ BUG ORIGINAL CORREGIDO: El regex anterior era /<u[^>]*>/gi
  //   Ese regex también matcheaba <ul class="doc-ul"> porque <ul> empieza con 'u'.
  //   Consecuencia: las listas se convertían en [UNDER_START] en lugar de [UL_START].
  //
  //   CORRECCIÓN: usar /<u(?!l)[^>]*>/gi
  //   La parte (?!l) es un "negative lookahead" — significa "u que NO va seguida de l".
  //   Así <u> matchea pero <ul> no.
  {
    token:      'UNDER_START',
    encodeFrom: /<u(?!l)[^>]*>/gi,  // ← (?!l) evita capturar <ul>
    decodeTo:   '<u>',
  },
  {
    token:      'UNDER_FINAL',
    encodeFrom: /<\/u(?!l)>/gi,     // ← (?!l) evita capturar </ul>
    decodeTo:   '</u>',
  },

  // ── TACHADO ──────────────────────────────────────────────────────────
  // El editor genera <s> o <del>. Unificamos en [STRIKE_START].
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

  // ─────────────────────────────────────────────────────────────────────
  // CATEGORÍA 2: LISTAS
  // ─────────────────────────────────────────────────────────────────────

  // ── LISTA DE VIÑETAS (ul) ─────────────────────────────────────────────
  // Al decodificar agregamos la clase doc-ul del sistema de estilos.
  // Así el HTML recuperado ya tiene los estilos institucionales.
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

  // ── LISTA NUMERADA (ol) ───────────────────────────────────────────────
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

  // ── ELEMENTO DE LISTA (li) ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────
  // CATEGORÍA 3: BLOQUES DE ESTRUCTURA
  // Tags que el contentEditable genera automáticamente al pulsar Enter.
  // ─────────────────────────────────────────────────────────────────────

  // ── PÁRRAFO ───────────────────────────────────────────────────────────
  // contentEditable genera <p> al crear párrafos nuevos.
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

  // ── DIV (bloque genérico) ──────────────────────────────────────────────
  // contentEditable a veces envuelve líneas en <div> en lugar de <p>.
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

  // ── SALTO DE LÍNEA (br) ────────────────────────────────────────────────
  // Elemento vacío — no tiene par de cierre.
  // El editor puede generar <br>, <br/> o <br />.
  // El regex captura las tres variantes.
  {
    token:      'BR',
    encodeFrom: /<br\s*\/?>/gi,
    decodeTo:   '<br>',
  },
])

// ─────────────────────────────────────────────────────────────────────────
// encodeHtml(htmlStr) — convierte HTML crudo a tokens seguros para la BD
// ─────────────────────────────────────────────────────────────────────────
//
// PROCESO PASO A PASO:
//   1. Recorre TOKEN_MAP de arriba hacia abajo.
//   2. Por cada entrada, aplica el regex encodeFrom sobre el texto actual.
//   3. Reemplaza cada match por [TOKEN_NAME].
//   4. Al final, elimina cualquier tag HTML que haya escapado las reglas anteriores.
//      Esto es la "red de seguridad" contra tags no conocidos como <script>, <iframe>.
//
// EJEMPLO:
//   Entrada:  "El <b style='color:red'>texto</b> importante"
//   Paso 1:   encuentra <b ...> → reemplaza por [BOLD_START]
//   Paso 2:   encuentra </b>   → reemplaza por [BOLD_FINAL]
//   Paso 4:   no hay tags restantes
//   Salida:   "El [BOLD_START]texto[BOLD_FINAL] importante"
export function encodeHtml(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return ''
  let result = htmlStr

  // Aplicar cada regla del TOKEN_MAP en orden
  for (const { token, encodeFrom } of TOKEN_MAP) {
    // Saltar entradas que no tienen encodeFrom (como HIGHLIGHT_FINAL)
    // Solo existe en el TOKEN_MAP para el decode, no para el encode.
    if (!encodeFrom) continue
    result = result.replace(encodeFrom, `[${token}]`)
  }

  // ── Red de seguridad (OWASP A03 - Injection) ──────────────────────────
  // Elimina cualquier tag HTML que no haya sido capturado por las reglas anteriores.
  // Ejemplos de tags peligrosos que esto bloquea:
  //   <script>alert('xss')</script>    → ""
  //   <iframe src="evil.com">          → ""
  //   <img onerror="alert(1)" src="">  → ""
  result = result.replace(/<[^>]+>/g, '')

  return result
}

// ─────────────────────────────────────────────────────────────────────────
// decodeHtml(tokenStr) — convierte tokens de la BD a HTML para mostrar
// ─────────────────────────────────────────────────────────────────────────
//
// PROCESO:
//   1. Recorre TOKEN_MAP.
//   2. Por cada entrada, busca el patrón [TOKEN_NAME] en el texto.
//   3. Lo reemplaza por el HTML de decodeTo.
//
// REVERSIBILIDAD:
//   decodeHtml(encodeHtml("<b>hola</b>"))
//   = decodeHtml("[BOLD_START]hola[BOLD_FINAL]")
//   = "<strong>hola</strong>"
//   No es idéntico al HTML original, pero es semánticamente equivalente y más limpio.
export function decodeHtml(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') return ''
  let result = tokenStr

  for (const { token, decodeTo } of TOKEN_MAP) {
    // Escapar los corchetes para que sean literales en la RegExp
    // (en regex, [ y ] tienen significado especial, hay que escaparlos con \)
    const pattern = new RegExp(`\\[${token}\\]`, 'g')
    result = result.replace(pattern, decodeTo)
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────
// sanitizePlain(htmlStr) — extrae solo el texto, sin ningún HTML
// ─────────────────────────────────────────────────────────────────────────
//
// Para títulos (h1, h2, h3) que no admiten formato rico.
// Elimina absolutamente todo el HTML y decodifica entidades HTML.
//
// EJEMPLO:
//   "<b>Título</b> importante" → "Título importante"
//   "Precio: &amp;1,000"       → "Precio: &1,000"
export function sanitizePlain(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return ''
  return htmlStr
    .replace(/<[^>]+>/g, '')    // eliminar todos los tags HTML
    .replace(/&nbsp;/g,  ' ')   // espacio no rompible → espacio normal
    .replace(/&amp;/g,   '&')   // & escapado → &
    .replace(/&lt;/g,    '<')   // < escapado → <
    .replace(/&gt;/g,    '>')   // > escapado → >
    .replace(/&quot;/g,  '"')   // " escapado → "
    .trim()
}

// ─────────────────────────────────────────────────────────────────────────
// htmlFromTokens(tokenStr) — alias de decodeHtml para generar páginas web
// ─────────────────────────────────────────────────────────────────────────
// Usa el mismo proceso que decodeHtml.
// Separado como función propia para mayor claridad en el código que genera HTML.
export function htmlFromTokens(tokenStr) {
  return decodeHtml(tokenStr)
}
