// SimpleFieldEditor.jsx — v3
// Maneja los elementos que no son texto rico: img, url, mail, hr
// FIXES en esta versión:
//   - Imagen: bug de fileRef null cuando se abre desde el preview
//   - Mail: validación de formato de correo electrónico
//   - Imagen: validación de tamaño máximo 2 MB
//   - URL: campo opcional de texto ancla (anchor text)
//   - Error handler con mensajes amigables para el usuario
import { useRef, useState, useCallback } from 'react'
import AlignButtons from './AlignButtons'
import styles from './SimpleFieldEditor.module.css'

// ── Tamaño máximo permitido para imágenes: 2 MB ──────────────────────
const MAX_IMG_BYTES = 2 * 1024 * 1024  // 2 * 1024 KB * 1024 B = 2,097,152 bytes

// ── Regex para validar formato de email ──────────────────────────────
// Verifica que tenga: texto@dominio.extension
// Ejemplo válido:   usuario@correo.gob.mx
// Ejemplo inválido: usuario@, @correo.com, sinArroba
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Ícono SVG de sobre para correo ───────────────────────────────────
function IconoSobre({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 20" fill="none">
      <rect x="1" y="1" width="22" height="18" rx="3" stroke="#880e4f" strokeWidth="1.8"/>
      <path d="M1 5l11 8 11-8" stroke="#880e4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Ícono de imagen ───────────────────────────────────────────────────
function IconoImagen({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 22" fill="none">
      <rect x="1" y="1" width="22" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.7"/>
      <path d="M1 19l6-7 4 4.5 4-5 8 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function SimpleFieldEditor({ tipo, contenido, align, cssClases, onChange, onFileSelected }) {
  const fileRef = useRef(null)

  // Estado de preview de imagen (URL temporal del objeto File)
  const [previewUrl,  setPreviewUrl]  = useState(null)
  const [isDragging,  setIsDragging]  = useState(false)

  // Estado de error amigable para el usuario
  const [errorMsg,    setErrorMsg]    = useState('')

  // Estado de validación de mail
  const [mailValido,  setMailValido]  = useState(true)

  // Estado para URL con texto ancla opcional
  // anchorText = texto visible del link (si está vacío, se muestra la URL)
  const [anchorText,  setAnchorText]  = useState('')
  const [mostrarAnchor, setMostrarAnchor] = useState(false)

  // Función que notifica cambios al componente padre (Section/Subsegment)
  const notificar = useCallback((extras = {}) => {
    onChange({
      contenido: extras.contenido !== undefined ? extras.contenido : contenido,
      align:     extras.align     !== undefined ? extras.align     : (align || 'left'),
      cssClases: cssClases || '',
    })
  }, [contenido, align, cssClases, onChange])

  // ── Procesar archivo de imagen ────────────────────────────────────
  // Se llama cuando el usuario selecciona o arrastra una imagen.
  const procesarArchivo = useCallback((file) => {
    if (!file) return
    setErrorMsg('') // limpiar errores anteriores

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setErrorMsg('⚠ Solo se permiten archivos de imagen (JPG, PNG, GIF, etc.)')
      return
    }

    // Validar tamaño máximo 2 MB
    // file.size viene en bytes. 2 MB = 2 * 1024 * 1024 = 2,097,152 bytes
    if (file.size > MAX_IMG_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setErrorMsg(`⚠ La imagen pesa ${sizeMB} MB. El máximo permitido es 2 MB.`)
      return
    }

    // Crear URL temporal para mostrar preview sin necesitar subir el archivo
    // URL.createObjectURL crea una URL tipo "blob:http://..." que solo existe
    // en memoria mientras la pestaña esté abierta
    if (previewUrl) URL.revokeObjectURL(previewUrl) // liberar memoria anterior
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    notificar({ contenido: file.name })
    if (onFileSelected) onFileSelected(file)
  }, [previewUrl, notificar, onFileSelected])

  // ── Click en la zona de imagen ────────────────────────────────────
  // FIX del bug: el input file a veces no se monta inmediatamente después
  // de que el acordeón abre. Usamos un pequeño delay para asegurar que
  // el DOM tenga el elemento antes de hacer click.
  const abrirSelectorArchivo = useCallback(() => {
    // Si ya está disponible, hacer click directo
    if (fileRef.current) {
      fileRef.current.click()
      return
    }
    // Si no está disponible (bug de timing), esperar un frame y reintentar
    requestAnimationFrame(() => {
      if (fileRef.current) fileRef.current.click()
    })
  }, [])

  // ── SEPARADOR (hr) ────────────────────────────────────────────────
  if (tipo === 'hr') return (
    <div className={styles.wrap}>
      <span className={styles.lbl}>Vista previa del separador:</span>
      <hr className={styles.hrLine} />
      <span className={styles.desc}>Línea horizontal que separa dos partes del documento.</span>
    </div>
  )

  // ── IMAGEN ────────────────────────────────────────────────────────
  if (tipo === 'img') return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>Imagen del documento</label>
      <span className={styles.desc}>Tamaño máximo: 2 MB — Formatos: JPG, PNG, GIF, WEBP</span>

      {/* Mensaje de error amigable */}
      {errorMsg && (
        <div className={styles.errorBox}>
          {errorMsg}
          <button className={styles.errorCerrar} onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}

      {/* Zona de drag & drop */}
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} ${contenido ? styles.dropZoneConArchivo : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); procesarArchivo(e.dataTransfer.files[0]) }}
        onClick={abrirSelectorArchivo}
      >
        {previewUrl
          ? <img src={previewUrl} alt={contenido} className={styles.imgPreviewReal} />
          : (
            <div className={styles.dropPlaceholder}>
              <span className={styles.dropIcon}><IconoImagen size={32} /></span>
              <span className={styles.dropTexto}>
                {contenido
                  ? <><strong>{contenido}</strong><br/><em>Clic para cambiar</em></>
                  : <><strong>Clic o arrastra una imagen aquí</strong><br/>JPG, PNG — máx. 2 MB</>
                }
              </span>
            </div>
          )
        }
      </div>

      {/* Input oculto — se activa con abrirSelectorArchivo() */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles.fileInputOculto}
        onChange={e => procesarArchivo(e.target.files?.[0])}
      />

      {/* Botón alternativo con estilo institucional */}
      <button className={styles.btnSeleccionar} onClick={abrirSelectorArchivo} type="button">
        <IconoImagen size={16} />
        {contenido ? 'Cambiar imagen' : 'Seleccionar imagen...'}
      </button>

      {contenido && (
        <div className={styles.imgNombreTag}>
          <span>🖼</span><span>{contenido}</span>
        </div>
      )}

      <div className={styles.alignRow}>
        <span className={styles.alignLbl}>Alineación:</span>
        <AlignButtons align={align} onAlign={v => notificar({ align: v })} />
      </div>
    </div>
  )

  // ── CORREO ELECTRÓNICO ────────────────────────────────────────────
  if (tipo === 'mail') return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>
        <span className={styles.lblConIcono}>
          <IconoSobre size={16} />
          Dirección de correo electrónico
        </span>
      </label>

      <input
        type="email"
        className={`${styles.input} ${!mailValido && contenido ? styles.inputError : ''}`}
        value={contenido}
        placeholder="orientacion@conamed.gob.mx"
        onChange={e => {
          const val = e.target.value
          // Validar formato de email mientras escribe
          const esValido = !val || EMAIL_REGEX.test(val)
          setMailValido(esValido)
          notificar({ contenido: val })
        }}
        onBlur={() => {
          // Al perder el foco, validar y mostrar mensaje si es inválido
          if (contenido && !EMAIL_REGEX.test(contenido)) {
            setMailValido(false)
            setErrorMsg('⚠ El formato del correo no es válido. Ejemplo: nombre@dominio.com')
          } else {
            setMailValido(true)
            setErrorMsg('')
          }
        }}
      />

      {/* Mensaje de error de validación */}
      {errorMsg && (
        <div className={styles.errorBox}>
          {errorMsg}
          <button className={styles.errorCerrar} onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}

      {/* Preview del correo */}
      {contenido && mailValido && (
        <div className={styles.previewWrap}>
          <span className={styles.previewLblSmall}>Vista previa:</span>
          <div className={styles.previewArea} style={{ textAlign: align || 'left' }}>
            <a className={styles.linkMail} href={`mailto:${contenido}`}
              onClick={e => e.preventDefault()}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px' }}>
                <IconoSobre size={14} />
                {contenido}
              </span>
            </a>
          </div>
        </div>
      )}

      <div className={styles.alignRow}>
        <span className={styles.alignLbl}>Alineación:</span>
        <AlignButtons align={align} onAlign={v => notificar({ align: v })} />
      </div>
    </div>
  )

  // ── URL ────────────────────────────────────────────────────────────
  // Incluye campo opcional de texto ancla (anchor text):
  //   - Si anchorText existe: <a href="url">texto visible</a>
  //   - Si no existe:         <a href="url">url</a>
  // En la BD se guarda:
  //   - resource_desc = url real
  //   - section_content = anchorText (si existe) o url
  return (
    <div className={styles.wrap}>
      <label className={styles.lbl}>Dirección de internet (URL)</label>

      <input
        type="url"
        className={styles.input}
        value={contenido}
        placeholder="https://www.conamed.gob.mx"
        onChange={e => notificar({ contenido: e.target.value })}
      />

      {/* Toggle para activar el texto ancla opcional */}
      <div className={styles.anchorToggleRow}>
        <label className={styles.anchorToggleLabel}>
          <input
            type="checkbox"
            checked={mostrarAnchor}
            onChange={e => {
              setMostrarAnchor(e.target.checked)
              if (!e.target.checked) setAnchorText('') // limpiar si se desactiva
            }}
            className={styles.anchorCheckbox}
          />
          <span title="Si activas esta opción, puedes poner un texto personalizado que el usuario verá en lugar de la URL completa">
            ✏ Texto visible del link (opcional)
          </span>
        </label>
      </div>

      {/* Campo de texto ancla — solo visible cuando el toggle está activado */}
      {mostrarAnchor && (
        <div className={styles.anchorFieldWrap}>
          <label className={styles.anchorLabel}>Texto del Link</label>
          <input
            type="text"
            className={styles.input}
            value={anchorText}
            placeholder="Ej: Visita el sitio de CONAMED"
            onChange={e => setAnchorText(e.target.value)}
          />
          <span className={styles.anchorHint}>
            El usuario verá este texto en lugar de la URL completa.
          </span>
        </div>
      )}

      {/* Preview del link */}
      {contenido && (
        <div className={styles.previewWrap}>
          <span className={styles.previewLblSmall}>Vista previa:</span>
          <div className={styles.previewArea} style={{ textAlign: align || 'left' }}>
            <a className={styles.linkUrl} href={contenido} onClick={e => e.preventDefault()}>
              <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
                <path d="M8 14l6-6M10.5 7.5l1.5-1.5a3.5 3.5 0 014.95 4.95l-1.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M11.5 14.5l-1.5 1.5A3.5 3.5 0 015.05 11L6.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              {/* Mostrar anchorText si existe, si no la URL */}
              {(mostrarAnchor && anchorText) ? anchorText : contenido}
            </a>
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
