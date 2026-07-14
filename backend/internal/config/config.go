// Package config centraliza la configuracion del backend.
//
// Si una variable sensible falta, este paquete devuelve error para que la API
// no arranque con defaults inseguros.
package config

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"time"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	JWTExpiry          time.Duration
	RefreshTokenExpiry time.Duration
	AllowedOrigins     []string
	PaymentProvider    string
}

// Cargar lee variables de entorno y, si existe, un archivo .env local.
// Los valores sensibles no tienen defaults: deben venir del entorno.
func Cargar() (*Config, error) {
	// Cargar .env si existe
	cargarEnvFile(".env")

	databaseURL := getEnv("DATABASE_URL", "")
	jwtSecret := getEnv("JWT_SECRET", "")
	// Acumular todas las variables faltantes ayuda a corregir la configuracion
	// en un solo intento en vez de fallar una por una.
	var missing []string
	if databaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if jwtSecret == "" {
		missing = append(missing, "JWT_SECRET")
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("faltan variables de entorno obligatorias: %s", strings.Join(missing, ", "))
	}

	cfg := &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     databaseURL,
		JWTSecret:       jwtSecret,
		AllowedOrigins:  strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:8081,http://localhost:19006"), ","),
		PaymentProvider: getEnv("PAYMENT_PROVIDER", "mock"),
	}

	if getEnv("APP_ENV", "development") == "production" && cfg.PaymentProvider == "mock" {
		return nil, fmt.Errorf("PAYMENT_PROVIDER=mock no esta permitido en produccion")
	}

	expiry, err := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
	if err != nil {
		expiry = 24 * time.Hour
	}
	cfg.JWTExpiry = expiry

	refreshExpiry, err := time.ParseDuration(getEnv("REFRESH_TOKEN_EXPIRY", "168h"))
	if err != nil {
		refreshExpiry = 168 * time.Hour
	}
	cfg.RefreshTokenExpiry = refreshExpiry

	return cfg, nil
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// cargarEnvFile es solo una comodidad para desarrollo local. En produccion se
// espera que las variables vengan del entorno/secret manager.
func cargarEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return // No pasa nada si no existe
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			// Solo setear si no existe ya (env vars del sistema tienen prioridad)
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
}
