
-- Estados de la Cita
CREATE TYPE estado_cita AS ENUM ('pendiente_confirmacion', 'confirmada', 'en_camino', 'en_progreso', 'completada', 'cancelada');
CREATE TYPE metodo_pago AS ENUM ('tarjeta', 'efectivo', 'seguro');

-- Tabla de Citas
CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES medicos(usuario_id),
    paciente_id UUID NOT NULL REFERENCES pacientes(usuario_id),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    motivo TEXT,
    estado estado_cita DEFAULT 'pendiente_confirmacion',
    precio_estimado DECIMAL(10, 2),
    direccion_atencion TEXT, -- Para visitas a domicilio
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pagos asociados a citas
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID NOT NULL REFERENCES citas(id),
    monto DECIMAL(10, 2) NOT NULL,
    metodo metodo_pago NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, pagado, fallido
    referencia_externa VARCHAR(255),
    fecha_pago TIMESTAMP WITH TIME ZONE
);

-- Tabla de Disponibilidad (Simple: Bloques horarios)
CREATE TABLE dispo_medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES medicos(usuario_id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL, -- 0=Domingo, 1=Lunes, ...
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    es_recurrente BOOLEAN DEFAULT TRUE,
    fecha_especifica DATE -- Si es excepcion o fecha unica
);

-- Reseñas (Evaluación)
CREATE TABLE resenas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID UNIQUE NOT NULL REFERENCES citas(id),
    autor_id UUID NOT NULL REFERENCES usuarios(id),
    medico_id UUID NOT NULL REFERENCES medicos(usuario_id),
    calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_citas_medico ON citas(medico_id, fecha_hora);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_dispo_medico ON dispo_medicos(medico_id);
