package appointment

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"asclepio/internal/database"
)

// --- Models ---

type Cita struct {
	ID              uuid.UUID `json:"id"`
	MedicoID        uuid.UUID `json:"medico_id"`
	PacienteID      uuid.UUID `json:"paciente_id"`
	FechaHora       time.Time `json:"fecha_hora"`
	DuracionMinutos int       `json:"duracion_minutos"`
	Motivo          string    `json:"motivo"`
	Estado          string    `json:"estado"`
	PrecioEstimado  float64   `json:"precio_estimado"`
	Direccion       string    `json:"direccion_atencion"`
	MedicoNombre    string    `json:"medico_nombre,omitempty"` // Join
	MedicoEspec     string    `json:"medico_especialidad,omitempty"`
}

type CrearCitaRequest struct {
	MedicoID  uuid.UUID `json:"medico_id"`
	FechaHora time.Time `json:"fecha_hora"`
	Motivo    string    `json:"motivo"`
	Direccion string    `json:"direccion"`
}

// --- Service ---

type Servicio struct {
	db *database.ServicioBD
}

func NuevoServicio(db *database.ServicioBD) *Servicio {
	return &Servicio{db: db}
}

func (s *Servicio) Crear(ctx context.Context, req CrearCitaRequest, pacienteID uuid.UUID) (*Cita, error) {
	// TODO: Validar disponibilidad del médico aquí

	sql := `
		INSERT INTO citas (medico_id, paciente_id, fecha_hora, motivo, direccion_atencion, estado)
		VALUES ($1, $2, $3, $4, $5, 'pendiente_confirmacion')
		RETURNING id, estado
	`
	var id uuid.UUID
	var estado string
	err := s.db.Pool.QueryRow(ctx, sql, req.MedicoID, pacienteID, req.FechaHora, req.Motivo, req.Direccion).Scan(&id, &estado)
	if err != nil {
		return nil, err
	}

	return &Cita{
		ID:         id,
		MedicoID:   req.MedicoID,
		PacienteID: pacienteID,
		FechaHora:  req.FechaHora,
		Motivo:     req.Motivo,
		Estado:     estado,
		Direccion:  req.Direccion,
	}, nil
}

func (s *Servicio) ListarPorPaciente(ctx context.Context, pacienteID uuid.UUID) ([]Cita, error) {
	sql := `
		SELECT c.id, c.medico_id, c.fecha_hora, c.motivo, c.estado, c.direccion_atencion,
		       m.nombre_completo, m.especialidad
		FROM citas c
		JOIN medicos m ON c.medico_id = m.usuario_id
		WHERE c.paciente_id = $1
		ORDER BY c.fecha_hora DESC
	`
	rows, err := s.db.Pool.Query(ctx, sql, pacienteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var citas []Cita
	for rows.Next() {
		var c Cita
		if err := rows.Scan(&c.ID, &c.MedicoID, &c.FechaHora, &c.Motivo, &c.Estado, &c.Direccion, &c.MedicoNombre, &c.MedicoEspec); err != nil {
			return nil, err
		}
		citas = append(citas, c)
	}
	return citas, nil
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
	r.Get("/", h.Historial)
}

func (h *Handler) Crear(w http.ResponseWriter, r *http.Request) {
	// Obtener ID del usuario autenticado (se asume Middleware de Auth que inyecta user_id en context)
	// Como no tenemos el middleware aún inyectando al contexto en este código simple, usaremos un header simulado o placeholder
	// En producción, usar: userID := r.Context().Value("user_id").(uuid.UUID)

	// SIMULACION: Leer header X-User-ID (en endpoint protegido usaríamos JWT claims)
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		http.Error(w, "Falta Header X-User-ID (Auth pendiente)", http.StatusUnauthorized)
		return
	}
	pacienteID, _ := uuid.Parse(userIDStr)

	var req CrearCitaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	cita, err := h.svc.Crear(r.Context(), req, pacienteID)
	if err != nil {
		fmt.Println("Error creando cita:", err)
		http.Error(w, "Error al crear cita", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cita)
}

func (h *Handler) Historial(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		http.Error(w, "Falta Header X-User-ID", http.StatusUnauthorized)
		return
	}
	pacienteID, _ := uuid.Parse(userIDStr)

	citas, err := h.svc.ListarPorPaciente(r.Context(), pacienteID)
	if err != nil {
		http.Error(w, "Error listando citas", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(citas)
}
