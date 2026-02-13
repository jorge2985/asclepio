
// mobile/stores/authStore.js
import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { servicioAutenticacion } from '../services/api';

// Store para manejar el estado de autenticación de manera global
const usarStoreAutenticacion = create((set, get) => ({
    usuario: null,
    token: null,
    cargando: false, // isLoading -> cargando
    error: null,

    // Hidratar: Recuperar sesión guardada al abrir la app
    hidratar: async () => {
        try {
            set({ cargando: true });
            let token, datosUsuario;

            if (Platform.OS === 'web') {
                token = localStorage.getItem('user_token');
                datosUsuario = localStorage.getItem('user_data');
            } else {
                token = await SecureStore.getItemAsync('user_token');
                datosUsuario = await SecureStore.getItemAsync('user_data');
            }

            if (token && datosUsuario) {
                set({ token, usuario: JSON.parse(datosUsuario) });
            }
        } catch (e) {
            console.error('Error hidratando autenticación', e);
        } finally {
            set({ cargando: false });
        }
    },

    // Función de Ingreso (Login)
    ingreso: async (email, password) => {
        try {
            set({ cargando: true, error: null });
            const respuesta = await servicioAutenticacion.ingreso(email, password);

            const { token, usuario } = respuesta.data;

            // Guardar de forma segura
            // Guardar de forma segura (o localStorage en web)
            if (Platform.OS === 'web') {
                localStorage.setItem('user_token', token);
                localStorage.setItem('user_data', JSON.stringify(usuario));
            } else {
                await SecureStore.setItemAsync('user_token', token);
                await SecureStore.setItemAsync('user_data', JSON.stringify(usuario));
            }

            set({ token, usuario });
            return true;
        } catch (error) {
            const { manejarError, registrarError } = require('../services/errorHandler');
            registrarError(error, 'Login');
            const mensajeError = manejarError(error);
            set({ error: { message: mensajeError } });
            return false;
        } finally {
            set({ cargando: false });
        }
    },

    // Función de Registro
    registro: async (datos) => {
        try {
            set({ cargando: true, error: null });
            const respuesta = await servicioAutenticacion.registro(datos);

            // Asumimos que el backend retorna lo mismo que login al registrar, 
            // o si no, hacemos login automático. 
            // En nuestra implementación actual: Returns &Usuario (sin token).
            // Por lo tanto, después del registro exitoso, el usuario debe ir a login o logueamos auto.
            // Ajustamos para devolver true y que la UI redirija a login.

            return true;
        } catch (error) {
            const { manejarError, registrarError } = require('../services/errorHandler');
            registrarError(error, 'Registro');
            const mensajeError = manejarError(error);
            set({ error: { message: mensajeError } });
            return false;
        } finally {
            set({ cargando: false });
        }
    },

    // Función de Salida (Logout)
    cerrarSesion: async () => {
        if (Platform.OS === 'web') {
            localStorage.removeItem('user_token');
            localStorage.removeItem('user_data');
        } else {
            await SecureStore.deleteItemAsync('user_token');
            await SecureStore.deleteItemAsync('user_data');
        }
        set({ usuario: null, token: null });
    },
}));

export default usarStoreAutenticacion;
