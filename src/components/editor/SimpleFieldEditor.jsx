import { useRef } from 'react'
import AlignButtons from './AlignButtons'
import styles from './SimpleFieldEditor.module.css'

export default function SimpleFieldEditor({ tipo, contenido, align, cssClases, onChange }) {
  const fileRef = useRef(null)
  const notificar = (extras={}) => onChange({
    contenido: extras.contenido !== undefined ? extras.contenido : contenido,
    align:     extras.align     !== undefined ? extras.align     : (align||'left'),
    cssClases: cssClases||'',
  })

  if (tipo==='hr') return (
    <div className={styles.wrap}>
      <span className={styles.lbl}>Vista previa:</span>
      <hr className={styles.hrLine}/>
      <span className={styles.desc}>Esta línea aparecerá en el documento como separador visual.</span>
    </div>
  )

  if (tipo==='img') return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>Seleccionar imagen</label>
      <label className={styles.fileLabel}>
        🖼 {contenido ? 'Cambiar imagen' : 'Seleccionar archivo...'}
        <input ref={fileRef} type="file" accept="image/*" className={styles.fileInput}
          onChange={e=>{ const f=e.target.files?.[0]; if(f) notificar({contenido:f.name}) }}/>
      </label>
      <span className={styles.desc}>Formatos: JPG, PNG — máx. 2 MB</span>
      {contenido && <div className={styles.imgPreview}>🖼 <strong>{contenido}</strong></div>}
      <div className={styles.alignRow}>
        <span className={styles.alignLbl}>Alineación de la imagen:</span>
        <AlignButtons align={align} onAlign={v=>notificar({align:v})}/>
      </div>
    </div>
  )

  // url / mail
  const isUrl  = tipo==='url'
  const isMail = tipo==='mail'

  return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>
        {isUrl ? 'Dirección de internet (URL)' : 'Dirección de correo electrónico'}
      </label>
      <input type={isMail?'email':'url'} className={styles.input} value={contenido}
        placeholder={isUrl?'https://www.conamed.gob.mx':'orientacion@conamed.gob.mx'}
        onChange={e=>notificar({contenido:e.target.value})}/>

      {/* Vista previa del enlace con alineación aplicada */}
      <div className={styles.previewWrap}>
        <span className={styles.previewLbl}>Vista previa:</span>
        <div className={styles.previewArea} style={{ textAlign: align||'left' }}>
          {contenido ? (
            <a
              className={isUrl ? styles.linkUrl : styles.linkMail}
              href={isMail?`mailto:${contenido}`:contenido}
              target={isUrl?'_blank':'_self'} rel="noreferrer"
              onClick={e=>e.preventDefault()}>
              {isUrl ? `🔗 ${contenido}` : `✉️ ${contenido}`}
            </a>
          ) : (
            <span className={styles.previewVacio}>— escribe para ver la vista previa —</span>
          )}
        </div>
      </div>

      <div className={styles.alignRow}>
        <span className={styles.alignLbl}>Alineación:</span>
        <AlignButtons align={align} onAlign={v=>notificar({align:v})}/>
      </div>
    </div>
  )
}
