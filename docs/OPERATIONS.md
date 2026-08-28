# Operaciones de Asclepio

Este documento guia la operacion tecnica de Asclepio sin depender de un proveedor
cloud especifico. Cuando se elija hosting, base de datos administrada o monitoreo,
se deben completar las secciones marcadas como pendiente externo.

## Entornos

Asclepio debe operar con tres entornos separados:

- `development`: maquina local o Docker Compose.
- `staging`: replica de produccion para pruebas internas y beta.
- `production`: usuarios reales y datos sensibles.

Variables obligatorias por entorno:

- `APP_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `PAYMENT_PROVIDER`
- `JWT_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`

## Arranque local con Docker

```bash
docker compose up --build db api
```

Aplicar migraciones desde el host:

```bash
cd backend
DATABASE_URL="postgres://asclepio:asclepio_dev_password@localhost:5432/asclepio?sslmode=disable" go run ./scripts/migrate
```

Verificar salud:

```bash
curl http://localhost:8080/health
```

## Despliegue backend

Checklist previo:

- Imagen Docker construye correctamente.
- `go test ./...` pasa.
- Migraciones probadas en staging.
- `APP_ENV=production` configurado.
- `PAYMENT_PROVIDER` no es `mock`.
- `ALLOWED_ORIGINS` contiene dominios reales.
- `DATABASE_URL` usa TLS si el proveedor lo requiere.
- `JWT_SECRET` viene de secret manager.

Pendiente externo:

- Elegir proveedor de hosting.
- Configurar dominio y TLS.
- Configurar PostgreSQL administrado.
- Configurar secret manager.

## Migraciones

El comando `backend/scripts/migrate` registra archivos aplicados en
`schema_migrations`. Usarlo asi:

```bash
cd backend
DATABASE_URL="<database-url-del-entorno>" go run ./scripts/migrate
```

Reglas:

- Nunca editar una migracion ya aplicada en staging/produccion.
- Crear un nuevo archivo incremental para cambios nuevos.
- Probar primero contra una copia o base staging.
- Revisar backups antes de migraciones destructivas.

## Backups

Politica recomendada:

- Produccion: backup diario automatico y retencion minima de 30 dias.
- Staging: backup antes de migraciones riesgosas.
- Prueba de restore: al menos una vez por mes.

Pendiente externo:

- Configurar backups automaticos en el proveedor de PostgreSQL.
- Definir ubicacion segura de dumps manuales.

## Monitoreo

Senales minimas:

- `/health` responde `200` y `database=ok`.
- Tasa de respuestas `5xx`.
- Latencia p95 de endpoints criticos.
- Fallos de login/refresh.
- Fallos de pago.
- Errores al enviar push notifications.

Pendiente externo:

- Elegir proveedor de observabilidad.
- Configurar alertas.
- Configurar dashboard operativo.

## Runbook de incidentes

Caida de API:

1. Revisar `/health`.
2. Revisar logs del backend.
3. Verificar conectividad a PostgreSQL.
4. Revisar ultimo despliegue.
5. Revertir version si el incidente coincide con deploy reciente.

Base de datos no disponible:

1. Confirmar estado del proveedor de DB.
2. Revisar limite de conexiones.
3. Pausar despliegues.
4. Restaurar backup solo si hay corrupcion o perdida confirmada.

Pagos fallidos:

1. Revisar proveedor configurado en `PAYMENT_PROVIDER`.
2. Revisar webhooks pendientes o rechazados.
3. No marcar pagos manualmente sin evidencia de proveedor.
4. Registrar caso para conciliacion.

Solicitud de eliminacion de cuenta:

1. Verificar identidad del solicitante.
2. Exportar datos si la politica legal lo requiere.
3. Anonimizar o eliminar segun retencion aplicable.
4. Registrar auditoria de la accion.
