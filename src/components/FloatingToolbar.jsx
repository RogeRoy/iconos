// ─────────────────────────────────────────────────────────────────────────
// FloatingToolbar.jsx — v3  (agrega toggle builder/preview para móvil)
// ─────────────────────────────────────────────────────────────────────────
//
// CAMBIO EN ESTA VERSIÓN:
//   Nuevo botón "👁 Preview / 🔨 Builder" visible solo en móvil (< 768px).
//   Permite cambiar entre el panel builder y el panel preview.
//
//   ANTES: en móvil los dos paneles aparecían apilados verticalmente.
//          El usuario tenía que hacer scroll para ver el preview.
//   AHORA: solo se muestra un panel a la vez, con este botón para cambiar.
//
//   IMPLEMENTACIÓN:
//   - Las props panelMovil y onTogglePanelMovil vienen de App.jsx.
//   - En desktop (> 768px) el botón se oculta con CSS (display:none).
//   - En móvil (≤ 768px) aparece destacado.
//
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import styles from './FloatingToolbar.module.css'

export default function FloatingToolbar({
  onAgregarSeccion, onGuardar, onDescargar, onVerDocumento, onEditarDocumento,
  cargando, totalSecciones,
  panelMovil,           // ← NUEVO: 'builder' | 'preview'
  onTogglePanelMovil,   // ← NUEVO: función para cambiar el panel activo
}) {
  const [colapsado, setColapsado] = useState(false)

  return (
    <div className={`${styles.fab} ${colapsado ? styles.fabColapsado : ''}`}>

      {/* Botón toggle (colapsar/expandir) — siempre visible */}
      <button
        className={`${styles.fabBtn} ${styles.fabToggle}`}
        onClick={() => setColapsado(p => !p)}
        title={colapsado ? 'Expandir menú' : 'Contraer menú'}
      >
        <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
          {colapsado
            ? <path d="M4 8l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M4 12l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          }
        </svg>
        {totalSecciones > 0 && (
          <span className={styles.counterInline}>{totalSecciones}</span>
        )}
      </button>

      {/* ── NUEVO: Botón de toggle Builder/Preview (solo en móvil) ────
          Se muestra con la clase fabTogglePanel.
          El CSS lo oculta en desktop y lo muestra en móvil.
          ───────────────────────────────────────────────────────────── */}
      {onTogglePanelMovil && (
        <button
          className={`${styles.fabBtn} ${styles.fabTogglePanel}`}
          onClick={onTogglePanelMovil}
          title={panelMovil === 'builder' ? 'Ver Preview' : 'Ver Builder'}
        >
          {panelMovil === 'builder' ? (
            // Ícono de "ojo" (ver preview)
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
          ) : (
            // Ícono de "lápiz" (volver al builder)
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <span className={styles.fabLabel}>
            {panelMovil === 'builder' ? 'Preview' : 'Builder'}
          </span>
        </button>
      )}

      {!colapsado && (
        <>
          <div className={styles.sep}/>

          {/* Agregar sección */}
          <button className={styles.fabBtn} onClick={onAgregarSeccion} title="Agregar nueva sección">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className={styles.fabLabel}>Sección</span>
          </button>

          <div className={styles.sep}/>

          {/* Guardar */}
          <button
            className={`${styles.fabBtn} ${cargando ? styles.fabCargando : ''}`}
            onClick={onGuardar} disabled={cargando}
            title="Guardar en la API"
          >
            {cargando
              ? <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className={styles.spin}>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28 56" strokeLinecap="round"/>
                </svg>
              : <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            }
            <span className={styles.fabLabel}>{cargando ? '...' : 'Guardar'}</span>
          </button>

          <div className={styles.sep}/>

          {/* Ver Documento — icono de hoja de documento */}
          {onVerDocumento && (
            <button className={styles.fabBtn} onClick={onVerDocumento} title="Ver el documento publicado">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                {/* Hoja de papel con esquina doblada */}
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Esquina doblada */}
                <polyline points="14 2 14 8 20 8"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Líneas de texto */}
                <line x1="16" y1="13" x2="8" y2="13"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="16" y1="17" x2="8" y2="17"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <polyline points="10 9 9 9 8 9"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span className={styles.fabLabel}>Ver Doc</span>
            </button>
          )}

          {onVerDocumento && <div className={styles.sep}/>}

          {/* Editar Documento existente */}
          {onEditarDocumento && (
            <button className={styles.fabBtn} onClick={onEditarDocumento} title="Editar un boletín guardado">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={styles.fabLabel}>Editar</span>
            </button>
          )}

          <div className={styles.sep}/>

          {/* Descargar JSON */}
          <button className={styles.fabBtn} onClick={onDescargar} title="Descargar JSON">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className={styles.fabLabel}>JSON</span>
          </button>
        </>
      )}
    </div>
  )
}
