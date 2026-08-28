# Checklist tecnico de release

Checklist interno para preparar una version antes de beta, staging o produccion.
No cubre aprobaciones legales ni credenciales de proveedores.

## Codigo

- No hay datos simulados en flujos principales.
- No hay secretos, IPs LAN ni URLs productivas hardcodeadas.
- Los archivos nuevos o modificados tienen comentarios guia cuando ayudan a navegar.
- Las rutas nuevas tienen permisos por rol documentados en `docs/API_ROUTES.md`.
- Los errores de UI usan `services/errorHandler.js`.
- Los logs mobile pasan por `services/logger.js`.

## Backend

- `go run ./scripts/migrate` aplica migraciones en una base limpia.
- `go test ./...` pasa.
- `go vet ./...` pasa.
- `go build -buildvcs=false ./...` pasa.
- `APP_ENV=production` falla al iniciar si faltan secretos obligatorios.

## Mobile

- `npm test -- --runInBand` pasa.
- `npm run lint` pasa.
- `EXPO_PUBLIC_API_URL` apunta al entorno correcto.
- Las pantallas criticas tienen loading, empty y error state.
- Las rutas que consumen datos sensibles muestran solo lo que devuelve la API.

## Operacion local

- `docker compose up --build` levanta API y PostgreSQL local.
- `scripts/check.ps1` completa verificaciones internas.
- `docs/OPERATIONS.md` sigue alineado con comandos reales del repo.

## Antes de publicar masivamente

- Ejecutar beta cerrada segun `docs/BETA_PLAN.md`.
- Revisar pendientes externos de `HOJA_DE_RUTA_USO_MASIVO.md`.
- Completar legal/stores segun `docs/LEGAL_AND_STORE_CHECKLIST.md`.
- Validar plan de lanzamiento en `docs/LAUNCH_PLAN.md`.
