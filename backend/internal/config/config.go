package config

import (
	"bufio"
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
}

func Cargar() *Config {
	// Cargar .env si existe
	cargarEnvFile(".env")

	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://postgres:18zeta29@localhost:5433/asclepio?sslmode=disable"),
		JWTSecret:      getEnv("JWT_SECRET", "dev_secreto_seguro_asclepio_2026"),
		AllowedOrigins: strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:8081,http://localhost:19006"), ","),
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

	return cfg
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

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
