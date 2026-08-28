// Logger liviano para codigo mobile.
//
// Mientras no haya proveedor externo de observabilidad, este modulo deja una
// sola puerta para logs de desarrollo. En produccion evita imprimir detalles.

const estaEnDesarrollo = typeof __DEV__ !== 'undefined' && __DEV__;

export const logger = {
    info: (...args) => {
        if (estaEnDesarrollo) {
            console.log(...args);
        }
    },
    warn: (...args) => {
        if (estaEnDesarrollo) {
            console.warn(...args);
        }
    },
    error: (...args) => {
        if (estaEnDesarrollo) {
            console.error(...args);
        }
    },
    group: (...args) => {
        if (estaEnDesarrollo && console.group) {
            console.group(...args);
        }
    },
    groupEnd: () => {
        if (estaEnDesarrollo && console.groupEnd) {
            console.groupEnd();
        }
    },
};

export default logger;
