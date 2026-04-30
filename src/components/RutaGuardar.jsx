// ─────────────────────────────────────────────────────────────────────────
// components/RutaGuardar.jsx
// ─────────────────────────────────────────────────────────────────────────
//
// ¿QUÉ HACE ESTE COMPONENTE?
//   Cuando el usuario abre http://localhost:5173/documento/guardar/2:
//
//   1. Llama a GET /bulletin/sections/2
//
//   2. Si responde 404 (no hay secciones):
//      → Muestra el BUILDER VACÍO para crear el documento desde cero
//        (como si el usuario hubiera abierto el builder normal)
//        El bull_id 2 ya está pre-configurado para guardar en ese boletín.
//
//   3. Si responde 200 con datos:
//      → Muestra el EDITOR con las secciones cargadas
//        (como si el usuario hubiera escrito "2" en el EditorBoletín
//        y presionado "Cargar para editar")
//
// ¿POR QUÉ ESTE ENFOQUE?
//   Centraliza la lógica de "¿existe este boletín?" en un solo lugar.
//   Los componentes App y EditorBoletín no necesitan saber de dónde viene
//   el bull_id — solo reciben los datos listos.
//
// ESTADOS DE ESTE COMPONENTE:
//   'cargando'  → haciendo la llamada a la API, mostramos spinner
//   'builder'   → 404, mostrar builder vacío para crear
//   'editor'    → 200, mostrar editor con datos cargados
//   'error'     → error inesperado (500, red caída, etc.)
//
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState }    from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BuilderConId               from './BuilderConId'
import EditorConDatos             from './EditorConDatos'

// TOKEN y BASE_URL — idealmente vendrían de import.meta.env
// pero los leemos igual que en los otros componentes del proyecto
const TOKEN    = import.meta.env.VITE_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJtaWxsYSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzUwODI0NCwiZXhwIjoxNzc3NTM3MDQ0fQ.naEZDKTjT6nvk2iLu0ZTkMbbHpNKKrtgS7S_y3YlK0k'
const BASE_URL = import.meta.env.VITE_API_URL   || 'http://localhost:3001'

export default function RutaGuardar() {
  const { id }   = useParams()
  const navigate = useNavigate()

  // Estado de la pantalla: qué mostrar
  // 'cargando' | 'builder' | 'editor' | 'error'
  const [modo, setModo]         = useState('cargando')
  const [secciones, setSecciones] = useState([])   // datos cuando hay 200
  const [errorMsg, setErrorMsg]   = useState('')

  const bullId = parseInt(id, 10)

  useEffect(() => {
    // Si el ID no es válido, no intentar la llamada
    if (!bullId || bullId <= 0) {
      setErrorMsg('ID de boletín inválido en la URL.')
      setModo('error')
      return
    }

    // Llamar a la API para verificar si el boletín tiene secciones
    // Esta es la misma llamada que hace EditorBoletín cuando el usuario
    // escribe el ID y presiona "Cargar para editar"
    const verificar = async () => {
      console.log(`[RutaGuardar] Verificando boletín ${bullId}...`)

      try {
        const res = await fetch(`${BASE_URL}/bulletin/sections/${bullId}`, {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'accept': '*/*',
          },
        })

        if (res.status === 404) {
          // 404 = No hay secciones → mostrar builder vacío para crear
          console.log(`[RutaGuardar] Boletín ${bullId}: no tiene secciones → modo builder (crear)`)
          setModo('builder')
          return
        }

        if (!res.ok) {
          // Otro error HTTP
          const texto = await res.text()
          throw new Error(`Error ${res.status}: ${texto}`)
        }

        // 200 = Hay secciones → cargar en el editor
        const data = await res.json()
        const lista = Array.isArray(data) ? data : (data.data || [])

        console.log(`[RutaGuardar] Boletín ${bullId}: ${lista.length} secciones → modo editor (editar)`)
        setSecciones(lista)
        setModo('editor')

      } catch (err) {
        // Error de red o error inesperado
        console.error('[RutaGuardar] Error al verificar:', err)
        setErrorMsg(err.message || 'No se pudo conectar con el servidor.')
        setModo('error')
      }
    }

    verificar()

    // El array vacío [] significa: ejecutar este efecto solo una vez,
    // cuando el componente se monta por primera vez.
    // En Java sería como un método @PostConstruct.
  }, [bullId])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pantalla de carga ─────────────────────────────────────────────
  if (modo === 'cargando') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#faf8f5', fontFamily: "'Noto Sans', sans-serif",
        gap: '16px',
      }}>
        <div style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}>⏳</div>
        <p style={{ color: '#611232', fontWeight: 700, fontSize: '16px' }}>
          Verificando boletín #{bullId}...
        </p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    )
  }

  // ── Pantalla de error ─────────────────────────────────────────────
  if (modo === 'error') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#faf8f5', fontFamily: "'Noto Sans', sans-serif",
        gap: '16px', padding: '24px',
      }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <h2 style={{ color: '#611232', fontFamily: 'Georgia,serif', margin: 0 }}>
          No se pudo cargar el boletín
        </h2>
        <p style={{ color: '#666', margin: 0, textAlign: 'center', maxWidth: '400px' }}>
          {errorMsg}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#611232', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '10px 24px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Ir al Builder
        </button>
      </div>
    )
  }

  // ── Modo builder: crear documento nuevo ──────────────────────────
  // 404 → el boletín existe pero no tiene secciones todavía
  // Mostramos el builder normal con el bull_id pre-configurado
  if (modo === 'builder') {
    return (
      <BuilderConId
        bullId={bullId}
        onVolver={() => navigate('/')}
      />
    )
  }

  // ── Modo editor: editar documento existente ──────────────────────
  // 200 → hay secciones, las cargamos en el editor
  if (modo === 'editor') {
    return (
      <EditorConDatos
        bullId={bullId}
        seccionesIniciales={secciones}
        onVolver={() => navigate('/')}
      />
    )
  }

  return null
}
