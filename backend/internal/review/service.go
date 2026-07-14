// Package review gestiona resenas posteriores a una cita.
//
// Mantiene juntas reglas simples y handlers. Si aparecen mas reglas de
// moderacion o reputacion, conviene separar repository/service/handler.
package review

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"asclepio/internal/database"
	ascMiddleware "asclepio/internal/middleware"
)

// --- Models ---

type CrearResenaRequest struct {
	CitaID       uuid.UUID `json:"cita_id"`
	Calificacion int       `json:"calificacion"`
	Comentario   string    `json:"comentario"`
}

type Resena struct {
	ID           uuid.UUID `json:"id"`
	CitaID       uuid.UUID `json:"cita_id"`
	AutorID      uuid.UUID `json:"autor_id"`
	MedicoID     uuid.UUID `json:"medico_id"`
	Calificacion int       `json:"calificacion"`
	Comentario   string    `json:"comentario"`
}

// --- Service ---

type Servicio struct {
	db *database.ServicioBD
}

func NuevoServicio(db *database.ServicioBD) *Servicio {
	return &Servicio{db: db}
}

func (s *Servicio) Crear(ctx context.Context, autorID uuid.UUID, req CrearResenaRequest) (*Resena, error) {
	// La cita debe existir y pertenecer al paciente que esta evaluando.
	// 1. Obtener el medico_id a partir de la cita
	var medicoID uuid.UUID
	err := s.db.Pool.QueryRow(ctx, "SELECT medico_id FROM citas WHERE id = $1 AND paciente_id = $2", req.CitaID, autorID).Scan(&medicoID)
	if err != nil {
		return nil, fmt.Errorf("cita no encontrada o no pertenece al paciente: %w", err)
	}

	// 2. Insertar reseña
	sqlInsert := `
		INSERT INTO resenas (cita_id, autor_id, medico_id, calificacion, comentario)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`
	var id uuid.UUID
	err = s.db.Pool.QueryRow(ctx, sqlInsert, req.CitaID, autorID, medicoID, req.Calificacion, req.Comentario).Scan(&id)
	if err != nil {
		return nil, fmt.Errorf("error guardando reseña (quizás ya evaluaste esta cita): %w", err)
	}

	// 3. Recalcular y actualizar promedio del médico
	// Primero se lee y se escribe la calificacion promedio del médico
	sqlUpdateAvg := `
		UPDATE medicos 
		SET calificacion = (
			SELECT ROUND(AVG(calificacion)::numeric, 1) 
			FROM resenas 
			WHERE medico_id = $1
		)
		WHERE usuario_id = $1
	`
	_, _ = s.db.Pool.Exec(ctx, sqlUpdateAvg, medicoID) // ignorar error al solo actualizar rating visual

	return &Resena{
		ID:           id,
		CitaID:       req.CitaID,
		AutorID:      autorID,
		MedicoID:     medicoID,
		Calificacion: req.Calificacion,
		Comentario:   req.Comentario,
	}, nil
}

// --- Handler ---

type Handler struct {
	svc *Servicio
}

func NuevoHandler(svc *Servicio) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegistrarRutas(r chi.Router) {
	r.Post("/", h.Crear)
}

func (h *Handler) Crear(w http.ResponseWriter, r *http.Request) {
	userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		http.Error(w, "Usuario invalido", http.StatusUnauthorized)
		return
	}
	autorID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}

	var req CrearResenaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.Calificacion < 1 || req.Calificacion > 5 {
		http.Error(w, "Calificación debe ser entre 1 y 5", http.StatusBadRequest)
		return
	}

	resena, err := h.svc.Crear(r.Context(), autorID, req)
	if err != nil {
		fmt.Println("Error creando reseña:", err)
		http.Error(w, "Error procesando evaluación", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resena)
}
