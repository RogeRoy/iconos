import { useState, useEffect } from "react";

function Buscador({ onBuscar }) {
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      onBuscar(texto.trim()); 
    }, 300); 

    return () => clearTimeout(delayDebounce);
  }, [texto, onBuscar]); 

  return (
    <div className="buscador-container">
      <input
        type="text"
        placeholder="Buscar por nombre, acrónimo o descripción..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="buscador-input"
      />
    </div>
  );
}

export default Buscador;
