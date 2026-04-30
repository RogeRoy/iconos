// ─────────────────────────────────────────────────────────────────────────
// BuilderPanel.jsx — v6
// ─────────────────────────────────────────────────────────────────────────
//
// CAMBIOS EN ESTA VERSIÓN:
//
//   1. buildJson() REMOVIDA de este archivo
//      Ahora vive en utils/buildJson.js.
//      Este componente ya no mezcla lógica de negocio con interfaz de usuario.
//
//   2. genId() usa crypto.randomUUID()
//      Más seguro, garantiza unicidad sin posibilidad de colisión.
//
//   3. activeNav (objeto unificado) reemplaza 3 props separadas:
//      ANTES: activeSectionIdExterno, activeSubIdExterno, activeElemIdExterno
//      AHORA: activeNavExterno = { secId, subId, elemId }
//
//      Esto elimina el problema de "useEffect con dependencias incompletas"
//      y los renders intermedios inconsistentes.
//
//   4. useEffect mejorados:
//      ANTES: 3 useEffect separados con setTimeout y lógica de deduplicación
//             manual (prevSecRef, prevSubRef, prevElemRef).
//      AHORA: 1 useEffect que reacciona al objeto activeNav completo.
//             Sin timeouts arbitrarios. Sin refs de "previo".
//
// ─────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import Section from './Section'
import styles  from './BuilderPanel.module.css'
import { buildJson, genId } from '../utils/buildJson'  // ← EXTRAÍDO

// ─────────────────────────────────────────────────────────────────────────
// BuilderPanel — componente principal del editor
//
// forwardRef permite que el padre (App.jsx) obtenga una "referencia" a este
// componente y llame métodos como agregarSeccion() o buildJsonActual().
// En Java sería como tener un método público en una clase que otra clase llama.
// ─────────────────────────────────────────────────────────────────────────
const BuilderPanel = forwardRef(function BuilderPanel({
  seccionesExternas,
  onSeccionesChange,
  activeNavExterno,
  onElementoAbierto,
}, ref) {

  const [seccionesLocales, setSeccionesLocales] = useState([])

  // Si el padre pasa seccionesExternas, usarlas; si no, usar el estado local.
  // Esto permite que el componente funcione tanto controlado (App.jsx)
  // como no-controlado (si se usa solo).
  const secciones    = seccionesExternas  !== undefined ? seccionesExternas  : seccionesLocales
  const setSecciones = onSeccionesChange  !== undefined ? onSeccionesChange  : setSeccionesLocales

  // Estado local de qué sección está abierta en el acordeón
  const [activeSection, setActiveSection] = useState(null)

  // Estado para propagar la navegación del preview a los hijos (Section → Subsegment)
  // Cuando el usuario hace clic en el preview, guardamos acá qué debe abrirse.
  const [navFromPreview, setNavFromPreview] = useState({
    subId: null,
    elemId: null,
  })

  const archivosImagenRef = useRef({})

  // ── Sincronizar navegación desde preview ──────────────────────────
  //
  // ANTES (problemático):
  //   3 useEffect separados, cada uno con su setTimeout y prevRef.
  //   Los timeouts de 150ms, 300ms, 600ms interferían entre sí.
  //   Si el usuario hacía clic muy rápido, los estados quedaban sucios.
  //
  // AHORA (correcto):
  //   1 useEffect que reacciona al objeto activeNavExterno completo.
  //   No necesita timeouts porque el reset se hace con un callback
  //   después de que Section confirma que procesó la navegación.
  //
  // Dependencias del useEffect: [activeNavExterno]
  //   React re-ejecuta el efecto cada vez que activeNavExterno cambia.
  //   Si cambia secId, subId o elemId, el efecto corre de nuevo.
  //   Si el objeto es el mismo (referencia igual), NO corre de nuevo.
  useEffect(() => {
    if (!activeNavExterno) return

    const { secId, subId, elemId } = activeNavExterno

    // Si hay una sección a activar, expandirla en el acordeón
    if (secId) {
      setActiveSection(secId)

      // Scroll al elemento del builder
      const secEl = document.getElementById(`seccion-${secId}`)
      if (secEl) secEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Propagar subId y elemId a los hijos (Section → Subsegment)
    if (subId || elemId) {
      setNavFromPreview({ subId: subId || null, elemId: elemId || null })

      // setTimeout(fn, 0) difiere la limpieza a la siguiente macrotask,
      // FUERA del ciclo de render de React. Esto evita el warning
      // "Cannot update a component while rendering a different component".
      //
      // Promise.resolve().then() ejecuta en la misma microtask que el render
      // y React lo detecta como setState anidado → warning.
      // setTimeout(fn, 0) espera a que React termine el render actual por completo.
      setTimeout(() => {
        setNavFromPreview({ subId: null, elemId: null })
      }, 0)
    }
  }, [activeNavExterno])

  const handleFileSelected = useCallback((elemId, file) => {
    archivosImagenRef.current[elemId] = file
  }, [])

  const toggleSec = (secId) => setActiveSection(p => p === secId ? null : secId)

  const agregarSeccion = useCallback(() => {
    setSecciones(prev => {
      // genId() ahora usa crypto.randomUUID() — garantiza unicidad
      const n = {
        id:           genId('sec'),
        nombre:       '',
        cssClases:    'doc-section',
        layout:       'full',
        elementos:    [],
        subsegmentos: [],
      }
      setActiveSection(n.id)
      return [...prev, n]
    })
  }, [setSecciones])

  const actualizarSeccion = (secId, datos) =>
    setSecciones(prev => prev.map(s => s.id === secId ? datos : s))

  const eliminarSeccion = (secId) => {
    setSecciones(prev => prev.filter(s => s.id !== secId))
    setActiveSection(p => p === secId ? null : p)
  }

  const moverSeccion = (idx, dir) => {
    const dest = idx + dir
    if (dest < 0 || dest >= secciones.length) return
    setSecciones(prev => {
      const a = [...prev]
      ;[a[idx], a[dest]] = [a[dest], a[idx]]
      return a
    })
  }

  // ── useImperativeHandle ───────────────────────────────────────────
  // Expone métodos públicos del componente al padre (App.jsx via ref).
  // Solo los métodos que el padre necesita llamar.
  // Es como definir una interfaz pública en Java.
  useImperativeHandle(ref, () => ({
    agregarSeccion,
    buildJsonActual: () => secciones.length ? buildJson(secciones) : null,
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
          {secciones.length === 0
            ? (
              <div className={styles.listaVacia}>
                <div className={styles.listaVaciaIco}>📋</div>
                <p>Usa el botón <strong>+</strong> flotante para agregar la primera sección.</p>
              </div>
            )
            : secciones.map((sec, idx) => (
              <Section
                key={sec.id}
                section={sec}
                sectionIndex={idx}
                isOpen={activeSection === sec.id}
                onToggle={() => toggleSec(sec.id)}
                onMoverSec={dir => moverSeccion(idx, dir)}
                canSecArriba={idx > 0}
                canSecAbajo={idx < secciones.length - 1}
                onUpdate={actualizarSeccion}
                onDelete={eliminarSeccion}
                onFileSelected={handleFileSelected}
                navFromPreview={activeSection === sec.id ? navFromPreview : { subId: null, elemId: null }}
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
