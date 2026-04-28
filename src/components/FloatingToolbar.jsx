// FloatingToolbar.jsx — v2 con colapso
// El menú flotante puede contraerse a un botón pequeño "☰"
// y expandirse al hacer clic. Estado colapsado por defecto.
import { useState } from 'react'
import styles from './FloatingToolbar.module.css'

export default function FloatingToolbar({
  onAgregarSeccion, onGuardar, onDescargar, onVerDocumento,
  cargando, totalSecciones,
}) {
  // Estado de colapso: true = minimizado (solo muestra el botón toggle)
  // false = expandido (muestra todos los botones)
  const [colapsado, setColapsado] = useState(false)

  return (
    <div className={`${styles.fab} ${colapsado ? styles.fabColapsado : ''}`}>

      {/* Botón toggle — siempre visible */}
      <button
        className={`${styles.fabBtn} ${styles.fabToggle}`}
        onClick={() => setColapsado(p => !p)}
        title={colapsado ? 'Expandir menú' : 'Contraer menú'}
      >
        <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
          {colapsado ? (
            /* Ícono expandir: flechas apuntando hacia afuera */
            <path d="M4 8l6 6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            /* Ícono contraer: flechas apuntando hacia adentro */
            <path d="M4 12l6-6 6 6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
        {/* Contador siempre visible aunque esté colapsado */}
        {totalSecciones > 0 && (
          <span className={styles.counterInline}>{totalSecciones}</span>
        )}
      </button>

      {/* Contenido que se oculta al colapsar */}
      {!colapsado && (
        <>
          <div className={styles.sep}/>

          {/* Agregar sección */}
          <button className={styles.fabBtn} onClick={onAgregarSeccion}
            title="Agregar nueva sección">
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
            title="Guardar en la API">
            {cargando
              ? <svg viewBox="0 0 24 24" fill="none" width="20" height="20"
                  className={styles.spin}>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"
                    strokeDasharray="28 56" strokeLinecap="round"/>
                </svg>
              : <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 21 17 13 7 13 7 21"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 3 7 8 15 8"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            }
            <span className={styles.fabLabel}>{cargando ? '...' : 'Guardar'}</span>
          </button>

          <div className={styles.sep}/>

          {/* Ver Documento */}
          <button className={styles.fabBtn} onClick={onVerDocumento}
            title="Ver el documento publicado">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            <span className={styles.fabLabel}>Ver Doc</span>
          </button>

          <div className={styles.sep}/>

          {/* Descargar JSON */}
          <button className={styles.fabBtn} onClick={onDescargar}
            title="Descargar JSON (boletin_yyyyMMdd_HHmmss.json)">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 10 12 15 17 10"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className={styles.fabLabel}>JSON</span>
          </button>
        </>
      )}
    </div>
  )
}
