import axios from "axios";

//  TOKEN
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJyb2dlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzkyNjQwNywiZXhwIjoxNzc3OTU1MjA3fQ.mQwf8N4UhnMws2D9vgyvnt-lYtn23cxI4UbhvlmGlTY";
//  URL base
const BASE_URL = "http://localhost:3001";

export const BASE_IMAGE_URL = "http://localhost:3001/images/";
// =========================
//  FUNCIÓN BASE
// =========================
const buildBulletinPayload = (boletin, status = true) => {
  return {
    bull_name: boletin.bull_name || "",
    bull_acronym: boletin.bull_acronym || "",
    bull_desc: boletin.bull_desc || "",
    bull_img_path: boletin.bull_img_path || "",
    bull_active_ini: boletin.bull_active_ini || null,
    bull_active_end: boletin.bull_active_end || null,
    bull_status: status,
    updated_by: "API_USER",
  };
};

// =========================
// ✅ GET
// =========================
export const getBulletines = async (status = true) => {
  const res = await axios.get(
    `${BASE_URL}/bulletins/0/${status}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );

  return res.data;
};

// =========================
// ✅ POST
// =========================
export const createBulletin = async (data) => {
  try {
    const formData = new FormData();

    formData.append("bull_name", data.bull_name);
    formData.append("bull_acronym", data.bull_acronym);
    formData.append("bull_desc", data.bull_desc);
    formData.append("bull_active_ini", data.bull_active_ini ?? "");
    formData.append("bull_active_end", data.bull_active_end ?? "");
    formData.append("bull_status", true);
    formData.append("updated_by", "WEB");

    formData.append("image", data.imagen);

    const res = await axios.post(
      "http://localhost:3001/bulletin",
      formData,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "multipart/form-data"
        }
      }
    );

    return res.data;

  } catch (error) {
    console.error("Error POST boletín:", error.response?.data || error);
    throw error;
  }
};

// =========================
// ✅ PATCH - OCULTAR
// =========================
export const desactivarBulletin = async (id) => {
  if (!id) throw new Error("ID undefined");

  const res = await axios.patch(
    `${BASE_URL}/bulletins/${id}`,
    {
      bull_status: false,
      updated_by: "API_USER",
    },
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );

  return res.data;
};

// =========================
// ✏️ PATCH - EDITAR
// =========================
export const updateBulletin = async (id, data) => {
  if (!id) throw new Error("ID undefined");

  try {
    const formData = new FormData();

    formData.append("bull_name", data.bull_name ?? "");
    formData.append("bull_acronym", data.bull_acronym ?? "");
    formData.append("bull_desc", data.bull_desc ?? "");
    formData.append("bull_status", data.bull_status ?? true);
    formData.append("updated_by", "WEB");

    // 🔥 NUEVO: prioridad
    formData.append("bull_priority", data.bull_priority ?? false);

    // 🔥 SOLO si hay imagen nueva
    if (data.imagen) {
      formData.append("image", data.imagen);
    }

    const res = await axios.patch(
      `${BASE_URL}/bulletins/${id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "multipart/form-data"
        },
      }
    );

    return res.data;

  } catch (error) {
    console.error("Error UPDATE boletín:", error.response?.data || error);
    throw error;
  }
};


// =========================
//  SEARCH API (ÚNICA)
// =========================
export const searchBulletinesAPI = async (keyword) => {
  const res = await axios.get(
    `${BASE_URL}/bulletins/search/${keyword}?keyword=${keyword}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );

  return res.data;
};