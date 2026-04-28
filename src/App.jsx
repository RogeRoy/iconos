import { useState, useCallback, useRef } from 'react'
import BuilderPanel     from './components/BuilderPanel'
import PreviewPanel     from './components/PreviewPanel'
import FloatingToolbar  from './components/FloatingToolbar'
import ErrorBoundary    from './components/ErrorBoundary'
import VisorDocumento   from './components/VisorDocumento'
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
  // 'builder' | 'visor'
  const [pantalla, setPantalla] = useState('builder')

  const [secciones,       setSecciones]       = useState([])
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [activeSubId,     setActiveSubId]     = useState(null)
  const [activeElemId,    setActiveElemId]    = useState(null)
  const [previewScrollId, setPreviewScrollId] = useState(null)

  // Estados de guardado exitoso / error
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const [errorGuardado,   setErrorGuardado]   = useState('')

  const builderRef = useRef(null)
  const { guardar, cargando } = useGuardarBoletin()

  const handleNavegar = useCallback(({ tipo, id, secId, subId }) => {
    if (tipo === 'elemento') {
      setActiveSectionId(secId || null); setActiveSubId(subId || null); setActiveElemId(id)
    } else if (tipo === 'subsegmento') {
      setActiveSectionId(secId); setActiveSubId(id); setActiveElemId(null)
    } else {
      setActiveSectionId(id); setActiveSubId(null); setActiveElemId(null)
    }
  }, [])

  const handleElementoAbierto = useCallback((elemId) => {
    setPreviewScrollId(elemId)
    setTimeout(() => setPreviewScrollId(null), 400)
  }, [])

  const handleSeccionesChange = useCallback((fn) => setSecciones(fn), [])
  const handleAgregarSeccion = useCallback(() => builderRef.current?.agregarSeccion(), [])

  const handleGuardar = useCallback(async () => {
    const flat = builderRef.current?.buildJsonActual?.()
    if (!flat) return
    setGuardadoExitoso(false); setErrorGuardado('')
    try {
      await guardar(flat, {})
      // ✅ Guardado exitoso: mostrar mensaje y limpiar el builder
      setGuardadoExitoso(true)
      setSecciones([])  // vaciar el builder
      setTimeout(() => setGuardadoExitoso(false), 5000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido'
      setErrorGuardado(`Hubo un problema al guardar. Por favor consulta al administrador. (${msg})`)
      console.error('[GUARDAR] Error completo:', err)
    }
  }, [guardar])

  const handleDescargar = useCallback(() => {
    const flat = builderRef.current?.buildJsonActual?.()
    if (flat) descargarJson(flat, 'boletin')
  }, [])

  // Pantalla del visor
  if (pantalla === 'visor') {
    return <VisorDocumento onVolver={() => setPantalla('builder')} />
  }

  return (
    <div className="app-layout">
      {/* ── Notificación de guardado exitoso ── */}
      {guardadoExitoso && (
        <div style={{ position:'fixed', top:'16px', left:'50%', transform:'translateX(-50%)', zIndex:1000, background:'#1e5b4f', color:'#fff', padding:'14px 24px', borderRadius:'10px', fontSize:'14px', fontWeight:700, display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 6px 24px rgba(0,0,0,.25)' }}>
          <span style={{ fontSize:'22px' }}>✅</span>
          Documento guardado exitosamente. El builder está listo para un nuevo documento.
          <button onClick={() => setGuardadoExitoso(false)} style={{ marginLeft:'10px', background:'transparent', border:'none', color:'#fff', cursor:'pointer', fontSize:'18px' }}>✕</button>
        </div>
      )}

      {/* ── Notificación de error de guardado ── */}
      {errorGuardado && (
        <div style={{ position:'fixed', top:'16px', left:'50%', transform:'translateX(-50%)', zIndex:1000, background:'#8b2020', color:'#fff', padding:'14px 24px', borderRadius:'10px', fontSize:'14px', fontWeight:700, display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 6px 24px rgba(0,0,0,.25)', maxWidth:'560px' }}>
          <span style={{ fontSize:'22px' }}>⚠</span>
          {errorGuardado}
          <button onClick={() => setErrorGuardado('')} style={{ marginLeft:'auto', background:'transparent', border:'none', color:'#fff', cursor:'pointer', fontSize:'18px' }}>✕</button>
        </div>
      )}

      <div className="app-builder">
        <ErrorBoundary>
          <BuilderPanel
            ref={builderRef}
            seccionesExternas={secciones}
            onSeccionesChange={handleSeccionesChange}
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
        onVerDocumento={() => setPantalla('visor')}
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
