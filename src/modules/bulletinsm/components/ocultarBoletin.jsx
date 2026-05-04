import { BASE_IMAGE_URL } from "../api/api_conexion";
function OcultarBoletin({
  data = [],
  seleccionado,
  setSeleccionado,
  ocultarBoletin,
  cancelar
}) {
  const activos = data
  .filter(b => b.bull_status === true)
  .sort((a, b) => a.bull_name.localeCompare(b.bull_name));
  

  return (
    <div className="ocultar-container">
      <div className="cerrar-formulario" onClick={cancelar}>
      ✕
    </div>
      <h2>Ocultar boletín</h2>

      <div className="lista-ocultar">
        {activos.map((b) => (
  <div
    key={b.bull_id}
    className={`item-eliminar ${
      seleccionado?.bull_id === b.bull_id ? "seleccionado" : ""
    }`}
    onClick={() => setSeleccionado(b)}
  >
    <div className="item-contenido">
      
      {/* 🔥 IMAGEN */}
      <img
        src={`${BASE_IMAGE_URL}${b.bull_img_path}`}
        alt={b.bull_name}
        className="item-img"
      />

      {/* 🔥 TEXTO */}
      <div className="item-texto">
        <strong>{b.bull_name}</strong>
        <span className="acronimo">({b.bull_acronym})</span>
      </div>

    </div>
  </div>
))}
      </div>

      <div className="botones-ocultar">
        <button className="btn-guardar" onClick={ocultarBoletin}>
          Ocultar
        </button>

        <button className="btn-cancelar" onClick={cancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default OcultarBoletin;