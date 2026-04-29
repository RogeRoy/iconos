// VisorDocumento.jsx — v2
// ─────────────────────────────────────────────────────────
// PANTALLA DE VISUALIZACIÓN PÚBLICA DEL BOLETÍN
//
// Muestra el documento como una página web limpia:
//   ✅ Sin bordes de segmentos ni subsegmentos
//   ✅ Sin márgenes extra entre secciones
//   ✅ Responsive: funciona en desktop, tablet y celular
//   ✅ Decodifica section_css (índices → clases CSS)
//   ✅ Decodifica section_format (tokens → HTML formateado)
//
// DIFERENCIA CON EL PANEL PREVIEW DEL BUILDER:
//   El preview del builder muestra bordes punteados, badges "SEG-1",
//   indicadores de columnas y botones de edición — todo para ayudar
//   al editor a entender la estructura.
//   Este visor no muestra NADA de eso. Es lo que ve el ciudadano.
// ─────────────────────────────────────────────────────────
import { useState, useCallback } from 'react'
import { decodeCssFromIndex } from '../utils/cssTokens'
import { decodeHtml }         from '../utils/htmlTokens'

// ══════════════════════════════════════════════════════════
// HARDCODE DE DESARROLLO
// ══════════════════════════════════════════════════════════
// Token JWT — mismo que api.js. Cambiar aquí si expira.
const TOKEN   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJtaWxsYSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzQ3NTQyNywiZXhwIjoxNzc3NTA0MjI3fQ.sQxW0L6uH1Ln5mTMCk5_OIzHQvvf2564RRdVA0HxUuo'
const BASE_URL = 'http://localhost:3001'

// ══════════════════════════════════════════════════════════
// CSS DEL DOCUMENTO PUBLICADO
// ══════════════════════════════════════════════════════════
// Estilos que aplican SOLO dentro de .visor-body.
// Son los mismos del sistema, pero sin ningún marcador de edición.
// Se usan media queries aquí también para que el texto
// se adapte a pantallas pequeñas.
const DOC_STYLES = `
/* ══ Estilos del documento publicado ══════════════════════════
   Idénticos al panel preview del builder para coherencia visual.
   Más estilos de los tokens decodificados (strong, em, u, mark, s)
   ═══════════════════════════════════════════════════════════ */

/* ── Contenedor principal ── */
.visor-body {
  font-family: 'Noto Sans', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #1a1a1a;
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 22px 60px;
}

/* ── Títulos (idénticos al PreviewPanel) ── */
.doc-h1 { font-family: Georgia,serif; font-size: 22px; font-weight: 900; color: #611232; margin: 0 0 10px; }
.doc-h2 { font-family: Georgia,serif; font-size: 17px; font-weight: 700; color: #9b2247; margin: 0 0 8px; }
.doc-h3 { font-family: 'Noto Sans',sans-serif; font-size: 13px; font-weight: 700; color: #1e5b4f; text-transform: uppercase; letter-spacing: .05em; margin: 0 0 6px; }

/* Variante con Noto Sans (selector de fuente) */
.noto-sans { font-family: 'Noto Sans', sans-serif !important; }
.patria    { font-family: Georgia, serif !important; }

/* ── Párrafo ── */
.doc-p { font-size: 14px; color: #222; margin: 0 0 8px; line-height: 1.7; }

/* ── Listas ── */
.doc-ul { padding-left: 20px; margin: 0 0 8px; }
.doc-ul li::marker { color: #a57f2c; }
.doc-ol { padding-left: 22px; margin: 0 0 8px; }
.doc-ol li::marker { color: #1e5b4f; font-weight: 700; }

/* ── Aviso importante (highlight) ── */
.doc-highlight { background: #fffde7; border-left: 4px solid #f9a825; padding: 10px 14px; border-radius: 4px; margin: 0 0 8px; color: #5f4700; font-size: 13px; display: flex; gap: 8px; align-items: flex-start; }

/* ── Nota al margen ── */
.doc-note { border-left: 4px solid #611232; padding: 8px 14px; background: #fdf5f7; border-radius: 0 4px 4px 0; margin: 0 0 8px; font-style: italic; color: #333; }

/* ── Separador ── */
.doc-hr { border: none; border-top: 2px solid #d0b090; margin: 12px 0; }

/* ── Links ── */
.doc-url    { color: #1e5b4f; font-weight: 600; text-decoration: underline; font-size: 13px; }
.doc-mailto { color: #880e4f; font-weight: 600; text-decoration: underline; font-size: 13px; }

/* ── Imagen ── */
.doc-img-full { max-width: 100%; display: block; border-radius: 4px; margin: 4px 0; }
.img-left   { margin-right: auto; }
.img-center { margin: 0 auto; }
.img-right  { margin-left: auto; }

/* ── Alineación ── */
.text-left    { text-align: left; }
.text-center  { text-align: center; }
.text-right   { text-align: right; }
.text-justify { text-align: justify; }

/* ── Formatos inline decodificados de los tokens ── */
/* Estos vienen de decodeHtml(): [BOLD_START] → <strong>, etc. */
.visor-body strong { font-weight: 700; color: inherit; }
.visor-body em     { font-style: italic; }
.visor-body u      { text-decoration: underline; }
.visor-body s      { text-decoration: line-through; }
.visor-body mark   { background: yellow; padding: 0 2px; border-radius: 2px; }

/* ── Grid de columnas (sin bordes ni márgenes extra) ── */
.visor-cols   { display: grid; gap: 16px; margin: 0; padding: 0; }
.visor-cols-2 { grid-template-columns: 1fr 1fr; }
.visor-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
.visor-col    { padding: 0; margin: 0; min-width: 0; }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .visor-body { font-size: 13px; padding: 16px 16px 48px; }
  .doc-h1 { font-size: 19px; }
  .doc-h2 { font-size: 15px; }
  .visor-cols-2 { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .visor-body { font-size: 13px; padding: 12px 12px 40px; }
  .visor-cols-2, .visor-cols-3 { grid-template-columns: 1fr; }
}
`

// ══════════════════════════════════════════════════════════
// renderSeccion — convierte una fila de la BD a HTML
// ══════════════════════════════════════════════════════════
// PARÁMETROS:
//   sec → objeto con los campos de bulletin_sections
//
// DECODIFICACIÓN INVERSA:
//   1. section_css:    "1,22"  → decodeCssFromIndex → "doc-h1 text-center"
//      También acepta clases directas "doc-h1 text-center" (datos legacy)
//   2. section_format: "[BOLD_START]texto[BOLD_FINAL]" → decodeHtml → "<strong>texto</strong>"
//      También acepta texto plano, alineaciones legacy y tags legacy
function renderSeccion(sec) {
  // Omitir secciones inactivas (section_status = false)
  if (!sec.section_status) return ''

  const tag = sec.section_htmltag || 'div'

  // ── Paso 1: Decodificar section_css a clases CSS ──────────────────
  // El campo puede tener dos formatos según cuándo se guardó:
  //   Formato nuevo:   "1,22"               → decodeCssFromIndex → "doc-h1 text-center"
  //   Formato legacy:  "doc-h1 text-center" → ya son clases, usar directo
  let clases = ''
  const cssRaw = (sec.section_css || '').trim()
  if (cssRaw) {
    // Si solo contiene dígitos y comas → son índices del mapa
    if (/^[\d,\s]+$/.test(cssRaw)) {
      clases = decodeCssFromIndex(cssRaw)
    } else {
      // Ya son clases en texto
      clases = cssRaw
    }
  }

  // ── Paso 2: Determinar alineación ─────────────────────────────────
  // La alineación puede venir de:
  //   a) section_format = "center" | "left" | "right" | "justify" (datos legacy)
  //   b) Ya está en section_css como clase "text-center"
  const ALINEACIONES = ['left','center','right','justify']
  const alineacion = ALINEACIONES.includes(sec.section_format)
    ? sec.section_format : null
  const styleAlign = alineacion ? `text-align:${alineacion};` : ''

  // ── Paso 3: Decodificar section_format a HTML ──────────────────────
  // Puede ser:
  //   a) Tokens:     "[BOLD_START]texto[BOLD_FINAL]" → decodeHtml → HTML formateado
  //   b) Alineación: "center" (ya tratado arriba)
  //   c) Tag legacy: "h1", "p", "img" → ignorar, usar section_content
  //   d) HTML sucio: "<div ...>" → limpiar tags peligrosos
  const fmt = sec.section_format || ''
  const TAGS_VALIDOS = ['h1','h2','h3','p','ul','ol','div','a','img','hr','blockquote','ul-ol','span','footer','table']

  let contenidoFormateado = ''
  if (fmt.includes('[') && fmt.includes(']')) {
    // Tiene tokens — decodificar completamente
    contenidoFormateado = decodeHtml(fmt)
  } else if (ALINEACIONES.includes(fmt) || TAGS_VALIDOS.includes(fmt)) {
    // Es solo una alineación o un tag — no es contenido real
    // Usar section_content como contenido
    contenidoFormateado = ''
  } else if (fmt.trim()) {
    // Es texto (posiblemente con HTML inline legacy) — limpiar tags peligrosos
    contenidoFormateado = fmt.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                             .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
  }

  // El contenido final: el formateado si existe, si no el plano
  const contenido = contenidoFormateado || sec.section_content || ''

  // ── Paso 4: Renderizar el elemento HTML ──────────────────────────
  const cls   = clases ? `class="${clases}"` : ''
  const style = styleAlign ? `style="${styleAlign}"` : ''

  switch (tag) {
    case 'h1': return `<h1 ${cls} ${style}>${sec.section_content}</h1>\n`
    case 'h2': return `<h2 ${cls} ${style}>${sec.section_content}</h2>\n`
    case 'h3': return `<h3 ${cls} ${style}>${sec.section_content}</h3>\n`

    case 'p':
      return `<p ${cls} ${style}>${contenido}</p>\n`

    case 'div':
      // Si tiene clase doc-highlight → aviso con ícono ⚠
      if (clases.includes('doc-highlight')) {
        return `<div ${cls} ${style}><span style="font-size:18px;flex-shrink:0;line-height:1.4">⚠</span><div style="flex:1">${contenido}</div></div>\n`
      }
      return `<div ${cls} ${style}>${contenido}</div>\n`

    case 'blockquote':
      return `<blockquote ${cls} ${style}>${contenido}</blockquote>\n`

    case 'ul':
    case 'ul-ol':
      // El contenido ya tiene los tokens decodificados como <ul><li>...</li></ul>
      return `<div ${cls} ${style}>${contenido}</div>\n`

    case 'ol':
      return `<div ${cls} ${style}>${contenido}</div>\n`

    case 'hr':
      return `<hr ${cls}>\n`

    case 'img': {
      // Determinar el src de la imagen:
      //   1. resource_desc con URL relativa del front (/assets/section_images/...)
      //   2. resource_desc con URL http
      //   3. section_content como fallback
      const desc    = sec.resource_desc || ''
      const content = sec.section_content || ''
      let imgSrc    = ''

      if (desc.startsWith('/') || desc.startsWith('http')) {
        imgSrc = desc                                        // URL limpia
      } else if (content.startsWith('/') || content.startsWith('http')) {
        imgSrc = content
      } else if (desc) {
        // Nombre de archivo — construir ruta del front
        imgSrc = `/assets/section_images/${sec.bull_id}/${desc}`
      } else if (content) {
        imgSrc = `/assets/section_images/${sec.bull_id}/${content}`
      }

      return imgSrc
        ? `<img src="${imgSrc}" alt="${content}" ${cls} ${style}>\n`
        : `<div style="background:#f5f5f5;border:1px dashed #ccc;padding:12px;text-align:center;color:#aaa;border-radius:6px">📷 ${content}</div>\n`
    }

    case 'a': {
      // Link: resource_desc = URL real, section_content = texto visible o URL
      const href   = sec.resource_desc || sec.section_content || '#'
      const texto  = sec.section_content || href
      const esMail = clases.includes('doc-mailto') || (href.includes('@') && !href.startsWith('http'))

      if (esMail) {
        return `<div ${style}><a class="doc-mailto" href="mailto:${href}">${texto}</a></div>\n`
      }
      return `<div ${style}><a class="doc-url" href="${href}" target="_blank" rel="noopener noreferrer">${texto}</a></div>\n`
    }

    default:
      return contenido ? `<div ${cls} ${style}>${contenido}</div>\n` : ''
  }
}

// ══════════════════════════════════════════════════════════
// construirHtmlDocumento
// ══════════════════════════════════════════════════════════
// Convierte el array plano de secciones al HTML final del documento.
// CLAVE: no agrega ningún wrapper visible de segmento/subsegmento.
// Los segmentos con múltiples subsegmentos usan grid CSS puro sin bordes.
function construirHtmlDocumento(secciones) {
  if (!secciones || !secciones.length) return ''

  // 1. Filtrar solo las activas y ordenar por segmento → orden
  const activas = secciones
    .filter(s => s.section_status !== false)
    .sort((a, b) =>
      a.section_segment !== b.section_segment
        ? a.section_segment - b.section_segment
        : a.section_order  - b.section_order
    )

  // 2. Agrupar por segmento
  const mapSegmentos = new Map()
  activas.forEach(sec => {
    const k = sec.section_segment
    if (!mapSegmentos.has(k)) mapSegmentos.set(k, [])
    mapSegmentos.get(k).push(sec)
  })

  let html = ''

  // 3. Renderizar cada segmento
  mapSegmentos.forEach(items => {
    // Obtener los subsegmentos distintos (> 0)
    const subsNums = [...new Set(items.map(s => s.section_subsegment))].filter(n => n > 0).sort()

    if (subsNums.length > 1) {
      // ── Segmento con columnas ──────────────────────────────────────
      // Usar clase CSS visor-cols-N para el grid.
      // SIN bordes, SIN fondos, SIN márgenes extra entre columnas.
      const cols = Math.min(subsNums.length, 3)
      html += `<div class="visor-cols visor-cols-${cols}">\n`

      subsNums.forEach(subNum => {
        const itemsSub = items
          .filter(s => s.section_subsegment === subNum)
          .sort((a, b) => a.section_order - b.section_order)
        // Cada columna es un div simple, sin estilos extra
        html += `<div class="visor-col">${itemsSub.map(renderSeccion).join('')}</div>\n`
      })

      html += `</div>\n`

      // Secciones directas del segmento (subsegment = 0) van después del grid
      items
        .filter(s => s.section_subsegment === 0)
        .sort((a, b) => a.section_order - b.section_order)
        .forEach(s => { html += renderSeccion(s) })

    } else {
      // ── Segmento simple (sin columnas) ────────────────────────────
      // Renderizar directo, sin ningún wrapper extra
      items.forEach(s => { html += renderSeccion(s) })
    }
  })

  return html
}

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — VisorDocumento
// ══════════════════════════════════════════════════════════
export default function VisorDocumento({ onVolver }) {
  const [bulletinId,   setBulletinId]   = useState('')
  const [secciones,    setSecciones]    = useState(null)
  const [cargando,     setCargando]     = useState(false)
  const [error,        setError]        = useState('')
  const [bullIdActual, setBullIdActual] = useState(null)

  // Llamar a GET /bulletin/sections/{id}
  const buscarContenido = useCallback(async () => {
    const id = parseInt(bulletinId, 10)
    if (!id || id <= 0) {
      setError('Por favor ingresa un número de boletín válido (número entero positivo).')
      return
    }
    setCargando(true); setError(''); setSecciones(null)

    try {
      console.log(`[VISOR] GET ${BASE_URL}/bulletin/sections/${id}`)

      const res = await fetch(`${BASE_URL}/bulletin/sections/${id}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'accept': '*/*' }
      })

      // Manejo de errores HTTP
      if (!res.ok) {
        if (res.status === 401) throw new Error('Tu sesión expiró. Actualiza el TOKEN en VisorDocumento.jsx.')
        if (res.status === 403) throw new Error('No tienes permiso para ver este boletín.')
        if (res.status === 404) throw new Error(`No se encontró el boletín con ID ${id}.`)
        throw new Error(`Error del servidor: código ${res.status}`)
      }

      const data = await res.json()

      // El response puede venir como { data: [...] } o directo como [...]
      const lista = Array.isArray(data) ? data : (data.data || [])

      console.log(`[VISOR] Boletín ${id}: ${lista.length} secciones`, lista)

      setSecciones(lista)
      setBullIdActual(id)

    } catch (err) {
      const msg = err.message || 'No se pudo conectar con el servidor.'
      setError(`Hubo un problema al obtener el boletín. ${msg}`)
      console.error('[VISOR] Error completo:', err)
    } finally {
      setCargando(false)
    }
  }, [bulletinId])

  const htmlDocumento = secciones ? construirHtmlDocumento(secciones) : ''

  return (
    <div style={{ minHeight:'100vh', background:'#faf8f5', fontFamily:"'Noto Sans',sans-serif" }}>
      {/* Inyectar el CSS del documento */}
      <style>{DOC_STYLES}</style>

      {/* ── Barra de navegación ─────────────────────────────── */}
      <div style={{
        background: '#611232',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: '16px',
        height: '52px',
        boxShadow: '0 3px 14px rgba(97,18,50,.4)',
        position: 'sticky', top: 0, zIndex: 100,
        flexWrap: 'wrap',
      }}>
        <button onClick={onVolver} style={{
          background: 'transparent',
          border: '1.5px solid rgba(230,209,148,.45)',
          color: '#e6d194',
          borderRadius: '7px',
          padding: '6px 14px',
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '6px',
          whiteSpace: 'nowrap',
        }}>
          ← Volver al Builder
        </button>

        <div style={{ width:'1px', height:'24px', background:'rgba(255,255,255,.2)', flexShrink:0 }}/>

        <span style={{ color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>
          📰 Visualizador de Boletines
        </span>

        {bullIdActual && (
          <span style={{
            background: 'rgba(165,127,44,.3)',
            color: '#e6d194',
            fontSize: '11px', fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '100px',
            border: '1px solid rgba(165,127,44,.5)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Boletín #{bullIdActual}
          </span>
        )}
      </div>

      {/* ── Panel de búsqueda ───────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e0d8', padding:'18px 24px', boxSizing:'border-box' }}>
        <div style={{
          maxWidth: '860px', margin: '0 auto',
          display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px', fontWeight: 700,
              color: '#611232',
              textTransform: 'uppercase', letterSpacing: '.05em',
              marginBottom: '6px',
            }}>
              Número de Boletín (ID)
            </label>
            <input
              type="number" min="1"
              value={bulletinId}
              onChange={e => setBulletinId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarContenido()}
              placeholder="Ej: 1"
              style={{
                width: '100%', padding: '9px 14px',
                border: '2px solid #d0b090', borderRadius: '8px',
                fontSize: '15px', fontFamily: 'inherit', outline: 'none',
                transition: 'border-color .15s', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#611232'}
              onBlur={e  => e.target.style.borderColor = '#d0b090'}
            />
          </div>

          <button
            onClick={buscarContenido}
            disabled={cargando}
            style={{
              background: cargando ? '#9b2247' : '#611232',
              color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 22px',
              fontSize: '14px', fontWeight: 700,
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'background .15s',
              whiteSpace: 'nowrap',
            }}
          >
            {cargando ? '⏳ Buscando...' : '🔍 Buscar Contenido'}
          </button>
        </div>

        {/* Error de búsqueda */}
        {error && (
          <div style={{
            maxWidth: '860px', margin: '12px auto 0',
            background: '#fdf0f0', border: '1.5px solid #e8a0a0',
            borderRadius: '8px', padding: '12px 16px',
            color: '#8b2020', fontSize: '13px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{ fontSize:'18px', flexShrink:0 }}>⚠</span>
            <span style={{ flex:1 }}>{error}</span>
            <button onClick={() => setError('')} style={{
              background:'none', border:'none', color:'#8b2020',
              cursor:'pointer', fontSize:'18px', padding:'0 4px', lineHeight:1,
            }}>✕</button>
          </div>
        )}
      </div>

      {/* ── Contenido del documento ─────────────────────────── */}
      <div>
        {/* Estado inicial — sin búsqueda */}
        {!secciones && !cargando && !error && (
          <div style={{ maxWidth:'860px', margin:'60px auto', textAlign:'center', color:'#bbb', padding:'0 24px' }}>
            <div style={{ fontSize:'64px', marginBottom:'16px' }}>📰</div>
            <p style={{ fontSize:'16px', margin:'0 0 8px', color:'#999' }}>
              Ingresa el ID del boletín y haz clic en "Buscar Contenido".
            </p>
            <p style={{ fontSize:'13px', color:'#ccc' }}>
              El documento se mostrará con todo su formato aplicado.
            </p>
          </div>
        )}

        {/* Sin resultados */}
        {secciones && secciones.length === 0 && (
          <div style={{ maxWidth:'860px', margin:'60px auto', textAlign:'center', color:'#bbb', padding:'0 24px' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>📭</div>
            <p>No se encontraron secciones activas para el boletín #{bullIdActual}.</p>
          </div>
        )}

        {/* Documento renderizado */}
        {secciones && secciones.length > 0 && (
          <div
            className="visor-body"
            dangerouslySetInnerHTML={{ __html: htmlDocumento }}
          />
        )}
      </div>
    </div>
  )
}
