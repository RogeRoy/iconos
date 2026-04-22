// components/editor/TextEditor.jsx
import { useRef, useState, useEffect } from 'react'
import Toolbar       from './Toolbar'
import StyleSelector from './StyleSelector'
import { applyCase, applyRichCase } from '../../utils/caseUtils'
import styles from './TextEditor.module.css'

const ALIGN_CLASS = {
  left:    'text-left',
  center:  'text-center',
  right:   'text-right',
  justify: 'text-justify',
}

const FONT_FAMILY = {
  'noto-sans': '"Noto Sans", sans-serif',
  'patria':    'Georgia, "Times New Roman", serif',
}

export default function TextEditor({ html, align, font, cssClases, onChange }) {
  const editorRef = useRef(null)

  // formatos activos en la selección actual (para iluminar botones)
  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false, hiliteColor: false,
  })

  // previewHtml: estado local que guarda el HTML del editor para el preview.
  // NO usamos editorRef.current directamente en el render porque las refs
  // no disparan re-renders. Este estado sí lo hace.
  const [previewHtml, setPreviewHtml] = useState(html || '')

  // Sincronizar HTML inicial SOLO al montar ([] como dependencia).
  // Si lo sincronizamos en cada render o con [html] como dependencia,
  // React sobreescribe el innerHTML mientras el usuario escribe → pantalla en blanco.
  useEffect(() => {
    const ed = editorRef.current
    if (ed) ed.innerHTML = html || ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ← intencional: solo al montar

  // Notificar al padre y actualizar previewHtml
  const notificar = (extras = {}) => {
    const ed = editorRef.current
    if (!ed) return

    const baseDoc  = (cssClases || '').replace(/\b(text-left|text-center|text-right|text-justify|noto-sans|patria)\b/g, '').trim()
    const fontCls  = extras.font  !== undefined ? extras.font  : (font  || '')
    const alignVal = extras.align !== undefined ? extras.align : (align || 'justify')
    const alignCls = ALIGN_CLASS[alignVal] || ''
    const partes   = [baseDoc, fontCls, alignCls].filter(Boolean)
    const nuevasCss = [...new Set(partes)].join(' ')

    const nuevoHtml = ed.innerHTML
    setPreviewHtml(nuevoHtml) // ← dispara re-render del preview

    onChange({ html: nuevoHtml, align: alignVal, font: fontCls, cssClases: nuevasCss })
  }

  const detectarFormatos = () => {
    setActiveFormats({
      bold:        document.queryCommandState('bold'),
      italic:      document.queryCommandState('italic'),
      underline:   document.queryCommandState('underline'),
      hiliteColor: document.queryCommandState('hiliteColor'),
    })
  }

  const handleFormat = (cmd, value = null) => {
    const ed = editorRef.current
    if (!ed) return
    ed.focus()

    if (cmd === 'bold') {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0)
        const b = document.createElement('b')
        b.style.color = '#3a0a0a'
        try { range.surroundContents(b) }
        catch { document.execCommand('bold', false, null) }
      } else {
        document.execCommand('bold', false, null)
      }
    } else {
      document.execCommand(cmd, false, value)
    }

    detectarFormatos()
    notificar()
  }

  const handleAlign = (valor)    => notificar({ align: valor })
  const handleFont  = (nuevaFont) => notificar({ font: nuevaFont })

  const handleCase = (modo) => {
    const ed = editorRef.current
    if (!ed) return
    ed.focus()
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const txt = sel.getRangeAt(0).toString()
      document.execCommand('insertText', false, applyCase(txt, modo))
    } else {
      applyRichCase(ed, modo)
    }
    notificar()
  }

  return (
    <div className={styles.editorWrap}>
      <Toolbar
        onFormat={handleFormat}
        onAlign={handleAlign}
        onCase={handleCase}
        align={align}
        activeFormats={activeFormats}
      />

      {/*
        contentEditable: React no puede controlar este div como un input normal.
        Por eso NO ponemos value=... ni re-sincronizamos en cada render.
        Solo leemos innerHTML via ref cuando el usuario hace algo (onInput).
      */}
      <div
        ref={editorRef}
        className={styles.editor}
        style={{
          textAlign:  align || 'justify',
          fontFamily: FONT_FAMILY[font] || 'inherit',
        }}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Escribe el párrafo aquí..."
        onInput={() => { detectarFormatos(); notificar() }}
        onKeyUp={detectarFormatos}
        onMouseUp={detectarFormatos}
        onFocus={detectarFormatos}
      />

      <StyleSelector
        font={font}
        onFontChange={handleFont}
        previewHtml={previewHtml}
      />
    </div>
  )
}
