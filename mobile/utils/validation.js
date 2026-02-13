// mobile/utils/validation.js

/**
 * Valida un email usando expresión regular
 * @param {string} email 
 * @returns {boolean} true si el email es válido
 */
export const validarEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
};

/**
 * Valida una contraseña
 * @param {string} password 
 * @param {number} minLength - Longitud mínima (default: 6)
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarPassword = (password, minLength = 6) => {
    if (!password || typeof password !== 'string') {
        return { valido: false, mensaje: 'La contraseña es requerida' };
    }

    if (password.length < minLength) {
        return { valido: false, mensaje: `La contraseña debe tener al menos ${minLength} caracteres` };
    }

    return { valido: true, mensaje: '' };
};

/**
 * Valida un nombre completo
 * @param {string} nombre 
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarNombreCompleto = (nombre) => {
    if (!nombre || typeof nombre !== 'string') {
        return { valido: false, mensaje: 'El nombre es requerido' };
    }

    const nombreTrim = nombre.trim();
    if (nombreTrim.length < 3) {
        return { valido: false, mensaje: 'El nombre debe tener al menos 3 caracteres' };
    }

    // Verificar que tenga al menos nombre y apellido
    const partes = nombreTrim.split(' ').filter(p => p.length > 0);
    if (partes.length < 2) {
        return { valido: false, mensaje: 'Ingresa nombre y apellido' };
    }

    return { valido: true, mensaje: '' };
};

/**
 * Valida un número de teléfono
 * @param {string} telefono 
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarTelefono = (telefono) => {
    if (!telefono || typeof telefono !== 'string') {
        return { valido: false, mensaje: 'El teléfono es requerido' };
    }

    // Remover espacios y guiones
    const telefonoLimpio = telefono.replace(/[\s-]/g, '');

    // Verificar que solo contenga números y tenga entre 8 y 15 dígitos
    const regex = /^\d{8,15}$/;
    if (!regex.test(telefonoLimpio)) {
        return { valido: false, mensaje: 'Ingresa un teléfono válido (8-15 dígitos)' };
    }

    return { valido: true, mensaje: '' };
};

/**
 * Valida datos de registro de paciente
 * @param {Object} datos 
 * @returns {Object} { valido: boolean, errores: Object }
 */
export const validarRegistroPaciente = (datos) => {
    const errores = {};

    if (!validarEmail(datos.email)) {
        errores.email = 'Email inválido';
    }

    const validacionPassword = validarPassword(datos.password);
    if (!validacionPassword.valido) {
        errores.password = validacionPassword.mensaje;
    }

    const validacionNombre = validarNombreCompleto(datos.nombre_completo);
    if (!validacionNombre.valido) {
        errores.nombre_completo = validacionNombre.mensaje;
    }

    if (datos.telefono) {
        const validacionTelefono = validarTelefono(datos.telefono);
        if (!validacionTelefono.valido) {
            errores.telefono = validacionTelefono.mensaje;
        }
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
};

/**
 * Valida datos de login
 * @param {Object} datos 
 * @returns {Object} { valido: boolean, errores: Object }
 */
export const validarLogin = (datos) => {
    const errores = {};

    if (!validarEmail(datos.email)) {
        errores.email = 'Email inválido';
    }

    if (!datos.password || datos.password.length === 0) {
        errores.password = 'La contraseña es requerida';
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
};
