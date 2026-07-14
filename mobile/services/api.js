// Servicio HTTP central de la app movil.
//
// Todo request al backend debe pasar por esta instancia de Axios para heredar:
// URL por entorno, Authorization Bearer, refresh token automatico y servicios
// agrupados por dominio.
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEFAULT_API_URLS = {
    // Defaults solo para desarrollo local. Staging/prod deben usar EXPO_PUBLIC_API_URL.
    web: 'http://localhost:8080/api',
    android: 'http://10.0.2.2:8080/api',
    ios: 'http://localhost:8080/api',
    default: 'http://localhost:8080/api',
};

const getApiUrl = () => {
    // Expo expone variables con prefijo EXPO_PUBLIC_ dentro del bundle mobile.
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (configuredUrl) {
        return configuredUrl;
    }

    return DEFAULT_API_URLS[Platform.OS] || DEFAULT_API_URLS.default;
};

export const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    // Antes de cada request se recupera el access token persistido y se agrega
    // Authorization. Web usa localStorage; nativo usa SecureStore.
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

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/verificar') &&
            !originalRequest.url.includes('/auth/refresh')
        ) {
            // Si el access token expiro, se intenta renovar una sola vez con
            // refresh token. _retry evita bucles infinitos de 401.
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

                const urlRefresh = `${API_URL}/auth/refresh`;
                const respuesta = await axios.post(urlRefresh, { refresh_token: refreshToken });
                const { token, refresh_token: nuevoRefreshToken, usuario } = respuesta.data;

                if (Platform.OS === 'web') {
                    localStorage.setItem('user_token', token);
                    localStorage.setItem('user_refresh_token', nuevoRefreshToken);
                    localStorage.setItem('user_data', JSON.stringify(usuario));
                } else {
                    await SecureStore.setItemAsync('user_token', token);
                    await SecureStore.setItemAsync('user_refresh_token', nuevoRefreshToken);
                    await SecureStore.setItemAsync('user_data', JSON.stringify(usuario));
                }

                const usarStoreAutenticacion = require('../stores/authStore').default;
                usarStoreAutenticacion.setState({ token, refreshToken: nuevoRefreshToken, usuario });

                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (err) {
                console.error('Error renovando token, cerrando sesion', err);
                const usarStoreAutenticacion = require('../stores/authStore').default;
                usarStoreAutenticacion.getState().cerrarSesion();
            }
        }
        return Promise.reject(error);
    }
);

export const servicioAutenticacion = {
    // Mantener estos wrappers chicos hace que las pantallas no conozcan rutas exactas.
    ingreso: (email, password) => api.post('/auth/login', { email, password }),
    verificar: (verificacion_id, codigo) => api.post('/auth/verificar', { verificacion_id, codigo }),
    reenviarCodigo: (verificacion_id) => api.post('/auth/reenviar-codigo', { verificacion_id }),
    registro: (datos) => api.post('/auth/registro', datos),
    guardarPushToken: (token) => api.put('/auth/push-token', { token }),
    refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
};

export const servicioDoctores = {
    listar: (query = '') => api.get(`/doctores?q=${query}`),
    obtener: (id) => api.get(`/doctores/${id}`),
};

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
