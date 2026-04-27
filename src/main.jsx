// main.jsx — Punto de entrada de React
// NOTA: StrictMode removido porque causa doble-montaje en desarrollo,
// lo que borra el contenido de los editores contentEditable al primer render.
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(<App />)
