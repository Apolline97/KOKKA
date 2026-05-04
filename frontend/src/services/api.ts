import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://kokka.onrender.com/api';

const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

const authHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Token ${token}`,
  };
};

// Auth
export const login = async (username: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

export const registro = async (username: string, email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/registro/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
};

// Recetas
export const getRecetas = async (params?: { categoria?: string; search?: string }) => {
  const headers = await authHeaders();
  let url = `${BASE_URL}/recetas/`;
  if (params) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    if (query) url += `?${query}`;
  }
  const res = await fetch(url, { headers });
  return res.json();
};

export const getReceta = async (id: number) => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/recetas/${id}/`, { headers });
  return res.json();
};

export const getRecomendadas = async () => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/recetas/recomendadas/`, { headers });
  return res.json();
};

export const getMisRecetas = async () => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/recetas/mis-recetas/`, { headers });
  return res.json();
};

export const crearReceta = async (
  data: {
    titulo: string;
    descripcion: string;
    tiempo_prep: number;
    calorias: number;
    categoria: string;
    pasos_nuevos: { numero: number; descripcion: string }[];
    ingredientes_nuevos?: { nombre: string; cantidad: number; unidad: string }[];
  },
  imagen?: { uri: string; type: string; name: string }
) => {
  const token = await getToken();
  const formData = new FormData();
  formData.append('titulo', data.titulo);
  formData.append('descripcion', data.descripcion);
  formData.append('tiempo_prep', String(data.tiempo_prep));
  formData.append('calorias', String(data.calorias));
  formData.append('categoria', data.categoria);
  formData.append('pasos_nuevos', JSON.stringify(data.pasos_nuevos));
  if (data.ingredientes_nuevos) {
    formData.append('ingredientes_nuevos', JSON.stringify(data.ingredientes_nuevos));
  }
  if (imagen) {
    formData.append('imagen', imagen as any);
  }
  const res = await fetch(`${BASE_URL}/recetas/`, {
    method: 'POST',
    headers: { Authorization: `Token ${token}` },
    body: formData,
  });
  return res.json();
};

// Perfil
export const getMiPerfil = async () => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/auth/perfil/`, { headers });
  return res.json();
};

export const updatePerfil = async (
  data: { preferencias?: string; alergias?: string; username?: string; email?: string },
  foto?: { uri: string; type: string; name: string }
) => {
  const token = await getToken();
  if (foto) {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined) formData.append(k, v as string); });
    formData.append('foto', foto as any);
    const res = await fetch(`${BASE_URL}/auth/perfil/`, {
      method: 'PUT',
      headers: { Authorization: `Token ${token}` },
      body: formData,
    });
    return res.json();
  }
  const headers = { 'Content-Type': 'application/json', Authorization: `Token ${token}` };
  const res = await fetch(`${BASE_URL}/auth/perfil/`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  return res.json();
};

export const guardarOnboarding = async (data: {
  tiempo_cocina: string;
  categoria_favorita: string;
  objetivo_calorias: string;
}) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/auth/perfil/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
    body: JSON.stringify({ ...data, onboarding_completado: true }),
  });
  return res.json();
};

export const getMisValoraciones = async () => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/valoraciones/`, { headers });
  return res.json();
};

// Favoritos
export const getFavoritos = async () => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/favoritos/`, { headers });
  return res.json();
};

export const addFavorito = async (receta_id: number) => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/favoritos/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ receta_id }),
  });
  return res.json();
};

export const removeFavorito = async (receta_id: number) => {
  const headers = await authHeaders();
  await fetch(`${BASE_URL}/favoritos/`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ receta_id }),
  });
};

// Planes
export const getPlanes = async (fecha?: string) => {
  const headers = await authHeaders();
  const url = fecha ? `${BASE_URL}/planes/?fecha=${fecha}` : `${BASE_URL}/planes/`;
  const res = await fetch(url, { headers });
  return res.json();
};

export const crearPlan = async (receta_id: number, fecha: string, tipo_comida: string) => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/planes/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ receta_id, fecha, tipo_comida }),
  });
  return res.json();
};

export const deletePlan = async (id: number) => {
  const headers = await authHeaders();
  await fetch(`${BASE_URL}/planes/${id}/`, { method: 'DELETE', headers });
};

// Valoraciones
export const getValoraciones = async (receta_id: number) => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/valoraciones/?receta_id=${receta_id}`, { headers });
  return res.json();
};

export const crearValoracion = async (receta_id: number, puntuacion: number, comentario: string) => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/valoraciones/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ receta_id, puntuacion, comentario }),
  });
  return res.json();
};

export const deleteReceta = async (id: number): Promise<boolean> => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/recetas/${id}/`, { method: 'DELETE', headers });
  return res.ok;
};

export const deleteAccount = async (): Promise<boolean> => {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/auth/cuenta/`, { method: 'DELETE', headers });
  return res.ok;
};

export const editarReceta = async (
  id: number,
  data: {
    titulo: string;
    descripcion: string;
    tiempo_prep: number;
    calorias: number;
    categoria: string;
    pasos_nuevos: { numero: number; descripcion: string }[];
  },
  imagen?: { uri: string; type: string; name: string }
) => {
  const token = await getToken();
  const formData = new FormData();
  formData.append('titulo', data.titulo);
  formData.append('descripcion', data.descripcion);
  formData.append('tiempo_prep', String(data.tiempo_prep));
  formData.append('calorias', String(data.calorias));
  formData.append('categoria', data.categoria);
  formData.append('pasos_nuevos', JSON.stringify(data.pasos_nuevos));
  if (imagen) {
    formData.append('imagen', imagen as any);
  }
  const res = await fetch(`${BASE_URL}/recetas/${id}/`, {
    method: 'PATCH',
    headers: { Authorization: `Token ${token}` },
    body: formData,
  });
  return res.json();
};
