// mobile/__tests__/api.test.js
// Tests unitarios de las funciones de services/api.js
// Mockea axios para evitar peticiones HTTP reales

jest.mock('axios', () => {
    const mockAxiosInstance = {
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
    };
    const mockAxios = {
        create: jest.fn(() => mockAxiosInstance),
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
    };
    return mockAxios;
});

jest.mock('react-native', () => ({
    Platform: { OS: 'android' },
}));

describe('servicioAutenticacion', () => {
    let servicioAutenticacion;
    let axiosMock;

    beforeEach(() => {
        jest.resetModules();
        // Necesitamos re-importar después de resetear para respetar mocks
        jest.mock('axios', () => {
            const mockInstance = {
                post: jest.fn().mockResolvedValue({ data: { ok: true } }),
                get: jest.fn().mockResolvedValue({ data: [] }),
                put: jest.fn().mockResolvedValue({ data: { ok: true } }),
                interceptors: {
                    request: { use: jest.fn() },
                    response: { use: jest.fn() },
                },
            };
            return {
                create: jest.fn(() => mockInstance),
                ...mockInstance,
            };
        });
    });

    test('el módulo api.js se puede importar sin errores', () => {
        // Verificar que el módulo se carga correctamente
        expect(() => {
            require('../services/api');
        }).not.toThrow();
    });

    test('servicioAutenticacion tiene los métodos requeridos', () => {
        const { servicioAutenticacion } = require('../services/api');
        expect(typeof servicioAutenticacion.ingreso).toBe('function');
        expect(typeof servicioAutenticacion.verificar).toBe('function');
        expect(typeof servicioAutenticacion.reenviarCodigo).toBe('function');
        expect(typeof servicioAutenticacion.registro).toBe('function');
        expect(typeof servicioAutenticacion.guardarPushToken).toBe('function');
    });

    test('servicioCitas tiene los métodos requeridos', () => {
        const { servicioCitas } = require('../services/api');
        expect(typeof servicioCitas.crear).toBe('function');
        expect(typeof servicioCitas.historial).toBe('function');
        expect(typeof servicioCitas.confirmar).toBe('function');
        expect(typeof servicioCitas.cancelar).toBe('function');
        expect(typeof servicioCitas.reprogramar).toBe('function');
        expect(typeof servicioCitas.pagar).toBe('function');
        expect(typeof servicioCitas.disponibilidad).toBe('function');
    });

    test('servicioDoctores tiene los métodos requeridos', () => {
        const { servicioDoctores } = require('../services/api');
        expect(typeof servicioDoctores.listar).toBe('function');
        expect(typeof servicioDoctores.obtener).toBe('function');
    });

    test('servicioResenas tiene el método crear', () => {
        const { servicioResenas } = require('../services/api');
        expect(typeof servicioResenas.crear).toBe('function');
    });
});

describe('URL de API', () => {
    test('API_URL está definida', () => {
        jest.mock('react-native', () => ({
            Platform: { OS: 'android' },
        }));
        const { API_URL } = require('../services/api');
        expect(API_URL).toBeDefined();
        expect(typeof API_URL).toBe('string');
    });
});
