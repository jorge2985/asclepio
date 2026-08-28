# Plan de lanzamiento publico

El lanzamiento debe ser progresivo. En una app de salud, crecer rapido sin
soporte, medicos verificados y monitoreo puede danar confianza muy pronto.

## Estrategia

1. Lanzamiento interno.
2. Beta cerrada.
3. Lanzamiento limitado por zona.
4. Apertura progresiva a nuevas zonas.
5. Optimizacion de crecimiento.

## Criterios para publicar

- Beta cerrada completada.
- Politica de privacidad y terminos publicados.
- Eliminacion de cuenta disponible o proceso documentado.
- Pagos reales probados si forman parte del producto.
- Medicos verificados.
- Soporte operativo.
- Backups y monitoreo activos.
- Builds firmados para Android/iOS.
- Version de backend etiquetada.

## Checklist previo a stores

Producto:

- Flujos principales sin datos simulados.
- Estados vacios y errores entendibles.
- App usable sin notificaciones habilitadas.
- App usable si falla la red.
- Informacion medica mostrada solo a usuarios autorizados.

Tecnico:

- `go test ./...`
- `go build -buildvcs=false ./...`
- `npm test -- --runInBand`
- `npm run lint`
- Migraciones aplicadas en staging.
- Health check verificado.

Operacion:

- Canal de soporte activo.
- Responsable de guardia definido.
- Runbook de incidentes revisado.
- Dashboard de errores revisado.
- Plan de rollback definido.

## Primeras metricas de crecimiento

- Instalaciones.
- Registro completado.
- Usuarios activos semanales.
- Busquedas por usuario.
- Conversion busqueda a cita.
- Citas completadas.
- Retencion a 7 y 30 dias.
- Tiempo de confirmacion por medico.
- Tasa de cancelacion.
- NPS o satisfaccion post-cita.

## Riesgos

- Oferta insuficiente de medicos por zona.
- Soporte saturado por pagos/cancelaciones.
- Rechazo de stores por privacidad incompleta.
- Errores en disponibilidad que generen doble reserva.
- Expectativas medicas mal comunicadas.

## Pendiente externo

- Cuenta Google Play Console.
- Cuenta Apple Developer.
- URLs publicas de privacidad/soporte/eliminacion.
- Proveedor de analitica/monitoreo.
- Proveedor de pagos, si aplica.
- Proceso comercial de captacion de medicos.
