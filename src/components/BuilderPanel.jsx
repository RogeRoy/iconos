// BuilderPanel.jsx — v5
// Recibe activeElemIdExterno desde App y lo propaga a Section.
// Llama onElementoAbierto cuando un elemento se expande (builder→preview).
import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import Section from './Section'
import styles from './BuilderPanel.module.css'
import { findType } from './editor/elementTypes'
import { buildCss } from '../utils/cssTokens'

function buildJson(secciones) {
  const sections = []; let order = 1
  secciones.forEach((sec, si) => {
    const segN = si+1; const segName = sec.nombre||`SEG-${segN}`; const layout = sec.layout||'full'
    const makeRow = (elem, subN, subName) => {
      const info = findType(elem.tipo)
      let path_id=null, path_desc=null
      if (elem.tipo==='url'  && elem.contenido) {
        path_id=0
        path_desc=elem.contenido  // URL real → resource_desc
        // Si hay anchorText, va a section_content; si no, la URL misma
      }
      if (elem.tipo==='mail' && elem.contenido) { path_id=0; path_desc=`mailto:${elem.contenido}` }
      if (elem.tipo==='img'  && elem.contenido) { path_id=0; path_desc=elem.contenido }
      const cssClases = buildCss(elem.tipo, elem.align||info.defAlign||'left', elem.font||'')
      return {
        section_order:order++, section_segment:segN, section_subsegment:subN,
        seg_name:segName, sub_name:subN>0?(subName||`Columna ${subN}`):null,
        type:elem.tipo, align:elem.align||info.defAlign||'',
        section_css:cssClases, section_html:elem.html||info.htmlTag||'div',
        // Para URL: section_content = anchorText si existe, si no la URL
        // Para los demás: el contenido normal
        section_content: (elem.tipo==='url' && elem.anchorText)
          ? elem.anchorText
          : (elem.contenido||''),
        path_id, path_desc,
        _meta_type:elem.tipo, _meta_align:elem.align||info.defAlign||'',
        _meta_seg_name:segName, _meta_sub_name:subN>0?(subName||`Columna ${subN}`):null,
      }
    }
    if (layout==='full') { (sec.elementos||[]).forEach(e=>sections.push(makeRow(e,0,null))) }
    else { ;(sec.subsegmentos||[]).forEach((sub,si2)=>{ const subN=si2+1; (sub.elementos||[]).forEach(e=>sections.push(makeRow(e,subN,sub.nombre))) }) }
  })
  return {
    bulletin:{ bull_name:'Documento', bull_status:true, updated_by:'SISTEMA' },
    bulletin_sections: sections.map(s=>({
      section_segment:s.section_segment, section_subsegment:s.section_subsegment,
      bull_id:null, path_id:s.path_id, section_content:s.section_content,
      section_css:s.section_css, section_html:s.section_html,
      section_order:s.section_order, section_status:true, updated_by:'SISTEMA',
      _meta_seg_name:s._meta_seg_name, _meta_sub_name:s._meta_sub_name,
      _meta_type:s._meta_type, _meta_align:s._meta_align,
    })),
    bulletin_path: sections.filter(s=>s.path_id!==null).map(s=>({path_id:null,path_desc:s.path_desc})),
  }
}

const BuilderPanel = forwardRef(function BuilderPanel({
  seccionesExternas, onSeccionesChange,
  activeSectionIdExterno, onActiveSectionChange,
  activeSubIdExterno, onActiveSubChange,
  activeElemIdExterno, onActiveElemChange,
  onElementoAbierto,
}, ref) {
  const [seccionesLocales, setSeccionesLocales] = useState([])
  const secciones    = seccionesExternas !==undefined ? seccionesExternas  : seccionesLocales
  const setSecciones = onSeccionesChange !==undefined ? onSeccionesChange  : setSeccionesLocales

  const [activeSection,         setActiveSection]         = useState(null)
  const [activeSubFromPreview,  setActiveSubFromPreview]  = useState(null)
  const [activeElemFromPreview, setActiveElemFromPreview] = useState(null)
  const archivosImagenRef = useRef({})
  const prevSecRef  = useRef(null)
  const prevSubRef  = useRef(null)
  const prevElemRef = useRef(null)

  // Sincronizar sección activa desde preview
  useEffect(() => {
    if (activeSectionIdExterno && activeSectionIdExterno !== prevSecRef.current) {
      prevSecRef.current = activeSectionIdExterno
      setActiveSection(activeSectionIdExterno)
      setTimeout(() => { if(onActiveSectionChange) onActiveSectionChange(null); prevSecRef.current=null }, 150)
    }
  }, [activeSectionIdExterno, onActiveSectionChange])

  // Sincronizar subsegmento activo desde preview
  useEffect(() => {
    if (activeSubIdExterno && activeSubIdExterno !== prevSubRef.current) {
      prevSubRef.current = activeSubIdExterno
      setActiveSubFromPreview(activeSubIdExterno)
      setTimeout(() => { if(onActiveSubChange) onActiveSubChange(null); prevSubRef.current=null; setActiveSubFromPreview(null) }, 300)
    }
  }, [activeSubIdExterno, onActiveSubChange])

  // Sincronizar elemento activo desde preview
  useEffect(() => {
    if (activeElemIdExterno && activeElemIdExterno !== prevElemRef.current) {
      prevElemRef.current = activeElemIdExterno
      setActiveElemFromPreview(activeElemIdExterno)
      // 600ms: da tiempo suficiente para que Section abra su accordeón
      // antes de que se resetee el activeElemIdFromPreview
      setTimeout(() => { if(onActiveElemChange) onActiveElemChange(null); prevElemRef.current=null; setActiveElemFromPreview(null) }, 600)
    }
  }, [activeElemIdExterno, onActiveElemChange])

  const genId = () => `sec_${Date.now()}_${Math.floor(Math.random()*1000)}`
  const handleFileSelected = useCallback((elemId,file)=>{ archivosImagenRef.current[elemId]=file },[])
  const toggleSec = (secId) => setActiveSection(p=>p===secId?null:secId)

  const agregarSeccion = useCallback(() => {
    setSecciones(prev=>{
      const n={id:genId(),nombre:'',cssClases:'doc-section',layout:'full',elementos:[],subsegmentos:[]}
      setActiveSection(n.id); return [...prev,n]
    })
  },[setSecciones])

  const actualizarSeccion = (secId,datos) => setSecciones(prev=>prev.map(s=>s.id===secId?datos:s))
  const eliminarSeccion   = (secId) => { setSecciones(prev=>prev.filter(s=>s.id!==secId)); setActiveSection(p=>p===secId?null:p) }
  const moverSeccion = (idx,dir) => {
    const dest=idx+dir; if(dest<0||dest>=secciones.length) return
    setSecciones(prev=>{ const a=[...prev];[a[idx],a[dest]]=[a[dest],a[idx]];return a })
  }

  useImperativeHandle(ref, () => ({
    agregarSeccion,
    buildJsonActual: () => secciones.length ? buildJson(secciones) : null,
    // NUEVO: exponer el mapa de imágenes para que App.jsx lo pase al guardar
    getImagenes: () => archivosImagenRef.current,
  }), [agregarSeccion, secciones])

  return (
    <div className={styles.panel}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.topbarLogo}>📄</span>
          <span className={styles.topbarTitulo}>Builder de Boletines</span>
          <span className={styles.topbarBadge}>React + Vite</span>
        </div>
      </div>
      <div className={styles.contenido}>
        <div className={styles.seccionesList}>
          {secciones.length===0
            ? <div className={styles.listaVacia}><div className={styles.listaVaciaIco}>📋</div><p>Usa el botón <strong>+</strong> flotante para agregar la primera sección.</p></div>
            : secciones.map((sec,idx)=>(
                <Section key={sec.id} section={sec} sectionIndex={idx}
                  isOpen={activeSection===sec.id}
                  onToggle={()=>toggleSec(sec.id)}
                  onMoverSec={dir=>moverSeccion(idx,dir)}
                  canSecArriba={idx>0} canSecAbajo={idx<secciones.length-1}
                  onUpdate={actualizarSeccion} onDelete={eliminarSeccion}
                  onFileSelected={handleFileSelected}
                  activeSubIdFromPreview={activeSection===sec.id ? activeSubFromPreview : null}
                  activeElemIdFromPreview={activeSection===sec.id ? activeElemFromPreview : null}
                  onElementoAbierto={onElementoAbierto}
                />
              ))
          }
        </div>
      </div>
    </div>
  )
})

export default BuilderPanel
