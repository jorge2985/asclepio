# Tareas de Implementación

- [x] Implementar la validación de disponibilidad en el backend
    - [x] Agregar validación de colisiones horarias en `backend/internal/appointment/service.go`
- [x] Implementar la persistencia de refresh tokens en `authStore.js`
    - [x] Incorporar el campo `refreshToken` en Zustand store y método `hidratar`
    - [x] Modificar `guardarSesion` y `cerrarSesion` para gestionar `user_refresh_token`
    - [x] Guardar el `refresh_token` real tras un login exitoso y al verificar 2FA
- [x] Implementar la renovación automática de tokens (interceptor de Axios)
    - [x] Agregar the endpoint `refresh` a `servicioAutenticacion` en `mobile/services/api.js`
    - [x] Registrar interceptor de respuestas en `api.js` que gestione errores 401 usando `require()` dinámico para evitar ciclos
- [x] Hacer dinámicas las pantallas de citas en curso
    - [x] Consultar cita en curso en `PantallaInicio` (`mobile/app/(tabs)/index.js`) y ocultar la tarjeta si no hay citas activas
    - [x] Hacer dinámico el renderizado de `PantallaSeguimiento` (`mobile/app/seguimiento/index.js`)
- [/] Verificación (Base de Datos Requerida)
    - [/] Notificar al usuario para levantar la base de datos
    - [ ] Compilar y levantar backend para validar colisiones de agendamiento
    - [ ] Validar flujo de refresco automático y cita en curso
