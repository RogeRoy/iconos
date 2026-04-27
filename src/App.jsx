import { useState, useCallback } from 'react'
import BuilderPanel   from './components/BuilderPanel'
import PreviewPanel   from './components/PreviewPanel'
import ErrorBoundary  from './components/ErrorBoundary'
import './App.css'

export default function App() {
  const [secciones,       setSecciones]       = useState([])
  const [activeSectionId, setActiveSectionId] = useState(null)

  const handleNavegar = useCallback(({ tipo, id, secId }) => {
    if (tipo === 'seccion') {
      setActiveSectionId(id)
    } else if (tipo === 'subsegmento') {
      setActiveSectionId(secId)
    }
  }, [])

  return (
    <div className="app-layout">
      <div className="app-builder">
        <ErrorBoundary>
          <BuilderPanel
            seccionesExternas={secciones}
            onSeccionesChange={setSecciones}
            activeSectionIdExterno={activeSectionId}
            onActiveSectionChange={setActiveSectionId}
          />
        </ErrorBoundary>
      </div>
      <div className="app-preview">
        <ErrorBoundary>
          <PreviewPanel
            secciones={secciones}
            onNavegar={handleNavegar}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}
