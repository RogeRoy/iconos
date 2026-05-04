import { BASE_IMAGE_URL } from "../api/api_conexion";

function EditarBoletinSelector({
  data,
  setBoletinEditar,
  cancelar
}) {

  const activos = data.filter(b => b.bull_status === true);
  const inactivos = data.filter(b => b.bull_status === false);

  return (
    <div className="ocultar-container">

      <div className="cerrar-formulario" onClick={cancelar}>
        ✕
      </div>

      <h2>Editar Boletín</h2>

      <p className="texto-instruccion">
        En esta sección puedes editar la visualización principal de los boletines.
      </p>

      {/* 🔥 ACTIVOS */}
      <h3 style={{ color: "#6A1B2E" }}>Activos</h3>
      <div className="lista-ocultar">
        {activos.map(b => (
          <div
            key={b.bull_id}
            className={`item-editar activo`}
            onClick={() => setBoletinEditar(b)}
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

      {/* 🔥 INACTIVOS */}
      <h3 style={{ marginTop: "25px", color: "#888" }}>Inactivos</h3>
      <div className="lista-ocultar">
        {inactivos.map(b => (
          <div
            key={b.bull_id}
            className={`item-editar inactivo`}
            onClick={() => setBoletinEditar(b)}
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
        <button className="btn-cancelar" onClick={cancelar}>
          Cancelar
        </button>
      </div>

    </div>
  );
}

export default EditarBoletinSelector;