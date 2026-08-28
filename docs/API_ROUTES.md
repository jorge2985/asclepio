# Mapa de API y permisos

Este documento ayuda a navegar los endpoints actuales sin leer todo el router.
Las rutas viven en `backend/cmd/api/main.go` y los permisos se aplican con JWT
mas `RequireRole`.

## Publicas

- `GET /health`: estado de API y PostgreSQL.
- `POST /api/auth/login`: inicio de sesion.
- `POST /api/auth/verificar`: verificacion 2FA.
- `POST /api/auth/reenviar-codigo`: reenvio de codigo 2FA.
- `POST /api/auth/registro`: alta de usuario.

## Autenticadas

- `GET /api/auth/me`: perfil del usuario autenticado.
- `PUT /api/auth/me`: actualizacion de perfil permitido por rol.
- `PUT /api/auth/push-token`: guarda Expo Push Token del usuario.
- `POST /api/auth/refresh`: renueva access token con refresh token.
- `GET /api/doctores`: busqueda de medicos.
- `GET /api/doctores/{id}`: detalle publico de medico.
- `GET /api/citas/disponibilidad`: disponibilidad de medico.

## Rol paciente

- `POST /api/citas`: crea una cita.
- `GET /api/citas`: historial propio.
- `PUT /api/citas/{id}/reprogramar`: pide reprogramacion.
- `POST /api/citas/{id}/pago`: registra pago mock/local o proveedor configurado.
- `POST /api/resenas`: crea resena de una cita completada.

## Rol medico o admin

- `GET /api/doctores/pacientes`: pacientes relacionados por citas.
- `GET /api/doctores/pacientes/{id}`: detalle de paciente relacionado.
- `GET /api/doctores/estadisticas`: metricas del dashboard medico.
- `GET /api/citas/medico`: citas del medico autenticado.
- `PUT /api/citas/{id}/confirmar`: confirma una cita.

## Rol paciente, medico o admin

- `PUT /api/citas/{id}/cancelar`: cancela una cita segun reglas del servicio.

## Reglas de mantenimiento

- No agregar rutas protegidas sin `AuthMiddleware`.
- No usar headers de usuario como `X-User-ID` para autorizar acciones.
- Si una pantalla mobile necesita datos nuevos, crear primero endpoint con rol claro.
- Si el dato es sensible de salud, documentar consentimiento antes de exponerlo.
