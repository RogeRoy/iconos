// ErrorBoundary.jsx
// Captura errores de render en componentes hijo y muestra UI de recuperación.
// Sin esto, un error en PreviewPanel o Section deja la pantalla en blanco
// sin ningún mensaje visible.
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error capturado:', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px', background: '#fff0f0',
          border: '2px solid #e57373', borderRadius: '8px',
          margin: '12px', fontFamily: 'monospace',
        }}>
          <h3 style={{ color: '#b71c1c', margin: '0 0 8px' }}>
            ⚠ Error en este panel
          </h3>
          <p style={{ color: '#555', fontSize: '13px', margin: '0 0 8px' }}>
            {this.state.error?.message || 'Error desconocido'}
          </p>
          <button
            style={{
              background: '#611232', color: '#fff', border: 'none',
              borderRadius: '5px', padding: '6px 14px',
              cursor: 'pointer', fontSize: '12px',
            }}
            onClick={() => this.setState({ hasError: false, error: null, info: null })}
          >
            Reintentar
          </button>
          <details style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
            <summary>Ver detalles técnicos</summary>
            <pre style={{ overflow: 'auto', maxHeight: '120px' }}>
              {this.state.info?.componentStack}
            </pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}
