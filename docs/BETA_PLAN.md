# Plan de beta controlada

La beta debe validar que pacientes y medicos completan el ciclo real de valor
sin soporte manual constante: registro, busqueda, reserva, confirmacion,
notificacion, pago o flujo equivalente, atencion y resena.

## Alcance recomendado

- Zona: una ciudad o area pequena.
- Pacientes: 20 a 50.
- Medicos: 3 a 10.
- Duracion: 4 a 8 semanas.

Pendiente externo:

- Reclutar medicos reales.
- Reclutar pacientes reales.
- Configurar distribucion TestFlight/Play Internal Testing.
- Activar proveedores externos elegidos para pagos, push, mapas o storage.

## Criterios de entrada

- Backend desplegado en staging.
- App configurada contra staging.
- Usuarios demo y reales diferenciados.
- Politica de privacidad disponible.
- Soporte definido.
- Monitoreo minimo activo.
- Backups activos.

## Flujos a validar

Paciente:

- Registro.
- Login y 2FA.
- Completar perfil.
- Buscar medico.
- Reservar cita.
- Recibir notificaciones.
- Pagar o completar flujo de pago definido.
- Ver historial.
- Evaluar atencion.

Medico:

- Login y 2FA.
- Ver dashboard.
- Ver citas.
- Confirmar/cancelar cita.
- Ver pacientes relacionados.
- Actualizar perfil profesional.
- Completar atencion.

## Metricas

Producto:

- Usuarios registrados.
- Registro completado.
- Busquedas por usuario.
- Citas creadas.
- Citas confirmadas.
- Citas completadas.
- Cancelaciones.
- Resenas enviadas.

Operacion:

- Tickets de soporte.
- Tiempo medio de respuesta.
- Errores 5xx.
- Latencia p95.
- Fallos de login.
- Fallos de pago.
- Crash-free sessions.

## Criterios de salida

La beta puede pasar a lanzamiento limitado cuando:

- Al menos 80% de usuarios piloto completan registro sin asistencia.
- Al menos 70% de citas creadas llegan a confirmacion o cierre claro.
- No hay errores criticos abiertos en auth, citas o pagos.
- No hay incidentes de privacidad pendientes.
- Soporte puede responder casos dentro del SLA definido.

## Registro de feedback

Cada feedback debe registrar:

- Usuario afectado.
- Rol: paciente o medico.
- Flujo afectado.
- Severidad.
- Evidencia.
- Decision: corregir ahora, postergar o descartar.
- Responsable.
