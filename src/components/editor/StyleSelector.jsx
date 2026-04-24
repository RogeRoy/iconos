import styles from './StyleSelector.module.css'

const FONTS = [
  { id:'',         label:'— Sin fuente —' },
  { id:'noto-sans',label:'Noto Sans'       },
  { id:'patria',   label:'Patria (Georgia)'},
]
const FONT_FAMILY = {
  '':'inherit',
  'noto-sans':'"Noto Sans", sans-serif',
  'patria':'Georgia, "Times New Roman", serif',
}

export default function StyleSelector({ font, onFontChange, previewHtml, previewText, previewStyle }) {
  const tieneContenido = previewHtml || previewText
  const boxStyle = { fontFamily: FONT_FAMILY[font]||'inherit', ...(previewStyle||{}) }

  return (
    <div className={styles.styleRow}>
      <div className={styles.selectorWrap}>
        <label className={styles.selectorLabel}>Fuente</label>
        <select className={styles.select} value={font||''} onChange={e=>onFontChange(e.target.value)}>
          {FONTS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>
      <div className={styles.previewWrap}>
        <span className={styles.previewLabel}>Vista previa</span>
        {previewHtml ? (
          <div className={styles.previewBox} style={boxStyle}
            dangerouslySetInnerHTML={{ __html: previewHtml }}/>
        ) : (
          <div className={styles.previewBox} style={boxStyle}>
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
