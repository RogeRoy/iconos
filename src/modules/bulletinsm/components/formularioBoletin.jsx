  import { useState } from "react";

  function FormularioBoletin({
    nombre,
    setNombre,
    acronimo,
    setAcronimo,
    descripcion,
    setDescripcion,
    guardar,
    cancelar,
    setFechas,
    setImagen,
    errores,
    triggerError
  }) {
    const [mostrarSiempre, setMostrarSiempre] = useState(true);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [preview, setPreview] = useState(null);

    const handleImagen = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setImagen(file);
      setPreview(URL.createObjectURL(file));
    };

    const handleGuardar = () => {
      let ini = null;
      let fin = null;

      if (!mostrarSiempre) {
        ini = fechaInicio || null;
        fin = fechaFin || null;
      }

      setFechas({
        bull_active_ini: ini,
        bull_active_end: fin
      });

      guardar();
    };

    return (
      

      <div className="formulario">
        <div className="cerrar-formulario" onClick={cancelar}>
        ✕
      </div>
        <h2>Crear Boletín</h2>

        <p className="mensaje-obligatorio">
          * Todos los campos son obligatorios
        </p>


        <input
        key={`${triggerError}-nombre`}
          type="text"
          placeholder="Nombre del boletín"
          value={nombre}
          className={errores?.nombre ? "input-error" : ""}
          onChange={(e) => setNombre(e.target.value)}
        />
        {errores?.nombre && (
          <span className="mensaje-error">{errores.nombre}</span>
        )}

        <input
        key={`${triggerError}-acronimo`}
          type="text"
          placeholder="Acrónimo"
          value={acronimo}
          className={errores?.acronimo ? "input-error" : ""}
          onChange={(e) => setAcronimo(e.target.value)}
        />
        {errores?.acronimo && (
          <span className="mensaje-error">{errores.acronimo}</span>
        )}

        <textarea
        key={`${triggerError}-descripcion`}
          placeholder="Descripción"
          value={descripcion}
          className={errores?.descripcion ? "input-error" : ""}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        {errores?.descripcion && (
          <span className="mensaje-error">{errores.descripcion}</span>
        )}

        {/* IMAGEN */}
        <div className="zona-superior-form">
          <div className="campo-imagen">
            <label className="input-file-label">
              {preview ? (
                <img
                  src={preview}
                  alt="Vista previa"
                  className="preview-img-interna"
                />
              ) : (
                <span>Seleccionar imagen</span>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImagen}
                className="input-file-hidden"
              />
            </label>
          </div>

          <div className="checkbox-lateral">
            <input
              type="checkbox"
              checked={mostrarSiempre}
              onChange={() => setMostrarSiempre(!mostrarSiempre)}
            />
            <span>Mostrar siempre</span>
          </div>
        </div>


        {!mostrarSiempre && (
          <div className="fechas-container">
            <div className="fecha-box">
              <label>A partir de:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="fecha-box">
              <label>Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="botones-form">
          <button className="btn-guardar" onClick={handleGuardar}>
            Guardar
          </button>

          <button className="btn-cancelar" onClick={cancelar}>
            Cancelar
          </button>
        </div>
      </div>

    );
  }

  export default FormularioBoletin;