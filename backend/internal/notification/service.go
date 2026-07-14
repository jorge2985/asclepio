// Package notification encapsula el envio de notificaciones push.
//
// Hoy usa Expo Push API porque el frontend esta hecho con Expo. Si en el futuro
// se migra a FCM/APNs directos, el resto del backend deberia seguir llamando a
// la interfaz Servicio sin cambiar su logica de citas.
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

// Servicio define lo minimo que necesita el resto del backend para notificar.
type Servicio interface {
	EnviarNotificacion(ctx context.Context, usuarioID uuid.UUID, titulo, cuerpo string, datos map[string]string) error
}

// ServicioPush implementa el envio usando el token Expo guardado en usuarios.
type ServicioPush struct {
	bd *database.ServicioBD
}

// NuevoServicioPush crea una nueva instancia del servicio de notificaciones.
func NuevoServicioPush(bd *database.ServicioBD) *ServicioPush {
	return &ServicioPush{bd: bd}
}

// EnviarNotificacion busca el Expo Push Token del usuario y llama a Expo.
// Si el usuario no tiene token, no es error: solo significa que no habilito push.
func (s *ServicioPush) EnviarNotificacion(ctx context.Context, usuarioID uuid.UUID, titulo, cuerpo string, datos map[string]string) error {
	var token *string
	err := s.bd.Pool.QueryRow(ctx, "SELECT expo_push_token FROM usuarios WHERE id = $1", usuarioID).Scan(&token)
	if err != nil || token == nil || *token == "" {
		fmt.Printf("Notificacion descartada (sin token) para %s: %s - %s\n", usuarioID, titulo, cuerpo)
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
		return fmt.Errorf("error serializando notificacion expo: %w", err)
	}

	resp, err := http.Post("https://exp.host/--/api/v2/push/send", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error conectando con API de Expo: %s\n", err)
		return err
	}
	defer resp.Body.Close()

	fmt.Printf("Notificacion push enviada a %s (%s). Titulo: %s\n", usuarioID, *token, titulo)
	return nil
}
