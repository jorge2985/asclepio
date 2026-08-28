// Utilidades centralizadas para transformar errores tecnicos en mensajes de UI.
//
// Las pantallas deberian llamar manejarError/registrarError en vez de repetir
// switches de HTTP status en cada componente.
import logger from './logger';

/**
 * Maneja errores de API de forma centralizada.
 * @param {Error} error - Error de axios o generico.
 * @returns {string} Mensaje de error amigable para el usuario.
 */
export const manejarError = (error) => {
    // Axios coloca la respuesta HTTP en error.response cuando el servidor contesto.
    if (error.response) {
        const { status, data } = error.response;
        const mensajeServidor = data?.message || data?.error || data?.mensaje;

        switch (status) {
            case 400:
                return mensajeServidor || 'Datos invalidos. Verifica la informacion ingresada.';
            case 401:
                return mensajeServidor || 'Credenciales incorrectas o sesion vencida.';
            case 403:
                return mensajeServidor || 'No tienes permisos para realizar esta accion.';
            case 404:
                return mensajeServidor || 'Recurso no encontrado.';
            case 409:
                return mensajeServidor || 'El recurso ya existe o hay un conflicto.';
            case 422:
                return mensajeServidor || 'Datos de validacion incorrectos.';
            case 429:
                return mensajeServidor || 'Demasiados intentos. Espera unos minutos.';
            case 500:
                return 'Error del servidor. Intenta nuevamente mas tarde.';
            case 503:
                return 'Servicio no disponible. Intenta nuevamente mas tarde.';
            default:
                return mensajeServidor || `Error del servidor (${status})`;
        }
    }

    // Si hubo request pero no response, suele ser red, timeout o API caida.
    if (error.request) {
        return 'No se pudo conectar con el servidor. Verifica tu conexion a internet.';
    }

    if (error.message) {
        return `Error: ${error.message}`;
    }

    return 'Ocurrio un error inesperado. Intenta nuevamente.';
};

/**
 * Extrae errores de validacion del backend en formato { campo: mensaje }.
 * @param {Object} errorData - Datos del error del backend.
 * @returns {Object} Objeto con errores por campo.
 */
export const extraerErroresValidacion = (errorData) => {
    if (!errorData?.errors || typeof errorData.errors !== 'object') {
        return {};
    }

    return Object.keys(errorData.errors).reduce((errores, campo) => {
        errores[campo] = errorData.errors[campo];
        return errores;
    }, {});
};

/**
 * Registra errores solo durante desarrollo local.
 * @param {Error} error - Error original.
 * @param {string} contexto - Flujo donde ocurrio el error.
 */
export const registrarError = (error, contexto = '') => {
    logger.group(`Error${contexto ? ` en ${contexto}` : ''}`);
    logger.error('Mensaje:', error.message);
    if (error.response) {
        logger.error('Status:', error.response.status);
        logger.error('Data:', error.response.data);
    }
    logger.error('Stack:', error.stack);
    logger.groupEnd();
};
