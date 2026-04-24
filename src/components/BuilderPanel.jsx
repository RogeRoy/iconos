import { useState } from 'react'
import Section from './Section'
import styles from './BuilderPanel.module.css'
import { findType } from './editor/elementTypes'

function buildJson(secciones) {
  const sections=[]; let order=1
  secciones.forEach((sec,si)=>{
    const segN=si+1, segName=sec.nombre||`SEG-${segN}`
    sec.elementos.forEach(elem=>{
      const info=findType(elem.tipo), tipo=elem.tipo
      let path_id=null, path_desc=null
      if(tipo==='url'&&elem.contenido){ path_id=0; path_desc=elem.contenido }
      if(tipo==='mail'&&elem.contenido){ path_id=0; path_desc=`mailto:${elem.contenido}` }
      if(tipo==='img'&&elem.contenido){ path_id=0; path_desc=elem.contenido }
      sections.push({
        section_order:order++, section_segment:segN, section_subsegment:0,
        seg_name:segName, sub_name:null, type:tipo, align:elem.align||info.defAlign||'',
        section_css:elem.cssClases||info.cssClases||'',
        section_html:elem.html||info.htmlTag||'div',
        section_content:elem.contenido||'',
        path_id, path_desc,
      })
    })
  })
  const flat={
    bulletin:{ bull_name:'Documento', bull_status:true, updated_by:'SISTEMA' },
    bulletin_sections:sections.map(s=>({
      section_segment:s.section_segment, section_subsegment:s.section_subsegment,
      bull_id:null, path_id:s.path_id, section_content:s.section_content,
      section_css:s.section_css, section_html:s.section_html,
      section_order:s.section_order, section_status:true, updated_by:'SISTEMA',
      _meta_seg_name:s.seg_name, _meta_sub_name:s.sub_name,
      _meta_type:s.type, _meta_align:s.align||null,
    })),
    bulletin_path:sections.filter(s=>s.path_id!==null).map(s=>({path_id:null,path_desc:s.path_desc})),
  }
  const segMap={}
  sections.forEach(s=>{
    if(!segMap[s.section_segment]) segMap[s.section_segment]={section_segment:s.section_segment,seg_name:s.seg_name,sections:[]}
    segMap[s.section_segment].sections.push({section_order:s.section_order,section_css:s.section_css,section_html:s.section_html,section_content:s.section_content,path_id:s.path_id,path_desc:s.path_desc||null,_meta_type:s.type,_meta_align:s.align||null})
  })
  return { flat, nested:{ bulletin:flat.bulletin, segments:Object.values(segMap) } }
}

export default function BuilderPanel() {
  const [secciones, setSecciones] = useState([])
  const [secAbierta, setSecAbierta] = useState(null)
  const [jsonResult, setJsonResult] = useState(null)
  const genId = () => `sec_${Date.now()}_${Math.floor(Math.random()*1000)}`

  const agregarSeccion = () => {
    setSecciones(prev=>{
      const nuevas=[...prev,{id:genId(),nombre:'',cssClases:'doc-section',elementos:[]}]
      setSecAbierta(nuevas.length-1)
      return nuevas
    })
  }
  const actualizarSeccion=(secId,datos)=>setSecciones(prev=>prev.map(s=>s.id===secId?datos:s))
  const eliminarSeccion=(secId)=>{ setSecciones(prev=>prev.filter(s=>s.id!==secId)); setSecAbierta(null) }
  const moverSeccion=(idx,dir)=>{
    const dest=idx+dir
    if(dest<0||dest>=secciones.length) return
    setSecciones(prev=>{ const a=[...prev];[a[idx],a[dest]]=[a[dest],a[idx]];return a })
    setSecAbierta(dest)
  }
  const toggleSec=idx=>setSecAbierta(p=>p===idx?null:idx)
  const guardar=()=>{
    if(!secciones.length){ alert('Agrega al menos una sección.'); return }
    const {flat,nested}=buildJson(secciones)
    console.log('📦 JSON plano:',JSON.stringify(flat,null,2))
    console.log('📦 JSON anidado:',JSON.stringify(nested,null,2))
    setJsonResult({flat,nested})
  }

  return (
    <div className={styles.panel}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.topbarLogo}>📄</span>
          <span className={styles.topbarTitulo}>Builder Panel</span>
          <span className={styles.topbarBadge}>React + Vite</span>
        </div>
        <button className={styles.btnGuardar} onClick={guardar}>💾 Guardar JSON</button>
      </div>
      <div className={styles.contenido}>
        <div className={styles.seccionesHeader}>
          <h2 className={styles.titulo}>Secciones del documento</h2>
          <button className={styles.btnAgregarSeccion} onClick={agregarSeccion}>+ Agregar sección</button>
        </div>
        <div className={styles.seccionesList}>
          {secciones.length===0
            ? <div className={styles.listaVacia}><div className={styles.listaVaciaIco}>📋</div><p>No hay secciones. Haz clic en <strong>"+ Agregar sección"</strong> para comenzar.</p></div>
            : secciones.map((sec,idx)=>(
                <Section key={sec.id} section={sec} sectionIndex={idx}
                  isOpen={secAbierta===idx} onToggle={()=>toggleSec(idx)}
                  onMoverSec={dir=>moverSeccion(idx,dir)}
                  canSecArriba={idx>0} canSecAbajo={idx<secciones.length-1}
                  onUpdate={actualizarSeccion} onDelete={eliminarSeccion}/>
              ))
          }
        </div>
        {jsonResult && (
          <div className={styles.jsonWrap}>
            <div className={styles.jsonHeader}>
              <span className={styles.jsonTitulo}>📦 JSON generado</span>
              <span className={styles.jsonHint}>También en consola (F12)</span>
              <button className={styles.btnCerrarJson} onClick={()=>setJsonResult(null)}>✕ Cerrar</button>
            </div>
            <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:'8px'}}>
              <strong style={{fontSize:'12px',color:'#611232'}}>Plano (DB)</strong>
              <pre className={styles.jsonCode}>{JSON.stringify(jsonResult.flat,null,2)}</pre>
              <strong style={{fontSize:'12px',color:'#611232',marginTop:'8px'}}>Anidado</strong>
              <pre className={styles.jsonCode}>{JSON.stringify(jsonResult.nested,null,2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
