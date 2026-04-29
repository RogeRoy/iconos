// Section.jsx — v4 FINAL
// ─────────────────────────────────────────────────────────
// CORRECCIONES vs v3:
//
// 1. COLUMNAS EN EL BUILDER = VERTICALES (una debajo de la otra)
//    El grid solo existe en el PREVIEW, no en el builder.
//    En el builder cada subsegmento es un .sub-card apilado, 
//    idéntico al monolito v59 (.sub-card uno debajo del otro).
//
// 2. ACORDEÓN DE SUBSEGMENTOS correcto:
//    - Al abrir un subsegmento → los demás se cierran (activeSub === idx)
//    - El estado activeSub es local a Section
//    - Al cambiar layout → activeSub = 0 (abre el primero automáticamente)
//
// 3. TypeMenu DENTRO de CADA subsegmento (no fuera)
//    Cada columna tiene su propio menú para agregar elementos.
//
// 4. Scroll sincronizado: cada elemento tiene id="elemento-{id}"
//    para que PreviewPanel pueda hacer scrollIntoView.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import TypeMenu          from './editor/TypeMenu'
import LayoutButtons     from './editor/LayoutButtons'
import Subsegment        from './Subsegment'
import TitleEditor       from './editor/TitleEditor'
import TextEditor        from './editor/TextEditor'
import RichEditor        from './editor/RichEditor'
import SimpleFieldEditor from './editor/SimpleFieldEditor'
import { findType }      from './editor/elementTypes'
import styles from './Section.module.css'

const CHIP_COLORS = {
  h1:'#611232', h2:'#9b2247', h3:'#1e5b4f', p:'#555',
  ul:'#a57f2c', ol:'#7b5800', 'ul-ol':'#8b3a00',
  hl:'#7b5800', note:'#611232', hr:'#888',
  url:'#1e5b4f', mail:'#880e4f', img:'#a57f2c',
}

// ── Preview visual para cada tipo ─────────────────────────
function PreviewElemento({ elemento }) {
  const { tipo, contenido, html, align, _fileUrl, anchorText } = elemento
  const s = { textAlign: align || 'left' }
  if (!contenido && !html) return null

  if (tipo==='hl') return (
    <div className={styles.prevHl} style={s}>
      <span className={styles.prevHlIcon}>⚠</span>
      <div dangerouslySetInnerHTML={{ __html: html||contenido }} />
    </div>
  )
  if (tipo==='note') return (
    <blockquote className={styles.prevNote} style={s}>
      <div dangerouslySetInnerHTML={{ __html: html||contenido }} />
    </blockquote>
  )
  if (['ul','ol','ul-ol'].includes(tipo)) return (
    <div className={styles.prevLista} style={s} dangerouslySetInnerHTML={{ __html: html||contenido }} />
  )
  if (tipo==='p') return (
    <div className={styles.prevParrafo} style={s} dangerouslySetInnerHTML={{ __html: html||contenido }} />
  )
  if (['h1','h2','h3'].includes(tipo)) {
    const Tag = tipo
    return <Tag className={styles[`prev${tipo.toUpperCase()}`]} style={s}>{contenido}</Tag>
  }
  if (tipo==='img' && _fileUrl) return (
    <div className={styles.prevImg} style={s}>
      <img src={_fileUrl} alt={contenido} className={styles.prevImgEl}/>
      <span className={styles.prevImgNombre}>{contenido}</span>
    </div>
  )
  if (tipo==='url' && contenido) return (
    <div className={styles.prevUrl}>
      <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
        <path d="M8 14l6-6M10.5 7.5l1.5-1.5a3.5 3.5 0 014.95 4.95l-1.5 1.5" stroke="#1e5b4f" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M11.5 14.5l-1.5 1.5A3.5 3.5 0 015.05 11L6.5 9.5" stroke="#1e5b4f" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <span className={styles.prevUrlText}>{anchorText || contenido}</span>
    </div>
  )
  if (tipo==='mail' && contenido) return (
    <div className={styles.prevMail}>
      <svg width="16" height="14" viewBox="0 0 22 18" fill="none">
        <rect x="1" y="1" width="20" height="16" rx="2.5" stroke="#880e4f" strokeWidth="1.6"/>
        <path d="M1 4l10 7 10-7" stroke="#880e4f" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      <span className={styles.prevMailText}>{contenido}</span>
    </div>
  )
  if (tipo==='hr') return <hr className={styles.prevHr}/>
  return null
}

// ── Editor según tipo ──────────────────────────────────────
function ElemEditor({ elemento, onUpdate, onFileSelected }) {
  const info = findType(elemento.tipo); const tipo = elemento.tipo
  const PH = { ul:'Primer punto...', ol:'Primer paso...', 'ul-ol':'Primer punto...', hl:'Aviso importante...', note:'Nota complementaria...' }
  if (['h1','h2','h3'].includes(tipo))
    return <TitleEditor contenido={elemento.contenido||''} align={elemento.align||info.defAlign||'left'} font={elemento.font||''} cssClases={elemento.cssClases||info.cssClases} onChange={onUpdate}/>
  if (tipo==='p')
    return <TextEditor html={elemento.html||''} align={elemento.align||'justify'} font={elemento.font||''} cssClases={elemento.cssClases||info.cssClases} onChange={({html,align,font,cssClases})=>onUpdate({html,align,font,cssClases,contenido:new DOMParser().parseFromString(html,'text/html').body.textContent||''})}/>
  if (['ul','ol','ul-ol','hl','note'].includes(tipo))
    return <RichEditor tipo={tipo} html={elemento.html||''} align={elemento.align||info.defAlign||'left'} font={elemento.font||''} cssClases={elemento.cssClases||info.cssClases} hasListBar={info.hasListBar} hasFormatBar={true} placeholder={PH[tipo]||'Escribe aquí...'} onChange={({html,align,font,cssClases})=>onUpdate({html,align,font,cssClases,contenido:new DOMParser().parseFromString(html,'text/html').body.textContent||''})}/>
  if (['url','mail','img','hr'].includes(tipo))
    return <SimpleFieldEditor tipo={tipo} contenido={elemento.contenido||''} align={elemento.align||info.defAlign||'left'} cssClases={elemento.cssClases||info.cssClases} anchorText={elemento.anchorText||''} onChange={({contenido,align,cssClases,anchorText})=>onUpdate({contenido,align,cssClases,anchorText})} onFileSelected={tipo==='img'?(file)=>{ onUpdate({contenido:file.name,_fileUrl:URL.createObjectURL(file)}); if(onFileSelected)onFileSelected(file) }:undefined}/>
  return null
}

// ── Elemento individual ───────────────────────────────────
function ElementoItem({ elemento, elemIndex, totalElems, isOpen, onToggle, onUpdate, onDelete, onMover, onFileSelected }) {
  return (
    <div className={styles.elementoCard} id={`elemento-${elemento.id}`}>
      <div className={styles.elementoHead} onClick={onToggle}>
        <span className={styles.chip} style={{ background: CHIP_COLORS[elemento.tipo]||'#555' }}>
          {findType(elemento.tipo).label}
        </span>
        {!isOpen && (
          <span className={styles.elementoResumen}>
            {elemento.contenido
              ? elemento.contenido.substring(0,60)+(elemento.contenido.length>60?'…':'')
              : <em style={{color:'#bbb',fontSize:'11px'}}>Sin contenido</em>}
          </span>
        )}
        <div className={styles.elemActions} onClick={e=>e.stopPropagation()}>
          <button className={styles.bicoBtn} onClick={()=>onMover(-1)} disabled={elemIndex===0} title="Subir">↑</button>
          <button className={styles.bicoBtn} onClick={()=>onMover(1)}  disabled={elemIndex===totalElems-1} title="Bajar">↓</button>
          <button className={`${styles.bicoBtn} ${styles.bicoDanger}`} onClick={()=>onDelete(elemento.id)} title="Eliminar">✕</button>
        </div>
        <span className={styles.elemArrow}>{isOpen?'▾':'▸'}</span>
      </div>
      {isOpen && (
        <div className={styles.elementoBody}>
          <ElemEditor elemento={elemento} onUpdate={c=>onUpdate(elemento.id,c)}
            onFileSelected={f=>onFileSelected&&onFileSelected(elemento.id,f)}/>
          <div className={styles.previewWrap}>
            <span className={styles.previewLbl}>👁 Vista previa</span>
            <div className={styles.previewBox}><PreviewElemento elemento={elemento}/></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// SECCIÓN
// ─────────────────────────────────────────────────────────
function Section({ section, sectionIndex, isOpen, onToggle, onUpdate, onDelete,
  onMoverSec, canSecArriba, canSecAbajo, onFileSelected,
  activeSubIdFromPreview,
  activeElemIdFromPreview,
  onElementoAbierto,
}) {

  const [activeElem, setActiveElem] = useState(null)
  const [activeSub,  setActiveSub]  = useState(-1)

  // preview → abrir subsegmento
  useEffect(() => {
    if (!activeSubIdFromPreview) return
    const idx = (section.subsegmentos||[]).findIndex(s => s.id === activeSubIdFromPreview)
    if (idx !== -1) setActiveSub(idx)
  }, [activeSubIdFromPreview, section.subsegmentos])

  // preview → abrir elemento individual
  // FIX: busca el elemento tanto en section.elementos (layout full)
  // como en section.subsegmentos[i].elementos (layout half/thirds)
  useEffect(() => {
    if (!activeElemIdFromPreview) return

    if (section.layout === 'full') {
      // Layout de columna única: buscar en section.elementos
      const idx = (section.elementos||[]).findIndex(e => e.id === activeElemIdFromPreview)
      if (idx !== -1) {
        setActiveElem(idx)
        setTimeout(() => {
          const el = document.getElementById(`elemento-${activeElemIdFromPreview}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 60)
      }
    } else {
      // Layout con columnas: buscar en qué subsegmento está el elemento
      const subs = section.subsegmentos || []
      for (let si = 0; si < subs.length; si++) {
        const idx = (subs[si].elementos||[]).findIndex(e => e.id === activeElemIdFromPreview)
        if (idx !== -1) {
          // 1. Abrir el subsegmento correcto
          setActiveSub(si)
          // 2. El Subsegment recibirá activeElemIdFromPreview via prop
          //    y abrirá el elemento dentro de él
          setTimeout(() => {
            const el = document.getElementById(`elemento-${activeElemIdFromPreview}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 120)
          break
        }
      }
    }
  }, [activeElemIdFromPreview, section.layout, section.elementos, section.subsegmentos])

  const genId    = () => `elem_${Date.now()}_${Math.floor(Math.random()*1000)}`
  const genSubId = () => `sub_${Date.now()}_${Math.floor(Math.random()*1000)}`

  // ── Cambio de layout ─────────────────────────────────
  // Al cambiar: crea subsegmentos faltantes, nunca borra los existentes
  const applyLayout = (nuevoLayout) => {
    const cols = nuevoLayout==='half'?2 : nuevoLayout==='thirds'?3 : 0
    let subs = [...(section.subsegmentos||[])]
    if (cols > 0) {
      while (subs.length < cols) {
        subs.push({ id:genSubId(), nombre:`Columna ${subs.length+1}`, elementos:[] })
      }
      setActiveSub(0)   // abrir primera columna automáticamente
    } else {
      setActiveSub(-1)
    }
    onUpdate(section.id, { ...section, layout:nuevoLayout, subsegmentos:subs })
  }

  // ── Toggle de subsegmento: al abrir uno, cierra los demás ──
  const toggleSub = (idx) => setActiveSub(prev => prev===idx ? -1 : idx)

  // ── CRUD elementos (layout full) ─────────────────────
  const agregarElemento = (_, tipo) => {
    const info = findType(tipo)
    const nuevos = [...section.elementos, {
      id:genId(), tipo, contenido:'', html:'',
      align:info.defAlign||'left', font:'', cssClases:info.cssClases||'',
    }]
    onUpdate(section.id, { ...section, elementos:nuevos })
    setActiveElem(nuevos.length-1)
  }
  const actualizarElemento = (elemId, c) =>
    onUpdate(section.id, { ...section, elementos:(section.elementos||[]).map(el=>el.id===elemId?{...el,...c}:el) })
  const eliminarElemento = (elemId) => {
    onUpdate(section.id, { ...section, elementos:(section.elementos||[]).filter(el=>el.id!==elemId) })
    setActiveElem(null)
  }
  const moverElemento = (idx, dir) => {
    const dest=idx+dir; const arr=[...(section.elementos||[])]
    if(dest<0||dest>=arr.length) return
    ;[arr[idx],arr[dest]]=[arr[dest],arr[idx]]
    onUpdate(section.id, { ...section, elementos:arr }); setActiveElem(dest)
  }

  // ── CRUD subsegmentos ─────────────────────────────────
  const actualizarSub = (subId, datos) =>
    onUpdate(section.id, { ...section, subsegmentos:(section.subsegmentos||[]).map(s=>s.id===subId?datos:s) })
  const eliminarSub = (subId) => {
    onUpdate(section.id, { ...section, subsegmentos:(section.subsegmentos||[]).filter(s=>s.id!==subId) })
    setActiveSub(-1)
  }
  const moverSub = (idx, dir) => {
    const dest=idx+dir; const arr=[...(section.subsegmentos||[])]
    if(dest<0||dest>=arr.length) return
    ;[arr[idx],arr[dest]]=[arr[dest],arr[idx]]
    onUpdate(section.id, { ...section, subsegmentos:arr }); setActiveSub(dest)
  }

  const layout = section.layout || 'full'

  return (
    <div className={styles.seccionCard} id={`seccion-${section.id}`}>
      {/* ── Cabecera ── */}
      <div className={styles.seccionHead} onClick={onToggle}>
        <span className={styles.seccionNum}>SEG-{sectionIndex+1}</span>
        <span className={styles.seccionNombre}>{section.nombre||`Sección ${sectionIndex+1}`}</span>
        <span className={styles.layoutBadge}>{layout==='full'?'▬':layout==='half'?'▬▬':'▬▬▬'}</span>
        {(layout==='full'?section.elementos:section.subsegmentos).length>0 && (
          <span className={styles.seccionCount}>
            {layout==='full'?`${section.elementos.length} elem.`:`${section.subsegmentos.length} col.`}
          </span>
        )}
        <div className={styles.seccionActions} onClick={e=>e.stopPropagation()}>
          <button className={styles.bicoBtn} onClick={()=>onMoverSec(-1)} disabled={!canSecArriba} title="Mover sección arriba">↑</button>
          <button className={styles.bicoBtn} onClick={()=>onMoverSec(1)}  disabled={!canSecAbajo}  title="Mover sección abajo">↓</button>
          <button className={`${styles.bicoBtn} ${styles.bicoDanger}`}  onClick={()=>onDelete(section.id)} title="Eliminar sección">🗑</button>
        </div>
        <span className={styles.seccionArrow}>{isOpen?'▾':'▸'}</span>
      </div>

      {/* ── Cuerpo ── */}
      {isOpen && (
        <div className={styles.seccionBody}>
          <div className={styles.campo}>
            <label>Nombre de la sección</label>
            <input type="text" value={section.nombre} placeholder={`Sección ${sectionIndex+1}`}
              onChange={e=>onUpdate(section.id,{...section,nombre:e.target.value})}/>
          </div>

          <LayoutButtons layout={layout} onLayoutChange={applyLayout}/>

          {/* ── FULL: elementos directos ── */}
          {layout==='full' && (
            <>
              <div className={styles.elementosLista}>
                {section.elementos.length===0
                  ? <p className={styles.listaVacia}>Sin elementos. Usa el menú de abajo para agregar.</p>
                  : section.elementos.map((elem,idx)=>(
                      <ElementoItem key={elem.id} elemento={elem} elemIndex={idx}
                        totalElems={section.elementos.length}
                        isOpen={activeElem===idx}
                        onToggle={()=>{
                          const ni = activeElem===idx ? null : idx
                          setActiveElem(ni)
                          if (ni !== null && onElementoAbierto && section.elementos[ni]) {
                            onElementoAbierto(section.elementos[ni].id)
                          }
                        }}
                        onUpdate={actualizarElemento} onDelete={eliminarElemento}
                        onMover={dir=>moverElemento(idx,dir)} onFileSelected={onFileSelected}/>
                    ))
                }
              </div>
              <TypeMenu seccionId={section.id} onAgregar={agregarElemento}/>
            </>
          )}

          {/* ── COLUMNAS: subsegmentos apilados verticalmente ──
              IMPORTANTE: en el BUILDER van apilados (flex column).
              El grid de columnas solo es para el PREVIEW.
              Idéntico al comportamiento del monolito v59. */}
          {(layout==='half'||layout==='thirds') && (
            <div className={styles.subsegList}>
              {(section.subsegmentos||[]).map((sub,idx)=>(
                <Subsegment key={sub.id} sub={sub} subIndex={idx}
                  activeElemIdFromPreview={activeElemIdFromPreview}
                  isOpen={activeSub===idx}
                  onToggle={()=>toggleSub(idx)}
                  onMover={dir=>moverSub(idx,dir)}
                  canArriba={idx>0}
                  canAbajo={idx<section.subsegmentos.length-1}
                  onUpdate={actualizarSub} onDelete={eliminarSub}
                  onFileSelected={onFileSelected}/>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Section
