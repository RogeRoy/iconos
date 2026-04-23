// RichEditor.jsx — Editor contentEditable reutilizable para ul, ol, ul-ol, hl, note.
import { useRef, useState, useEffect } from 'react'
import AlignButtons  from './AlignButtons'
import CaseButtons   from './CaseButtons'
import StyleSelector from './StyleSelector'
import { applyCase, applyRichCase } from '../../utils/caseUtils'
import styles from './RichEditor.module.css'

const ALIGN_CLASS  = { left:'text-left', center:'text-center', right:'text-right', justify:'text-justify' }
const FONT_FAMILY  = { 'noto-sans':'"Noto Sans", sans-serif', 'patria':'Georgia, "Times New Roman", serif' }

function ListBar({ editorRef }) {
  const cmd = (c) => { editorRef.current?.focus(); document.execCommand(c, false, null) }
  return (
    <div className={styles.listBar}>
      <span className={styles.listBarLbl}>Lista:</span>
      <button className={styles.tbtn} title="Agregar viñeta (•) — punto sin número" onMouseDown={(e)=>{e.preventDefault();cmd('insertUnorderedList')}}>
        <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><circle cx="4" cy="6" r="2" fill="#a57f2c"/><rect x="8" y="5" width="10" height="2" rx="1" fill="#888"/><circle cx="4" cy="14" r="2" fill="#a57f2c"/><rect x="8" y="13" width="10" height="2" rx="1" fill="#888"/></svg>
      </button>
      <button className={styles.tbtn} title="Agregar número (1. 2. 3.) — punto con número" onMouseDown={(e)=>{e.preventDefault();cmd('insertOrderedList')}}>
        <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><circle cx="4" cy="6" r="3" fill="#7b5800"/><text x="4" y="8.5" fontFamily="Arial" fontSize="4.5" fontWeight="700" fill="#fff" textAnchor="middle">1</text><rect x="9" y="5" width="9" height="2" rx="1" fill="#888"/><circle cx="4" cy="14" r="3" fill="#7b5800"/><text x="4" y="16.5" fontFamily="Arial" fontSize="4.5" fontWeight="700" fill="#fff" textAnchor="middle">2</text><rect x="9" y="13" width="9" height="2" rx="1" fill="#888"/></svg>
      </button>
      <div className={styles.sep}/>
      <button className={`${styles.tbtn} ${styles.tbtnAncho}`} title="Anidar — mover el punto hacia adentro para crear sub-lista" onMouseDown={(e)=>{e.preventDefault();cmd('indent')}}>
        <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M1 4h12M5 7h8M5 10h8M1 7l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Anidar
      </button>
      <button className={`${styles.tbtn} ${styles.tbtnAncho}`} title="Quitar — sacar el punto de la sub-lista hacia afuera" onMouseDown={(e)=>{e.preventDefault();cmd('outdent')}}>
        <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M1 4h12M5 7h8M5 10h8M4 7l-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Quitar
      </button>
    </div>
  )
}

export default function RichEditor({ tipo, html, align, font, cssClases, hasListBar=false, hasStyleRow=false, placeholder='Escribe aquí...', onChange }) {
  const editorRef = useRef(null)
  const [activeFormats, setActiveFormats] = useState({ bold:false, italic:false, underline:false, hiliteColor:false })
  const [previewHtml, setPreviewHtml]     = useState(html || '')

  useEffect(() => {
    const ed = editorRef.current
    if (ed) ed.innerHTML = html || ''
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const notificar = (extras = {}) => {
    const ed = editorRef.current; if (!ed) return
    const base    = (cssClases||'').replace(/\b(text-left|text-center|text-right|text-justify|noto-sans|patria)\b/g,'').trim()
    const fontCls = extras.font  !== undefined ? extras.font  : (font||'')
    const alignVal= extras.align !== undefined ? extras.align : (align||'left')
    const parts   = [base, fontCls, ALIGN_CLASS[alignVal]||''].filter(Boolean)
    const nuevoHtml = ed.innerHTML
    setPreviewHtml(nuevoHtml)
    onChange({ html:nuevoHtml, align:alignVal, font:fontCls, cssClases:[...new Set(parts)].join(' ') })
  }

  const detectar = () => setActiveFormats({
    bold:document.queryCommandState('bold'), italic:document.queryCommandState('italic'),
    underline:document.queryCommandState('underline'), hiliteColor:document.queryCommandState('hiliteColor'),
  })

  const handleFormat = (cmd, value=null) => {
    const ed = editorRef.current; if (!ed) return; ed.focus()
    if (cmd==='bold') {
      const sel=window.getSelection()
      if (sel&&sel.rangeCount>0&&!sel.isCollapsed) {
        const b=document.createElement('b'); b.style.color='#3a0a0a'
        try { sel.getRangeAt(0).surroundContents(b) } catch { document.execCommand('bold',false,null) }
      } else { document.execCommand('bold',false,null) }
    } else { document.execCommand(cmd,false,value) }
    detectar(); notificar()
  }

  const handleCase = (modo) => {
    const ed = editorRef.current; if (!ed) return; ed.focus()
    const sel=window.getSelection()
    if (sel&&sel.rangeCount>0&&!sel.isCollapsed) document.execCommand('insertText',false,applyCase(sel.getRangeAt(0).toString(),modo))
    else applyRichCase(ed,modo)
    notificar()
  }

  const minH = ['ul','ol','ul-ol'].includes(tipo) ? 90 : 72

  return (
    <div className={styles.richWrap}>
      {hasListBar && <ListBar editorRef={editorRef} />}
      <div className={styles.toolbar}>
        <div className={styles.grupo}>
          {[
            {cmd:'bold',       title:'Negrita — hace el texto más grueso y oscuro',             icon:<svg viewBox="0 0 20 20" width="15" height="15"><text x="4" y="15" fontFamily="Georgia,serif" fontSize="13" fontWeight="900" fill="#3a0a0a">B</text></svg>},
            {cmd:'italic',     title:'Cursiva — inclina el texto',                               icon:<svg viewBox="0 0 20 20" width="15" height="15"><text x="5" y="15" fontFamily="Georgia,serif" fontSize="13" fontStyle="italic" fontWeight="700" fill="currentColor">I</text></svg>},
            {cmd:'underline',  title:'Subrayado — pone una línea debajo del texto seleccionado', icon:<svg viewBox="0 0 20 20" width="15" height="15"><text x="4" y="13" fontFamily="Arial" fontSize="12" fontWeight="700" fill="currentColor">U</text><line x1="3" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>},
            {cmd:'hiliteColor',value:'yellow',title:'Resaltar — pone fondo amarillo al texto seleccionado', extraCls:styles.btnHl, icon:<svg viewBox="0 0 20 20" width="15" height="15"><rect x="3" y="11" width="14" height="5" rx="1" fill="#ffe566" opacity=".9"/><text x="4" y="13" fontFamily="Arial" fontSize="10" fontWeight="700" fill="#7b5800">Aa</text></svg>},
          ].map(({cmd,value,title,icon,extraCls})=>(
            <button key={cmd} className={`${styles.tbtn} ${extraCls||''} ${activeFormats[cmd]?styles.active:''}`} title={title}
              onMouseDown={(e)=>{e.preventDefault();handleFormat(cmd,value)}}>{icon}</button>
          ))}
          <div className={styles.sep}/>
        </div>
        <div className={styles.grupo}>
          <AlignButtons align={align} onAlign={(v)=>notificar({align:v})} />
        </div>
        <div className={styles.sep}/>
        <div className={styles.grupo}>
          <CaseButtons onCase={handleCase} />
        </div>
      </div>
      <div ref={editorRef} className={styles.editor}
        style={{ textAlign:align||'justify', fontFamily:FONT_FAMILY[font]||'inherit', minHeight:minH }}
        contentEditable suppressContentEditableWarning data-placeholder={placeholder}
        onInput={()=>{detectar();notificar()}} onKeyUp={detectar} onMouseUp={detectar} onFocus={detectar}
      />
      {hasStyleRow && <StyleSelector font={font} onFontChange={(v)=>notificar({font:v})} previewHtml={previewHtml} />}
    </div>
  )
}
