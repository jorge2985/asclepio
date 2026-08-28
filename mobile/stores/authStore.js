
// Store global de autenticacion.
//
// Zustand mantiene usuario/token disponibles para cualquier pantalla sin pasar
// props. Este archivo tambien persiste sesion, maneja 2FA y sincroniza push.
import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { servicioAutenticacion } from '../services/api';
import logger from '../services/logger';

// Store para manejar el estado de autenticación de manera global
// Estado principal: una pantalla puede leer usuario/token/cargando/error desde aqui.
const usarStoreAutenticacion = create((set, get) => ({
    usuario: null,
    token: null,
    refreshToken: null,
    cargando: false,
    error: null,

    // Estado de verificación 2FA
    verificacionPendiente: null, // { verificacion_id, email_enmascarado }

    // Hidratar: Recuperar sesión guardada al abrir la app
    hidratar: async () => {
        // Recupera sesion guardada al abrir la app.
        try {
            set({ cargando: true });
            let token, datosUsuario, refreshToken;

            if (Platform.OS === 'web') {
                token = localStorage.getItem('user_token');
                refreshToken = localStorage.getItem('user_refresh_token');
                datosUsuario = localStorage.getItem('user_data');
            } else {
                token = await SecureStore.getItemAsync('user_token');
                refreshToken = await SecureStore.getItemAsync('user_refresh_token');
                datosUsuario = await SecureStore.getItemAsync('user_data');
            }

            if (token && datosUsuario) {
                // Si hay sesion persistida, la app entra directo al area privada.
                set({ token, refreshToken, usuario: JSON.parse(datosUsuario) });
                sincronizarTokenPush(); // Intentar al abrir app
            }
        } catch (e) {
            logger.error('Error hidratando autenticacion', e);
        } finally {
            set({ cargando: false });
        }
    },

    // Función de Ingreso (Login) — Ahora retorna verificación pendiente
    ingreso: async (email, password) => {
        // Puede devolver 'verificacion' si el backend exige 2FA.
        try {
            set({ cargando: true, error: null, verificacionPendiente: null });
            const respuesta = await servicioAutenticacion.ingreso(email, password);

            const data = respuesta.data;

            if (data.requiere_verificacion) {
                // Guardamos el id temporal para que la pantalla de 2FA pueda verificar.
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
            const { token, refresh_token, usuario } = data;
            await guardarSesion(token, refresh_token, usuario);
            set({ token, refreshToken: refresh_token, usuario });
            sincronizarTokenPush(); // Sincronizar al loguearse directo
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
        // Transforma una verificacion pendiente en sesion real con JWT.
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

            const { token, refresh_token, usuario } = respuesta.data;

            // Guardar sesión
            await guardarSesion(token, refresh_token, usuario);
            set({ token, refreshToken: refresh_token, usuario, verificacionPendiente: null });
            sincronizarTokenPush(); // Sincronizar tras verificar 2FA
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
        // Reemplaza el verificacion_id viejo por uno nuevo generado por backend.
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
        // Registro crea usuario; login se hace luego con el flujo normal.
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
        // Borra almacenamiento local y estado en memoria.
        if (Platform.OS === 'web') {
            localStorage.removeItem('user_token');
            localStorage.removeItem('user_refresh_token');
            localStorage.removeItem('user_data');
        } else {
            await SecureStore.deleteItemAsync('user_token');
            await SecureStore.deleteItemAsync('user_refresh_token');
            await SecureStore.deleteItemAsync('user_data');
        }
        set({ usuario: null, token: null, refreshToken: null, verificacionPendiente: null });
    },
}));

// Helper para guardar sesión
async function guardarSesion(token, refreshToken, usuario) {
    // Web no tiene SecureStore; por eso se usa localStorage solo en Platform web.
    if (Platform.OS === 'web') {
        localStorage.setItem('user_token', token);
        localStorage.setItem('user_refresh_token', refreshToken);
        localStorage.setItem('user_data', JSON.stringify(usuario));
    } else {
        await SecureStore.setItemAsync('user_token', token);
        await SecureStore.setItemAsync('user_refresh_token', refreshToken);
        await SecureStore.setItemAsync('user_data', JSON.stringify(usuario));
    }
}

// Helper para sincronizar el Push Token con Backend
async function sincronizarTokenPush() {
    // Este helper no debe romper login: si push falla, se ignora en la UI.
    try {
        const { registerForPushNotificationsAsync } = require('../services/pushNotifications');
        const tokenPush = await registerForPushNotificationsAsync();
        if (tokenPush) {
            await servicioAutenticacion.guardarPushToken(tokenPush);
            logger.info('Push Token enviado al servidor exitosamente.');
        }
    } catch (e) {
        logger.info('Silenciosamente ignorando error de Push Token en la UI:', e);
    }
}

export default usarStoreAutenticacion;
