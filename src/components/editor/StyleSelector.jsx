// components/editor/StyleSelector.jsx
// Selector de fuente + preview en tiempo real.
// Acepta previewHtml (párrafo, con formato bold/italic/etc.)
// o previewText (título, texto plano).
import styles from './StyleSelector.module.css'

export const FONTS = [
  { id: '',          label: '— Sin fuente —'       },
  { id: 'noto-sans', label: 'Noto Sans'             },
  { id: 'patria',    label: 'Patria (Georgia)'      },
]

const FONT_FAMILY = {
  '':          'inherit',
  'noto-sans': '"Noto Sans", sans-serif',
  'patria':    'Georgia, "Times New Roman", serif',
}

export default function StyleSelector({ font, onFontChange, previewHtml, previewText }) {
  // previewHtml: viene del párrafo → tiene tags <b><em><u> → renderizar con dangerouslySetInnerHTML
  // previewText: viene del título  → texto plano → renderizar como children
  const tieneContenido = previewHtml || previewText

  return (
    <div className={styles.styleRow}>
      <div className={styles.selectorWrap}>
        <label className={styles.selectorLabel}>Fuente</label>
        <select
          className={styles.select}
          value={font || ''}
          onChange={(e) => onFontChange(e.target.value)}
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.previewWrap}>
        <span className={styles.previewLabel}>Vista previa</span>
        {/*
          Por qué dangerouslySetInnerHTML para el párrafo:
          El HTML viene del propio editor del usuario (no de fuente externa),
          y necesitamos mostrar <b>, <em>, <u>, highlight tal cual.
          Si usáramos {children}, React escaparía los tags y mostraría texto plano.
        */}
        {previewHtml ? (
          <div
            className={styles.previewBox}
            style={{ fontFamily: FONT_FAMILY[font] || 'inherit' }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        ) : (
          <div
            className={styles.previewBox}
            style={{ fontFamily: FONT_FAMILY[font] || 'inherit' }}
          >
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
