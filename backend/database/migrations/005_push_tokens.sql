-- Agregar columna para almacenar el token de Expo Push Notifications
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(255);
