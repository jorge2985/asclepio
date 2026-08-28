package notification

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
)

func TestServicio_Interface(t *testing.T) {
	// Verificacion en tiempo de compilacion: ServicioPush debe cumplir la interfaz.
	var _ Servicio = (*ServicioPush)(nil)
}

func TestEnviarNotificacion_ServicioSinBDNoHacePanic(t *testing.T) {
	// Este caso cubre tests unitarios y construcciones defensivas sin PostgreSQL.
	svc := &ServicioPush{bd: nil}

	err := svc.EnviarNotificacion(context.Background(), uuid.New(), "Titulo", "Cuerpo", nil)
	if err != nil {
		t.Fatalf("esperaba nil con BD ausente, obtuvo %v", err)
	}
}

func TestEnviarNotificacion_ContextoCancelado(t *testing.T) {
	// Si el request ya fue cancelado, el servicio debe cortar antes de consultar BD.
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	svc := &ServicioPush{bd: nil}
	err := svc.EnviarNotificacion(ctx, uuid.New(), "Titulo", "Cuerpo", nil)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("esperaba context.Canceled, obtuvo %v", err)
	}
}
