import { useState } from 'react'
import { TYPE_GROUPS } from './elementTypes'
import styles from './TypeMenu.module.css'

function TypeIcon({ tipo }) {
  const g='#611232',g2='#9b2247',vd='#1e5b4f',gr='#888'
  switch(tipo){
    case 'h1':   return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><text x="1" y="17" fontFamily="Georgia,serif" fontSize="17" fontWeight="900" fill={g}>T</text><rect x="1" y="19" width="20" height="1.2" rx=".6" fill={g} opacity=".4"/></svg>
    case 'h2':   return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><text x="2" y="16" fontFamily="Georgia,serif" fontSize="13" fontWeight="700" fill={g2}>T</text><rect x="1" y="18" width="20" height="1" rx=".5" fill={g2} opacity=".4"/></svg>
    case 'h3':   return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><text x="3" y="15" fontFamily="Arial" fontSize="10" fontWeight="700" fill={vd}>T</text><rect x="1" y="17" width="20" height=".9" rx=".45" fill={vd} opacity=".4"/></svg>
    case 'p':    return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><rect x="2" y="4" width="18" height="1.5" rx=".75" fill={gr}/><rect x="2" y="7.5" width="18" height="1.5" rx=".75" fill={gr}/><rect x="2" y="11" width="18" height="1.5" rx=".75" fill={gr}/><rect x="2" y="14.5" width="12" height="1.5" rx=".75" fill={gr}/></svg>
    case 'ul':   return <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="4" cy="5.5" r="2" fill="#a57f2c"/><rect x="8" y="4.5" width="14" height="2" rx="1" fill={gr}/><circle cx="4" cy="12" r="2" fill="#a57f2c"/><rect x="8" y="11" width="14" height="2" rx="1" fill={gr}/><circle cx="4" cy="18.5" r="2" fill="#a57f2c"/><rect x="8" y="17.5" width="10" height="2" rx="1" fill={gr}/></svg>
    case 'ol':   return <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="4" cy="5.5" r="3.5" fill="#7b5800"/><text x="4" y="8" fontFamily="Arial" fontSize="5" fontWeight="700" fill="#fff" textAnchor="middle">1</text><rect x="10" y="4.5" width="12" height="2" rx="1" fill={gr}/><circle cx="4" cy="12" r="3.5" fill="#7b5800"/><text x="4" y="14.5" fontFamily="Arial" fontSize="5" fontWeight="700" fill="#fff" textAnchor="middle">2</text><rect x="10" y="11" width="12" height="2" rx="1" fill={gr}/></svg>
    case 'ul-ol':return <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="3.5" cy="5" r="2" fill="#a57f2c"/><rect x="7" y="4" width="15" height="2" rx="1" fill={gr}/><circle cx="7" cy="11" r="1.5" fill="#8b3a00"/><rect x="10.5" y="10" width="11" height="2" rx="1" fill="#aaa"/><circle cx="7" cy="17" r="1.5" fill="#8b3a00"/><rect x="10.5" y="16" width="9" height="2" rx="1" fill="#aaa"/></svg>
    case 'hl':   return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><rect x="1" y="5" width="20" height="13" rx="2.5" fill="#fff9c4" stroke="#f5c800" strokeWidth="1.5"/><text x="10" y="14.5" fontFamily="Arial" fontSize="11" fontWeight="900" fill="#7b5800" textAnchor="middle">!</text></svg>
    case 'note': return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><rect x="1" y="3" width="3" height="16" rx="1.5" fill={g}/><rect x="6" y="5" width="14" height="1.5" rx=".75" fill={gr}/><rect x="6" y="9" width="14" height="1.5" rx=".75" fill={gr}/><rect x="6" y="13" width="10" height="1.5" rx=".75" fill={gr}/></svg>
    case 'hr':   return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><rect x="1" y="10" width="20" height="2" rx="1" fill={gr}/></svg>
    case 'url':  return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><path d="M8 14l6-6M10.5 7.5l1.5-1.5a3.5 3.5 0 014.95 4.95l-1.5 1.5" stroke={vd} strokeWidth="1.8" strokeLinecap="round"/><path d="M11.5 14.5l-1.5 1.5A3.5 3.5 0 015.05 11L6.5 9.5" stroke={vd} strokeWidth="1.8" strokeLinecap="round"/></svg>
    case 'mail': return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><rect x="2" y="6" width="18" height="11" rx="2" stroke="#880e4f" strokeWidth="1.5"/><path d="M2 8l9 6 9-6" stroke="#880e4f" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'img':  return <svg viewBox="0 0 22 22" fill="none" width="22" height="22"><rect x="2" y="4" width="18" height="14" rx="2" stroke="#a57f2c" strokeWidth="1.5"/><circle cx="7.5" cy="9" r="2" fill="#fce4b0" stroke="#a57f2c" strokeWidth="1"/><path d="M2 17l5-5 3.5 3.5 3-3.5L20 17" stroke="#a57f2c" strokeWidth="1.2" strokeLinecap="round"/></svg>
    default: return null
  }
}

export default function TypeMenu({ seccionId, onAgregar }) {
  const [grupoAbierto, setGrupoAbierto] = useState(null)
  const toggle = idx => setGrupoAbierto(p => p===idx ? null : idx)
  const handleAgregar = tipo => { onAgregar(seccionId, tipo); setGrupoAbierto(null) }

  return (
    <div className={styles.menuWrap}>
      <div className={styles.menuTitulo}>➕ Agregar elemento a la sección</div>
      <div className={styles.grupos}>
        {TYPE_GROUPS.map((grupo,gi) => {
          const abierto = grupoAbierto===gi
          return (
            <div key={gi} className={styles.grupoAcc}>
              <button className={`${styles.grupoHeader} ${abierto?styles.grupoHeaderAbierto:''}`}
                onClick={()=>toggle(gi)} aria-expanded={abierto}>
                <span className={styles.grupoIcono}>{grupo.icon}</span>
                <span className={styles.grupoNombre}>{grupo.label}</span>
                <span className={`${styles.grupoFlecha} ${abierto?styles.grupoFlechaAbierto:''}`}>▶</span>
              </button>
              {abierto && (
                <div className={styles.grupoBody}>
                  <div className={styles.tiposBtns}>
                    {grupo.types.map(tipo=>(
                      <button key={tipo.key} className={styles.tipoBtn}
                        onClick={()=>handleAgregar(tipo.key)} title={tipo.descLarga}>
                        <span className={styles.tipoBtnIcono}><TypeIcon tipo={tipo.key}/></span>
                        <span className={styles.tipoBtnTexto}>
                          <strong>{tipo.label}</strong>
                          <span>{tipo.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
