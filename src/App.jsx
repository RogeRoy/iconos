// App.jsx — v3
// Maneja la navegación completa bidireccional:
//   preview → builder (clic en elemento/sub/seg abre en builder)
//   builder → preview (abrir elemento en builder scrollea el preview)
import { useState, useCallback, useRef } from 'react'
import BuilderPanel    from './components/BuilderPanel'
import PreviewPanel    from './components/PreviewPanel'
import FloatingToolbar from './components/FloatingToolbar'
import ErrorBoundary   from './components/ErrorBoundary'
import { useGuardarBoletin } from './hooks/useGuardarBoletin'
import './App.css'

function getSufijoDeFecha() {
  const n=new Date(); const p=x=>String(x).padStart(2,'0')
  return `_${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`
}
function descargarJson(datos, nombre='boletin') {
  const blob=new Blob([JSON.stringify(datos,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob); const a=document.createElement('a')
  a.href=url; a.download=`${nombre}${getSufijoDeFecha()}.json`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function App() {
  const [secciones,       setSecciones]       = useState([])
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [activeSubId,     setActiveSubId]     = useState(null)
  const [activeElemId,    setActiveElemId]    = useState(null)   // preview→builder
  const [previewScrollId, setPreviewScrollId] = useState(null)   // builder→preview

  const builderRef = useRef(null)
  const { guardar, cargando } = useGuardarBoletin()

  // ── Preview → Builder ─────────────────────────────────────
  const handleNavegar = useCallback(({ tipo, id, secId, subId }) => {
    if (tipo === 'elemento') {
      // Abrir la sección → subsegmento (si existe) → elemento
      setActiveSectionId(secId  || null)
      setActiveSubId(subId      || null)
      setActiveElemId(id)
    } else if (tipo === 'subsegmento') {
      setActiveSectionId(secId)
      setActiveSubId(id)
      setActiveElemId(null)
    } else {
      setActiveSectionId(id)
      setActiveSubId(null)
      setActiveElemId(null)
    }
  }, [])

  // ── Builder → Preview ─────────────────────────────────────
  // BuilderPanel llama esto cuando el usuario abre un elemento.
  // Lo pasamos al PreviewPanel para que haga scroll.
  const handleElementoAbierto = useCallback((elemId) => {
    setPreviewScrollId(elemId)
    // Limpiar después para que el next useEffect en Preview funcione
    setTimeout(() => setPreviewScrollId(null), 400)
  }, [])

  const handleAgregarSeccion = useCallback(() => builderRef.current?.agregarSeccion(), [])
  const handleGuardar = useCallback(async () => {
    const flat = builderRef.current?.buildJsonActual?.()
    if (!flat) return
    try { await guardar(flat, {}) } catch (e) { console.error(e.message) }
  }, [guardar])
  const handleDescargar = useCallback(() => {
    const flat = builderRef.current?.buildJsonActual?.()
    if (flat) descargarJson(flat, 'boletin')
  }, [])

  return (
    <div className="app-layout">
      <div className="app-builder">
        <ErrorBoundary>
          <BuilderPanel
            ref={builderRef}
            seccionesExternas={secciones}
            onSeccionesChange={setSecciones}
            activeSectionIdExterno={activeSectionId}
            onActiveSectionChange={setActiveSectionId}
            activeSubIdExterno={activeSubId}
            onActiveSubChange={setActiveSubId}
            activeElemIdExterno={activeElemId}
            onActiveElemChange={setActiveElemId}
            onElementoAbierto={handleElementoAbierto}
          />
        </ErrorBoundary>
      </div>
      <FloatingToolbar
        onAgregarSeccion={handleAgregarSeccion}
        onGuardar={handleGuardar}
        onDescargar={handleDescargar}
        cargando={cargando}
        totalSecciones={secciones.length}
      />
      <div className="app-preview">
        <ErrorBoundary>
          <PreviewPanel
            secciones={secciones}
            onNavegar={handleNavegar}
            activeElemIdFromBuilder={previewScrollId}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}
