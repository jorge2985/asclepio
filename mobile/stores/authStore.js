
// mobile/stores/authStore.js
import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { servicioAutenticacion } from '../services/api';

// Store para manejar el estado de autenticación de manera global
const usarStoreAutenticacion = create((set, get) => ({
    usuario: null,
    token: null,
    cargando: false,
    error: null,

    // Estado de verificación 2FA
    verificacionPendiente: null, // { verificacion_id, email_enmascarado }

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

    // Función de Ingreso (Login) — Ahora retorna verificación pendiente
    ingreso: async (email, password) => {
        try {
            set({ cargando: true, error: null, verificacionPendiente: null });
            const respuesta = await servicioAutenticacion.ingreso(email, password);

            const data = respuesta.data;

            if (data.requiere_verificacion) {
                // Guardar estado de verificación pendiente
                set({
                    verificacionPendiente: {
                        verificacion_id: data.verificacion_id,
                        email_enmascarado: data.email_enmascarado,
                    },
                });
                return 'verificacion'; // Indica que necesita 2FA
            }

            // Fallback: si el backend retorna token directamente (compat)
            const { token, usuario } = data;
            await guardarSesion(token, usuario);
            set({ token, usuario });
            return 'ok';
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

    // Verificar código 2FA
    verificarCodigo: async (codigo) => {
        try {
            set({ cargando: true, error: null });
            const { verificacionPendiente } = get();
            if (!verificacionPendiente) {
                set({ error: { message: 'No hay verificación pendiente' } });
                return false;
            }

            const respuesta = await servicioAutenticacion.verificar(
                verificacionPendiente.verificacion_id,
                codigo
            );

            const { token, usuario } = respuesta.data;

            // Guardar sesión
            await guardarSesion(token, usuario);
            set({ token, usuario, verificacionPendiente: null });
            return true;
        } catch (error) {
            const { manejarError, registrarError } = require('../services/errorHandler');
            registrarError(error, 'Verificación 2FA');
            const mensajeError = manejarError(error);
            set({ error: { message: mensajeError } });
            return false;
        } finally {
            set({ cargando: false });
        }
    },

    // Reenviar código de verificación
    reenviarCodigo: async () => {
        try {
            set({ error: null });
            const { verificacionPendiente } = get();
            if (!verificacionPendiente) return false;

            const respuesta = await servicioAutenticacion.reenviarCodigo(
                verificacionPendiente.verificacion_id
            );

            const data = respuesta.data;
            set({
                verificacionPendiente: {
                    verificacion_id: data.verificacion_id,
                    email_enmascarado: data.email_enmascarado,
                },
            });
            return true;
        } catch (error) {
            const { manejarError, registrarError } = require('../services/errorHandler');
            registrarError(error, 'Reenviar Código');
            const mensajeError = manejarError(error);
            set({ error: { message: mensajeError } });
            return false;
        }
    },

    // Función de Registro
    registro: async (datos) => {
        try {
            set({ cargando: true, error: null });
            await servicioAutenticacion.registro(datos);
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
        set({ usuario: null, token: null, verificacionPendiente: null });
    },
}));

// Helper para guardar sesión
async function guardarSesion(token, usuario) {
    if (Platform.OS === 'web') {
        localStorage.setItem('user_token', token);
        localStorage.setItem('user_data', JSON.stringify(usuario));
    } else {
        await SecureStore.setItemAsync('user_token', token);
        await SecureStore.setItemAsync('user_data', JSON.stringify(usuario));
    }
}

export default usarStoreAutenticacion;
