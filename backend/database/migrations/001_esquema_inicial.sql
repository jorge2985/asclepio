CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE rol_usuario AS ENUM ('paciente', 'medico', 'admin');

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pacientes (
    usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    direccion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicos (
    usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    biografia TEXT,
    tarifa_hora DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ubicacion TEXT, -- Podría ser JSONB en el futuro para lat/long
    calificacion DECIMAL(3, 2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda
CREATE INDEX idx_medicos_especialidad ON medicos(especialidad);
CREATE INDEX idx_usuarios_email ON usuarios(email);
