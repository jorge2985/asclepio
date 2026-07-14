// Hook de conveniencia para pantallas que necesitan autenticacion.
//
// Envuelve authStore con nombres simples de UI: login, registrar, logout e
// inicializar. Si necesitas estado completo, usa authStore directamente.
import { useCallback } from 'react';
import usarStoreAutenticacion from '../stores/authStore';

/**
 * Hook personalizado para manejar autenticación
 * Abstrae la lógica de login, registro y redirección
 * NOTA: No usa useRouter para evitar incompatibilidad con React 19
 */
export function useAuth() {
    const { ingreso, registro, cerrarSesion, hidratar, usuario, cargando, error } = usarStoreAutenticacion();

    /**
     * Inicia sesión
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<boolean>} true si el login fue exitoso
     */
    const login = useCallback(async (email, password) => {
        const exito = await ingreso(email, password);
        return exito;
    }, [ingreso]);

    /**
     * Registra un nuevo usuario
     * @param {Object} datos - Datos del usuario a registrar
     * @returns {Promise<boolean>} true si el registro fue exitoso
     */
    const registrar = useCallback(async (datos) => {
        const exito = await registro(datos);
        return exito;
    }, [registro]);

    /**
     * Cierra sesión
     */
    const logout = useCallback(async () => {
        await cerrarSesion();
    }, [cerrarSesion]);

    /**
     * Inicializa la sesión desde el almacenamiento
     */
    const inicializar = useCallback(async () => {
        await hidratar();
    }, [hidratar]);

    return {
        login,
        registrar,
        logout,
        inicializar,
        usuario,
        cargando,
        error,
        estaAutenticado: !!usuario,
    };
}
