import { useState, useRef, useCallback, useEffect } from 'react'
import Section from './Section'
import styles from './BuilderPanel.module.css'
import { findType } from './editor/elementTypes'
import { useGuardarBoletin } from '../hooks/useGuardarBoletin'

function buildJson(secciones) {
  const sections = []; let order = 1
  secciones.forEach((sec, si) => {
    const segN = si + 1; const segName = sec.nombre || `SEG-${segN}`; const layout = sec.layout || 'full'
    const makeRow = (elem, subN, subName) => {
      const info = findType(elem.tipo)
      let path_id = null, path_desc = null
      if (elem.tipo === 'url'  && elem.contenido) { path_id = 0; path_desc = elem.contenido }
      if (elem.tipo === 'mail' && elem.contenido) { path_id = 0; path_desc = `mailto:${elem.contenido}` }
      if (elem.tipo === 'img'  && elem.contenido) { path_id = 0; path_desc = elem.contenido }
      return {
        section_order: order++, section_segment: segN, section_subsegment: subN,
        seg_name: segName, sub_name: subN > 0 ? (subName || `Columna ${subN}`) : null,
        type: elem.tipo, align: elem.align || info.defAlign || '',
        section_css: elem.cssClases || info.cssClases || '',
        section_html: elem.html || info.htmlTag || 'div',
        section_content: elem.contenido || '', path_id, path_desc,
      }
    }
    if (layout === 'full') {
      (sec.elementos || []).forEach(e => sections.push(makeRow(e, 0, null)))
    } else {
      ;(sec.subsegmentos || []).forEach((sub, si2) => {
        const subN = si2 + 1
        ;(sub.elementos || []).forEach(e => sections.push(makeRow(e, subN, sub.nombre)))
      })
    }
  })
  return {
    bulletin: { bull_name: 'Documento', bull_status: true, updated_by: 'SISTEMA' },
    bulletin_sections: sections.map(s => ({
      section_segment: s.section_segment, section_subsegment: s.section_subsegment,
      bull_id: null, path_id: s.path_id, section_content: s.section_content,
      section_css: s.section_css, section_html: s.section_html,
      section_order: s.section_order, section_status: true, updated_by: 'SISTEMA',
      _meta_seg_name: s.seg_name, _meta_sub_name: s.sub_name,
      _meta_type: s.type, _meta_align: s.align || null,
    })),
    bulletin_path: sections
      .filter(s => s.path_id !== null)
      .map(s => ({ path_id: null, path_desc: s.path_desc })),
  }
}

function getSufijoDeFecha() {
  const n = new Date(); const p = x => String(x).padStart(2, '0')
  return `_${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`
}

function descargarJson(datos, nombre = 'boletin') {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${nombre}${getSufijoDeFecha()}.json`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function BuilderPanel({
  seccionesExternas,
  onSeccionesChange,
  activeSectionIdExterno,
  onActiveSectionChange,
}) {
  const [seccionesLocales, setSeccionesLocales] = useState([])
  const secciones    = seccionesExternas  !== undefined ? seccionesExternas  : seccionesLocales
  const setSecciones = onSeccionesChange  !== undefined ? onSeccionesChange  : setSeccionesLocales

  const [activeSection, setActiveSection] = useState(null)
  const [jsonLocal,     setJsonLocal]     = useState(null)
  const archivosImagenRef = useRef({})

  // Ref para evitar loop: solo sincronizar cuando el valor externo CAMBIA
  // y es distinto de null (null = ya fue procesado)
  const prevExternoRef = useRef(null)
  useEffect(() => {
    if (
      activeSectionIdExterno &&
      activeSectionIdExterno !== prevExternoRef.current
    ) {
      prevExternoRef.current = activeSectionIdExterno
      setActiveSection(activeSectionIdExterno)
      // Limpiar el trigger externo DESPUÉS de procesar, sin causar re-render loop
      setTimeout(() => {
        if (onActiveSectionChange) onActiveSectionChange(null)
        prevExternoRef.current = null
      }, 100)
    }
  }, [activeSectionIdExterno, onActiveSectionChange])

  const { guardar, cargando, error, resultado, limpiar } = useGuardarBoletin()

  const genId = () => `sec_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const handleFileSelected = useCallback((elemId, file) => {
    archivosImagenRef.current[elemId] = file
  }, [])

  const toggleSec = (secId) =>
    setActiveSection(prev => prev === secId ? null : secId)

  const agregarSeccion = () => {
    setSecciones(prev => {
      const nueva = {
        id: genId(), nombre: '', cssClases: 'doc-section',
        layout: 'full', elementos: [], subsegmentos: [],
      }
      setActiveSection(nueva.id)
      return [...prev, nueva]
    })
  }

  const actualizarSeccion = (secId, datos) =>
    setSecciones(prev => prev.map(s => s.id === secId ? datos : s))

  const eliminarSeccion = (secId) => {
    setSecciones(prev => prev.filter(s => s.id !== secId))
    setActiveSection(prev => prev === secId ? null : prev)
  }

  const moverSeccion = (idx, dir) => {
    const dest = idx + dir
    if (dest < 0 || dest >= secciones.length) return
    setSecciones(prev => {
      const a = [...prev]; [a[idx], a[dest]] = [a[dest], a[idx]]; return a
    })
  }

  const handleGuardar = async () => {
    if (!secciones.length) { alert('Agrega al menos una sección.'); return }
    limpiar()
    const flat = buildJson(secciones); setJsonLocal(flat)
    try { await guardar(flat, archivosImagenRef.current); archivosImagenRef.current = {} }
    catch (e) { console.error(e.message) }
  }

  const handleDescargar = () => {
    if (!secciones.length) { alert('Agrega al menos una sección.'); return }
    descargarJson(buildJson(secciones), 'boletin')
  }

  return (
    <div className={styles.panel}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.topbarLogo}>📄</span>
          <span className={styles.topbarTitulo}>Builder Panel</span>
          <span className={styles.topbarBadge}>React + Vite</span>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.btnDescargar} onClick={handleDescargar}
            title="boletin_yyyyMMdd_HHmmss.json">
            ⬇ Descargar JSON
          </button>
          <button
            className={`${styles.btnGuardar} ${cargando ? styles.btnGuardandoActivo : ''}`}
            onClick={handleGuardar} disabled={cargando}>
            {cargando ? '⏳ Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>

      <div className={styles.contenido}>
        <div className={styles.seccionesHeader}>
          <h2 className={styles.titulo}>Secciones del documento</h2>
          <button className={styles.btnAgregarSeccion} onClick={agregarSeccion}>
            + Agregar sección
          </button>
        </div>

        {error && (
          <div className={styles.alertaError}>
            ❌ <strong>Error:</strong> {error}
            <button className={styles.alertaCerrar} onClick={limpiar}>✕</button>
          </div>
        )}
        {resultado && !error && (
          <div className={styles.alertaExito}>
            ✅ <strong>Guardado</strong>
            {resultado.bull_id && ` — ID: ${resultado.bull_id}`}
            <button className={styles.alertaCerrar} onClick={limpiar}>✕</button>
          </div>
        )}

        <div className={styles.seccionesList}>
          {secciones.length === 0
            ? (
              <div className={styles.listaVacia}>
                <div className={styles.listaVaciaIco}>📋</div>
                <p>No hay secciones. Haz clic en <strong>&quot;+ Agregar sección&quot;</strong> para comenzar.</p>
              </div>
            )
            : secciones.map((sec, idx) => (
                <Section
                  key={sec.id} section={sec} sectionIndex={idx}
                  isOpen={activeSection === sec.id}
                  onToggle={() => toggleSec(sec.id)}
                  onMoverSec={dir => moverSeccion(idx, dir)}
                  canSecArriba={idx > 0}
                  canSecAbajo={idx < secciones.length - 1}
                  onUpdate={actualizarSeccion}
                  onDelete={eliminarSeccion}
                  onFileSelected={handleFileSelected}
                />
              ))
          }
        </div>

        {jsonLocal && (
          <div className={styles.jsonWrap}>
            <div className={styles.jsonHeader}>
              <span className={styles.jsonTitulo}>📦 JSON generado</span>
              <button className={styles.btnDescargarJson}
                onClick={() => descargarJson(jsonLocal, 'boletin')}>⬇ Descargar</button>
              <button className={styles.btnCerrarJson}
                onClick={() => setJsonLocal(null)}>✕ Cerrar</button>
            </div>
            <div style={{ padding: '14px' }}>
              <pre className={styles.jsonCode}>{JSON.stringify(jsonLocal, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
