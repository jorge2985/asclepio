// mobile/__tests__/authStore.test.js
// Tests del Zustand Store de autenticación
// Mockea el módulo servicioAutenticacion para no hacer llamadas reales

// Tests del Zustand authStore.
//
// Mockea servicioAutenticacion y SecureStore para probar flujo de sesion sin
// backend ni almacenamiento nativo real.
jest.mock('react-native', () => ({
    Platform: { OS: 'android' },
}));

jest.mock('../services/api', () => ({
    servicioAutenticacion: {
        ingreso: jest.fn(),
        verificar: jest.fn(),
        reenviarCodigo: jest.fn(),
        registro: jest.fn(),
        guardarPushToken: jest.fn().mockResolvedValue({ data: { mensaje: 'ok' } }),
    },
    servicioCitas: {
        crear: jest.fn(),
        historial: jest.fn(),
        confirmar: jest.fn(),
        cancelar: jest.fn(),
        reprogramar: jest.fn(),
        pagar: jest.fn(),
        disponibilidad: jest.fn(),
        porMedico: jest.fn(),
    },
    default: {
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

jest.mock('../services/pushNotifications', () => ({
    registerForPushNotificationsAsync: jest.fn().mockResolvedValue(null),
}));

jest.mock('../services/errorHandler', () => ({
    manejarError: jest.fn(() => 'Error de conexión'),
    registrarError: jest.fn(),
}));

describe('usarStoreAutenticacion', () => {
    let useStore;

    beforeEach(() => {
        jest.resetModules();
        // Re-mockear después del reset
        jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
        jest.mock('../services/api', () => ({
            servicioAutenticacion: {
                ingreso: jest.fn(),
                verificar: jest.fn(),
                reenviarCodigo: jest.fn(),
                registro: jest.fn(),
                guardarPushToken: jest.fn().mockResolvedValue({ data: {} }),
            },
            default: {
                interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
            },
        }));
        jest.mock('../services/pushNotifications', () => ({
            registerForPushNotificationsAsync: jest.fn().mockResolvedValue(null),
        }));
        jest.mock('../services/errorHandler', () => ({
            manejarError: jest.fn(() => 'Error'),
            registrarError: jest.fn(),
        }));
    });

    test('el módulo authStore se puede importar', () => {
        expect(() => {
            require('../stores/authStore');
        }).not.toThrow();
    });

    test('estado inicial es null para usuario y token', () => {
        const useAuth = require('../stores/authStore').default;
        const state = useAuth.getState();
        expect(state.usuario).toBeNull();
        expect(state.token).toBeNull();
        expect(state.cargando).toBe(false);
        expect(state.error).toBeNull();
    });

    test('login fallido setea el error correctamente', async () => {
        const { servicioAutenticacion } = require('../services/api');
        servicioAutenticacion.ingreso.mockRejectedValue(new Error('Network Error'));

        const useAuth = require('../stores/authStore').default;
        const result = await useAuth.getState().ingreso('bad@test.com', 'wrongpass');

        expect(result).toBe(false);
        expect(useAuth.getState().error).not.toBeNull();
    });

    test('login exitoso con verificación 2FA retorna "verificacion"', async () => {
        const { servicioAutenticacion } = require('../services/api');
        servicioAutenticacion.ingreso.mockResolvedValue({
            data: {
                requiere_verificacion: true,
                verificacion_id: 'test-uuid-123',
                email_enmascarado: 'te***@test.com',
            },
        });

        const useAuth = require('../stores/authStore').default;
        const result = await useAuth.getState().ingreso('test@test.com', 'pass123');

        expect(result).toBe('verificacion');
        const state = useAuth.getState();
        expect(state.verificacionPendiente).not.toBeNull();
        expect(state.verificacionPendiente.verificacion_id).toBe('test-uuid-123');
    });

    test('cerrarSesion limpia el estado del store', async () => {
        const useAuth = require('../stores/authStore').default;
        // Simular que hay un usuario logueado
        useAuth.setState({ usuario: { id: '123', email: 'u@e.com', rol: 'paciente' }, token: 'tok' });

        await useAuth.getState().cerrarSesion();

        const state = useAuth.getState();
        expect(state.usuario).toBeNull();
        expect(state.token).toBeNull();
    });

    test('las funciones requeridas existen en el store', () => {
        const useAuth = require('../stores/authStore').default;
        const state = useAuth.getState();
        expect(typeof state.hidratar).toBe('function');
        expect(typeof state.ingreso).toBe('function');
        expect(typeof state.verificarCodigo).toBe('function');
        expect(typeof state.reenviarCodigo).toBe('function');
        expect(typeof state.registro).toBe('function');
        expect(typeof state.cerrarSesion).toBe('function');
    });
});
