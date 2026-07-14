# Hoja de ruta para llevar Asclepio a uso masivo

## Diagnostico breve

Asclepio ya tiene una base tecnica real: backend en Go, PostgreSQL, autenticacion con JWT y refresh tokens, app movil con Expo Router, flujos de paciente, citas, pagos simulados, resenas, notificaciones y dashboard medico parcial.

El proyecto todavia esta en fase MVP. Para convertirse en una aplicacion descargable y usable por muchas personas, el foco debe pasar de "demo funcional" a "producto seguro, operable, confiable, legalmente publicable y escalable".

Los bloqueos principales detectados son:

- Configuracion sensible con defaults inseguros en `backend/internal/config/config.go`.
- Uso de `X-User-ID` como fallback en varios handlers protegidos.
- Falta de RBAC estricto por rol en endpoints de paciente, medico y admin.
- Datos simulados en dashboard medico, detalle de paciente, pago, seguimiento y perfiles.
- App movil apuntando a IP/local host en `mobile/services/api.js`.
- Pantallas placeholder como agenda y chat.
- Falta de flujo real para edicion de perfil, imagenes, datos medicos, verificacion profesional y pagos reales.
- CI basico existente, pero sin E2E, seguridad automatizada, builds firmados ni despliegue completo.
- Ausencia visible de preparacion legal, privacidad, soporte y operacion productiva.

## Objetivo

Convertir Asclepio en una aplicacion movil de salud lista para distribucion publica en Android/iOS, con seguridad de produccion, datos reales, experiencia completa para pacientes y medicos, operaciones confiables y cumplimiento legal.

## Fase 0 - Ordenar la base antes de crecer

Duracion estimada: 1 a 2 semanas.

Objetivo: eliminar riesgos obvios y dejar el repositorio preparado para trabajar con ritmo profesional.

Estado: completada. Se retiraron secretos hardcodeados, se movieron los scripts de debug fuera de la raiz a `backend/scripts/`, la app movil usa configuracion por entorno y la documentacion de arranque quedo actualizada.

Acciones:

1. Eliminar secretos hardcodeados.
   - Quitar `DATABASE_URL` real y `JWT_SECRET` por defecto del codigo.
   - Hacer que produccion falle al iniciar si faltan secretos obligatorios.
   - Crear `.env.example` sin credenciales reales.

2. Retirar archivos de debug de la raiz.
   - Mover o eliminar `debug_login.go`, `fix_password.go`, `generate_hash.go`, `test_login.go`.
   - Dejar scripts utiles bajo una carpeta `scripts/` documentada.

3. Normalizar configuracion movil.
   - Sustituir IP fija `192.168.0.5` por variables Expo/EAS.
   - Separar API URL de desarrollo, staging y produccion.

4. Arreglar documentacion de arranque.
   - Actualizar nombres reales de migraciones.
   - Documentar comandos backend, mobile, tests y variables.

Resultado esperado:

- Un desarrollador nuevo puede levantar el proyecto sin tocar codigo.
- No hay credenciales reales en el repositorio.
- El proyecto distingue desarrollo, staging y produccion.

## Fase 1 - Seguridad minima de produccion

Duracion estimada: 2 a 4 semanas.

Objetivo: que ningun usuario pueda acceder, modificar o ver datos que no le corresponden.

Avance implementado: RBAC centralizado agregado, rutas protegidas por rol, fallback `X-User-ID` eliminado y tests unitarios de RBAC agregados.

Pendiente por credenciales/proveedores/decisiones externas:

- Configurar un secret manager real para `JWT_SECRET`, `DATABASE_URL` y futuros secretos de pagos/notificaciones en staging y produccion.
- Definir politica de rotacion de secretos y responsable operativo.
- Configurar dominios reales en `ALLOWED_ORIGINS` para staging y produccion.
- Integrar auditoria centralizada con un proveedor de logs/observabilidad si se usara uno externo.

Acciones:

1. Eliminar fallback a `X-User-ID`.
   - Usar solo el usuario obtenido desde JWT.
   - Quitar `X-User-ID` de CORS y tests salvo casos estrictamente internos.

2. Implementar RBAC centralizado.
   - Crear middleware `RequireRole("paciente")`, `RequireRole("medico")`, `RequireRole("admin")`.
   - Aplicarlo a citas, doctores, pacientes, resenas, pagos y perfil.

3. Endurecer JWT y sesiones.
   - Validar `rol`, `sub`, expiracion y firma.
   - Acortar access token si corresponde.
   - Mantener refresh token rotativo con revocacion.
   - Agregar logout server-side/revocacion de refresh token.

4. Mejorar validaciones y errores.
   - Validar entradas con reglas consistentes.
   - Evitar mensajes internos en respuestas publicas.
   - Normalizar formato JSON de errores.

5. Agregar auditoria.
   - Registrar eventos sensibles: login, refresh, cambio de perfil, pago, cita creada/cancelada, acceso a historial medico.
   - Evitar guardar datos sensibles en logs.

Resultado esperado:

- Pacientes solo ven sus datos.
- Medicos solo ven sus citas y pacientes relacionados.
- Admin queda separado como rol operativo.
- El backend puede exponerse en internet con un nivel basico razonable de seguridad.

## Fase 2 - Cerrar flujos reales de paciente

Duracion estimada: 3 a 5 semanas.

Objetivo: que una persona pueda instalar la app, registrarse, completar su perfil, buscar medico, reservar, pagar, recibir notificaciones y ver su historial sin datos falsos.

Avance implementado: endpoint real de perfil `GET/PUT /api/auth/me` agregado y pantalla de perfil del paciente conectada a datos reales del backend.

Pendiente por credenciales/proveedores/decisiones externas:

- Elegir y configurar almacenamiento de imagenes/documentos: S3, Cloudinary, Firebase Storage, Supabase Storage u otro.
- Obtener credenciales del proveedor elegido para fotos de perfil y documentos medicos.
- Definir politica de privacidad y consentimiento para almacenar datos de salud, imagenes y documentos.
- Definir si habra geolocalizacion real para seguimiento; si la hay, configurar permisos, mapas y politica de uso de ubicacion.
- Configurar proveedor real de envio 2FA si el codigo dejara de mostrarse por consola: email transaccional, SMS o WhatsApp.

Acciones:

1. Perfil real del paciente.
   - Endpoint `GET/PUT /auth/me` o `/perfil`.
   - Edicion de nombre, telefono, direccion y foto.
   - Carga de imagenes con almacenamiento externo.

2. Historial medico real.
   - Modelo para antecedentes, alergias, medicacion, condiciones cronicas y documentos.
   - Permisos explicitos para que un medico vea informacion del paciente.
   - Pantalla movil conectada a backend.

3. Busqueda y reserva robusta.
   - Filtros por especialidad, ubicacion, disponibilidad, precio y calificacion.
   - Validacion real de disponibilidad por rango horario, no solo hora exacta.
   - Prevencion de doble reserva con transacciones o restricciones.

4. Seguimiento de cita realista.
   - Reemplazar mapa simulado por estado real de la cita.
   - Definir si habra geolocalizacion real; si se usa, pedir permisos y justificarlo.
   - Estados claros: pendiente, confirmada, en camino, en progreso, completada, cancelada.

5. Notificaciones utiles.
   - Confirmacion de cita.
   - Recordatorios.
   - Cambios de estado.
   - Cancelaciones y reprogramaciones.

Resultado esperado:

- El flujo principal de paciente funciona de punta a punta con datos persistentes.
- La app ya puede probarse con usuarios piloto reales.

## Fase 3 - Cerrar flujos reales de medico

Duracion estimada: 3 a 6 semanas.

Objetivo: que un medico pueda operar su agenda y atender pacientes desde la app sin depender de pantallas simuladas.

Avance implementado: dashboard medico conectado a citas, pacientes relacionados y estadisticas reales; arrays simulados principales removidos.

Pendiente por credenciales/proveedores/decisiones externas:

- Definir proveedor y proceso de verificacion profesional: validacion manual, integracion con colegio/registro medico o servicio KYC/KYB.
- Obtener credenciales del proveedor de almacenamiento para matriculas, identidad y certificaciones.
- Definir politica de acceso medico a historial del paciente y consentimiento explicito del paciente.
- Elegir proveedor de chat/mensajeria si no se implementa propio: Stream, Firebase, Supabase Realtime, Twilio Conversations u otro.
- Definir retencion, moderacion y auditoria de mensajes medicos antes de activar chat real.

Acciones:

1. Conectar endpoints ya existentes.
   - Usar `/doctores/pacientes` en el dashboard en lugar de `pacientesSimulados`.
   - Usar `/doctores/estadisticas` para reemplazar metricas hardcodeadas.

2. Agenda del medico.
   - Reemplazar pantalla "Proximamente".
   - Vista diaria/semanal.
   - Confirmar, cancelar y reprogramar citas.
   - Gestion de disponibilidad recurrente y excepciones.

3. Perfil profesional.
   - Edicion de especialidad, biografia, tarifa, ubicacion y foto.
   - Documentos profesionales: matricula, identidad, certificaciones.
   - Estado de verificacion: pendiente, aprobado, rechazado.

4. Detalle de paciente real.
   - Reemplazar `pacientesData` hardcodeado.
   - Mostrar datos permitidos segun relacion medico-paciente.
   - Acceso controlado a historial medico.

5. Flujo de atencion.
   - Iniciar consulta.
   - Registrar notas clinicas.
   - Marcar cita como completada.
   - Solicitar resena o seguimiento.

Resultado esperado:

- El medico puede gestionar su trabajo diario desde la app.
- Desaparecen los principales datos fake de la experiencia profesional.

## Fase 4 - Pagos reales y modelo comercial

Duracion estimada: 3 a 5 semanas.

Objetivo: convertir el pago simulado en un flujo confiable, auditable y conciliable.

Avance implementado: pagos dejaron de guardar una referencia externa fija; se agrego `PAYMENT_PROVIDER` configurable y se bloquea `mock` en produccion. La integracion con proveedor real sigue requiriendo credenciales y definicion comercial.

Pendiente por credenciales/proveedores/decisiones externas:

- Elegir proveedor de pagos real: Mercado Pago, Stripe, Apple Pay/Google Pay, proveedor local u otro.
- Crear cuenta comercial, completar KYC/KYB y obtener credenciales sandbox/produccion.
- Definir modelo comercial: comision por cita, suscripcion medica, cargo al paciente, cargo al medico o mixto.
- Configurar webhooks firmados del proveedor y URL publica para recibirlos.
- Definir reglas de cancelacion, reembolso, disputa, contracargo y conciliacion.
- Definir moneda, impuestos, comprobantes/recibos y responsabilidad fiscal segun pais objetivo.
- Configurar Apple Pay/Google Pay si se requiere checkout nativo.

Acciones:

1. Elegir proveedor de pagos.
   - Mercado Pago, Stripe, Apple Pay/Google Pay o proveedor local segun pais objetivo.
   - Definir si Asclepio cobra al paciente, al medico, comision por cita o suscripcion.

2. Implementar pagos reales.
   - Payment intent/preferencia de pago.
   - Webhooks firmados.
   - Estados: pendiente, aprobado, rechazado, reembolsado.
   - Idempotencia para evitar cobros duplicados.

3. Conciliacion y comprobantes.
   - Guardar referencia externa real.
   - Emitir recibos.
   - Manejar reembolsos y cancelaciones.

4. Riesgo y fraude.
   - Limites por usuario.
   - Deteccion de patrones anormales.
   - Registro de disputas.

Resultado esperado:

- El pago deja de ser una demo.
- La app puede generar ingresos y resolver casos de fallo sin soporte manual improvisado.

## Fase 5 - Calidad, testing y estabilidad

Duracion estimada: continua, con primer corte de 3 a 4 semanas.

Objetivo: detectar regresiones antes de que lleguen a usuarios reales.

Avance implementado: tests de RBAC agregados, wrappers API actualizados en tests, backend/mobile verificados y lint mobile limpio.

Pendiente por credenciales/proveedores/decisiones externas:

- Configurar E2E en dispositivos/emuladores con servicio externo o CI capaz de correr mobile: Maestro Cloud, BrowserStack, Bitrise, GitHub Actions macOS u otro.
- Configurar escaneo de seguridad/secretos en CI si se usara proveedor externo: GitHub Advanced Security, Snyk, Gitleaks, Semgrep u otro.
- Configurar pruebas de carga con entorno staging publico y datos semilla seguros.
- Configurar monitoreo de errores mobile/backend: Sentry, Datadog, Grafana Cloud, Firebase Crashlytics u otro.
- Definir indicadores de calidad para release: crash-free sessions, latencia maxima, tasa de error, cobertura minima y flujos E2E obligatorios.

Acciones:

1. Ampliar tests backend.
   - Tests de autorizacion por rol.
   - Tests de citas, disponibilidad, pagos, perfiles y resenas.
   - Tests contra base de datos con migraciones limpias.

2. Ampliar tests mobile.
   - Tests de stores, servicios y pantallas criticas.
   - Estados de error, loading, vacio y sin conexion.

3. E2E.
   - Flujos: registro, login, reserva, pago, cancelacion, doctor confirma cita.
   - Usar Detox/Maestro para mobile.

4. Seguridad automatizada.
   - `gosec` para Go.
   - `npm audit` o scanner equivalente.
   - Escaneo de secretos en CI.

5. Performance.
   - Pruebas de carga en endpoints criticos.
   - Indices de base de datos para busqueda, citas y pagos.
   - Paginacion en listas.

Resultado esperado:

- La app soporta cambios frecuentes sin romper flujos criticos.
- Hay evidencia tecnica para pilotos, inversionistas y tiendas.

## Fase 6 - Infraestructura, despliegue y operaciones

Duracion estimada: 3 a 6 semanas.

Objetivo: que Asclepio funcione todos los dias, no solo en la maquina local.

Acciones:

1. Entornos separados.
   - Desarrollo local.
   - Staging.
   - Produccion.

2. Backend productivo.
   - Hosting en plataforma confiable.
   - PostgreSQL administrado.
   - Migraciones versionadas.
   - TLS obligatorio.
   - Backups automaticos.

3. CI/CD.
   - Tests en cada PR.
   - Deploy automatico a staging.
   - Deploy manual/aprobado a produccion.

4. Observabilidad.
   - Logs estructurados.
   - Metricas: errores, latencia, uso, pagos, citas.
   - Alertas por caidas, errores 5xx, fallos de pagos y problemas de DB.

5. Soporte e incidentes.
   - Canal de soporte.
   - Panel o tooling admin minimo.
   - Runbook para caidas, pagos fallidos, eliminacion de cuenta y reclamos.

Resultado esperado:

- Existe un ambiente productivo controlado.
- Se puede operar la aplicacion sin entrar manualmente a la base de datos.

## Fase 7 - Cumplimiento legal, privacidad y tiendas

Duracion estimada: 2 a 4 semanas, con asesoria legal.

Objetivo: publicar sin exponer al proyecto a rechazos de tienda o riesgos serios por datos de salud.

Acciones:

1. Documentos legales.
   - Politica de privacidad.
   - Terminos y condiciones.
   - Consentimiento informado para tratamiento de datos de salud.
   - Politica de eliminacion de cuenta y datos.

2. Privacidad en producto.
   - Consentimiento para notificaciones.
   - Consentimiento para ubicacion si se usa seguimiento.
   - Consentimiento para compartir historial medico con medicos.
   - Exportacion/eliminacion de datos personales.

3. Requisitos de stores.
   - Nombre, icono y branding definitivo.
   - Screenshots reales.
   - Descripcion clara.
   - Clasificacion de edad.
   - Declaraciones de datos recolectados.
   - Cuenta de desarrollador Apple/Google.

4. Riesgo medico.
   - Definir si la app solo gestiona citas o si entra en diagnostico/telemedicina.
   - Evitar claims medicos no respaldados.
   - Definir responsabilidad de medicos y plataforma.

Resultado esperado:

- La app esta lista para revision de Play Store/App Store.
- Los usuarios entienden que datos se recolectan y para que.

## Fase 8 - Beta controlada

Duracion estimada: 4 a 8 semanas.

Objetivo: validar el producto con usuarios reales antes del lanzamiento publico.

Acciones:

1. Beta cerrada.
   - 20 a 50 pacientes.
   - 3 a 10 medicos.
   - Una ciudad o zona especifica.

2. Medir lo esencial.
   - Registro completado.
   - Busquedas realizadas.
   - Citas creadas.
   - Citas completadas.
   - Pagos exitosos/fallidos.
   - Cancelaciones.
   - Tiempo de respuesta de medicos.
   - Tickets de soporte.

3. Ajustar producto.
   - Reducir friccion de onboarding.
   - Mejorar textos de errores.
   - Corregir problemas de agenda y disponibilidad.
   - Ajustar precios, comisiones o reglas de negocio.

4. Preparar lanzamiento.
   - Onboarding de medicos verificados.
   - Soporte activo.
   - Monitoreo diario.
   - Plan de contingencia.

Resultado esperado:

- Evidencia de que usuarios reales pueden completar el ciclo de valor.
- Lista priorizada de mejoras antes del lanzamiento abierto.

## Fase 9 - Lanzamiento publico y crecimiento

Duracion estimada: continua.

Objetivo: crecer sin romper confianza, seguridad ni soporte.

Acciones:

1. Lanzamiento progresivo.
   - Primero una region.
   - Luego nuevas zonas segun capacidad medica y soporte.

2. Producto de escala.
   - Referidos.
   - Calificaciones confiables.
   - Busqueda por cercania.
   - Especialidades ampliadas.
   - Panel admin para aprobacion de medicos y moderacion.

3. Operacion comercial.
   - Adquisicion de medicos.
   - Atencion al cliente.
   - Procesos de reclamo.
   - Gestion de reputacion.

4. Mejora continua.
   - Analitica de embudos.
   - Experimentos controlados.
   - Roadmap trimestral.
   - Revisiones de seguridad periodicas.

Resultado esperado:

- Asclepio deja de ser solo una app y se convierte en una plataforma operable.

## Prioridades inmediatas recomendadas

Si el equipo solo puede hacer cinco cosas ahora, deberian ser estas:

1. Quitar secretos hardcodeados y configuracion local del codigo.
2. Eliminar `X-User-ID` y aplicar RBAC por rol.
3. Conectar dashboard medico con `/doctores/pacientes` y `/doctores/estadisticas`.
4. Crear perfil editable real para paciente y medico.
5. Reemplazar pago simulado por integracion real o dejarlo explicitamente fuera del piloto.

## Criterios de "listo para app publica"

Asclepio deberia considerarse listo para publicacion masiva cuando cumpla:

- No hay datos simulados en flujos principales.
- La app usa API de produccion mediante configuracion segura.
- Todos los endpoints protegidos tienen autorizacion por rol.
- Pagos, citas, perfiles, historial y notificaciones funcionan con datos reales.
- Hay monitoreo, alertas, backups y plan de soporte.
- Hay politica de privacidad, terminos y eliminacion de cuenta.
- Hay beta cerrada exitosa con usuarios reales.
- Hay builds firmados y revisados para Android/iOS.

## Estimacion global

Con un equipo pequeno de 1 a 3 desarrolladores, el paso de MVP tecnico a app publica seria razonablemente de 4 a 8 meses, dependiendo del alcance legal, pagos, verificacion profesional y nivel de exigencia del mercado objetivo.

La ruta mas inteligente no es agregar muchas funciones nuevas de inmediato. Primero conviene cerrar con datos reales los flujos que ya existen, endurecer seguridad, preparar operacion y validar con una beta pequena.
