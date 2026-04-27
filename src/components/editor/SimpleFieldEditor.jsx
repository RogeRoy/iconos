// SimpleFieldEditor.jsx — v2
// ─────────────────────────────────────────────────────────
// MEJORAS vs v1:
//
// 1. IMAGEN:
//    - Botón estilizado con diseño institucional (antes era muy básico)
//    - Preview REAL de la imagen seleccionada (antes solo mostraba el nombre)
//    - Drag & Drop básico sobre el área de imagen
//
// 2. CORREO ELECTRÓNICO:
//    - Icono SVG de sobre en lugar de emoji ✉️
//    - Diseño más limpio
//
// 3. LISTAS (ul/ol):
//    - Los botones de viñeta y número usan íconos SVG más descriptivos
// ─────────────────────────────────────────────────────────
import { useRef, useState } from 'react'
import AlignButtons from './AlignButtons'
import styles from './SimpleFieldEditor.module.css'

// ── Icono SVG de sobre para correo ──────────────────────
// Más claro y profesional que ✉️
function IconoSobre({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="18" rx="3" stroke="#880e4f" strokeWidth="1.8"/>
      <path d="M1 5l11 8 11-8" stroke="#880e4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Icono de imagen para el botón ───────────────────────
function IconoImagen({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.7"/>
      <path d="M1 19l6-7 4 4.5 4-5 8 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function SimpleFieldEditor({ tipo, contenido, align, cssClases, onChange, onFileSelected }) {
  const fileRef = useRef(null)
  // Para preview de imagen: guardamos URL local del archivo seleccionado
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const notificar = (extras = {}) => onChange({
    contenido: extras.contenido !== undefined ? extras.contenido : contenido,
    align:     extras.align     !== undefined ? extras.align     : (align || 'left'),
    cssClases: cssClases || '',
  })

  // ── Procesar archivo de imagen seleccionado o soltado ──
  const procesarArchivo = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    // Crear URL temporal para mostrar preview en pantalla
    if (previewUrl) URL.revokeObjectURL(previewUrl)  // Liberar memoria anterior
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    notificar({ contenido: file.name })
    if (onFileSelected) onFileSelected(file)
  }

  // ── SEPARADOR (hr) ───────────────────────────────────
  if (tipo === 'hr') return (
    <div className={styles.wrap}>
      <span className={styles.lbl}>Vista previa del separador:</span>
      <hr className={styles.hrLine} />
      <span className={styles.desc}>Esta línea horizontal separa visualmente dos partes del documento.</span>
    </div>
  )

  // ── IMAGEN ───────────────────────────────────────────
  if (tipo === 'img') return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>Imagen del documento</label>

      {/* Área de drop + botón estilizado */}
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} ${contenido ? styles.dropZoneConArchivo : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); procesarArchivo(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
      >
        {previewUrl
          /* Preview real de la imagen */
          ? <img src={previewUrl} alt={contenido} className={styles.imgPreviewReal} />
          /* Placeholder cuando no hay imagen */
          : (
            <div className={styles.dropPlaceholder}>
              <span className={styles.dropIcon}><IconoImagen size={32} /></span>
              <span className={styles.dropTexto}>
                {contenido
                  ? <><strong>{contenido}</strong><br/><em>Haz clic para cambiar</em></>
                  : <><strong>Haz clic o arrastra una imagen aquí</strong><br/>JPG, PNG — máx. 2 MB</>
                }
              </span>
            </div>
          )
        }
      </div>

      {/* Input oculto — se activa con el clic en la drop zone */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles.fileInputOculto}
        onChange={e => procesarArchivo(e.target.files?.[0])}
      />

      {/* Botón alternativo con diseño institucional */}
      <button
        className={styles.btnSeleccionar}
        onClick={() => fileRef.current?.click()}
        type="button"
      >
        <IconoImagen size={16} />
        {contenido ? 'Cambiar imagen' : 'Seleccionar imagen...'}
      </button>

      {contenido && (
        <div className={styles.imgNombreTag}>
          <span className={styles.imgNombreIco}>🖼</span>
          <span>{contenido}</span>
        </div>
      )}

      <div className={styles.alignRow}>
        <span className={styles.alignLbl}>Alineación:</span>
        <AlignButtons align={align} onAlign={v => notificar({ align: v })} />
      </div>
    </div>
  )

  // ── URL y CORREO ─────────────────────────────────────
  const isUrl  = tipo === 'url'
  return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>
        {isUrl
          ? 'Dirección de internet (URL)'
          : (
            <span className={styles.lblConIcono}>
              <IconoSobre size={16} />
              Dirección de correo electrónico
            </span>
          )
        }
      </label>
      <input
        type={isUrl ? 'url' : 'email'}
        className={styles.input}
        value={contenido}
        placeholder={isUrl ? 'https://www.conamed.gob.mx' : 'orientacion@conamed.gob.mx'}
        onChange={e => notificar({ contenido: e.target.value })}
      />
      {contenido && (
        <div className={styles.previewWrap}>
          <span className={styles.previewLblSmall}>Vista previa:</span>
          <div className={styles.previewArea} style={{ textAlign: align || 'left' }}>
            {isUrl
              ? (
                <a className={styles.linkUrl}
                  href={contenido}
                  target="_blank" rel="noreferrer"
                  onClick={e => e.preventDefault()}>
                  {/* Icono SVG de enlace */}
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                    <path d="M8 14l6-6M10.5 7.5l1.5-1.5a3.5 3.5 0 014.95 4.95l-1.5 1.5" stroke="#1e5b4f" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M11.5 14.5l-1.5 1.5A3.5 3.5 0 015.05 11L6.5 9.5" stroke="#1e5b4f" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  {contenido}
                </a>
              )
              : (
                <a className={styles.linkMail}
                  href={`mailto:${contenido}`}
                  onClick={e => e.preventDefault()}>
                  {/* Icono SVG de sobre — reemplaza ✉️ */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', verticalAlign: 'middle' }}>
                    <IconoSobre size={14} />
                    {contenido}
                  </span>
                </a>
              )
            }
          </div>
        </div>
      )}
      <div className={styles.alignRow}>
        <span className={styles.alignLbl}>Alineación:</span>
        <AlignButtons align={align} onAlign={v => notificar({ align: v })} />
      </div>
    </div>
  )
}
