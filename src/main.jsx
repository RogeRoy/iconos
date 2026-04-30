// ─────────────────────────────────────────────────────────────────────────
// main.jsx — v2  (agrega React Router para URLs directas)
// ─────────────────────────────────────────────────────────────────────────
//
// ¿QUÉ ES REACT ROUTER?
//   Es una librería que permite tener varias "páginas" en una aplicación
//   React que en realidad es un solo archivo HTML (SPA = Single Page App).
//
//   Sin React Router: la URL siempre es http://localhost:5173/
//   Con React Router: puedes tener rutas como:
//     http://localhost:5173/documento/2        → muestra el visor
//     http://localhost:5173/documento/guardar/2 → muestra el editor/builder
//
//   En Java con Spring Boot sería como tener @GetMapping("/documento/{id}")
//   y @GetMapping("/documento/guardar/{id}") en tu controlador.
//
// RUTAS CONFIGURADAS:
//   /                        → App.jsx (builder normal)
//   /documento/:id           → VisorDocumento cargando bull_id desde la URL
//   /documento/guardar/:id   → EditorBoletín o Builder según si hay datos
//
// INSTALACIÓN:
//   npm install react-router-dom
//
// ─────────────────────────────────────────────────────────────────────────

import { createRoot }          from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App                from './App'
import RutaDocumento      from './components/RutaDocumento'
import RutaGuardar        from './components/RutaGuardar'

// BrowserRouter: el "contenedor" que habilita el routing en toda la app.
// Routes: el bloque que contiene todas las rutas posibles.
// Route: una ruta individual. path es la URL, element es el componente.
//
// El * en path="*" es un "catch-all": cualquier URL que no coincida
// con las anteriores carga App.jsx (el builder normal).
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* Ruta principal — builder normal */}
      <Route path="/" element={<App />} />

      {/* /documento/2 → visor del boletín con ID 2 */}
      <Route path="/documento/:id" element={<RutaDocumento />} />

      {/* /documento/guardar/2 → builder/editor para el boletín ID 2 */}
      <Route path="/documento/guardar/:id" element={<RutaGuardar />} />

      {/* Cualquier otra URL → App normal */}
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>
)
