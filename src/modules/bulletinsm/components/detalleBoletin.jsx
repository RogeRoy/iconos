import { useLocation, useNavigate } from "react-router-dom";
import { BASE_IMAGE_URL } from "../api/api_conexion";

function DetalleBoletin() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const boletin = state;

  if (!boletin) return <p>No hay información</p>;

  return (
    <div className="formulario">
      
      {/* 🔥 BOTÓN VOLVER */}
      <div
        className="cerrar-formulario"
        onClick={() => navigate(-1)}
      >
        ✕
      </div>

      <h2>{boletin.bull_name}</h2>

      <img
        src={`${BASE_IMAGE_URL}${boletin.bull_img_path}`}
        alt={boletin.bull_name}
        className="preview-img"
      />

      <p>
        <b>Acrónimo:</b> {boletin.bull_acronym}
      </p>

      <p>
        {boletin.bull_desc || "Sin descripción"}
      </p>

    </div>
  );
}

export default DetalleBoletin;