-- Limpiar datos existentes (opcional, cuidado en prod)
-- TRUNCATE medicos, pacientes, usuarios CASCADE;

-- 1. Insertar Usuarios (Password hash es '123456' bcrypt simulado o uno válido generado)
-- Nota: Para simplificar, insertaremos hashes reales generados previamente o un placeholder si no validamos hash estricto aun.
-- Hash para '123456': $2a$10$3QxDjD1ylg.wK/././././././././. (Ejemplo)
-- Usaremos un hash dummy valido de bcrypt: $2a$10$x.zN1j.1.1.1.1.1.1.1.1 (No valido real, pero sirve si no chequeamos)
-- Mejor usamos uno real generado por la app: $2a$10$4L.X.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x (Simulado)

-- Usuario Medico 1: Dr. Ana García
INSERT INTO usuarios (id, email, password_hash, rol)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ana@doctor.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'medico')
ON CONFLICT DO NOTHING;

INSERT INTO medicos (usuario_id, nombre_completo, especialidad, biografia, tarifa_hora, ubicacion, calificacion)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dr. Ana García', 'Medicina General', 'Especialista en atención primaria con 10 años de experiencia.', 50.00, 'Av. Reforma 222, CDMX', 4.9)
ON CONFLICT DO NOTHING;

-- Usuario Medico 2: Dr. Marcus Thorne
INSERT INTO usuarios (id, email, password_hash, rol)
VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'marcus@doctor.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'medico')
ON CONFLICT DO NOTHING;

INSERT INTO medicos (usuario_id, nombre_completo, especialidad, biografia, tarifa_hora, ubicacion, calificacion)
VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Dr. Marcus Thorne', 'Cardiología', 'Experto en salud cardiovascular.', 120.00, 'Hospital Central', 4.8)
ON CONFLICT DO NOTHING;

-- Usuario Paciente: Test User
INSERT INTO usuarios (id, email, password_hash, rol)
VALUES ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'juan@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'paciente')
ON CONFLICT DO NOTHING;

INSERT INTO pacientes (usuario_id, nombre_completo, telefono, direccion)
VALUES ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Juan Pérez', '555-1234', 'Calle Falsa 123')
ON CONFLICT DO NOTHING;

-- Cita de Prueba
INSERT INTO citas (id, medico_id, paciente_id, fecha_hora, duracion_minutos, motivo, estado, precio_estimado, direccion_atencion)
VALUES (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Dr. Ana
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', -- Juan
    NOW() + INTERVAL '1 day', -- Mañana
    30,
    'Dolor de cabeza persistente',
    'confirmada',
    50.00,
    'Calle Falsa 123'
ON CONFLICT DO NOTHING;

-- Disponibilidad del Doctor 1 (Dr. Ana García - Lunes a Viernes de 09:00 a 14:00 y 15:00 a 18:00)
INSERT INTO dispo_medicos (medico_id, dia_semana, hora_inicio, hora_fin) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, '09:00:00', '14:00:00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, '15:00:00', '18:00:00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, '09:00:00', '14:00:00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, '15:00:00', '18:00:00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, '09:00:00', '14:00:00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, '15:00:00', '18:00:00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, '09:00:00', '14:00:00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, '15:00:00', '18:00:00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5, '09:00:00', '14:00:00');

-- Disponibilidad del Doctor 2 (Dr. Marcus Thorne - Lunes a Miércoles de 10:00 a 16:00)
INSERT INTO dispo_medicos (medico_id, dia_semana, hora_inicio, hora_fin) VALUES 
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 1, '10:00:00', '16:00:00'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 2, '10:00:00', '16:00:00'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 3, '10:00:00', '16:00:00');
