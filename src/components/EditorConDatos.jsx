// ─────────────────────────────────────────────────────────────────────────
// components/EditorConDatos.jsx
// ─────────────────────────────────────────────────────────────────────────
//
// ¿QUÉ HACE?
//   Muestra el editor (BuilderPanel + PreviewPanel) con secciones
//   ya cargadas desde la API. Es usado por RutaGuardar cuando el
//   GET /bulletin/sections/{id} responde 200 con datos.
//
//   La diferencia con EditorBoletín.jsx es que este componente
//   NO tiene la pantalla de "Ingresa el ID" — ya recibe los datos
//   listos como props.
//
// PROPS:
//   bullId             → número entero del boletín
//   seccionesIniciales → array de filas de bulletin_sections del API
//   onVolver           → función para ir a otra pantalla
//
// ─────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback }  from 'react'
import BuilderPanel  from './BuilderPanel'
import PreviewPanel  from './PreviewPanel'
import FloatingToolbar from './FloatingToolbar'
import ErrorBoundary from './ErrorBoundary'
import { apiRowsToSecciones } from '../utils/apiToBuilder'
import { useBuilderState }    from '../hooks/useBuilderState'
import { useGuardarBoletin }  from '../hooks/useGuardarBoletin'

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

export default function EditorConDatos({ bullId, seccionesIniciales, onVolver }) {
  // Convertir el array plano de la API al estado del builder
  // apiRowsToSecciones hace exactamente lo que hace EditorBoletín
  // cuando recibe los datos del GET
  const [panelMovil, setPanelMovil] = useState('builder')

  const {
    secciones, setSecciones,
    activeNav, previewScrollId,
    builderRef,
    guardadoExitoso, errorGuardado, cargandoGuardado,
    handleNavegar, handleElementoAbierto,
    handleSeccionesChange, handleAgregarSeccion,
    limpiarNotificaciones,
  } = useBuilderState()

  // Cargar las secciones iniciales cuando el componente se monta
  // useState con función inicializadora: se ejecuta solo UNA VEZ al montar
  const [inicializado, setInicializado] = useState(() => {
    const convertidas = apiRowsToSecciones(seccionesIniciales || [])
    return convertidas
  })

  // Sincronizar con el estado del hook si no se ha inicializado
  const refInicialized = useRef(false)
  if (!refInicialized.current && inicializado.length > 0) {
    refInicialized.current = true
    // Usamos setTimeout(0) para evitar setState durante render
    setTimeout(() => setSecciones(inicializado), 0)
  }

  const { guardar, cargando: guardando } = useGuardarBoletin()
  const [guardadoOk, setGuardadoOk]   = useState(false)
  const [errorGuard, setErrorGuard]   = useState('')

  const handleGuardar = useCallback(async () => {
    const flat     = builderRef.current?.buildJsonActual?.()
    const imagenes = builderRef.current?.getImagenes?.() || {}
    if (!flat) return
    setGuardadoOk(false); setErrorGuard('')
    try {
      await guardar(flat, imagenes)
      setGuardadoOk(true)
      setTimeout(() => setGuardadoOk(false), 5000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido'
      setErrorGuard(`Hubo un problema al guardar. (${msg})`)
    }
  }, [guardar, builderRef])

  const handleDescargar = useCallback(() => {
    const flat = builderRef.current?.buildJsonActual?.()
    if (flat) descargarJson(flat, `boletin_${bullId}`)
  }, [builderRef, bullId])

  return (
    <div className="app-layout" style={{ position: 'relative' }}>

      {/* Barra superior: muestra el ID del boletín que se edita */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: '#3a0000', height: '34px',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px',
        fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
      }}>
        <button onClick={onVolver} style={{
          background: 'transparent', border: 'none',
          color: 'rgba(230,209,148,.7)', cursor: 'pointer',
          fontSize: '12px', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          ← Volver
        </button>
        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,.15)' }}/>
        {/* NUEVO: nombre del boletín visible */}
        <span style={{ color: '#e6d194', fontWeight: 700 }}>
          ✏ Editando Boletín #{bullId}
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

      {/* Notificación de éxito */}
      {guardadoOk && (
        <div style={{
          position: 'fixed', top: '50px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#1e5b4f', color: '#fff',
          padding: '12px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 6px 24px rgba(0,0,0,.25)', maxWidth: '90vw',
        }}>
          ✅ Cambios guardados correctamente.
          <button onClick={() => setGuardadoOk(false)} style={{
            background: 'transparent', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: '16px',
          }}>✕</button>
        </div>
      )}

      {/* Notificación de error */}
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
            background: 'transparent', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: '16px',
          }}>✕</button>
        </div>
      )}

      {/* Builder panel */}
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

      {/* Preview panel */}
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
