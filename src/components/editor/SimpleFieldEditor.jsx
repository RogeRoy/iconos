// SimpleFieldEditor.jsx — Campos simples para url, mail, img, hr.
import AlignButtons from './AlignButtons'
import styles from './SimpleFieldEditor.module.css'

export default function SimpleFieldEditor({ tipo, contenido, align, cssClases, onChange }) {
  const notificar = (extras={}) => onChange({
    contenido: extras.contenido !== undefined ? extras.contenido : contenido,
    align:     extras.align     !== undefined ? extras.align     : (align||'left'),
    cssClases: cssClases || '',
  })

  if (tipo === 'hr') return (
    <div className={styles.wrap}>
      <span className={styles.lbl}>Vista previa:</span>
      <hr className={styles.hrLine}/>
      <span className={styles.desc}>Esta línea aparecerá en el documento como separador visual.</span>
    </div>
  )

  if (tipo === 'img') return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>Nombre o ruta de la imagen</label>
      <input type="text" className={styles.input} value={contenido} placeholder="foto-portada.jpg"
        onChange={(e)=>notificar({contenido:e.target.value})} />
      <span className={styles.desc}>📁 Formatos permitidos: JPG, PNG — máx. 2 MB</span>
      {contenido && <div className={styles.preview}>🖼 <strong>{contenido}</strong></div>}
      <div className={styles.alignRow}>
        <span className={styles.alignLbl}>Alineación de la imagen:</span>
        <AlignButtons align={align} onAlign={(v)=>notificar({align:v})} />
      </div>
    </div>
  )

  return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>
        {tipo==='url' ? 'Dirección de internet (URL)' : 'Dirección de correo electrónico'}
      </label>
      <input type={tipo==='mail'?'email':'url'} className={styles.input} value={contenido}
        placeholder={tipo==='url'?'https://www.conamed.gob.mx':'orientacion@conamed.gob.mx'}
        onChange={(e)=>notificar({contenido:e.target.value})} />
      {contenido && (
        <span className={styles.linkPreview}>
          {tipo==='url' ? `🔗 ${contenido}` : `✉️ ${contenido}`}
        </span>
      )}
      <div className={styles.alignRow}>
        <span className={styles.alignLbl}>Alineación:</span>
        <AlignButtons align={align} onAlign={(v)=>notificar({align:v})} />
      </div>
    </div>
  )
}
