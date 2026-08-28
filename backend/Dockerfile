# Imagen multi-stage para compilar el backend Go y ejecutar solo el binario final.
# Mantener este Dockerfile dentro de backend permite usar rutas relativas simples.

FROM golang:1.25-alpine AS build

WORKDIR /src

# Primero copiamos mod/sum para aprovechar cache de dependencias.
COPY go.mod go.sum ./
RUN go mod download

# Luego copiamos el codigo de la API y paquetes internos.
COPY cmd ./cmd
COPY internal ./internal

# -buildvcs=false evita fallos si el contexto Docker no incluye metadatos Git.
RUN CGO_ENABLED=0 GOOS=linux go build -buildvcs=false -o /out/asclepio-api ./cmd/api

FROM alpine:3.22

WORKDIR /app

# ca-certificates permite llamadas HTTPS salientes, por ejemplo a Expo Push API.
RUN apk add --no-cache ca-certificates

COPY --from=build /out/asclepio-api /app/asclepio-api

EXPOSE 8080

CMD ["/app/asclepio-api"]
