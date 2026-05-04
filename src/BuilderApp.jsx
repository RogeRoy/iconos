// ─────────────────────────────────────────────────────────────────────────
// BuilderApp.jsx (ANTES: App.jsx)
// Ahora funciona como módulo dentro del router principal
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation } from "react-router-dom";
import BuilderPanel    from './components/BuilderPanel'
import PreviewPanel    from './components/PreviewPanel'
import FloatingToolbar from './components/FloatingToolbar'
import ErrorBoundary   from './components/ErrorBoundary'
import VisorDocumento  from './components/VisorDocumento'
import EditorBoletín   from './components/EditorBoletín'

import { useBuilderState } from './hooks/useBuilderState'
import './App.css'

export default function BuilderApp() {
  const navigate = useNavigate()

  // ── Pantalla interna del builder ────────────────────────────────
  const [pantalla, setPantalla] = useState('builder')

  // ── Panel visible en móvil ──────────────────────────────────────
  const [panelMovil, setPanelMovil] = useState('builder')

  // ── Lógica central ──────────────────────────────────────────────
  const {
    secciones,
    activeNav,
    previewScrollId,
    builderRef,
    guardadoExitoso,
    errorGuardado,
    cargandoGuardado,
    handleNavegar,
    handleElementoAbierto,
    handleSeccionesChange,
    handleAgregarSeccion,
    handleGuardar,
    handleDescargar,
    limpiarNotificaciones,
  } = useBuilderState()

  // ── Navegación a otras rutas globales ───────────────────────────
  if (pantalla === 'visor') {
    return <VisorDocumento onVolver={() => setPantalla('builder')} />
  }

  if (pantalla === 'editor') {
    return <EditorBoletín onVolver={() => setPantalla('builder')} />
  }


const location = useLocation();
const boletin = location.state?.boletin;

console.log(boletin);

  return (
    <div className="app-layout">

      {/* 🔙 BOTÓN PARA VOLVER AL SISTEMA DE BOLETINES */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          background: '#333',
          color: '#fff'
        }}
      >
        ← Volver
      </button>

      {/* ── Notificación OK ───────────────────────────── */}
      {guardadoExitoso && (
        <div style={{
          position:'fixed', top:'16px', left:'50%', transform:'translateX(-50%)',
          zIndex:1000, background:'#1e5b4f', color:'#fff',
          padding:'12px 20px', borderRadius:'10px',
          fontSize:'14px', fontWeight:700, display:'flex', gap:'10px'
        }}>
          ✅ Documento guardado
          <button onClick={limpiarNotificaciones}>✕</button>
        </div>
      )}

      {/* ── Error ───────────────────────────────────── */}
      {errorGuardado && (
        <div style={{
          position:'fixed', top:'16px', left:'50%', transform:'translateX(-50%)',
          zIndex:1000, background:'#8b2020', color:'#fff',
          padding:'12px 20px', borderRadius:'10px',
          fontSize:'13px', fontWeight:700, display:'flex', gap:'10px'
        }}>
          ⚠ {errorGuardado}
          <button onClick={limpiarNotificaciones}>✕</button>
        </div>
      )}

      {/* ── BUILDER ─────────────────────────────────── */}
      <div className={`app-builder${panelMovil !== 'builder' ? ' panel-oculto-movil' : ''}`}>
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

      {/* ── TOOLBAR ─────────────────────────────────── */}
      <FloatingToolbar
        onAgregarSeccion={handleAgregarSeccion}
        onGuardar={handleGuardar}
        onDescargar={handleDescargar}
        onVerDocumento={() => setPantalla('visor')}
        onEditarDocumento={() => setPantalla('editor')}
        cargando={cargandoGuardado}
        totalSecciones={secciones.length}
        panelMovil={panelMovil}
        onTogglePanelMovil={() =>
          setPanelMovil(p => p === 'builder' ? 'preview' : 'builder')
        }
      />

      {/* ── PREVIEW ─────────────────────────────────── */}
      <div className={`app-preview${panelMovil !== 'preview' ? ' panel-oculto-movil' : ''}`}>
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