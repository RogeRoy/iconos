// ─────────────────────────────────────────────────────────────────────────
// hooks/useBuilderState.js  — Estado compartido del builder
// ─────────────────────────────────────────────────────────────────────────
//
// ¿POR QUÉ EXISTE ESTE ARCHIVO?
//
//   PROBLEMA ANTES:
//     App.jsx y EditorBoletín.jsx tenían EXACTAMENTE el mismo código:
//     los mismos useState, el mismo handleNavegar, handleGuardar,
//     handleElementoAbierto, etc. Era código duplicado.
//
//     Si había un bug en handleNavegar, había que corregirlo en DOS lugares.
//     Si querías agregar una funcionalidad, había que hacerlo en DOS lugares.
//     Esto viola el principio DRY (Don't Repeat Yourself / No te repitas).
//
//   SOLUCIÓN:
//     Mover toda esa lógica a un hook personalizado (useBuilderState).
//     Tanto App.jsx como EditorBoletín.jsx llaman a este hook y obtienen
//     todo lo que necesitan. El código existe solo UNA VEZ.
//
//     En Java sería como extraer lógica duplicada de dos Controladores
//     a un Service que ambos usan.
//
// ¿QUÉ ES UN HOOK PERSONALIZADO?
//   Es una función que:
//   - Empieza con "use" (convención obligatoria de React)
//   - Puede usar otros hooks (useState, useCallback, useRef)
//   - Encapsula lógica reutilizable
//   - Retorna los datos y funciones que necesitan los componentes
//
// MEJORA EN activeElem — OBJETO ÚNICO EN LUGAR DE 3 ESTADOS:
//
//   ANTES (problemático):
//     const [activeSectionId, setActiveSectionId] = useState(null)
//     const [activeSubId, setActiveSubId]         = useState(null)
//     const [activeElemId, setActiveElemId]       = useState(null)
//
//     Problema: 3 estados independientes que deben moverse juntos.
//     Si se actualizaban en orden incorrecto, causaban renders intermedios
//     con estado inconsistente (por ejemplo: sectionId nuevo pero subId viejo).
//
//   DESPUÉS (correcto):
//     const [activeNav, setActiveNav] = useState({ secId: null, subId: null, elemId: null })
//
//     Un solo objeto que se actualiza de golpe. React agrupa la actualización
//     en un solo render. No hay estados intermedios inconsistentes.
//
// ─────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react'
import { useGuardarBoletin }             from './useGuardarBoletin'

// ── getSufijoDeFecha ──────────────────────────────────────────────────
// Genera un string de fecha para el nombre del archivo JSON descargado.
// Ejemplo de resultado: "_20260428_143055"
function getSufijoDeFecha() {
  const n = new Date()
  const p = x => String(x).padStart(2, '0')
  return `_${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`
}

// ── descargarJson ─────────────────────────────────────────────────────
// Crea un archivo JSON en memoria y fuerza la descarga en el navegador.
// Blob = "Binary Large Object", sirve para crear archivos en memoria.
function descargarJson(datos, nombre = 'boletin') {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${nombre}${getSufijoDeFecha()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────
// useBuilderState — el hook principal
// ─────────────────────────────────────────────────────────────────────────
//
// RETORNA un objeto con:
//   secciones           → array de secciones del builder
//   setSecciones        → función para actualizar las secciones
//   activeNav           → { secId, subId, elemId } — qué elemento está activo
//   previewScrollId     → ID del elemento al que el preview debe hacer scroll
//   builderRef          → ref para hablar con BuilderPanel (agregarSeccion, etc.)
//   guardadoExitoso     → boolean: ¿el último guardado fue exitoso?
//   errorGuardado       → string: mensaje de error del último guardado (o '')
//   cargandoGuardado    → boolean: ¿se está guardando en este momento?
//   handleNavegar       → función: cuando el usuario hace clic en el preview
//   handleElementoAbierto → función: cuando el builder abre un elemento
//   handleSeccionesChange → función: actualizar el estado de secciones
//   handleAgregarSeccion  → función: agregar nueva sección al builder
//   handleGuardar         → función: guardar en la API
//   handleDescargar       → función: descargar JSON
//   limpiarNotificaciones → función: limpiar mensajes de error/éxito
//
export function useBuilderState() {
  // ── Estado principal: las secciones del documento ─────────────────
  const [secciones, setSecciones] = useState([])

  // ── Estado de navegación: qué elemento está activo ────────────────
  // MEJORA: un solo objeto en lugar de 3 estados separados.
  // Esto elimina el problema de "renders intermedios inconsistentes".
  const [activeNav, setActiveNav] = useState({
    secId:  null,
    subId:  null,
    elemId: null,
  })

  // ── ID del elemento al que el preview debe hacer scroll ───────────
  // Se usa para la sincronización builder → preview (dirección inversa).
  // Cuando el usuario abre un elemento en el builder, App notifica al
  // PreviewPanel cuál elemento debe resaltar y hacer scroll.
  const [previewScrollId, setPreviewScrollId] = useState(null)

  // ── Estado de guardado ────────────────────────────────────────────
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const [errorGuardado,   setErrorGuardado]   = useState('')

  // ── Ref al BuilderPanel ───────────────────────────────────────────
  // useRef crea una referencia que persiste entre renders.
  // La usamos para llamar métodos del BuilderPanel desde afuera
  // (como agregarSeccion() o buildJsonActual()).
  // Equivalente en Java a tener una referencia al objeto para llamar métodos.
  const builderRef = useRef(null)

  // ── Hook de guardado (lógica de API) ─────────────────────────────
  const { guardar, cargando: cargandoGuardado } = useGuardarBoletin()

  // ── handleNavegar ─────────────────────────────────────────────────
  // Se llama cuando el usuario hace clic en el preview.
  // El PreviewPanel notifica: "se hizo clic en este tipo de elemento con este ID".
  //
  // useCallback: memoiza la función para que no se recree en cada render.
  // El [] al final significa: "esta función nunca cambia, créala solo una vez".
  // En Java sería como un método final de instancia.
  //
  // PARÁMETRO { tipo, id, secId, subId }:
  //   tipo: 'elemento' | 'subsegmento' | 'seccion'
  //   id:   ID del elemento/subsegmento/sección
  //   secId: ID de la sección padre (si aplica)
  //   subId: ID del subsegmento padre (si aplica)
  const handleNavegar = useCallback(({ tipo, id, secId, subId }) => {
    if (tipo === 'elemento') {
      // Actualizar los 3 valores en un solo setState (un solo render)
      setActiveNav({ secId: secId || null, subId: subId || null, elemId: id })
    } else if (tipo === 'subsegmento') {
      setActiveNav({ secId: secId || null, subId: id, elemId: null })
    } else {
      setActiveNav({ secId: id, subId: null, elemId: null })
    }
  }, [])  // [] = sin dependencias, la función es estable

  // ── handleElementoAbierto ─────────────────────────────────────────
  // Se llama cuando el builder ABRE un elemento (el usuario lo expande).
  // Notificamos al PreviewPanel para que haga scroll al elemento correspondiente.
  //
  // El setTimeout(null, 400) limpia el ID después de 400ms para que
  // el efecto pueda volver a dispararse si el usuario abre el mismo elemento
  // varias veces seguidas.
  const handleElementoAbierto = useCallback((elemId) => {
    setPreviewScrollId(elemId)
    setTimeout(() => setPreviewScrollId(null), 400)
  }, [])

  // ── handleSeccionesChange ─────────────────────────────────────────
  // Recibe una función updater (igual que el setSecciones de useState)
  // y actualiza el estado de secciones.
  // Es necesaria porque BuilderPanel recibe las secciones como prop
  // y las actualiza llamando a esta función.
  const handleSeccionesChange = useCallback((fn) => setSecciones(fn), [])

  // ── handleAgregarSeccion ──────────────────────────────────────────
  // Llama al método agregarSeccion() del BuilderPanel a través del ref.
  // Es como llamar un método público de un objeto en Java.
  const handleAgregarSeccion = useCallback(() => {
    builderRef.current?.agregarSeccion()
  }, [])

  // ── handleGuardar ─────────────────────────────────────────────────
  // Orquesta el proceso de guardado:
  //   1. Obtiene el JSON del BuilderPanel (buildJsonActual)
  //   2. Obtiene las imágenes pendientes de subir (getImagenes)
  //   3. Llama a guardar() del hook useGuardarBoletin
  //   4. Si exitoso: limpia el builder y muestra notificación
  //   5. Si error: muestra mensaje de error
  const handleGuardar = useCallback(async () => {
    const flat     = builderRef.current?.buildJsonActual?.()
    const imagenes = builderRef.current?.getImagenes?.() || {}
    if (!flat) return

    setGuardadoExitoso(false)
    setErrorGuardado('')

    try {
      await guardar(flat, imagenes)
      setGuardadoExitoso(true)
      setSecciones([])  // limpiar el builder después de guardar exitosamente
      setTimeout(() => setGuardadoExitoso(false), 5000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido'
      setErrorGuardado(`Hubo un problema al guardar. (${msg})`)
    }
  }, [guardar])

  // ── handleDescargar ───────────────────────────────────────────────
  const handleDescargar = useCallback(() => {
    const flat = builderRef.current?.buildJsonActual?.()
    if (flat) descargarJson(flat, 'boletin')
  }, [])

  // ── limpiarNotificaciones ─────────────────────────────────────────
  const limpiarNotificaciones = useCallback(() => {
    setGuardadoExitoso(false)
    setErrorGuardado('')
  }, [])

  // Retornar todo lo que los componentes necesitan
  return {
    secciones,
    setSecciones,
    activeNav,
    setActiveNav,
    previewScrollId,
    builderRef,
    guardadoExitoso,
    errorGuardado,
    cargandoGuardado,
    handleNavegar,
    handleElementoAbierto,
    handleSeccionesChange,
    handleAgregarSeccion,
    handleGuardar,
    handleDescargar,
    limpiarNotificaciones,
  }
}
