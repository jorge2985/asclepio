// Package doctor gestiona busqueda de medicos, pacientes relacionados y metricas.
//
// En este modulo conviven modelos, servicio y handler porque aun es pequeno.
// Si crece, seguir el patron de identity: separar repository, service y handler.
package doctor

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"asclepio/internal/database"
	ascMiddleware "asclepio/internal/middleware"
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

type PacienteRelacionado struct {
	ID             uuid.UUID `json:"id"`
	NombreCompleto string    `json:"nombre_completo"`
	Telefono       string    `json:"telefono"`
	Direccion      string    `json:"direccion"`
	UltimaVisita   time.Time `json:"ultima_visita"`
}

type EstadisticasMedico struct {
	PacientesAtendidos int     `json:"pacientes_atendidos"`
	Calificacion       float64 `json:"calificacion"`
	CitasCompletadas   int     `json:"citas_completadas"`
	CitasPendientes    int     `json:"citas_pendientes"`
	IngresosEstimados  float64 `json:"ingresos_estimados"`
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
	// El filtro es opcional: query vacio devuelve todos los medicos.
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

// ListarPacientes retorna la lista de pacientes que han tenido citas con el médico
func (s *Servicio) ListarPacientes(ctx context.Context, medicoID uuid.UUID) ([]PacienteRelacionado, error) {
	// Un paciente aparece aqui solo si tuvo al menos una cita con ese medico.
	sql := `
		SELECT DISTINCT p.usuario_id, p.nombre_completo, COALESCE(p.telefono, ''), COALESCE(p.direccion, ''), MAX(c.fecha_hora) as ultima_visita
		FROM pacientes p
		JOIN citas c ON c.paciente_id = p.usuario_id
		WHERE c.medico_id = $1
		GROUP BY p.usuario_id, p.nombre_completo, p.telefono, p.direccion
		ORDER BY ultima_visita DESC
	`
	rows, err := s.db.Pool.Query(ctx, sql, medicoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pacientes []PacienteRelacionado
	for rows.Next() {
		var pr PacienteRelacionado
		if err := rows.Scan(&pr.ID, &pr.NombreCompleto, &pr.Telefono, &pr.Direccion, &pr.UltimaVisita); err != nil {
			return nil, err
		}
		pacientes = append(pacientes, pr)
	}
	return pacientes, nil
}

// ObtenerEstadisticas calcula métricas de rendimiento del médico
func (s *Servicio) ObtenerEstadisticas(ctx context.Context, medicoID uuid.UUID) (*EstadisticasMedico, error) {
	// Estas metricas alimentan el dashboard medico. Evitar hardcodearlas en mobile.
	sql := `
		SELECT 
			(SELECT COUNT(DISTINCT paciente_id) FROM citas WHERE medico_id = $1 AND estado NOT IN ('cancelada')) as pacientes_atendidos,
			(SELECT COALESCE(calificacion, 0.00) FROM medicos WHERE usuario_id = $1) as calificacion,
			(SELECT COUNT(*) FROM citas WHERE medico_id = $1 AND estado = 'completada') as citas_completadas,
			(SELECT COUNT(*) FROM citas WHERE medico_id = $1 AND estado IN ('pendiente_confirmacion', 'confirmada')) as citas_pendientes,
			(SELECT COALESCE(SUM(p.monto), 0.0) FROM pagos p JOIN citas c ON p.cita_id = c.id WHERE c.medico_id = $1 AND p.estado = 'pagado') as ingresos_estimados
	`
	var stats EstadisticasMedico
	err := s.db.Pool.QueryRow(ctx, sql, medicoID).Scan(
		&stats.PacientesAtendidos,
		&stats.Calificacion,
		&stats.CitasCompletadas,
		&stats.CitasPendientes,
		&stats.IngresosEstimados,
	)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

// --- Handler ---

type Handler struct {
	svc *Servicio
}

func NuevoHandler(svc *Servicio) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegistrarRutas(r chi.Router) {
	r.Get("/pacientes", h.ListarPacientes)
	r.Get("/estadisticas", h.ObtenerEstadisticas)
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

func (h *Handler) ListarPacientes(w http.ResponseWriter, r *http.Request) {
	userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		http.Error(w, "No autorizado", http.StatusUnauthorized)
		return
	}
	medicoID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "ID de médico inválido", http.StatusBadRequest)
		return
	}

	pacientes, err := h.svc.ListarPacientes(r.Context(), medicoID)
	if err != nil {
		http.Error(w, "Error al listar pacientes", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pacientes)
}

func (h *Handler) ObtenerEstadisticas(w http.ResponseWriter, r *http.Request) {
	userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		http.Error(w, "No autorizado", http.StatusUnauthorized)
		return
	}
	medicoID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "ID de médico inválido", http.StatusBadRequest)
		return
	}

	stats, err := h.svc.ObtenerEstadisticas(r.Context(), medicoID)
	if err != nil {
		http.Error(w, "Error al obtener estadísticas", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
