-- Tabla para códigos de verificación en dos pasos (2FA)
CREATE TABLE codigos_verificacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo VARCHAR(6) NOT NULL,
    expira_en TIMESTAMP WITH TIME ZONE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    intentos INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda rápida por id y limpieza de expirados
CREATE INDEX idx_codigos_verificacion_usuario ON codigos_verificacion(usuario_id);
CREATE INDEX idx_codigos_verificacion_expira ON codigos_verificacion(expira_en);
