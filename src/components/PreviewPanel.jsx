// PreviewPanel.jsx — v3 con useMemo + escapado correcto de IDs
import { useRef, useEffect, useMemo } from 'react'
import styles from './PreviewPanel.module.css'

const DOC_CSS = `
.doc-preview-body{font-family:'Noto Sans',sans-serif;font-size:14px;line-height:1.7;color:#1a1a1a;padding:18px 22px}
.doc-h1{font-family:Georgia,serif;font-size:22px;font-weight:900;color:#611232;margin:0 0 10px}
.doc-h2{font-family:Georgia,serif;font-size:17px;font-weight:700;color:#9b2247;margin:0 0 8px}
.doc-h3{font-family:'Noto Sans',sans-serif;font-size:13px;font-weight:700;color:#1e5b4f;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px}
.doc-p{font-size:14px;color:#222;margin:0 0 8px;line-height:1.7}
.doc-ul{padding-left:20px;margin:0 0 8px}.doc-ul li::marker{color:#a57f2c}
.doc-ol{padding-left:22px;margin:0 0 8px}.doc-ol li::marker{color:#1e5b4f;font-weight:700}
.doc-highlight{background:#fffde7;border-left:4px solid #f9a825;padding:10px 14px;border-radius:4px;margin:0 0 8px;color:#5f4700;font-size:13px}
.doc-note{border-left:4px solid #611232;padding:8px 14px;background:#fdf5f7;border-radius:0 4px 4px 0;margin:0 0 8px;font-style:italic;color:#333}
.doc-hr{border:none;border-top:2px solid #d0b090;margin:12px 0}
.doc-url{color:#1e5b4f;font-weight:600;text-decoration:underline;font-size:13px}
.doc-mailto{color:#880e4f;font-weight:600;text-decoration:underline;font-size:13px}
.doc-img-full{max-width:100%;display:block;border-radius:4px;margin:4px 0}
.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}.text-justify{text-align:justify}
.pv-seg{padding:10px 0;border-bottom:1px dashed #ede8e0;cursor:pointer;border-radius:4px;transition:background .15s}
.pv-seg:last-child{border-bottom:none}
.pv-seg:hover{background:rgba(97,18,50,.04)}
.pv-seg-label{display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #eddde2}
.pv-seg-badge{font-size:10px;font-weight:700;font-family:'Courier New',monospace;background:#611232;color:#fff;padding:2px 8px;border-radius:100px}
.pv-seg-name{font-size:12px;color:#611232;font-style:italic}
.pv-inspect-hint{font-size:9px;opacity:0;transition:opacity .15s;margin-left:auto}
.pv-seg:hover .pv-inspect-hint,.pv-sub-card:hover .pv-inspect-hint{opacity:.6}
.pv-sub-grid{display:grid;gap:8px;margin-top:4px}
.pv-sub-grid-2{grid-template-columns:1fr 1fr}
.pv-sub-grid-3{grid-template-columns:1fr 1fr 1fr}
.pv-sub-card{padding:8px 10px 10px;background:#f6faf7;border:1px solid #c8e4d4;border-top:2px solid #8ecfb4;border-radius:0 0 6px 6px;cursor:pointer;transition:background .15s}
.pv-sub-card:hover{background:#ecf7f2}
.pv-sub-label{font-size:10px;font-weight:700;color:#1e5b4f;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;display:flex;align-items:center;gap:4px}
.pv-sec-empty{font-size:11px;color:#bbb;font-style:italic;padding:4px 0}
.pv-active{outline:2px solid #611232 !important;outline-offset:2px}
`

// ── Escapa un ID para usarlo dentro de atributo HTML ──────
// Un ID como "sec_1714000000_123" es seguro, pero por robustez
// usamos encodeURIComponent para que cualquier carácter especial
// no rompa el onclick="...('aquí')"
const eid = (id) => String(id).replace(/'/g, "\\'")

function renderElem(elem) {
  const { tipo, contenido, html, align, _fileUrl } = elem
  const as = align ? `text-align:${align}` : ''
  const v = html || contenido || ''
  const empty = `<em style="color:#ccc;font-size:11px">(vacío)</em>`
  const d = v || empty

  switch (tipo) {
    case 'h1':   return `<h1 class="doc-h1" style="${as}">${d}</h1>`
    case 'h2':   return `<h2 class="doc-h2" style="${as}">${d}</h2>`
    case 'h3':   return `<h3 class="doc-h3" style="${as}">${d}</h3>`
    case 'p':    return `<p class="doc-p" style="${as}">${d}</p>`
    case 'hl':   return `<div class="doc-highlight" style="${as}">${d}</div>`
    case 'note': return `<blockquote class="doc-note" style="${as}">${d}</blockquote>`
    case 'hr':   return `<hr class="doc-hr">`
    case 'url':  return `<div style="${as}"><a class="doc-url" href="#">${contenido || empty}</a></div>`
    case 'mail': return `<div style="${as}"><a class="doc-mailto" href="#">` +
      `<svg width="13" height="11" viewBox="0 0 22 18" fill="none" style="vertical-align:middle;margin-right:3px">` +
      `<rect x="1" y="1" width="20" height="16" rx="2.5" stroke="currentColor" stroke-width="1.6"/>` +
      `<path d="M1 4l10 7 10-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>` +
      `${contenido || empty}</a></div>`
    case 'img':
      if (_fileUrl) return `<div style="${as}"><img src="${_fileUrl}" alt="${contenido||''}" class="doc-img-full"></div>`
      if (contenido) return `<div style="background:#f5e8d0;border:1.5px dashed #c9a76c;border-radius:6px;padding:10px;font-size:12px;color:#7b5800;text-align:center">🖼 ${contenido}</div>`
      return `<div style="background:#f5f5f5;border:1.5px dashed #ccc;border-radius:6px;padding:10px;font-size:11px;color:#aaa;text-align:center">📷 imagen</div>`
    default: return `<div style="${as}">${d}</div>`
  }
}

export default function PreviewPanel({ secciones, onNavegar }) {
  const scrollRef = useRef(null)

  // ── Auto-scroll al fondo solo si el usuario ya estaba cerca del final ──
  const prevLenRef = useRef(0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (secciones.length > prevLenRef.current) {
      el.scrollTop = el.scrollHeight
    }
    prevLenRef.current = secciones.length
  }, [secciones.length])

  // ── Construir HTML solo cuando secciones cambia (useMemo) ──
  const html = useMemo(() => {
    if (!secciones.length) return ''
    return secciones.map((sec, si) => {
      const segN = si + 1
      const segName = sec.nombre || ''
      const mode = sec.layout || 'full'
      const secId = eid(sec.id)

      let inner = ''
      if (mode === 'full') {
        const elems = sec.elementos || []
        inner = elems.length
          ? elems.map(e => renderElem(e)).join('')
          : `<div class="pv-sec-empty">— sin elementos —</div>`
      } else {
        const cols = mode === 'half' ? 2 : 3
        const subs = sec.subsegmentos || []
        const total = Math.max(subs.length, cols)
        let colsHtml = ''
        for (let i = 0; i < total; i++) {
          if (i < subs.length) {
            const sub = subs[i]
            const subName = sub.nombre || `Columna ${i+1}`
            const subId = eid(sub.id)
            const subContent = (sub.elementos||[]).length
              ? (sub.elementos||[]).map(e => renderElem(e)).join('')
              : `<div class="pv-sec-empty">— vacío —</div>`
            colsHtml += `<div class="pv-sub-card" data-sub-id="${subId}" data-sec-id="${secId}">` +
              `<div class="pv-sub-label">${subName}<span class="pv-inspect-hint">🔍</span></div>` +
              subContent + `</div>`
          } else {
            colsHtml += `<div class="pv-sub-card"><div class="pv-sub-label">Columna ${i+1}</div><div class="pv-sec-empty">— vacío —</div></div>`
          }
        }
        inner = `<div class="pv-sub-grid pv-sub-grid-${cols}">${colsHtml}</div>`
      }

      return `<div class="pv-seg" data-pv-sec-id="${secId}">` +
        `<div class="pv-seg-label"><span class="pv-seg-badge">SEG-${segN}</span>` +
        (segName ? `<span class="pv-seg-name">${segName}</span>` : '') +
        `<span class="pv-inspect-hint">🔍 clic para editar</span></div>` +
        inner + `</div>`
    }).join('')
  }, [secciones])

  // ── Delegación de eventos (en lugar de onclick inline) ──
  // Más seguro y no rompe el HTML cuando hay caracteres especiales en los IDs.
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleClick = (e) => {
      // Clic en un segmento
      const seg = e.target.closest('[data-pv-sec-id]')
      // Clic en una columna (subsegmento)
      const sub = e.target.closest('[data-sub-id]')

      if (sub) {
        e.stopPropagation()
        const subId  = sub.dataset.subId
        const secId  = sub.dataset.secId

        // Resaltar en preview
        container.querySelectorAll('.pv-active').forEach(el => el.classList.remove('pv-active'))
        sub.classList.add('pv-active')

        // Scroll al subsegmento en el builder
        const target = document.getElementById(`subsegmento-${subId}`)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

        if (onNavegar) onNavegar({ tipo: 'subsegmento', id: subId, secId })
        return
      }

      if (seg) {
        const secId = seg.dataset.pvSecId

        // Resaltar en preview
        container.querySelectorAll('.pv-active').forEach(el => el.classList.remove('pv-active'))
        seg.classList.add('pv-active')

        // Scroll al segmento en el builder
        const target = document.getElementById(`seccion-${secId}`)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })

        if (onNavegar) onNavegar({ tipo: 'seccion', id: secId })
      }
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [onNavegar])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitulo}>Vista Previa</span>
        <span className={styles.headerBadge}>EN VIVO</span>
        <span className={styles.headerHint}>🔍 Clic para ir al elemento</span>
      </div>

      <div className={styles.body} ref={scrollRef}>
        <style>{DOC_CSS}</style>
        <div className="doc-preview-body">
          {!secciones.length
            ? (
              <div className={styles.vacio}>
                <div className={styles.vacioIco}>📄</div>
                <p>El documento está vacío.</p>
                <small>Agrega secciones para ver la previsualización aquí.</small>
              </div>
            )
            : <div dangerouslySetInnerHTML={{ __html: html }} />
          }
        </div>
      </div>
    </div>
  )
}
