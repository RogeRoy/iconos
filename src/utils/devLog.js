// devLog.js — Logger que aparece en AMBOS lados: browser Y terminal npm
// ─────────────────────────────────────────────────────────
// En desarrollo (npm run dev):
//   - console.log()  → aparece en el inspector del navegador
//   - fetch('/__devlog', ...) → aparece en la terminal de npm
//
// En producción:
//   - No hace nada (import.meta.env.DEV = false)
//
// USO:
//   import { devLog, devLogGroup } from '../utils/devLog'
//   devLog('TOKEN', 'section_html ANTES', htmlCrudo)
//   devLog('TOKEN', 'section_html DESPUÉS', htmlToken)
// ─────────────────────────────────────────────────────────

const IS_DEV = import.meta.env.DEV

// Colores para la consola del navegador
const COLORS = {
  TOKEN: '#1e5b4f',  // verde
  CSS:   '#a57f2c',  // dorado
  IMG:   '#611232',  // guinda
  GUARD: '#880e4f',  // rosa
  INFO:  '#555',
}

function enviarAlServidor(level, msg, data) {
  if (!IS_DEV) return
  // Fire and forget: no bloquear el flujo principal.
  // El .catch(() => {}) suprime el error 404 que aparece cuando
  // el plugin devLogPlugin de vite.config.js no está activo.
  // Esto evita el mensaje "POST /__devlog 404" en la consola.
  fetch('/__devlog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, msg, data }),
  }).catch(() => {})  // silencioso — 404 esperado si el plugin no está
}

// ── devLog(categoria, mensaje, dato) ─────────────────────
export function devLog(categoria, mensaje, dato) {
  if (!IS_DEV) return
  const color = COLORS[categoria] || COLORS.INFO
  const tag   = `%c[${categoria}]`
  const style = `color:${color};font-weight:700;font-family:monospace`

  // Consola del navegador
  if (dato !== undefined) {
    console.log(tag, style, mensaje, dato)
  } else {
    console.log(tag, style, mensaje)
  }

  // Terminal de npm (via fetch)
  const dataStr = dato !== undefined
    ? (typeof dato === 'string' ? dato : JSON.stringify(dato))
    : undefined
  enviarAlServidor('log', `[${categoria}] ${mensaje}`, dataStr)
}

// ── devLogGroup(categoria, items) ────────────────────────
// items = array de { label, valor }
// Agrupa varios valores bajo un título colapsable
export function devLogGroup(categoria, titulo, items) {
  if (!IS_DEV) return
  const color = COLORS[categoria] || COLORS.INFO
  console.groupCollapsed(`%c[${categoria}] ${titulo}`, `color:${color};font-weight:700;font-family:monospace`)
  items.forEach(({ label, valor }) => {
    console.log(`  ${label}:`, valor)
  })
  console.groupEnd()

  // Terminal npm: un solo mensaje con todo
  const resumen = items.map(({ label, valor }) =>
    `  ${label}: ${typeof valor === 'string' ? valor : JSON.stringify(valor)}`
  ).join('\n')
  enviarAlServidor('log', `[${categoria}] ${titulo}\n${resumen}`)
}

// ── devSeparator(titulo) ─────────────────────────────────
export function devSeparator(titulo) {
  if (!IS_DEV) return
  const linea = '═'.repeat(40)
  console.log(`%c${linea}\n  ${titulo}\n${linea}`, 'color:#611232;font-weight:700;font-family:monospace')
  enviarAlServidor('log', `\n${linea}\n  ${titulo}\n${linea}`)
}
