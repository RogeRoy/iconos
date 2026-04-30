// ─────────────────────────────────────────────────────────────────────────
// Section.jsx — v5
// ─────────────────────────────────────────────────────────────────────────
//
// CAMBIOS EN ESTA VERSIÓN:
//
//   1. navFromPreview (objeto unificado) reemplaza 2 props separadas
//      ANTES: activeSubIdFromPreview, activeElemIdFromPreview
//      AHORA: navFromPreview = { subId, elemId }
//
//   2. Scroll mejorado preview → builder
//      ANTES: setTimeout(80) fijo — a veces el acordeón no había
//             terminado de abrirse y el scroll no encontraba el elemento.
//      AHORA: requestAnimationFrame() — espera al siguiente frame de
//             dibujo del navegador, cuando el DOM ya está actualizado.
//
//   3. Confirmación antes de eliminar secciones
//      ANTES: clic en 🗑 → borra inmediatamente sin preguntar.
//      AHORA: window.confirm() pregunta "¿Estás seguro?".
//             Si el usuario cancela, NO se borra nada.
//
//   4. Baja lógica: botón "Dar de baja" para elementos que vienen de la BD
//      Si el elemento tiene _bdId (fue cargado desde la BD), aparece
//      un botón extra "⬇ Baja" que llama onDarDeBaja en lugar de borrar.
//      Si NO tiene _bdId (es nuevo), se borra normalmente del builder.
//
//   5. genId() usa crypto.randomUUID()
//
//   6. useEffect de sincronización con dependencias correctas
//
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import TypeMenu          from './editor/TypeMenu'
import LayoutButtons     from './editor/LayoutButtons'
import Subsegment        from './Subsegment'
import TitleEditor       from './editor/TitleEditor'
import TextEditor        from './editor/TextEditor'
import RichEditor        from './editor/RichEditor'
import SimpleFieldEditor from './editor/SimpleFieldEditor'
import { findType }      from './editor/elementTypes'
import { genId }         from '../utils/buildJson'
import styles from './Section.module.css'

// Colores de los chips de tipo de elemento
const CHIP_COLORS = {
  h1:'#611232', h2:'#9b2247', h3:'#1e5b4f', p:'#555',
  ul:'#a57f2c', ol:'#7b5800', 'ul-ol':'#8b3a00',
  hl:'#7b5800', note:'#611232', hr:'#888',
  url:'#1e5b4f', mail:'#880e4f', img:'#a57f2c',
}

// ── Preview visual para cada tipo de elemento ─────────────────────────
function PreviewElemento({ elemento }) {
  const { tipo, contenido, html, align, _fileUrl, anchorText } = elemento
  const s = { textAlign: align || 'left' }
  if (!contenido && !html) return null

  if (tipo === 'hl')   return (
    <div className={styles.prevHl} style={s}>
      <span className={styles.prevHlIcon}>⚠</span>
      <div dangerouslySetInnerHTML={{ __html: html || contenido }} />
    </div>
  )
  if (tipo === 'note') return (
    <blockquote className={styles.prevNote} style={s}>
      <div dangerouslySetInnerHTML={{ __html: html || contenido }} />
    </blockquote>
  )
  if (['ul','ol','ul-ol'].includes(tipo)) return (
    <div className={styles.prevLista} style={s} dangerouslySetInnerHTML={{ __html: html || contenido }} />
  )
  if (tipo === 'p') return (
    <div className={styles.prevParrafo} style={s} dangerouslySetInnerHTML={{ __html: html || contenido }} />
  )
  if (['h1','h2','h3'].includes(tipo)) {
    const Tag = tipo
    return <Tag className={styles[`prev${tipo.toUpperCase()}`]} style={s}>{contenido}</Tag>
  }
  if (tipo === 'img' && _fileUrl) return (
    <div className={styles.prevImg} style={s}>
      <img src={_fileUrl} alt={contenido} className={styles.prevImgEl} />
      <span className={styles.prevImgNombre}>{contenido}</span>
    </div>
  )
  if (tipo === 'url' && contenido) return (
    <div className={styles.prevUrl}>
      <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
        <path d="M8 14l6-6M10.5 7.5l1.5-1.5a3.5 3.5 0 014.95 4.95l-1.5 1.5" stroke="#1e5b4f" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M11.5 14.5l-1.5 1.5A3.5 3.5 0 015.05 11L6.5 9.5" stroke="#1e5b4f" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <span className={styles.prevUrlText}>{anchorText || contenido}</span>
    </div>
  )
  if (tipo === 'mail' && contenido) return (
    <div className={styles.prevMail}>
      <svg width="16" height="14" viewBox="0 0 22 18" fill="none">
        <rect x="1" y="1" width="20" height="16" rx="2.5" stroke="#880e4f" strokeWidth="1.6"/>
        <path d="M1 4l10 7 10-7" stroke="#880e4f" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      <span className={styles.prevMailText}>{contenido}</span>
    </div>
  )
  if (tipo === 'hr') return <hr className={styles.prevHr}/>
  return null
}

// ── Editor según el tipo del elemento ─────────────────────────────────
function ElemEditor({ elemento, onUpdate, onFileSelected }) {
  const info = findType(elemento.tipo)
  const tipo = elemento.tipo
  const PH = {
    ul:'Primer punto...', ol:'Primer paso...', 'ul-ol':'Primer punto...',
    hl:'Aviso importante...', note:'Nota complementaria...'
  }

  if (['h1','h2','h3'].includes(tipo))
    return <TitleEditor
      contenido={elemento.contenido || ''}
      align={elemento.align || info.defAlign || 'left'}
      font={elemento.font || ''}
      cssClases={elemento.cssClases || info.cssClases}
      onChange={onUpdate}
    />
  if (tipo === 'p')
    return <TextEditor
      html={elemento.html || ''}
      align={elemento.align || 'justify'}
      font={elemento.font || ''}
      cssClases={elemento.cssClases || info.cssClases}
      onChange={({ html, align, font, cssClases }) =>
        onUpdate({ html, align, font, cssClases,
          contenido: new DOMParser().parseFromString(html, 'text/html').body.textContent || '' })
      }
    />
  if (['ul','ol','ul-ol','hl','note'].includes(tipo))
    return <RichEditor
      tipo={tipo}
      html={elemento.html || ''}
      align={elemento.align || info.defAlign || 'left'}
      font={elemento.font || ''}
      cssClases={elemento.cssClases || info.cssClases}
      hasListBar={info.hasListBar}
      hasFormatBar={true}
      placeholder={PH[tipo] || 'Escribe aquí...'}
      onChange={({ html, align, font, cssClases }) =>
        onUpdate({ html, align, font, cssClases,
          contenido: new DOMParser().parseFromString(html, 'text/html').body.textContent || '' })
      }
    />
  if (['url','mail','img','hr'].includes(tipo))
    return <SimpleFieldEditor
      tipo={tipo}
      contenido={elemento.contenido || ''}
      align={elemento.align || info.defAlign || 'left'}
      cssClases={elemento.cssClases || info.cssClases}
      anchorText={elemento.anchorText || ''}
      onChange={({ contenido, align, cssClases, anchorText }) =>
        onUpdate({ contenido, align, cssClases, anchorText })
      }
      onFileSelected={tipo === 'img'
        ? (file) => {
            onUpdate({ contenido: file.name, _fileUrl: URL.createObjectURL(file) })
            if (onFileSelected) onFileSelected(file)
          }
        : undefined
      }
    />
  return null
}

// ── ElementoItem — un elemento individual con su acordeón ─────────────
//
// NUEVO: botón "Dar de baja" para elementos que vienen de la BD (_bdId).
// NUEVO: confirmación antes de eliminar.
// NUEVO: indicador de carga cuando se está subiendo imagen.
function ElementoItem({
  elemento, elemIndex, totalElems,
  isOpen, onToggle,
  onUpdate, onDelete, onDarDeBaja,
  onMover, onFileSelected,
  uploadingImg,   // boolean: ¿se está subiendo la imagen de este elemento?
}) {
  // ── Confirmación antes de eliminar ────────────────────────────────
  // window.confirm() muestra un diálogo nativo del navegador.
  // Si el usuario hace clic en "Cancelar", retorna false y NO se borra.
  // Si hace clic en "Aceptar", retorna true y se borra.
  //
  // ¿Por qué usar window.confirm en lugar de un modal personalizado?
  // Es la forma más simple y sin dependencias. Para un proyecto estudiantil
  // es perfectamente válido. Un modal personalizado requeriría más código.
  const handleEliminar = () => {
    const confirmar = window.confirm(
      `¿Eliminar este elemento (${findType(elemento.tipo).label})?\n\n` +
      (elemento.contenido
        ? `Contenido: "${elemento.contenido.substring(0, 60)}..."\n\n`
        : '') +
      'Esta acción no se puede deshacer.'
    )
    if (confirmar) onDelete(elemento.id)
  }

  // Si el elemento viene de la BD (_bdId existe), "eliminar" es dar de baja lógica
  // Si es nuevo (sin _bdId), "eliminar" borra del builder directamente
  const handleBaja = () => {
    if (!elemento._bdId) {
      // Elemento nuevo: simplemente eliminarlo del builder
      handleEliminar()
      return
    }
    // Elemento de la BD: confirmar baja lógica
    const confirmar = window.confirm(
      `¿Dar de baja este elemento (${findType(elemento.tipo).label})?\n\n` +
      'El registro quedará con section_status = false.\n' +
      'Podrá ser restaurado posteriormente.'
    )
    if (confirmar) onDarDeBaja(elemento)
  }

  return (
    <div className={styles.elementoCard} id={`elemento-${elemento.id}`}>
      <div className={styles.elementoHead} onClick={onToggle}>
        <span className={styles.chip} style={{ background: CHIP_COLORS[elemento.tipo] || '#555' }}>
          {findType(elemento.tipo).label}
        </span>

        {/* Indicador de baja lógica: muestra badge si tiene _bdId */}
        {elemento._bdId && (
          <span style={{
            fontSize:'9px', fontWeight:700, background:'rgba(30,91,79,.15)',
            color:'#1e5b4f', padding:'1px 6px', borderRadius:'100px',
            border:'1px solid rgba(30,91,79,.3)', flexShrink:0,
          }}>
            BD#{elemento._bdId}
          </span>
        )}

        {/* Resumen cuando está cerrado */}
        {!isOpen && (
          <span className={styles.elementoResumen}>
            {/* NUEVO: indicador de carga de imagen */}
            {uploadingImg ? (
              <em style={{ color:'#a57f2c', fontSize:'11px' }}>⏳ Subiendo imagen...</em>
            ) : elemento.contenido ? (
              elemento.contenido.substring(0, 60) + (elemento.contenido.length > 60 ? '…' : '')
            ) : (
              <em style={{ color:'#bbb', fontSize:'11px' }}>Sin contenido</em>
            )}
          </span>
        )}

        <div className={styles.elemActions} onClick={e => e.stopPropagation()}>
          <button className={styles.bicoBtn} onClick={() => onMover(-1)} disabled={elemIndex === 0} title="Subir">↑</button>
          <button className={styles.bicoBtn} onClick={() => onMover(1)}  disabled={elemIndex === totalElems - 1} title="Bajar">↓</button>

          {/* Si tiene _bdId → botón de baja lógica
              Si no tiene _bdId → botón de eliminar normal */}
          {elemento._bdId ? (
            <button
              className={`${styles.bicoBtn} ${styles.bicoBaja}`}
              onClick={handleBaja}
              title="Dar de baja (section_status = false)"
            >⬇</button>
          ) : (
            <button
              className={`${styles.bicoBtn} ${styles.bicoDanger}`}
              onClick={handleEliminar}
              title="Eliminar"
            >✕</button>
          )}
        </div>
        <span className={styles.elemArrow}>{isOpen ? '▾' : '▸'}</span>
      </div>

      {isOpen && (
        <div className={styles.elementoBody}>
          <ElemEditor
            elemento={elemento}
            onUpdate={c => onUpdate(elemento.id, c)}
            onFileSelected={f => onFileSelected && onFileSelected(elemento.id, f)}
          />
          <div className={styles.previewWrap}>
            <span className={styles.previewLbl}>👁 Vista previa</span>
            <div className={styles.previewBox}>
              <PreviewElemento elemento={elemento} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// SECCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function Section({
  section, sectionIndex,
  isOpen, onToggle,
  onUpdate, onDelete,
  onMoverSec, canSecArriba, canSecAbajo,
  onFileSelected,
  navFromPreview,   // ← NUEVO: objeto { subId, elemId }
  onElementoAbierto,
}) {
  const [activeElem, setActiveElem] = useState(null)
  const [activeSub,  setActiveSub]  = useState(-1)
  const [uploadingImgId, setUploadingImgId] = useState(null) // ID del elemento cuya imagen se sube

  // ── Sincronizar navegación desde preview ──────────────────────────
  // ANTES: 2 useEffect separados, con setTimeout(60) y setTimeout(120).
  // AHORA: 1 useEffect con requestAnimationFrame().
  //
  // requestAnimationFrame() ejecuta el callback ANTES del próximo repintado
  // del navegador — es decir, exactamente cuando el DOM ya está actualizado
  // pero antes de que el browser lo dibuje en pantalla.
  // Es más preciso que setTimeout(n) que no garantiza el timing.
  //
  // El array de dependencias [navFromPreview, section.layout, ...] es correcto:
  // el efecto corre cada vez que navFromPreview cambia.
  useEffect(() => {
    if (!navFromPreview) return
    const { subId, elemId } = navFromPreview
    if (!subId && !elemId) return

    if (section.layout === 'full' && elemId) {
      // Layout de columna única: buscar el elemento directo
      const idx = (section.elementos || []).findIndex(e => e.id === elemId)
      if (idx !== -1) {
        setActiveElem(idx)
        // requestAnimationFrame: esperar al próximo repintado para hacer scroll
        requestAnimationFrame(() => {
          const el = document.getElementById(`elemento-${elemId}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      }
    } else if (subId) {
      // Layout con columnas: abrir el subsegmento correcto
      const subIdx = (section.subsegmentos || []).findIndex(s => s.id === subId)
      if (subIdx !== -1) {
        setActiveSub(subIdx)
        // Doble requestAnimationFrame: el primero espera que el subsegmento se abra,
        // el segundo espera que su contenido (el elemento) esté en el DOM.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (elemId) {
              const el = document.getElementById(`elemento-${elemId}`)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          })
        })
      }
    }
  }, [navFromPreview, section.layout, section.elementos, section.subsegmentos])

  // ── genSubId ──────────────────────────────────────────────────────
  const genSubId = () => genId('sub')

  // ── Cambio de layout ──────────────────────────────────────────────
  const applyLayout = (nuevoLayout) => {
    const cols = nuevoLayout === 'half' ? 2 : nuevoLayout === 'thirds' ? 3 : 0
    let subs = [...(section.subsegmentos || [])]
    if (cols > 0) {
      while (subs.length < cols) {
        subs.push({ id: genSubId(), nombre: `Columna ${subs.length + 1}`, elementos: [] })
      }
      setActiveSub(0)
    } else {
      setActiveSub(-1)
    }
    onUpdate(section.id, { ...section, layout: nuevoLayout, subsegmentos: subs })
  }

  const toggleSub = (idx) => setActiveSub(prev => prev === idx ? -1 : idx)

  // ── CRUD elementos (layout full) ──────────────────────────────────
  const agregarElemento = (_, tipo) => {
    const info   = findType(tipo)
    const nuevos = [...section.elementos, {
      id:        genId('elem'),
      tipo,
      contenido: '',
      html:      '',
      align:     info.defAlign || 'left',
      font:      '',
      cssClases: info.cssClases || '',
    }]
    onUpdate(section.id, { ...section, elementos: nuevos })
    setActiveElem(nuevos.length - 1)
  }

  const actualizarElemento = (elemId, c) =>
    onUpdate(section.id, {
      ...section,
      elementos: (section.elementos || []).map(el => el.id === elemId ? { ...el, ...c } : el)
    })

  // ── NUEVO: onFileSelected con indicador de progreso ───────────────
  // Cuando se selecciona una imagen, mostramos "⏳ Subiendo imagen..."
  // en el elemento. Simulamos un estado de carga.
  // (La subida real ocurre en el hook useGuardarBoletin al guardar.)
  const handleFileSelected = useCallback((elemId, file) => {
    setUploadingImgId(elemId)
    // La imagen se procesa de forma síncrona (solo genera URL local)
    // Limpiamos el indicador después de un momento para dar feedback
    setTimeout(() => setUploadingImgId(null), 1500)
    if (onFileSelected) onFileSelected(elemId, file)
  }, [onFileSelected])

  const eliminarElemento = (elemId) => {
    onUpdate(section.id, {
      ...section,
      elementos: (section.elementos || []).filter(el => el.id !== elemId)
    })
    setActiveElem(null)
  }

  // ── NUEVO: dar de baja lógica de un elemento ──────────────────────
  // onDarDeBaja se pasa hacia arriba (a BuilderPanel → App → useGuardarBoletin)
  // Aquí solo marcamos el elemento como dado de baja en el estado local.
  // El PATCH real a la BD ocurre cuando el usuario presiona Guardar.
  const darDeBajaElemento = (elemento) => {
    onUpdate(section.id, {
      ...section,
      elementos: (section.elementos || []).map(el =>
        el.id === elemento.id
          ? { ...el, _dadoDeBaja: true, section_status: false }  // marca local
          : el
      )
    })
  }

  const moverElemento = (idx, dir) => {
    const dest = idx + dir
    const arr  = [...(section.elementos || [])]
    if (dest < 0 || dest >= arr.length) return
    ;[arr[idx], arr[dest]] = [arr[dest], arr[idx]]
    onUpdate(section.id, { ...section, elementos: arr })
    setActiveElem(dest)
  }

  // ── CRUD subsegmentos ─────────────────────────────────────────────
  const actualizarSub = (subId, datos) =>
    onUpdate(section.id, {
      ...section,
      subsegmentos: (section.subsegmentos || []).map(s => s.id === subId ? datos : s)
    })

  const eliminarSub = (subId) => {
    const confirmar = window.confirm('¿Eliminar esta columna y todo su contenido?')
    if (!confirmar) return
    onUpdate(section.id, {
      ...section,
      subsegmentos: (section.subsegmentos || []).filter(s => s.id !== subId)
    })
    setActiveSub(-1)
  }

  const moverSub = (idx, dir) => {
    const dest = idx + dir
    const arr  = [...(section.subsegmentos || [])]
    if (dest < 0 || dest >= arr.length) return
    ;[arr[idx], arr[dest]] = [arr[dest], arr[idx]]
    onUpdate(section.id, { ...section, subsegmentos: arr })
    setActiveSub(dest)
  }

  // ── Confirmación antes de eliminar sección ────────────────────────
  // NUEVO: el usuario debe confirmar antes de borrar toda la sección.
  const handleEliminarSeccion = () => {
    const totalElems = section.layout === 'full'
      ? (section.elementos || []).length
      : (section.subsegmentos || []).reduce((acc, s) => acc + (s.elementos || []).length, 0)

    const confirmar = window.confirm(
      `¿Eliminar la Sección ${sectionIndex + 1} "${section.nombre || 'sin nombre'}"?\n\n` +
      `Esta sección contiene ${totalElems} elemento(s).\n` +
      'Esta acción no se puede deshacer.'
    )
    if (confirmar) onDelete(section.id)
  }

  const layout = section.layout || 'full'

  // Filtrar elementos dados de baja para no mostrarlos en el builder
  // (siguen en el estado para que buildJson los procese con status=false)
  const elementosVisibles = (section.elementos || []).filter(e => !e._dadoDeBaja)

  return (
    <div className={styles.seccionCard} id={`seccion-${section.id}`}>

      {/* ── Cabecera ──────────────────────────────────────────────── */}
      <div className={styles.seccionHead} onClick={onToggle}>
        <span className={styles.seccionNum}>SEG-{sectionIndex + 1}</span>

        {/* NUEVO: nombre de la sección visible en la cabecera */}
        <span className={styles.seccionNombre}>
          {section.nombre || `Sección ${sectionIndex + 1}`}
        </span>

        <span className={styles.layoutBadge}>
          {layout === 'full' ? '▬' : layout === 'half' ? '▬▬' : '▬▬▬'}
        </span>

        {(layout === 'full' ? elementosVisibles : section.subsegmentos).length > 0 && (
          <span className={styles.seccionCount}>
            {layout === 'full'
              ? `${elementosVisibles.length} elem.`
              : `${section.subsegmentos.length} col.`
            }
          </span>
        )}

        <div className={styles.seccionActions} onClick={e => e.stopPropagation()}>
          <button className={styles.bicoBtn} onClick={() => onMoverSec(-1)} disabled={!canSecArriba} title="Mover arriba">↑</button>
          <button className={styles.bicoBtn} onClick={() => onMoverSec(1)}  disabled={!canSecAbajo}  title="Mover abajo">↓</button>
          {/* NUEVO: confirmación en el onClick */}
          <button className={`${styles.bicoBtn} ${styles.bicoDanger}`} onClick={handleEliminarSeccion} title="Eliminar sección">🗑</button>
        </div>
        <span className={styles.seccionArrow}>{isOpen ? '▾' : '▸'}</span>
      </div>

      {/* ── Cuerpo ────────────────────────────────────────────────── */}
      {isOpen && (
        <div className={styles.seccionBody}>

          {/* NUEVO: input de nombre ahora visible y prominente */}
          <div className={styles.campo}>
            <label>Nombre de la sección</label>
            <input
              type="text"
              value={section.nombre}
              placeholder={`Sección ${sectionIndex + 1}`}
              onChange={e => onUpdate(section.id, { ...section, nombre: e.target.value })}
            />
          </div>

          <LayoutButtons layout={layout} onLayoutChange={applyLayout} />

          {/* ── Layout full: elementos directos ─────────────────── */}
          {layout === 'full' && (
            <>
              <div className={styles.elementosLista}>
                {elementosVisibles.length === 0
                  ? <p className={styles.listaVacia}>Sin elementos. Usa el menú de abajo para agregar.</p>
                  : elementosVisibles.map((elem, idx) => (
                    <ElementoItem
                      key={elem.id}
                      elemento={elem}
                      elemIndex={idx}
                      totalElems={elementosVisibles.length}
                      isOpen={activeElem === idx}
                      onToggle={() => {
                        const ni = activeElem === idx ? null : idx
                        setActiveElem(ni)
                        // Notificar al preview para que haga scroll al elemento
                        if (ni !== null && onElementoAbierto && elementosVisibles[ni]) {
                          onElementoAbierto(elementosVisibles[ni].id)
                        }
                      }}
                      onUpdate={actualizarElemento}
                      onDelete={eliminarElemento}
                      onDarDeBaja={darDeBajaElemento}
                      onMover={dir => moverElemento(idx, dir)}
                      onFileSelected={handleFileSelected}
                      uploadingImg={uploadingImgId === elem.id}
                    />
                  ))
                }
              </div>
              <TypeMenu seccionId={section.id} onAgregar={agregarElemento} />
            </>
          )}

          {/* ── Layout con columnas ──────────────────────────────── */}
          {(layout === 'half' || layout === 'thirds') && (
            <div className={styles.subsegList}>
              {(section.subsegmentos || []).map((sub, idx) => (
                <Subsegment
                  key={sub.id}
                  sub={sub}
                  subIndex={idx}
                  navFromPreview={activeSub === idx ? navFromPreview : { subId: null, elemId: null }}
                  isOpen={activeSub === idx}
                  onToggle={() => toggleSub(idx)}
                  onMover={dir => moverSub(idx, dir)}
                  canArriba={idx > 0}
                  canAbajo={idx < section.subsegmentos.length - 1}
                  onUpdate={actualizarSub}
                  onDelete={eliminarSub}
                  onFileSelected={onFileSelected}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Section
