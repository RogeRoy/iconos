export const filtrarBoletines = (data, busqueda) => {
  if (!busqueda) return data;

  return data.filter((b) =>
    b.bull_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    b.bull_acronym?.toLowerCase().includes(busqueda.toLowerCase()) ||
    b.bull_desc?.toLowerCase().includes(busqueda.toLowerCase())
  );
};