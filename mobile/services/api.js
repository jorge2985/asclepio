
// mobile/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

// Detectar entorno
// Web -> localhost
// Android Emulator -> 10.0.2.2
// Físico -> Tu IP (192.168.0.5)
let url = 'http://192.168.0.5:8080/api';

if (Platform.OS === 'web') {
    url = 'http://localhost:8080/api';
} else if (Platform.OS === 'android') {
    // Si es emulador podría ser 10.0.2.2, pero dejamos la IP local para físico por defecto
    // url = 'http://10.0.2.2:8080/api'; 
}

export const API_URL = url;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


// Interceptor para Token (Request)
api.interceptors.request.use(async (config) => {
    try {
        let token;

        if (Platform.OS === 'web') {
            token = localStorage.getItem('user_token');
        } else {
            token = await SecureStore.getItemAsync('user_token');
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Error leyendo token', error);
    }
    return config;
});

// Interceptor para Respuestas (Manejo de 401 y renovación automática)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Evitar bucles infinitos y renovar solo ante un 401 que no sea en endpoints de login/verificación/refresh
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/verificar') &&
            !originalRequest.url.includes('/auth/refresh')
        ) {
            originalRequest._retry = true;
            try {
                let refreshToken;
                if (Platform.OS === 'web') {
                    refreshToken = localStorage.getItem('user_refresh_token');
                } else {
                    refreshToken = await SecureStore.getItemAsync('user_refresh_token');
                }

                if (!refreshToken) {
                    const usarStoreAutenticacion = require('../stores/authStore').default;
                    usarStoreAutenticacion.getState().cerrarSesion();
                    return Promise.reject(error);
                }

                // Solicitar nuevo token
                const urlRefresh = `${API_URL}/auth/refresh`;
                const respuesta = await axios.post(urlRefresh, { refresh_token: refreshToken });
                const { token, refresh_token: nuevoRefreshToken, usuario } = respuesta.data;

                // Persistir sesión nueva
                if (Platform.OS === 'web') {
                    localStorage.setItem('user_token', token);
                    localStorage.setItem('user_refresh_token', nuevoRefreshToken);
                    localStorage.setItem('user_data', JSON.stringify(usuario));
                } else {
                    await SecureStore.setItemAsync('user_token', token);
                    await SecureStore.setItemAsync('user_refresh_token', nuevoRefreshToken);
                    await SecureStore.setItemAsync('user_data', JSON.stringify(usuario));
                }

                // Sincronizar Zustand Store dinámicamente para evitar acoplamiento circular
                const usarStoreAutenticacion = require('../stores/authStore').default;
                usarStoreAutenticacion.setState({ token, refreshToken: nuevoRefreshToken, usuario });

                // Reintentar petición original con el nuevo token
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (err) {
                console.error('Error renovando token, cerrando sesión', err);
                const usarStoreAutenticacion = require('../stores/authStore').default;
                usarStoreAutenticacion.getState().cerrarSesion();
            }
        }
        return Promise.reject(error);
    }
);

// Servicio de Autenticación
export const servicioAutenticacion = {
    // Función para ingreso (login) — ahora retorna verificacion_id
    ingreso: (email, password) => api.post('/auth/login', { email, password }),
    // Verificar código 2FA — retorna token + usuario
    verificar: (verificacion_id, codigo) => api.post('/auth/verificar', { verificacion_id, codigo }),
    // Reenviar código de verificación
    reenviarCodigo: (verificacion_id) => api.post('/auth/reenviar-codigo', { verificacion_id }),
    // Función para registro de nuevos usuarios
    registro: (datos) => api.post('/auth/registro', datos),
    // Envia token Expo Push
    guardarPushToken: (token) => api.put('/auth/push-token', { token }),
    // Renovar sesión expirada con refresh token
    refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
};

// Servicio de Doctores
export const servicioDoctores = {
    listar: (query = '') => api.get(`/doctores?q=${query}`),
    obtener: (id) => api.get(`/doctores/${id}`),
};

// Servicio de Citas
export const servicioCitas = {
    crear: (datos) => api.post('/citas', datos),
    historial: () => api.get('/citas'),
    porMedico: () => api.get('/citas/medico'),
    disponibilidad: (medicoId, fecha) => api.get(`/citas/disponibilidad?medico_id=${medicoId}&fecha=${fecha}`),
    confirmar: (id) => api.put(`/citas/${id}/confirmar`),
    cancelar: (id) => api.put(`/citas/${id}/cancelar`),
    reprogramar: (id, nuevaFechaHora) => api.put(`/citas/${id}/reprogramar`, { nueva_fecha_hora: nuevaFechaHora }),
    pagar: (id, metodo) => api.post(`/citas/${id}/pago`, { metodo }),
};

export const servicioResenas = {
    crear: (cita_id, calificacion, comentario) => api.post('/resenas', { cita_id, calificacion, comentario }),
};

export default api;
