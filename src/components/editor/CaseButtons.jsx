import styles from './Toolbar.module.css'

// Solo 3 tipos de case: mayúsculas, minúsculas, oración
// Se quitó 'title case' (Aa) porque era redundante con 'sentence' (A·)
const CASE_BTNS = [
  { cmd:'upper',    label:'AA', title:'TODO EN MAYÚSCULAS'      },
  { cmd:'lower',    label:'aa', title:'todo en minúsculas'      },
  { cmd:'sentence', label:'A·', title:'Oración (primera letra)' },
]

export default function CaseButtons({ onCase }) {
  return (
    <>
      {CASE_BTNS.map(({ cmd, label, title }) => (
        <button key={cmd} className={`${styles.toolBtn} ${styles.caseBtn}`} title={title}
          onMouseDown={(e) => { e.preventDefault(); onCase && onCase(cmd) }}>
          {label}
        </button>
      ))}
    </>
  )
}
