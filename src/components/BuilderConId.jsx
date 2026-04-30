// ─────────────────────────────────────────────────────────────────────────
// components/BuilderConId.jsx
// ─────────────────────────────────────────────────────────────────────────
//
// ¿QUÉ HACE?
//   Muestra el builder VACÍO para crear un documento nuevo,
//   pero con el bull_id ya conocido (viene de la URL).
//
//   Se usa cuando /documento/guardar/2 responde 404 (no hay secciones).
//   El boletín existe en la tabla bulletin, pero todavía no tiene
//   secciones en bulletin_sections.
//
// DIFERENCIA CON App.jsx:
//   App.jsx usa BULLETIN_ID_HARDCODE = 4.
//   BuilderConId usa el bullId que llega como prop desde la URL.
//   Esto permite crear el documento para cualquier boletín, no solo el 4.
//
// ─────────────────────────────────────────────────────────────────────────

import { useState, useCallback }   from 'react'
import BuilderPanel   from './BuilderPanel'
import PreviewPanel   from './PreviewPanel'
import FloatingToolbar from './FloatingToolbar'
import ErrorBoundary  from './ErrorBoundary'
import { useBuilderState }   from '../hooks/useBuilderState'
import { useGuardarBoletin } from '../hooks/useGuardarBoletin'

function getSufijoDeFecha() {
  const n = new Date()
  const p = x => String(x).padStart(2, '0')
  return `_${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`
}
function descargarJson(datos, nombre = 'boletin') {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${nombre}${getSufijoDeFecha()}.json`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function BuilderConId({ bullId, onVolver }) {
  const [panelMovil, setPanelMovil] = useState('builder')

  const {
    secciones, activeNav, previewScrollId, builderRef,
    handleNavegar, handleElementoAbierto,
    handleSeccionesChange, handleAgregarSeccion,
  } = useBuilderState()

  const { guardar, cargando: guardando } = useGuardarBoletin()
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [errorGuard, setErrorGuard] = useState('')

  const handleGuardar = useCallback(async () => {
    const flat     = builderRef.current?.buildJsonActual?.()
    const imagenes = builderRef.current?.getImagenes?.() || {}
    if (!flat) return

    // Inyectar el bullId correcto en cada sección antes de guardar
    // Esto reemplaza el BULLETIN_ID_HARDCODE del hook de guardado
    if (flat.bulletin_sections) {
      flat.bulletin_sections = flat.bulletin_sections.map(s => ({
        ...s, bull_id: bullId,
      }))
    }

    setGuardadoOk(false); setErrorGuard('')
    try {
      await guardar(flat, imagenes)
      setGuardadoOk(true)
      setTimeout(() => setGuardadoOk(false), 5000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido'
      setErrorGuard(`Hubo un problema al guardar. (${msg})`)
    }
  }, [guardar, builderRef, bullId])

  const handleDescargar = useCallback(() => {
    const flat = builderRef.current?.buildJsonActual?.()
    if (flat) descargarJson(flat, `boletin_${bullId}`)
  }, [builderRef, bullId])

  return (
    <div className="app-layout" style={{ position: 'relative' }}>

      {/* Barra superior */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: '#1e5b4f', height: '34px',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px',
        fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
      }}>
        <button onClick={onVolver} style={{
          background: 'transparent', border: 'none',
          color: 'rgba(230,209,148,.8)', cursor: 'pointer',
          fontSize: '12px', fontFamily: 'inherit',
        }}>
          ← Volver
        </button>
        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,.2)' }}/>
        {/* NUEVO: nombre del boletín visible — verde para diferenciar de edición */}
        <span style={{ color: '#e6d194', fontWeight: 700 }}>
          ✨ Creando contenido para Boletín #{bullId}
        </span>
        <span style={{
          background: 'rgba(165,127,44,.3)', color: '#e6d194',
          fontSize: '10px', fontWeight: 700,
          padding: '2px 8px', borderRadius: '100px',
          border: '1px solid rgba(165,127,44,.4)',
        }}>
          {secciones.length} sección{secciones.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Notificaciones */}
      {guardadoOk && (
        <div style={{
          position: 'fixed', top: '50px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#1e5b4f', color: '#fff',
          padding: '12px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 6px 24px rgba(0,0,0,.25)', maxWidth: '90vw',
        }}>
          ✅ Documento guardado en Boletín #{bullId}.
          <button onClick={() => setGuardadoOk(false)} style={{
            background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px',
          }}>✕</button>
        </div>
      )}
      {errorGuard && (
        <div style={{
          position: 'fixed', top: '50px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#8b2020', color: '#fff',
          padding: '12px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 6px 24px rgba(0,0,0,.25)', maxWidth: '90vw',
        }}>
          ⚠ {errorGuard}
          <button onClick={() => setErrorGuard('')} style={{
            background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px',
          }}>✕</button>
        </div>
      )}

      {/* Builder */}
      <div className={`app-builder app-builder-editor${panelMovil !== 'builder' ? ' panel-oculto-movil' : ''}`}>
        <ErrorBoundary>
          <BuilderPanel
            ref={builderRef}
            seccionesExternas={secciones}
            onSeccionesChange={handleSeccionesChange}
            activeNavExterno={activeNav}
            onElementoAbierto={handleElementoAbierto}
          />
        </ErrorBoundary>
      </div>

      <FloatingToolbar
        onAgregarSeccion={handleAgregarSeccion}
        onGuardar={handleGuardar}
        onDescargar={handleDescargar}
        onVerDocumento={null}
        cargando={guardando}
        totalSecciones={secciones.length}
        panelMovil={panelMovil}
        onTogglePanelMovil={() => setPanelMovil(p => p === 'builder' ? 'preview' : 'builder')}
      />

      {/* Preview */}
      <div className={`app-preview app-preview-editor${panelMovil !== 'preview' ? ' panel-oculto-movil' : ''}`}>
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
