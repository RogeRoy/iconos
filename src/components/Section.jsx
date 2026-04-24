import { useState } from 'react'
import TypeMenu          from './editor/TypeMenu'
import TitleEditor       from './editor/TitleEditor'
import TextEditor        from './editor/TextEditor'
import RichEditor        from './editor/RichEditor'
import SimpleFieldEditor from './editor/SimpleFieldEditor'
import { findType, CHIP_STYLE } from './editor/elementTypes'
import styles from './Section.module.css'

const PH = {
  ul:'Escribe el primer punto y usa los botones de arriba para agregar más...',
  ol:'Escriba el primer paso y use los botones de lista numerada para agregar más...',
  'ul-ol':'Escriba las viñetas principales. Use "Anidar" para crear sub-listas.',
  hl:'Escriba aquí la información importante que desea resaltar...',
  note:'Escriba aquí la aclaración o nota complementaria...',
}

function CssTagsPreview({ valor }) {
  if (!valor) return null
  return (
    <div className={styles.cssPreview}>
      {valor.split(' ').filter(Boolean).map(cls=>(
        <span key={cls} className={styles.cssTag}>{cls}</span>
      ))}
    </div>
  )
}

function ElemEditor({ elemento, onUpdate }) {
  const { tipo } = elemento
  const info = findType(tipo)

  if (['h1','h2','h3'].includes(tipo)) return (
    <TitleEditor contenido={elemento.contenido||''} align={elemento.align||info.defAlign||'left'}
      font={elemento.font||''} cssClases={elemento.cssClases||info.cssClases} onChange={onUpdate}/>
  )
  if (tipo==='p') return (
    <TextEditor html={elemento.html||''} align={elemento.align||'justify'}
      font={elemento.font||''} cssClases={elemento.cssClases||info.cssClases}
      onChange={({html,align,font,cssClases})=>onUpdate({html,align,font,cssClases,
        contenido:new DOMParser().parseFromString(html,'text/html').body.textContent||''})}/>
  )
  if (['ul','ol','ul-ol','hl','note'].includes(tipo)) return (
    <RichEditor tipo={tipo} html={elemento.html||''} align={elemento.align||info.defAlign||'left'}
      font={elemento.font||''} cssClases={elemento.cssClases||info.cssClases}
      hasListBar={info.hasListBar} hasStyleRow={info.hasStyle}
      placeholder={PH[tipo]||'Escribe aquí...'}
      onChange={({html,align,font,cssClases})=>onUpdate({html,align,font,cssClases,
        contenido:new DOMParser().parseFromString(html,'text/html').body.textContent||''})}/>
  )
  if (['url','mail','img','hr'].includes(tipo)) return (
    <SimpleFieldEditor tipo={tipo} contenido={elemento.contenido||''}
      align={elemento.align||info.defAlign||'left'} cssClases={elemento.cssClases||info.cssClases}
      onChange={({contenido,align,cssClases})=>onUpdate({contenido,align,cssClases})}/>
  )
  return null
}

function ElementoItem({ elemento, isOpen, onToggle, onMover, canArriba, canAbajo, onUpdateElemento, onDeleteElemento }) {
  const info = findType(elemento.tipo)
  const chip = CHIP_STYLE[elemento.tipo]||{ bg:'#555', color:'#fff', border:'none' }
  return (
    <div className={styles.elementoCard}>
      <div className={styles.elementoHead} onClick={onToggle}>
        <span className={styles.chip} style={{ background:chip.bg, color:chip.color, border:chip.border }}>
          {info.label}
        </span>
        <div className={styles.elemActions} onClick={e=>e.stopPropagation()}>
          <button className={styles.bicoBtn} onClick={()=>onMover(-1)} disabled={!canArriba} title="Subir elemento">↑</button>
          <button className={styles.bicoBtn} onClick={()=>onMover(1)}  disabled={!canAbajo}  title="Bajar elemento">↓</button>
          <button className={`${styles.bicoBtn} ${styles.bicoDanger}`} onClick={()=>onDeleteElemento(elemento.id)} title="Eliminar elemento">✕</button>
        </div>
        <span className={styles.elemArrow}>{isOpen?'▾':'▸'}</span>
      </div>
      {isOpen && (
        <div className={styles.elementoBody}>
          <ElemEditor elemento={elemento} onUpdate={cambios=>onUpdateElemento(elemento.id,cambios)}/>
        </div>
      )}
    </div>
  )
}

function Section({ section, sectionIndex, isOpen, onToggle, onMoverSec, canSecArriba, canSecAbajo, onUpdate, onDelete }) {
  const [elemAbierto, setElemAbierto] = useState(null)
  const genId = () => `elem_${Date.now()}_${Math.floor(Math.random()*1000)}`

  const agregarElemento = (seccionId, tipo) => {
    const info=findType(tipo)
    const nuevos=[...section.elementos,{ id:genId(),tipo,contenido:'',html:'',align:info.defAlign||'left',font:'',cssClases:info.cssClases||'' }]
    onUpdate(section.id,{...section,elementos:nuevos})
    setElemAbierto(nuevos.length-1)
  }

  const actualizarElemento = (elemId, cambios) =>
    onUpdate(section.id,{...section,elementos:section.elementos.map(el=>el.id===elemId?{...el,...cambios}:el)})

  const eliminarElemento = (elemId) => {
    onUpdate(section.id,{...section,elementos:section.elementos.filter(el=>el.id!==elemId)})
    setElemAbierto(null)
  }

  const moverElemento = (idx, dir) => {
    const dest=idx+dir
    if(dest<0||dest>=section.elementos.length) return
    const arr=[...section.elementos];[arr[idx],arr[dest]]=[arr[dest],arr[idx]]
    onUpdate(section.id,{...section,elementos:arr})
    setElemAbierto(dest)
  }

  const toggleElem = idx => setElemAbierto(p=>p===idx?null:idx)
  const actualizarCampo = (campo,valor) => onUpdate(section.id,{...section,[campo]:valor})

  return (
    <div className={styles.seccionCard}>
      <div className={styles.seccionHead} onClick={onToggle}>
        <span className={styles.seccionNum}>SEG-{sectionIndex+1}</span>
        <span className={styles.seccionNombre}>{section.nombre||`Sección ${sectionIndex+1}`}</span>
        <div className={styles.seccionActions} onClick={e=>e.stopPropagation()}>
          <button className={styles.bicoSecBtn} onClick={()=>onMoverSec(-1)} disabled={!canSecArriba} title="Subir sección">↑</button>
          <button className={styles.bicoSecBtn} onClick={()=>onMoverSec(1)}  disabled={!canSecAbajo}  title="Bajar sección">↓</button>
          <button className={`${styles.bicoSecBtn} ${styles.bicoSecDanger}`} onClick={()=>onDelete(section.id)} title="Eliminar sección">✕</button>
        </div>
        <span className={styles.seccionArrow}>{isOpen?'▾':'▸'}</span>
      </div>

      {isOpen && (
        <div className={styles.seccionBody}>
          <div className={styles.campo}>
            <label>Nombre de la sección</label>
            <input type="text" value={section.nombre} placeholder={`Sección ${sectionIndex+1}`}
              onChange={e=>actualizarCampo('nombre',e.target.value)}/>
          </div>
          <div className={styles.campo}>
            <label>Clases CSS<span className={styles.labelHint}> (ej: doc-section)</span></label>
            <input type="text" value={section.cssClases} placeholder="doc-section"
              onChange={e=>actualizarCampo('cssClases',e.target.value)} className={styles.inputMono}/>
            <CssTagsPreview valor={section.cssClases}/>
          </div>
          <div className={styles.elementosLista}>
            {section.elementos.length===0
              ? <p className={styles.listaVacia}>Sin elementos. Usa el menú de abajo para agregar.</p>
              : section.elementos.map((elem,idx)=>(
                  <ElementoItem key={elem.id} elemento={elem}
                    isOpen={elemAbierto===idx} onToggle={()=>toggleElem(idx)}
                    onMover={dir=>moverElemento(idx,dir)}
                    canArriba={idx>0} canAbajo={idx<section.elementos.length-1}
                    onUpdateElemento={actualizarElemento} onDeleteElemento={eliminarElemento}/>
                ))
            }
          </div>
          <TypeMenu seccionId={section.id} onAgregar={agregarElemento}/>
        </div>
      )}
    </div>
  )
}
export default Section
