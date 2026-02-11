# Asclepio

Plataforma de búsqueda de doctores y reserva de citas médicas.

## Estructura del Proyecto

El proyecto sigue una arquitectura estándar de Go:

*   `cmd/api`: Punto de entrada de la aplicación (Servidor HTTP).
*   `internal/`: Código privado de la aplicación (Handlers, Modelos, DB).
*   `frontend/static`: Archivos HTML, CSS y JS del frontend (anteriormente `stitch_patient_search_home`).
*   `database/`: Scripts de migración y seeds para PostgreSQL.

## Requisitos

*   Go 1.21+
*   PostgreSQL
*   Docker (Opcional)

## Configuración

1.  Clonar el repositorio.
2.  Instalar dependencias: `go mod download`
3.  Configurar variables de entorno (BD, Puerto).

## Ejecución

```bash
go run cmd/api/main.go
```

Visita `http://localhost:8080` para ver la aplicación.
