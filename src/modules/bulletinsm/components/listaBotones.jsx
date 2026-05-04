import { BASE_IMAGE_URL } from "../api/api_conexion";
import { useNavigate } from "react-router-dom";

function ListaBotones({ botones = [] }) {
  const navigate = useNavigate();

  const irADetalle = (boletin) => {
    navigate(`/documento/${boletin.bull_id}`);
  };

  const activos = botones
    .filter(b => b.bull_status === true)
    .sort((a, b) => a.bull_name.localeCompare(b.bull_name));

  if (!activos.length) {
    return <p>No hay boletines</p>;
  }

  return (
    <>

      <div className="contenedor-botones">
        {activos.map((btn, index) => (
          <div key={btn.bull_id || index} className="icono-container tooltip-container">

            <div
              className="icono-container tooltip-container"
              onClick={() => irADetalle(btn)}
            >
              <div className="icono-boton">
                <img src={`${BASE_IMAGE_URL}${btn.bull_img_path}`} />
              </div>

              <div className="icono-texto">
                {btn.bull_acronym}
              </div>
            </div>

            <div className="tooltip-personalizado">
              <span className="tooltip-nombre">
                {btn.bull_name || "Sin nombre"}
              </span>

              <span className="tooltip-desc">
                {(btn.bull_desc || "Sin descripción").length > 150
                  ? (btn.bull_desc || "Sin descripción").slice(0, 150) + "..."
                  : (btn.bull_desc || "Sin descripción")}
              </span>
            </div>

          </div>
        ))}
      </div>
    </>
  );
}

export default ListaBotones;