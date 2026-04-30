// ─────────────────────────────────────────────────────────────────────────
// components/RutaDocumento.jsx
// ─────────────────────────────────────────────────────────────────────────
//
// ¿QUÉ HACE ESTE COMPONENTE?
//   Cuando el usuario abre http://localhost:5173/documento/2
//   este componente toma el "2" de la URL, llama a la API
//   GET /bulletin/sections/2 y muestra el visor directamente,
//   sin que el usuario tenga que escribir el ID en el input.
//
//   Es como si alguien hubiera escrito "2" en el campo y dado clic en
//   "Buscar Contenido" automáticamente.
//
// ¿POR QUÉ UN COMPONENTE SEPARADO Y NO MODIFICAR VisorDocumento?
//   VisorDocumento.jsx ya funciona para cuando lo llamas desde el botón
//   "Ver Doc" del toolbar. No queremos romper esa funcionalidad.
//   RutaDocumento es un "wrapper" (envoltorio) que prepara el ID y
//   se lo pasa a VisorDocumento como prop.
//
// ANALOGÍA CON JAVA:
//   RutaDocumento es como un @GetMapping("/documento/{id}") que
//   extrae el parámetro de la URL y lo pasa al servicio.
//   VisorDocumento es el Service/View que hace el trabajo real.
//
// useParams() — hook de React Router
//   Lee los parámetros de la URL. En la ruta "/documento/:id",
//   useParams() devuelve { id: "2" } cuando la URL es /documento/2.
//   Es como request.getPathVariable("id") en Spring Boot.
//
// ─────────────────────────────────────────────────────────────────────────

import { useParams, useNavigate } from 'react-router-dom'
import VisorDocumentoDirecto       from './VisorDocumentoDirecto'

export default function RutaDocumento() {
  // useParams() lee el :id de la URL
  // Si la URL es /documento/2, params.id es "2" (string)
  const { id } = useParams()

  // useNavigate() devuelve una función para cambiar de ruta
  // navigate('/') lleva al usuario a la raíz (el builder)
  const navigate = useNavigate()

  // Convertir el id de string a número entero
  const bullId = parseInt(id, 10)

  // Validar que el ID sea un número válido
  if (!bullId || bullId <= 0) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#faf8f5', fontFamily: "'Noto Sans', sans-serif",
        gap: '16px', padding: '24px',
      }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <h2 style={{ color: '#611232', fontFamily: 'Georgia,serif', margin: 0 }}>
          ID de boletín inválido
        </h2>
        <p style={{ color: '#666', margin: 0 }}>
          La URL debe tener un número válido. Ejemplo: <code>/documento/2</code>
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

  // Renderizar el visor pasándole el bullId extraído de la URL
  // y una función para volver al inicio cuando el usuario lo pida
  return (
    <VisorDocumentoDirecto
      bullId={bullId}
      onVolver={() => navigate('/')}
    />
  )
}
