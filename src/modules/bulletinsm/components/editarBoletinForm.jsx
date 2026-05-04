import { useState, useEffect } from "react";
import { BASE_IMAGE_URL } from "../api/api_conexion";
function EditarBoletinForm({
  boletin,
  guardarEdicion,
  cancelar
}) {

  const [nombre, setNombre] = useState("");
  const [acronimo, setAcronimo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [status, setStatus] = useState(true);
  const [prioritario, setPrioritario] = useState(false);
const [imagen, setImagen] = useState(null);
const [preview, setPreview] = useState("");

 useEffect(() => {
  if (boletin) {
    setNombre(boletin.bull_name);
    setAcronimo(boletin.bull_acronym);
    setDescripcion(boletin.bull_desc);
    setStatus(boletin.bull_status);
    setPrioritario(boletin.bull_priority || false);
    setPreview(boletin.bull_img_path);
  }
}, [boletin]);

  

  return (
    
    <div className="formulario">
                  <div className="cerrar-formulario" onClick={cancelar}> ✕ </div>

      <h2>Editar boletín</h2>

      <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input value={acronimo} onChange={(e) => setAcronimo(e.target.value)} />
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <div>
  <label>Cambiar imagen:</label>
    
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) {
        setImagen(file);
        setPreview(URL.createObjectURL(file)); // preview inmediata
      }
    }}
  />
  {preview && (
  <div style={{ marginTop: "10px" }}>
    <img
      src={
        imagen
          ? preview
          : `${BASE_IMAGE_URL}${preview}`
      }
      alt="preview"
      width={120}
      style={{ borderRadius: "8px" }}
    />
  </div>
)}
</div>

      <div className="checkbox-container">
        <label>
          <input
            type="checkbox"
            checked={status}
            onChange={() => setStatus(!status)}
          />
          Activo
        </label>
        <label>
    <input
      type="checkbox"
      checked={prioritario}
      onChange={() => setPrioritario(!prioritario)}
    />
    Priorizar
  </label>
      </div>

      <div className="botones-form">
        <button
  className="btn-guardar"
  onClick={() =>
    guardarEdicion({
      bull_id: boletin.bull_id,
      bull_name: nombre,
      bull_acronym: acronimo,
      bull_desc: descripcion,
      bull_status: status,
      bull_priority: prioritario,
      imagen: imagen // 🔥 archivo (si existe)
    })
  }
>
  Guardar
</button>

        <button className="btn-cancelar" onClick={cancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default EditarBoletinForm;