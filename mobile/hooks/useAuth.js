// mobile/hooks/useAuth.js
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
    const login = async (email, password) => {
        const exito = await ingreso(email, password);
        return exito;
    };

    /**
     * Registra un nuevo usuario
     * @param {Object} datos - Datos del usuario a registrar
     * @returns {Promise<boolean>} true si el registro fue exitoso
     */
    const registrar = async (datos) => {
        const exito = await registro(datos);
        return exito;
    };

    /**
     * Cierra sesión
     */
    const logout = async () => {
        await cerrarSesion();
    };

    /**
     * Inicializa la sesión desde el almacenamiento
     */
    const inicializar = async () => {
        await hidratar();
    };

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
