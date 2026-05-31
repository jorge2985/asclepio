# 📊 Estado del Proyecto Asclepio — Mayo 2026

## Resumen Ejecutivo

**Asclepio** es un sistema de gestión médica compuesto por un **backend en Go** (Clean Architecture, PostgreSQL, JWT) y un **frontend móvil en React Native + Expo**. El proyecto tiene una base sólida con una arquitectura bien diseñada, pero se encuentra en una **fase intermedia de desarrollo** donde los flujos principales (paciente) están mayormente funcionales y los flujos secundarios (médico) están parcialmente implementados o son placeholders.

---

## 🟢 Lo que YA está implementado y funcionando

### Backend (Go + PostgreSQL)

| Módulo | Estado | Detalle |
|--------|--------|---------|
| **Autenticación** | ✅ Completo | Registro, login con 2FA por código de 6 dígitos, verificación, reenvío de código |
| **JWT + Refresh Tokens** | ✅ Completo | Access tokens (24h), refresh tokens (7d) con rotación y hash SHA-256 en BD |
| **Repository Pattern** | ✅ Completo | Interfaz `Repository` bien definida en [repository.go](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/identity/repository.go) con implementación PostgreSQL |
| **Validaciones** | ✅ Completo | Validadores centralizados en [validator.go](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/identity/validator.go) con tests unitarios |
| **Doctores** | ✅ Funcional | Listar con búsqueda ILIKE y obtener por ID en [service.go](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/doctor/service.go) |
| **Citas** | ✅ Funcional | CRUD completo: crear, listar (paciente/médico), confirmar, cancelar, reprogramar, pagar, disponibilidad |
| **Pagos** | ⚠️ Simulado | Funcional pero con pago simulado (`referencia_externa: 'simulacion_mvp_1234'`) |
| **Reseñas** | ✅ Funcional | Crear reseña post-cita con recálculo automático de calificación del médico |
| **Notificaciones Push** | ✅ Funcional | Integración con Expo Push API, almacenamiento de tokens |
| **Middleware** | ✅ Completo | Auth middleware JWT + Rate limiter (5 intentos/min en login) |
| **Health Check** | ✅ Completo | `/health` con verificación de BD y respuesta JSON |
| **Logger** | ✅ Completo | slog estructurado (JSON en prod, texto en dev) |
| **Config** | ✅ Completo | Carga desde `.env` con fallbacks |
| **Tests** | ⚠️ Parcial | Tests de integración HTTP básicos + tests unitarios de validadores |

### Frontend Mobile (React Native + Expo Router)

| Pantalla / Flujo | Estado | Archivo |
|-------------------|--------|---------|
| **Login** | ✅ Funcional | [index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/index.js) — Con validación local y redirección por rol |
| **Registro** | ✅ Funcional | [registro.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/auth/registro.js) |
| **Verificación 2FA** | ✅ Funcional | [verificacion.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/auth/verificacion.js) — Input de 6 dígitos con reenvío |
| **Home Paciente** | ✅ Funcional | [(tabs)/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(tabs)/index.js) — Búsqueda con debounce, doctores reales del API |
| **Perfil Paciente** | ✅ Funcional | [(tabs)/perfil.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(tabs)/perfil.js) |
| **Detalle Médico** | ✅ Funcional | [medico/[id].js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/medico/[id].js) — Con reserva de citas |
| **Historial de Citas** | ✅ Funcional | [historial/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/historial/index.js) |
| **Selección de Pago** | ✅ Funcional | [pago/seleccion.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/pago/seleccion.js) |
| **Confirmación de Pago** | ✅ Funcional | [pago/exito.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/pago/exito.js) |
| **Evaluación Post-Cita** | ✅ Funcional | [evaluacion/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/evaluacion/index.js) |
| **Seguimiento de Cita** | ✅ Funcional | [seguimiento/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/seguimiento/index.js) — Con mapa simulado |
| **Dashboard Doctor** | ✅ Funcional | [(doctor)/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(doctor)/index.js) — Citas reales + datos de pacientes simulados |
| **Perfil Doctor** | ✅ Funcional | [(doctor)/perfil.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(doctor)/perfil.js) |
| **Detalle Paciente (médico)** | ✅ Funcional | [paciente/[id].js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/paciente/[id].js) |

### Infraestructura Frontend

| Componente | Estado | Detalle |
|------------|--------|---------|
| **Estado Global** | ✅ | Zustand store con persistencia (SecureStore nativo / localStorage web) |
| **API Service** | ✅ | Axios con interceptor de JWT automático, detección de plataforma |
| **Error Handler** | ✅ | Manejo centralizado por código HTTP, errores de red, validación |
| **Validaciones** | ✅ | Funciones puras reutilizables para login, registro, email, teléfono |
| **Design System** | ⚠️ Parcial | Theme con colores, spacing, fonts, borderRadius en [theme.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/styles/theme.js) — pero el doctor dashboard usa colores hardcodeados separados |
| **Push Notifications** | ✅ | Registro de permisos, obtención de token Expo, sincronización con backend |

---

## 🟡 Lo que está incompleto o es placeholder

### Pantallas Placeholder (solo texto "Próximamente")
- **Agenda Doctor** → [(doctor)/agenda.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(doctor)/agenda.js) — **Solo muestra "Próximamente"**
- **Chat Doctor** → [(doctor)/chat.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(doctor)/chat.js) — **Solo muestra "Próximamente"**

### Datos Simulados / Hardcodeados

| Elemento | Ubicación | Problema |
|----------|-----------|----------|
| Lista de pacientes | [(doctor)/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(doctor)/index.js#L20-L24) | Array `pacientesSimulados` hardcodeado — no hay endpoint backend |
| Stats del doctor | [(doctor)/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(doctor)/index.js#L120-L121) | "1,240 Pacientes" y "4.9 Calificación" son constantes fijas |
| Cita en curso en Home | [(tabs)/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/(tabs)/index.js#L69-L91) | Card "Cita en Curso — Dr. Ana García" siempre visible, sin datos reales |
| Seguimiento/Mapa | [seguimiento/index.js](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/seguimiento/index.js) | Mapa simulado sin geolocalización real |
| Imágenes de avatares | Múltiples pantallas | Usan `placehold.co` — no hay sistema de fotos de perfil |

### Backend: Funcionalidad Faltante
- ❌ **No hay endpoint para listar pacientes de un médico** (el dashboard usa datos fake)
- ❌ **No hay endpoint de estadísticas del médico** (pacientes atendidos, calificación promedio)
- ❌ **No hay endpoint para editar perfil** (ni paciente ni médico)
- ❌ **No hay endpoint de historial médico** del paciente
- ❌ **No hay chat/mensajería** (ni backend ni frontend)
- ❌ **No hay sistema de archivos/fotos** para avatares
- ❌ **No hay job de limpieza** de códigos 2FA expirados / refresh tokens revocados
- ❌ **La validación de disponibilidad al crear cita es un TODO** en [appointment/service.go L62](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/appointment/service.go#L62)

---

## 🔴 Deuda Técnica y Problemas Detectados

### Arquitectura

| Problema | Severidad | Detalle |
|----------|-----------|---------|
| **Appointment mezcla Handler + Service** | Media | [appointment/service.go](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/appointment/service.go) tiene 492 líneas con handler y service en el mismo archivo. No usa repository pattern como identity |
| **Doctor mezcla Handler + Service** | Media | [doctor/service.go](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/doctor/service.go) — mismo problema |
| **Review mezcla Handler + Service** | Media | [review/service.go](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/review/service.go) — mismo problema |
| **SQL inline en services** | Media | Appointment, doctor y review tienen SQL directo en los services en vez de pasar por un repository |
| **`internal/models/` vacío** | Baja | El directorio existe pero está vacío; cada dominio define sus propios models |
| **`internal/server/` vacío** | Baja | Directorio vacío sin uso |
| **`database/seeds/` vacío** | Baja | Se documenta un seed en README pero el directorio está vacío |
| **Dos migraciones `005_`** | Baja | `005_push_tokens.sql` y `005_refresh_tokens.sql` comparten número de secuencia |

### Seguridad

| Problema | Severidad | Detalle |
|----------|-----------|---------|
| **Credenciales hardcodeadas** | 🔴 Alta | Contraseña de BD en [config.go L25](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/config/config.go#L25) como default: `18zeta29` |
| **JWT secret hardcodeado** | 🔴 Alta | Default `dev_secreto_seguro_asclepio_2026` en config.go |
| **Código 2FA solo en consola** | Media | [service.go L167](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/identity/service.go#L167): `fmt.Printf("🔐 Código de verificación...")` — no se envía por email/SMS |
| **Fallback a X-User-ID header** | Media | Múltiples handlers aceptan `X-User-ID` del header si no hay contexto JWT, lo cual podría ser explotable |
| **No hay RBAC real** | Media | El middleware extrae el rol pero ningún endpoint lo verifica; un paciente podría llamar endpoints de médico |
| **IP spoofing en rate limiter** | Baja | Confía ciegamente en `X-Forwarded-For` sin validación |

### Código Frontend

| Problema | Severidad | Detalle |
|----------|-----------|---------|
| **Inconsistencia de design tokens** | Media | El doctor dashboard define su propia paleta `dc` en vez de usar el theme global |
| **`require()` dinámico** | Baja | El authStore usa `require('../services/errorHandler')` dinámico dentro de catches en vez de import estático |
| **`require()` para navegación** | Baja | En [index.js L53](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/mobile/app/index.js#L53): `require('../stores/authStore').default.getState()` en vez del hook |
| **Font Manrope declarada pero no cargada** | Baja | theme.js declara `Manrope` pero no hay `useFonts` en ningún layout |
| **No se guardan refresh tokens** | Media | El auth store guarda `token` y `usuario` pero no persiste el `refresh_token`, así que no puede renovar sesiones expiradas |
| **Archivos debug en raíz del proyecto** | Baja | `debug_login.go`, `fix_password.go`, `generate_hash.go`, `test_login.go` — deberían estar en scripts/ o eliminarse |

---

## 🗺️ Diseños de Referencia Disponibles (sin implementar)

El directorio `design_reference/` contiene **12 carpetas** de diseños que marcan la visión del producto:

1. `2-step_verification` ✅ (implementado)
2. `login_screen` ✅ (implementado)
3. `patient_search_home` ✅ (implementado)
4. `doctor_profile_&_booking` ✅ (implementado)
5. `selección_de_método_de_pago` ✅ (implementado)
6. `confirmación_de_pago_exitoso` ✅ (implementado)
7. `post-service_evaluation` ✅ (implementado)
8. `seguimiento_de_cita_y_mapa` ✅ (implementado, parcial)
9. `doctor_professional_dashboard` ✅ (implementado, parcial)
10. `user_profile_settings` ✅ (implementado)
11. `historial_médico_del_paciente` ⚠️ (implementado como lista de citas, no como historial médico real)
12. `detalle_del_paciente_para_médico` ⚠️ (pantalla existe pero con datos simulados)

---

## 📋 Recomendaciones: Por dónde seguir

### 🥇 Prioridad 1 — Cerrar brechas funcionales críticas

> [!IMPORTANT]
> Estas son las piezas que faltan para que el flujo médico-paciente funcione de punta a punta con datos reales.

1. **Implementar endpoint de pacientes del médico en el backend**
   - Nuevo endpoint `GET /api/doctores/pacientes` que devuelva pacientes que han tenido citas con el médico
   - Eliminar `pacientesSimulados` del dashboard doctor

2. **Implementar endpoint de estadísticas del médico**
   - `GET /api/doctores/stats` → total pacientes, calificación promedio, citas hoy/semana
   - Reemplazar las constantes "1,240" y "4.9" del dashboard

3. **Hacer la "Cita en Curso" dinámica**
   - Consultar citas con estado `en_camino` o `en_progreso` para el paciente actual
   - Ocultar la card si no hay cita activa

4. **Validar disponibilidad al crear citas**
   - Completar el TODO en [appointment/service.go L62](file:///c:/Users/Jorge/Documents/Proyectos/Asclepio/backend/internal/appointment/service.go#L62)
   - Verificar que no exista otra cita en el mismo horario

5. **Persistir y usar el refresh token en el frontend**
   - Guardar `refresh_token` en SecureStore
   - Implementar interceptor de Axios que renueve automáticamente al recibir 401

---

### 🥈 Prioridad 2 — Implementar pantallas placeholder

6. **Pantalla de Agenda del Doctor**
   - Vista de calendario con citas por día/semana
   - Permite al doctor gestionar su disponibilidad
   - Backend ya soporta la tabla `dispo_medicos`

7. **Sistema de Chat/Mensajería**
   - Requiere nuevo módulo backend (WebSocket o polling)
   - Pantallas de conversación doctor-paciente
   - Tabla nueva `mensajes` en BD

---

### 🥉 Prioridad 3 — Seguridad y Calidad

8. **Corregir problemas de seguridad**
   - Eliminar credenciales hardcodeadas del código (mantenerlas solo en `.env`)
   - Remover el fallback a `X-User-ID` header en todos los handlers
   - Implementar verificación de rol (RBAC) en endpoints protegidos
   - Validar `X-Forwarded-For` contra IPs de proxy conocidas

9. **Unificar arquitectura del backend**
   - Separar handlers de services en `appointment`, `doctor` y `review` como ya se hizo en `identity`
   - Implementar repository pattern en los módulos que aún hacen SQL directo

10. **Unificar design system del frontend**
    - Mover colores del doctor dashboard al theme global
    - Cargar la fuente Manrope con `expo-font` o reemplazarla por una que funcione
    - Eliminar `require()` dinámicos

11. **Limpieza general**
    - Eliminar archivos de debug de la raíz (`debug_login.go`, `fix_password.go`, etc.)
    - Corregir numeración de migraciones duplicadas (dos `005_`)
    - Eliminar directorios vacíos (`models/`, `server/`, `seeds/`)

---

### 🎯 Prioridad 4 — Mejoras futuras

12. **Envío real de códigos 2FA** (SMS vía Twilio / email vía SendGrid)
13. **Sistema de imágenes de perfil** (upload a S3/Cloudinary)
14. **Geolocalización real** en seguimiento de citas (react-native-maps)
15. **Sistema de notificaciones in-app** (bandeja de notificaciones)
16. **Pasarela de pago real** (Stripe/MercadoPago)
17. **Panel de administración** (el rol `admin` existe en el enum pero no tiene funcionalidad)
18. **CI/CD** (GitHub Actions para tests + build)

---

## 📈 Valoración General

| Aspecto | Nota | Comentario |
|---------|------|------------|
| Arquitectura Backend | **8/10** | Clean architecture bien aplicada en identity, pero inconsistente en otros módulos |
| Funcionalidad Backend | **7/10** | CRUD completo de los flujos principales, faltan endpoints secundarios |
| Arquitectura Frontend | **8/10** | Buena separación hooks/stores/services, design system definido |
| Funcionalidad Frontend | **7/10** | Flujo del paciente bastante completo, flujo del doctor con huecos |
| Seguridad | **5/10** | JWT/bcrypt/2FA implementados, pero hay credenciales expuestas y falta RBAC |
| Testing | **4/10** | Solo tests básicos de integración y validators; sin tests de services ni UI |
| Completitud vs Diseños | **75%** | 9 de 12 diseños implementados funcionalmente, 3 parciales |

> [!TIP]
> El proyecto tiene una base excelente. La recomendación principal es **cerrar los flujos existentes con datos reales** (prioridad 1) antes de agregar funcionalidad nueva. Esto convertirá el MVP en algo demo-able de punta a punta.
