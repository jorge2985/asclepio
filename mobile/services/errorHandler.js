// mobile/services/errorHandler.js

/**
 * Maneja errores de API de forma centralizada
 * @param {Error} error - Error de axios o genérico
 * @returns {string} Mensaje de error amigable para el usuario
 */
export const manejarError = (error) => {
    // Error de respuesta del servidor
    if (error.response) {
        const { status, data } = error.response;

        // Errores específicos por código de estado
        switch (status) {
            case 400:
                return data.message || 'Datos inválidos. Verifica la información ingresada.';
            case 401:
                return 'Credenciales incorrectas. Verifica tu email y contraseña.';
            case 403:
                return 'No tienes permisos para realizar esta acción.';
            case 404:
                return 'Recurso no encontrado.';
            case 409:
                return data.message || 'El recurso ya existe.';
            case 422:
                return data.message || 'Datos de validación incorrectos.';
            case 500:
                return 'Error del servidor. Intenta nuevamente más tarde.';
            case 503:
                return 'Servicio no disponible. Intenta nuevamente más tarde.';
            default:
                return data.message || `Error del servidor (${status})`;
        }
    }

    // Error de red (sin respuesta del servidor)
    if (error.request) {
        return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }

    // Error en la configuración de la petición
    if (error.message) {
        return `Error: ${error.message}`;
    }

    // Error desconocido
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
};

/**
 * Extrae mensajes de error de validación del backend
 * @param {Object} errorData - Datos del error del backend
 * @returns {Object} Objeto con errores por campo
 */
export const extraerErroresValidacion = (errorData) => {
    if (!errorData || !errorData.errors) {
        return {};
    }

    const errores = {};

    // Si el backend envía errores en formato { field: message }
    if (typeof errorData.errors === 'object') {
        Object.keys(errorData.errors).forEach(campo => {
            errores[campo] = errorData.errors[campo];
        });
    }

    return errores;
};

/**
 * Registra errores para debugging (en desarrollo)
 * @param {Error} error 
 * @param {string} contexto - Contexto donde ocurrió el error
 */
export const registrarError = (error, contexto = '') => {
    if (__DEV__) {
        console.group(`❌ Error${contexto ? ` en ${contexto}` : ''}`);
        console.error('Mensaje:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        console.error('Stack:', error.stack);
        console.groupEnd();
    }
};
