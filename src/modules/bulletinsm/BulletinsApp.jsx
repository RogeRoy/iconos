import { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route, useNavigate } from "react-router-dom";
import DetalleBoletin from "./components/detalleBoletin";
import {
  getBulletines,
  createBulletin,
  desactivarBulletin,
  updateBulletin,
} from "./api/api_conexion.jsx";

import FormularioBoletin from "./components/formularioBoletin.jsx";
import ListaBotones from "./components/listaBotones.jsx";
import Buscador from "./components/buscador.jsx";
import OcultarBoletin from "./components/ocultarBoletin.jsx";
import EditarBoletinSelector from "./components/editarBoletinSelector.jsx";
import EditarBoletinForm from "./components/editarBoletinForm.jsx";

function App() {
  const navigate = useNavigate();
const [triggerError, setTriggerError] = useState(false);
  const [data, setData] = useState([]);
  const [resultadosBusqueda, setResultadosBusqueda] = useState(null);
  const [mostrarMenu, setMostrarMenu] = useState(false);

  const [seleccionado, setSeleccionado] = useState(null);
  const [boletinEditar, setBoletinEditar] = useState(null);

  const [nombre, setNombre] = useState("");
const [acronimo, setAcronimo] = useState("");
const [descripcion, setDescripcion] = useState("");
const [fechas, setFechas] = useState({});
const [imagen, setImagen] = useState(null);
const [errores, setErrores] = useState({});

  // ========================
  // CARGAR DATOS
  // ========================
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resultado = await getBulletines(true);
      setData(resultado);
    } catch (error) {
      console.error(error);
    }
  };

  // ========================
  // BUSCAR
  // ========================
  const buscar = (keyword) => {
    const texto = keyword.trim().toLowerCase();

    if (!texto) {
      setResultadosBusqueda(null);
      return;
    }

    const filtrados = data.filter((b) =>
      b.bull_name?.toLowerCase().includes(texto) ||
      b.bull_acronym?.toLowerCase().includes(texto) ||
      b.bull_desc?.toLowerCase().includes(texto)
    );

    setResultadosBusqueda(filtrados);
  };

  const listaFiltrada =
    resultadosBusqueda !== null ? resultadosBusqueda : data;

  // ========================
  // ACCIONES
  // ========================
  const guardar = async (nuevo) => {
  const nuevosErrores = {};

  if (!nuevo.bull_name?.trim()) {
    nuevosErrores.nombre = "El nombre es obligatorio";
  }

  if (!nuevo.bull_acronym?.trim()) {
    nuevosErrores.acronimo = "El acrónimo es obligatorio";
  }

  if (!nuevo.bull_desc?.trim()) {
    nuevosErrores.descripcion = "La descripción es obligatoria";
  }

  if (!nuevo.imagen) {
    nuevosErrores.imagen = "La imagen es obligatoria";
  }

  if (Object.keys(nuevosErrores).length > 0) {
    setErrores(nuevosErrores);

    // 🔥 AQUÍ VA EL TRIGGER
    setTriggerError(prev => !prev);

    return;
  }

  setErrores({});

  await createBulletin(nuevo);
  await cargarDatos();
  navigate("/builder");{ 
  state: { boletin: res }
  }
};

  const ocultarBoletin = async () => {
    if (!seleccionado) return;

    await desactivarBulletin(seleccionado.bull_id);
    await cargarDatos();
    navigate("/");
  };

  const guardarEdicion = async (boletin) => {
    await updateBulletin(boletin.bull_id, boletin);
    await cargarDatos();
    navigate("/");
  };

  // ========================
  // UI
  // ========================
  return (
    <>
      <header className="header-sirel">
  <div className="header-contenido">
    
    <div className="logo-area">
      <img
        src="public/images/logoSirel.png"
        className="logo-sirel"
      />
      <h1>SIREL</h1>
    </div>

    <Buscador onBuscar={buscar} />

    {/* 🔥 WRAPPER DEL MENÚ */}
    <div className="menu-wrapper">
      <button
        className="search-button"
        onClick={() => setMostrarMenu(!mostrarMenu)}
      >
        MENÚ
      </button>

      {mostrarMenu && (
        <div className="menu">
          <button onClick={() => navigate("/crear")}>
            Nuevo Boletín
          </button>
          <button onClick={() => navigate("/ocultar")}>
            Ocultar Boletín
          </button>
          <button onClick={() => navigate("/editar")}>
            Editar Boletín
          </button>
        </div>
      )}
    </div>

  </div>
</header>


      <Routes>
        <Route path="/" element={
      <div>
        {/* Aquí dejas tu lista actual */}
        <ListaBotones botones={listaFiltrada} />
      </div>
    } />
    
    <Route path="/boletin" element={<DetalleBoletin />} />
        {/* HOME */}
        <Route
          path="/"
          element={<ListaBotones botones={listaFiltrada} />}
        />

        {/* CREAR */}
        <Route
          path="/crear"
          element={
            <FormularioBoletin
  nombre={nombre}
  setNombre={setNombre}
  acronimo={acronimo}
  setAcronimo={setAcronimo}
  descripcion={descripcion}
  setDescripcion={setDescripcion}
  setFechas={setFechas}
  setImagen={setImagen}
  errores={errores}
  triggerError={triggerError}
  guardar={() => guardar({
    bull_name: nombre,
    bull_acronym: acronimo,
    bull_desc: descripcion,
    ...fechas,
    imagen
  })}
  cancelar={() => navigate(-1)}
/>
          }
        />

        {/* OCULTAR */}
        <Route
          path="/ocultar"
          element={
            <OcultarBoletin
              data={listaFiltrada}
              seleccionado={seleccionado}
              setSeleccionado={setSeleccionado}
              ocultarBoletin={ocultarBoletin}
              cancelar={() => navigate(-1)}
            />
          }
        />

        {/* EDITAR - SELECTOR */}
        <Route
          path="/editar"
          element={
            <EditarBoletinSelector
              data={listaFiltrada}
              setBoletinEditar={(b) => {
                setBoletinEditar(b);
                navigate(`/editar/${b.bull_id}`);
              }}
              cancelar={() => navigate(-1)}
            />
          }
        />

        {/* EDITAR - FORM */}
        <Route
          path="/editar/:id"
          element={
            <EditarBoletinForm
              boletin={boletinEditar}
              guardarEdicion={guardarEdicion}
              cancelar={() => navigate(-1)}
            />
          }
        />
      </Routes>
      
    </>
  );
}

export default App;     