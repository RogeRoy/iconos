import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// 🔥 MÓDULO COMPLETO
import BulletinsApp from "./modules/bulletinsm/BulletinsApp"

// 🔥 BUILDER
import BuilderApp from './BuilderApp'

// YA EXISTENTES
import RutaDocumento from './components/RutaDocumento'
import RutaGuardar   from './components/RutaGuardar'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>

      {/* 🔥 HOME REAL */}
      <Route path="/" element={<BulletinsApp />} />

      {/* 🔥 BUILDER */}
      <Route path="/builder" element={<BuilderApp />} />

      {/* YA TENÍAS */}
      <Route path="/documento/:id" element={<RutaDocumento />} />
      <Route path="/documento/guardar/:id" element={<RutaGuardar />} />

      {/* fallback */}
      <Route path="*" element={<BulletinsApp />} />

    </Routes>
  </BrowserRouter>
)