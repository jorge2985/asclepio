// Package logger centraliza el logging estructurado de Asclepio.
//
// Usar este paquete en vez de fmt.Println facilita cambiar formato/nivel de logs
// sin tocar todos los servicios. En produccion emite JSON; en desarrollo, texto.
package logger

import (
	"log/slog"
	"os"
)

var L *slog.Logger

func init() {
	// APP_ENV decide el formato. El logger se configura una vez al iniciar.
	env := os.Getenv("APP_ENV")

	var handler slog.Handler
	if env == "production" {
		// JSON estructurado: ideal para CloudWatch, Datadog, Grafana, etc.
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	} else {
		// Texto legible: mas comodo mientras se desarrolla en local.
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	}

	L = slog.New(handler)
	slog.SetDefault(L)
}

// Info registra un evento normal del sistema.
func Info(msg string, args ...any) {
	L.Info(msg, args...)
}

// Error registra fallos que requieren atencion o impiden completar una accion.
func Error(msg string, args ...any) {
	L.Error(msg, args...)
}

// Warn registra situaciones anormales que no detienen el flujo.
func Warn(msg string, args ...any) {
	L.Warn(msg, args...)
}

// Debug registra datos utiles para desarrollo y diagnostico local.
func Debug(msg string, args ...any) {
	L.Debug(msg, args...)
}

// With crea un logger con contexto persistente, por ejemplo request_id o user_id.
func With(args ...any) *slog.Logger {
	return L.With(args...)
}
