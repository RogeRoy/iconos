// StyleSelector.jsx — fix: aplica previewAlign + fuente en título
import styles from './StyleSelector.module.css'

export const FONTS = [
  { id: '',          label: '— Sin fuente —'  },
  { id: 'noto-sans', label: 'Noto Sans'        },
  { id: 'patria',    label: 'Patria (Georgia)' },
]

const FONT_FAMILY = {
  '':          'inherit',
  'noto-sans': '"Noto Sans", sans-serif',
  'patria':    'Georgia, "Times New Roman", serif',
}

export default function StyleSelector({
  font, onFontChange,
  previewHtml,   // párrafos: HTML rico
  previewText,   // títulos: texto plano
  previewAlign,  // ← NUEVO: alineación a aplicar en el preview local
}) {
  const tieneContenido = previewHtml || previewText
  const fontStyle = { fontFamily: FONT_FAMILY[font] || 'inherit' }

  // ── FIX: si viene alineación, aplicarla en el preview ──
  if (previewAlign) fontStyle.textAlign = previewAlign

  return (
    <div className={styles.styleRow}>
      <div className={styles.selectorWrap}>
        <label className={styles.selectorLabel}>Fuente</label>
        <select className={styles.select} value={font || ''}
          onChange={(e) => onFontChange && onFontChange(e.target.value)}>
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.previewWrap}>
        <span className={styles.previewLabel}>Vista previa</span>
        {previewHtml ? (
          <div className={styles.previewBox} style={fontStyle}
            dangerouslySetInnerHTML={{ __html: previewHtml }} />
        ) : (
          <div className={styles.previewBox} style={fontStyle}>
            {tieneContenido
              ? previewText
              : <span className={styles.previewVacio}>— escribe para ver la vista previa —</span>
            }
          </div>
        )}
      </div>
    </div>
  )
}
