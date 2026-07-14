# Scripts auxiliares del backend

Estos scripts son herramientas locales para diagnostico y mantenimiento puntual. Ejecutalos desde `backend/` para que usen el modulo Go del backend.

## Variables comunes

- `DATABASE_URL`: URL de PostgreSQL local o del entorno objetivo.
- `AUTH_EMAIL`: email del usuario a probar.
- `AUTH_EMAILS`: lista de emails separada por comas.
- `AUTH_PASSWORD`: password a validar, hashear o asignar.
- `AUTH_API_URL`: URL base de la API. Default: `http://localhost:8080/api`.

## Comandos

```bash
go run ./scripts/generate-hash
go run ./scripts/debug-login
go run ./scripts/fix-password
go run ./scripts/test-login
```

Ejemplos:

```bash
AUTH_PASSWORD="valor-local" go run ./scripts/generate-hash
DATABASE_URL="postgres://usuario:password@localhost:5432/asclepio?sslmode=disable" AUTH_EMAIL="usuario@example.com" AUTH_PASSWORD="valor-local" go run ./scripts/debug-login
AUTH_API_URL="http://localhost:8080/api" AUTH_EMAIL="usuario@example.com" AUTH_PASSWORD="valor-local" go run ./scripts/test-login
```
