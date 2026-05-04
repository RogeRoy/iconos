import { BASE_IMAGE_URL } from "../api/api_conexion";
import { useNavigate } from "react-router-dom";
function ListaBotones({ botones = [] }) {
  const navigate = useNavigate();

  const irADetalle = (boletin) => {
    navigate("/boletin", { state: boletin });
  };
  const activos = botones.filter(b => b.bull_status === true);

  if (!activos.length) {
    return <p>No hay boletines</p>;
  }

  // 🔥 Separar prioritarios y normales
  const prioritarios = activos
    .filter(b => b.bull_priority === true)
    .sort((a, b) => a.bull_name.localeCompare(b.bull_name));

  const normales = activos
    .filter(b => !b.bull_priority)
    .sort((a, b) => a.bull_name.localeCompare(b.bull_name));

  return (
    <>
      <h3 style={{ textAlign: "center" }}>Lista de boletines</h3>

      {/* 🔥 SECCIÓN PRIORITARIOS */}
      {prioritarios.length > 0 && (
        <>
          <div style={{ marginTop: "10px", marginBottom: "5px", fontWeight: "bold" }}>
            Boletines Prioritarios
          </div>

          <div className="contenedor-botones">
            {prioritarios.map((btn, index) => (
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

                <div className="icono-texto">
                  {btn.bull_acronym}
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
      )}

      {/* 🔥 SECCIÓN NORMAL */}
      <div className="contenedor-botones">
        {normales.map((btn, index) => (
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