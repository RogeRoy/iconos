// ─────────────────────────────────────────────────────────────────────────
// App.jsx — v2  (usa useBuilderState, agrega toggle de panel en móvil)
// ─────────────────────────────────────────────────────────────────────────
//
// CAMBIOS EN ESTA VERSIÓN:
//
//   1. useBuilderState() reemplaza ~40 líneas de código duplicado.
//      Todo el estado y los handlers vienen del hook.
//      El componente solo se ocupa de QUÉ MOSTRAR, no de la lógica.
//
//   2. activeNav (objeto único) reemplaza 3 estados separados:
//      ANTES: activeSectionId, activeSubId, activeElemId (3 setStates)
//      AHORA: activeNav.secId, activeNav.subId, activeNav.elemId (1 setState)
//
//   3. Estado de panel para móvil: 'builder' | 'preview'
//      En pantallas pequeñas solo se muestra UN panel a la vez.
//      El botón flotante extra permite cambiar entre ellos.
//      Esto soluciona el responsive incompleto en móvil.
//
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import BuilderPanel    from './components/BuilderPanel'
import PreviewPanel    from './components/PreviewPanel'
import FloatingToolbar from './components/FloatingToolbar'
import ErrorBoundary   from './components/ErrorBoundary'
import VisorDocumento  from './components/VisorDocumento'
import EditorBoletín   from './components/EditorBoletín'
import { useBuilderState } from './hooks/useBuilderState'
import './App.css'

export default function App() {
  // ── Pantalla activa ────────────────────────────────────────────────
  // 'builder' → pantalla principal de creación de documentos
  // 'visor'   → pantalla de visualización del documento publicado
  // 'editor'  → pantalla de edición de boletín existente
  const [pantalla, setPantalla] = useState('builder')

  // ── Panel visible en móvil ────────────────────────────────────────
  // En móvil (< 768px) solo se muestra un panel a la vez.
  // 'builder' | 'preview'
  // El CSS oculta el panel que no está activo usando la clase .panelOculto.
  const [panelMovil, setPanelMovil] = useState('builder')

  // ── Toda la lógica del builder viene del hook ─────────────────────
  // useBuilderState devuelve todos los estados y funciones necesarios.
  // Si necesitas cambiar algo de la lógica, solo tienes que ir a
  // hooks/useBuilderState.js — ya no hay lógica dispersa aquí.
  const {
    secciones,
    setSecciones,
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

  // ── Pantalla del visor ─────────────────────────────────────────────
  if (pantalla === 'visor') {
    return <VisorDocumento onVolver={() => setPantalla('builder')} />
  }

  // ── Pantalla del editor de boletines existentes ───────────────────
  if (pantalla === 'editor') {
    return <EditorBoletín onVolver={() => setPantalla('builder')} />
  }

  return (
    <div className="app-layout">

      {/* ── Notificación de guardado exitoso ─────────────────────── */}
      {guardadoExitoso && (
        <div style={{
          position:'fixed', top:'16px', left:'50%', transform:'translateX(-50%)',
          zIndex:1000, background:'#1e5b4f', color:'#fff',
          padding:'12px 20px', borderRadius:'10px', fontSize:'14px',
          fontWeight:700, display:'flex', alignItems:'center', gap:'10px',
          boxShadow:'0 6px 24px rgba(0,0,0,.25)',
          maxWidth:'min(560px, 92vw)', width:'fit-content', boxSizing:'border-box',
        }}>
          <span style={{ fontSize:'22px' }}>✅</span>
          Documento guardado exitosamente. El builder está listo para un nuevo documento.
          <button
            onClick={limpiarNotificaciones}
            style={{ marginLeft:'10px', background:'transparent', border:'none', color:'#fff', cursor:'pointer', fontSize:'18px' }}
          >✕</button>
        </div>
      )}

      {/* ── Notificación de error de guardado ────────────────────── */}
      {errorGuardado && (
        <div style={{
          position:'fixed', top:'16px', left:'50%', transform:'translateX(-50%)',
          zIndex:1000, background:'#8b2020', color:'#fff',
          padding:'12px 20px', borderRadius:'10px', fontSize:'13px',
          fontWeight:700, display:'flex', alignItems:'center', gap:'10px',
          boxShadow:'0 6px 24px rgba(0,0,0,.25)',
          maxWidth:'min(560px, 92vw)', width:'fit-content', boxSizing:'border-box',
        }}>
          <span style={{ fontSize:'22px' }}>⚠</span>
          {errorGuardado}
          <button
            onClick={limpiarNotificaciones}
            style={{ marginLeft:'auto', background:'transparent', border:'none', color:'#fff', cursor:'pointer', fontSize:'18px' }}
          >✕</button>
        </div>
      )}

      {/* ── Panel del builder ─────────────────────────────────────── */}
      {/* La clase .panelOcultoMovil se activa en móvil cuando panelMovil !== 'builder' */}
      <div
        className={`app-builder${panelMovil !== 'builder' ? ' panel-oculto-movil' : ''}`}
      >
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

      {/* ── Toolbar flotante ─────────────────────────────────────── */}
      <FloatingToolbar
        onAgregarSeccion={handleAgregarSeccion}
        onGuardar={handleGuardar}
        onDescargar={handleDescargar}
        onVerDocumento={() => setPantalla('visor')}
        onEditarDocumento={() => setPantalla('editor')}
        cargando={cargandoGuardado}
        totalSecciones={secciones.length}
        panelMovil={panelMovil}
        onTogglePanelMovil={() => setPanelMovil(p => p === 'builder' ? 'preview' : 'builder')}
      />

      {/* ── Panel del preview ────────────────────────────────────── */}
      <div
        className={`app-preview${panelMovil !== 'preview' ? ' panel-oculto-movil' : ''}`}
      >
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
