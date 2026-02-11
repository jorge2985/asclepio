package doctor

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"asclepio/internal/database"
)

// --- Models ---

type Medico struct {
	ID             uuid.UUID `json:"id"`
	NombreCompleto string    `json:"nombre_completo"`
	Especialidad   string    `json:"especialidad"`
	Biografia      string    `json:"biografia"`
	TarifaHora     float64   `json:"tarifa_hora"`
	Ubicacion      string    `json:"ubicacion"`
	Calificacion   float64   `json:"calificacion"`
}

// --- Repository/Service ---

type Servicio struct {
	db *database.ServicioBD
}

func NuevoServicio(db *database.ServicioBD) *Servicio {
	return &Servicio{db: db}
}

// ListarDoctores retorna todos los médicos (con filtro opcional query)
func (s *Servicio) ListarDoctores(ctx context.Context, query string) ([]Medico, error) {
	sql := `
		SELECT usuario_id, nombre_completo, especialidad, biografia, tarifa_hora, ubicacion, calificacion 
		FROM medicos 
		WHERE ($1 = '' OR nombre_completo ILIKE '%' || $1 || '%' OR especialidad ILIKE '%' || $1 || '%')
		ORDER BY calificacion DESC
	`
	rows, err := s.db.Pool.Query(ctx, sql, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var doctores []Medico
	for rows.Next() {
		var m Medico
		if err := rows.Scan(&m.ID, &m.NombreCompleto, &m.Especialidad, &m.Biografia, &m.TarifaHora, &m.Ubicacion, &m.Calificacion); err != nil {
			return nil, err
		}
		doctores = append(doctores, m)
	}
	return doctores, nil
}

func (s *Servicio) ObtenerPorID(ctx context.Context, id uuid.UUID) (*Medico, error) {
	sql := `SELECT usuario_id, nombre_completo, especialidad, biografia, tarifa_hora, ubicacion, calificacion FROM medicos WHERE usuario_id = $1`
	var m Medico
	err := s.db.Pool.QueryRow(ctx, sql, id).Scan(&m.ID, &m.NombreCompleto, &m.Especialidad, &m.Biografia, &m.TarifaHora, &m.Ubicacion, &m.Calificacion)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Not found
		}
		return nil, err
	}
	return &m, nil
}

// --- Handler ---

type Handler struct {
	svc *Servicio
}

func NuevoHandler(svc *Servicio) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegistrarRutas(r chi.Router) {
	r.Get("/", h.Listar)
	r.Get("/{id}", h.Detalle)
}

func (h *Handler) Listar(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	docs, err := h.svc.ListarDoctores(r.Context(), q)
	if err != nil {
		http.Error(w, "Error interno", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(docs)
}

func (h *Handler) Detalle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	doc, err := h.svc.ObtenerPorID(r.Context(), id)
	if err != nil {
		http.Error(w, "Error interno", http.StatusInternalServerError)
		return
	}
	if doc == nil {
		http.Error(w, "Doctor no encontrado", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(doc)
}
