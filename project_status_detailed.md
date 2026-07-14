# Estado detallado del proyecto Asclepio

## Información general

- Proyecto: Asclepio
- Tipo: Plataforma médica móvil y backend para gestión de citas, pacientes, doctores y pagos
- Stack:
  - Backend: Go + PostgreSQL + JWT + bcrypt
  - Frontend móvil: React Native + Expo + Zustand + Axios
- Fecha de revisión: 2026-07-13
- Estado general: MVP técnico funcional, con base sólida, pero aún no listo para publicación en tiendas como app de consumo masivo y segura

---

## Resumen ejecutivo

Asclepio ya cuenta con una arquitectura base sólida y con flujos principales funcionales, especialmente en autenticación, gestión de citas y navegación móvil. Sin embargo, todavía requiere trabajo adicional en seguridad, datos reales, cobertura de calidad, despliegue y operaciones para poder considerarse una aplicación preparada para publicación seria en Play Store o App Store.

---

## Estado por capa

### 1. Backend

#### Estado actual
- Autenticación funcional con registro, login y verificación en dos pasos.
- JWT y refresh tokens implementados.
- Módulos de doctores, citas, pagos, reseñas y notificaciones disponibles.
- Health check y logging estructurado implementados.
- Tests unitarios e integración básicos funcionando.

#### Fortalezas
- Arquitectura bien organizada en varios módulos.
- Separación de lógica de negocio en servicios.
- Uso de PostgreSQL y validaciones centralizadas.

#### Pendientes importantes
- Eliminar secretos hardcodeados y mover toda configuración sensible a variables de entorno.
- Implementar RBAC real y autorización por rol en endpoints.
- Mejorar la arquitectura de módulos como appointments, doctors y reviews para que sigan el mismo patrón que identity.
- Completar endpoints que aún dependen de datos simulados o faltantes.

### 2. Frontend móvil

#### Estado actual
- Flujo de login, registro, verificación 2FA y navegación por rol implementado.
- Pantallas principales del paciente operativas.
- Pantallas de pagos, evaluación post-cita y seguimiento disponibles.
- Dashboard del doctor funcional, aunque con datos parciales.

#### Fortalezas
- Buen uso de Expo Router, Zustand y hooks.
- Arquitectura de servicios y manejo de errores bien planteada.
- Pruebas de UI/estado funcionando.

#### Pendientes importantes
- Eliminar datos hardcodeados o simulados en pantallas clave.
- Implementar carga real de imágenes de perfil y datos de pacientes.
- Completar pantallas placeholder como agenda y chat.
- Mejorar el diseño system y consistency visual.

---

## Seguridad

### Lo que ya existe
- JWT para autenticación.
- Hashing de contraseñas con bcrypt.
- Refresh tokens con rotación y almacenamiento hash.
- Rate limiting básico en login.

### Riesgos actuales
- Credenciales hardcodeadas en el backend.
- JWT secret con fallback inseguro.
- Fallback a headers como X-User-ID que pueden introducir riesgos de confianza indebida.
- Falta de control de autorización robusto por rol en todos los endpoints.
- Falta de auditoría, logs sensibles y políticas de seguridad más completas.

### Nivel de madurez de seguridad
- Nivel actual: intermedio.
- Necesita mejoras antes de una publicación seria.

---

## Funcionalidad y producto

### Funcionalidades ya presentes
- Registro e inicio de sesión.
- Verificación de identidad por código de 6 dígitos.
- Búsqueda y visualización de doctores.
- Reserva y gestión de citas.
- Pago simulado.
- Reseñas post-cita.
- Notificaciones push básicas.
- Seguimiento de cita y mapa simulado.

### Funcionalidades incompletas o placeholder
- Dashboard del doctor con datos simulados.
- Agenda del doctor aún no desarrollada por completo.
- Chat o mensajería no implementado.
- Historial médico completo aún no disponible como flujo real.
- Edición de perfil no implementada en backend.
- Gestión real de imágenes de perfil no implementada.

---

## Calidad técnica

### Verificación ejecutada
- Backend: pruebas ejecutadas con éxito mediante `go test ./...`
- Frontend: pruebas ejecutadas con éxito mediante `npm test -- --runInBand`

### Evidencia verificada
- Backend: todas las pruebas del paquete principal y módulos críticos pasaron.
- Frontend: 12 pruebas ejecutadas correctamente.

### Limitaciones actuales
- Falta testing end-to-end real.
- Falta testing de integración con servicios reales y flujos completos.
- Falta validación de carga y estabilidad bajo uso simultáneo.

---

## Publicación en stores

### ¿Qué se necesita para publicar en Play Store/App Store?

#### Requisitos mínimos de producto
- Eliminar placeholders y datos falsos de pantallas clave.
- Asegurar que el flujo completo funcione con datos reales y consistentes.
- Implementar mecanismos reales para pagos, autenticación, perfiles y notificaciones.

#### Requisitos de seguridad
- Rotación y manejo seguro de secretos.
- Autorización estricta por rol.
- Protección contra abuso y ataques comunes.
- Configuración segura para producción.

#### Requisitos de operación
- Entornos separados: desarrollo, staging y producción.
- CI/CD para builds automáticos.
- Monitoreo, logs y alertas.
- Backups y recuperación ante fallos.
- Manejo de incidencias y soporte.

#### Requisitos legales y de tienda
- Políticas de privacidad.
- Términos y condiciones.
- Consentimiento de notificaciones push.
- Documentación de manejo de datos de salud.

---

## Prioridades recomendadas

### Prioridad 1: seguridad y base de producción
1. Mover secretos a variables de entorno o servicios seguros.
2. Implementar RBAC real y verificar permisos en cada endpoint.
3. Reemplazar lógica insegura de confianza de headers.
4. Añadir logging de auditoría y manejo seguro de errores.

### Prioridad 2: cerrar flujos reales
1. Implementar endpoints reales para pacientes del médico y estadísticas del doctor.
2. Eliminar datos simulados de pantallas clave.
3. Hacer dinámica la “cita en curso” y el seguimiento.
4. Implementar edición de perfil y carga de imágenes.

### Prioridad 3: madurez de producto
1. Completar agenda del doctor.
2. Implementar chat o mensajería.
3. Integrar pagos reales y notificaciones más robustas.
4. Añadir pruebas de integración y E2E.

### Prioridad 4: publicación
1. Preparar builds firmados para Android/iOS.
2. Configurar entornos de staging y producción.
3. Implementar CI/CD y monitoreo.
4. Preparar documentación legal y de privacidad.

---

## Conclusión

El proyecto ya demuestra una base sólida y una dirección clara. Tiene suficiente avance para considerarse un MVP técnico serio, pero aún le faltan mejoras importantes en seguridad, datos reales, madurez operativa y preparación para tiendas para convertirse en una aplicación robusta y escalable de consumo masivo.

### Valoración general
- Arquitectura: buena
- Funcionalidad: intermedia-avanzada
- Seguridad: intermedia
- Preparación para producción: parcial
- Preparación para Play Store/App Store: aún incompleta

---

## Nota final

Este documento sirve como referencia para compartir con inversionistas, colaboradores o equipos de desarrollo. Puede actualizarse a medida que el proyecto avance.
