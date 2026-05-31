// internal/logger/logger.go
// Logger estructurado para Asclepio.
// Proporciona log en formato JSON para producción y texto legible en desarrollo.
package logger

import (
	"log/slog"
	"os"
)

var L *slog.Logger

func init() {
	env := os.Getenv("APP_ENV")

	var handler slog.Handler
	if env == "production" {
		// Producción: JSON estructurado (compatible con cloud logging)
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	} else {
		// Desarrollo: Texto legible coloreado
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	}

	L = slog.New(handler)
	slog.SetDefault(L)
}

// Info registra un mensaje informativo con atributos opcionales
func Info(msg string, args ...any) {
	L.Info(msg, args...)
}

// Error registra un error con atributos opcionales
func Error(msg string, args ...any) {
	L.Error(msg, args...)
}

// Warn registra una advertencia
func Warn(msg string, args ...any) {
	L.Warn(msg, args...)
}

// Debug registra información de debug (solo en dev)
func Debug(msg string, args ...any) {
	L.Debug(msg, args...)
}

// With retorna un sub-logger con contexto adicional persistente
func With(args ...any) *slog.Logger {
	return L.With(args...)
}
