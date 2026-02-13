
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


// Interceptor para Token
api.interceptors.request.use(async (config) => {
    try {
        let token;
        let datosUsuarioStr;

        if (Platform.OS === 'web') {
            token = localStorage.getItem('user_token');
            datosUsuarioStr = localStorage.getItem('user_data');
        } else {
            token = await SecureStore.getItemAsync('user_token');
            datosUsuarioStr = await SecureStore.getItemAsync('user_data');
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // TEMPORAL: Enviar ID de usuario en header
        if (datosUsuarioStr) {
            const usuario = JSON.parse(datosUsuarioStr);
            config.headers['X-User-ID'] = usuario.id;
        }
    } catch (error) {
        console.error('Error leyendo token', error);
    }
    return config;
});

// Servicio de Autenticación
export const servicioAutenticacion = {
    // Función para ingreso (login)
    ingreso: (email, password) => api.post('/auth/login', { email, password }),
    // Función para registro de nuevos usuarios
    registro: (datos) => api.post('/auth/registro', datos),
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
};

export default api;
