// components/Section.jsx — ACTUALIZADO v2
// ─────────────────────────────────────────────────────────
// Cambios respecto a v1:
//   - El tipo 'parrafo' ahora usa TextEditor (contentEditable + toolbar)
//     en lugar de un <textarea> simple.
//   - El estado de cada elemento ahora incluye: html, align, font
//     además de contenido y cssClases.
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import TextEditor from './editor/TextEditor'
import styles from './Section.module.css'

function CssTagsPreview({ valor }) {
  if (!valor) return null
  return (
    <div className={styles.cssPreview}>
      {valor.split(' ').filter(Boolean).map((cls) => (
        <span key={cls} className={styles.cssTag}>{cls}</span>
      ))}
    </div>
  )
}

function ElementoItem({ elemento, onUpdateElemento, onDeleteElemento }) {
  return (
    <div className={styles.elementoCard}>
      <div className={styles.elementoHead}>
        <span className={`${styles.chip} ${elemento.tipo === 'titulo' ? styles.chipTitulo : styles.chipParrafo}`}>
          {elemento.tipo === 'titulo' ? 'H2 Título' : '¶ Párrafo'}
        </span>
        <button
          className={styles.btnEliminar}
          onClick={() => onDeleteElemento(elemento.id)}
          title="Eliminar elemento"
        >✕</button>
      </div>

      <div className={styles.elementoBody}>
        {elemento.tipo === 'titulo' ? (
          <>
            <div className={styles.campo}>
              <label>Contenido</label>
              <input
                type="text"
                value={elemento.contenido}
                placeholder="Escribe el título aquí..."
                onChange={(e) => onUpdateElemento(elemento.id, { contenido: e.target.value })}
              />
            </div>
            <div className={styles.campo}>
              <label>
                Clases CSS
                <span className={styles.labelHint}>(ej: doc-h2 text-center)</span>
              </label>
              <input
                type="text"
                value={elemento.cssClases}
                placeholder="doc-h2 text-center"
                onChange={(e) => onUpdateElemento(elemento.id, { cssClases: e.target.value })}
                className={styles.inputMono}
              />
              <CssTagsPreview valor={elemento.cssClases} />
            </div>
          </>
        ) : (
          <TextEditor
            html={elemento.html || ''}
            align={elemento.align || 'justify'}
            font={elemento.font || ''}
            cssClases={elemento.cssClases || 'doc-p'}
            onChange={({ html, align, font, cssClases }) =>
              onUpdateElemento(elemento.id, {
                html, align, font, cssClases,
                contenido: new DOMParser()
                  .parseFromString(html, 'text/html')
                  .body.textContent || ''
              })
            }
          />
        )}
      </div>
    </div>
  )
}

function Section({ section, sectionIndex, onUpdate, onDelete }) {
  const [abierta, setAbierta] = useState(true)
  const generarId = () => `elem_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  const agregarElemento = (tipo) => {
    const nuevo = {
      id: generarId(),
      tipo,
      contenido: '',
      html: '',
      align: tipo === 'titulo' ? 'left' : 'justify',
      font: '',
      cssClases: tipo === 'titulo' ? 'doc-h2' : 'doc-p',
    }
    onUpdate(section.id, { ...section, elementos: [...section.elementos, nuevo] })
  }

  const actualizarElemento = (elemId, cambios) => {
    onUpdate(section.id, {
      ...section,
      elementos: section.elementos.map((el) =>
        el.id === elemId ? { ...el, ...cambios } : el
      ),
    })
  }

  const eliminarElemento = (elemId) => {
    onUpdate(section.id, {
      ...section,
      elementos: section.elementos.filter((el) => el.id !== elemId),
    })
  }

  const actualizarCampoSeccion = (campo, valor) => {
    onUpdate(section.id, { ...section, [campo]: valor })
  }

  return (
    <div className={styles.seccionCard}>
      <div className={styles.seccionHead} onClick={() => setAbierta(!abierta)}>
        <span className={styles.seccionNum}>SEG-{sectionIndex + 1}</span>
        <span className={styles.seccionNombre}>
          {section.nombre || `Sección ${sectionIndex + 1}`}
        </span>
        <span className={styles.seccionArrow}>{abierta ? '▾' : '▸'}</span>
        <button
          className={styles.btnEliminarSeccion}
          onClick={(e) => { e.stopPropagation(); onDelete(section.id) }}
          title="Eliminar sección"
        >🗑</button>
      </div>

      {abierta && (
        <div className={styles.seccionBody}>
          <div className={styles.campo}>
            <label>Nombre de la sección</label>
            <input
              type="text"
              value={section.nombre}
              placeholder={`Sección ${sectionIndex + 1}`}
              onChange={(e) => actualizarCampoSeccion('nombre', e.target.value)}
            />
          </div>
          <div className={styles.campo}>
            <label>
              Clases CSS del contenedor
              <span className={styles.labelHint}>(ej: doc-section)</span>
            </label>
            <input
              type="text"
              value={section.cssClases}
              placeholder="doc-section"
              onChange={(e) => actualizarCampoSeccion('cssClases', e.target.value)}
              className={styles.inputMono}
            />
            <CssTagsPreview valor={section.cssClases} />
          </div>

          <div className={styles.elementosLista}>
            {section.elementos.length === 0 ? (
              <p className={styles.listaVacia}>No hay elementos. Agrega un título o párrafo.</p>
            ) : (
              section.elementos.map((elem) => (
                <ElementoItem
                  key={elem.id}
                  elemento={elem}
                  onUpdateElemento={actualizarElemento}
                  onDeleteElemento={eliminarElemento}
                />
              ))
            )}
          </div>

          <div className={styles.botonesAgregar}>
            <span className={styles.botonesLabel}>+ Agregar:</span>
            <button className={styles.btnAgregarTitulo} onClick={() => agregarElemento('titulo')}>
              H2 Título
            </button>
            <button className={styles.btnAgregarParrafo} onClick={() => agregarElemento('parrafo')}>
              ¶ Párrafo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Section
