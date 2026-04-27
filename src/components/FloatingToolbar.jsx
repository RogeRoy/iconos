// FloatingToolbar.jsx — Barra flotante entre builder y preview
// ─────────────────────────────────────────────────────────
// Flota en posición fija en el margen entre los dos paneles.
// Sigue el scroll verticalmente (fixed en pantalla, centrado entre paneles).
// Contiene: Agregar Sección, Guardar, Descargar JSON.
// ─────────────────────────────────────────────────────────
import styles from './FloatingToolbar.module.css'

export default function FloatingToolbar({
  onAgregarSeccion,
  onGuardar,
  onDescargar,
  cargando,
  totalSecciones,
}) {
  return (
    <div className={styles.fab}>
      {/* Agregar sección */}
      <button
        className={styles.fabBtn}
        onClick={onAgregarSeccion}
        title="Agregar nueva sección al documento"
      >
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className={styles.fabLabel}>Sección</span>
      </button>

      <div className={styles.sep}/>

      {/* Guardar */}
      <button
        className={`${styles.fabBtn} ${styles.fabGuardar} ${cargando ? styles.fabCargando : ''}`}
        onClick={onGuardar}
        disabled={cargando}
        title="Guardar en la API (POST /api/bulletins)"
      >
        {cargando
          ? (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className={styles.spin}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28 56" strokeLinecap="round"/>
            </svg>
          )
          : (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        }
        <span className={styles.fabLabel}>{cargando ? '...' : 'Guardar'}</span>
      </button>

      {/* Descargar JSON */}
      <button
        className={`${styles.fabBtn} ${styles.fabDescargar}`}
        onClick={onDescargar}
        title="Descargar JSON con sufijo de fecha (boletin_yyyyMMdd_HHmmss.json)"
      >
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span className={styles.fabLabel}>JSON</span>
      </button>

      {/* Contador de secciones */}
      {totalSecciones > 0 && (
        <div className={styles.counter} title={`${totalSecciones} sección(es) en el documento`}>
          {totalSecciones}
        </div>
      )}
    </div>
  )
}
