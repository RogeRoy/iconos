// components/editor/AlignButtons.jsx
// ─────────────────────────────────────────────────────────
// Botones de alineación: izquierda · centro · derecha · justificado
// Recibe: align (estado actual), onAlign(valor) para cambiar
// ─────────────────────────────────────────────────────────
import styles from './Toolbar.module.css'

// SVGs de alineación (líneas horizontales, estilo Word/Docs)
const ALIGN_BTNS = [
  {
    value: 'left',
    title: 'Alinear a la izquierda',
    icon: (
      <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
        <rect x="2" y="4"  width="16" height="2" rx="1" fill="currentColor"/>
        <rect x="2" y="9"  width="11" height="2" rx="1" fill="currentColor"/>
        <rect x="2" y="14" width="14" height="2" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    value: 'center',
    title: 'Centrar',
    icon: (
      <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
        <rect x="2"   y="4"  width="16" height="2" rx="1" fill="currentColor"/>
        <rect x="4.5" y="9"  width="11" height="2" rx="1" fill="currentColor"/>
        <rect x="3"   y="14" width="14" height="2" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    value: 'right',
    title: 'Alinear a la derecha',
    icon: (
      <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
        <rect x="2"  y="4"  width="16" height="2" rx="1" fill="currentColor"/>
        <rect x="7"  y="9"  width="11" height="2" rx="1" fill="currentColor"/>
        <rect x="4"  y="14" width="14" height="2" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    value: 'justify',
    title: 'Justificado',
    icon: (
      <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
        <rect x="2" y="4"  width="16" height="2" rx="1" fill="currentColor"/>
        <rect x="2" y="9"  width="16" height="2" rx="1" fill="currentColor"/>
        <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
]

// Mapeo alineación → clase CSS (igual que ALIGN_MAP del HTML original)
export const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
}

export default function AlignButtons({ align, onAlign }) {
  return (
    <>
      {ALIGN_BTNS.map(({ value, title, icon }) => (
        <button
          key={value}
          className={`${styles.toolBtn} ${align === value ? styles.active : ''}`}
          title={title}
          onMouseDown={(e) => {
            e.preventDefault() // preservar foco del editor
            onAlign(value)
          }}
        >
          {icon}
        </button>
      ))}
    </>
  )
}
