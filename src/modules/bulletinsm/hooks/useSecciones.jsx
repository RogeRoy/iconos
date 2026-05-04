import { useState } from "react";

export const useSecciones = () => {
  const [secciones, setSecciones] = useState([
    { id: 1, nombre: "Sección 1" },
    { id: 2, nombre: "Sección 2" }
  ]);

  const agregarSeccion = (nombre) => {
    const nueva = {
      id: Date.now(),
      nombre
    };
    setSecciones([...secciones, nueva]);
  };

  const eliminarSeccion = (id) => {
    setSecciones(secciones.filter(s => s.id !== id));
  };

  return {
    secciones,
    agregarSeccion,
    eliminarSeccion
  };
};