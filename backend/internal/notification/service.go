package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"asclepio/internal/database"

	"github.com/google/uuid"
)

// Servicio define la interfaz para enviar notificaciones
type Servicio interface {
	EnviarNotificacion(ctx context.Context, usuarioID uuid.UUID, titulo, cuerpo string, datos map[string]string) error
}

// ServicioPush implementa el envío de notificaciones de Expo
type ServicioPush struct{
	bd *database.ServicioBD
}

// NuevoServicioPush crea una nueva instancia del servicio de notificaciones
func NuevoServicioPush(bd *database.ServicioBD) *ServicioPush {
	return &ServicioPush{bd: bd}
}

// EnviarNotificacion envía una notificación a Expo si el usuario tiene Token
func (s *ServicioPush) EnviarNotificacion(ctx context.Context, usuarioID uuid.UUID, titulo, cuerpo string, datos map[string]string) error {
	var token *string
	err := s.bd.Pool.QueryRow(ctx, "SELECT expo_push_token FROM usuarios WHERE id = $1", usuarioID).Scan(&token)
	if err != nil || token == nil || *token == "" {
		fmt.Printf("Notificación descartada (Sin Token) para %s: %s - %s\n", usuarioID, titulo, cuerpo)
		return nil
	}

	payload := map[string]interface{}{
		"to":    *token,
		"sound": "default",
		"title": titulo,
		"body":  cuerpo,
	}
	if len(datos) > 0 {
		payload["data"] = datos
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error serializando notificación expo: %w", err)
	}

	resp, err := http.Post("https://exp.host/--/api/v2/push/send", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error conectando con API de Expo: %s\n", err)
		return err
	}
	defer resp.Body.Close()

	fmt.Printf("✅ Notificación Push enviada a %s (%s). Título: %s\n", usuarioID, *token, titulo)
	return nil
}
