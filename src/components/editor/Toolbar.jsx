// components/editor/Toolbar.jsx
// ─────────────────────────────────────────────────────────
// Contenedor de la barra de herramientas del editor.
// Agrupa: FormatButtons | sep | AlignButtons | sep | CaseButtons
//
// PRINCIPIO: Toolbar no ejecuta lógica, solo organiza botones
// y pasa callbacks hacia arriba (prop drilling hacia TextEditor).
// ─────────────────────────────────────────────────────────
import FormatButtons from './FormatButtons'
import AlignButtons  from './AlignButtons'
import CaseButtons   from './CaseButtons'
import styles        from './Toolbar.module.css'

export default function Toolbar({ onFormat, onAlign, onCase, align, activeFormats }) {
  return (
    <div className={styles.toolbar}>
      {/* Grupo: Formato inline (bold, underline, highlight) */}
      <div className={styles.grupo}>
        <FormatButtons onFormat={onFormat} activeFormats={activeFormats} />
      </div>

      <div className={styles.sep} />

      {/* Grupo: Alineación del bloque */}
      <div className={styles.grupo}>
        <AlignButtons align={align} onAlign={onAlign} />
      </div>

      <div className={styles.sep} />

      {/* Grupo: Transformaciones de case */}
      <div className={styles.grupo}>
        <CaseButtons onCase={onCase} />
      </div>
    </div>
  )
}
