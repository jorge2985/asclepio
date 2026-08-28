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

// Medico es el perfil publico que ven los pacientes al buscar profesionales.
type Medico struct {
	ID             uuid.UUID `json:"id"`
	NombreCompleto string    `json:"nombre_completo"`
	Especialidad   string    `json:"especialidad"`
	Biografia      string    `json:"biografia"`
	TarifaHora     float64   `json:"tarifa_hora"`
	Ubicacion      string    `json:"ubicacion"`
	Calificacion   float64   `json:"calificacion"`
}

// PacienteRelacionado es la fila compacta del dashboard medico.
type PacienteRelacionado struct {
	ID             uuid.UUID `json:"id"`
	NombreCompleto string    `json:"nombre_completo"`
	Telefono       string    `json:"telefono"`
	Direccion      string    `json:"direccion"`
	UltimaVisita   time.Time `json:"ultima_visita"`
}

// ConsultaPaciente resume una cita pasada o futura visible para el medico.
type ConsultaPaciente struct {
	ID              uuid.UUID `json:"id"`
	FechaHora       time.Time `json:"fecha_hora"`
	Motivo          string    `json:"motivo"`
	Estado          string    `json:"estado"`
	DoctorNombre    string    `json:"doctor_nombre"`
	Direccion       string    `json:"direccion_atencion"`
	DuracionMinutos int       `json:"duracion_minutos"`
}

// DetallePaciente contiene solo datos que el medico puede ver por relacion previa.
type DetallePaciente struct {
	ID             uuid.UUID          `json:"id"`
	NombreCompleto string             `json:"nombre_completo"`
	Telefono       string             `json:"telefono"`
	Direccion      string             `json:"direccion"`
	UltimaVisita   *time.Time         `json:"ultima_visita,omitempty"`
	MotivoActual   string             `json:"motivo_actual"`
	Consultas      []ConsultaPaciente `json:"consultas"`
}

// EstadisticasMedico alimenta las tarjetas del dashboard medico.
type EstadisticasMedico struct {
	PacientesAtendidos int     `json:"pacientes_atendidos"`
	Calificacion       float64 `json:"calificacion"`
	CitasCompletadas   int     `json:"citas_completadas"`
	CitasPendientes    int     `json:"citas_pendientes"`
	IngresosEstimados  float64 `json:"ingresos_estimados"`
}

// Servicio concentra consultas de lectura del dominio medico.
type Servicio struct {
	db *database.ServicioBD
}

// NuevoServicio inyecta la conexion compartida a PostgreSQL.
func NuevoServicio(db *database.ServicioBD) *Servicio {
	return &Servicio{db: db}
}

// ListarDoctores retorna todos los medicos con filtro opcional por nombre/especialidad.
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
		var medico Medico
		if err := rows.Scan(&medico.ID, &medico.NombreCompleto, &medico.Especialidad, &medico.Biografia, &medico.TarifaHora, &medico.Ubicacion, &medico.Calificacion); err != nil {
			return nil, err
		}
		doctores = append(doctores, medico)
	}
	return doctores, rows.Err()
}

// ObtenerPorID retorna el perfil publico de un medico o nil si no existe.
func (s *Servicio) ObtenerPorID(ctx context.Context, id uuid.UUID) (*Medico, error) {
	sql := `
		SELECT usuario_id, nombre_completo, especialidad, biografia, tarifa_hora, ubicacion, calificacion
		FROM medicos
		WHERE usuario_id = $1
	`
	var medico Medico
	err := s.db.Pool.QueryRow(ctx, sql, id).Scan(&medico.ID, &medico.NombreCompleto, &medico.Especialidad, &medico.Biografia, &medico.TarifaHora, &medico.Ubicacion, &medico.Calificacion)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &medico, nil
}

// ListarPacientes retorna pacientes que tuvieron al menos una cita con el medico.
func (s *Servicio) ListarPacientes(ctx context.Context, medicoID uuid.UUID) ([]PacienteRelacionado, error) {
	sql := `
		SELECT p.usuario_id, p.nombre_completo, COALESCE(p.telefono, ''), COALESCE(p.direccion, ''), MAX(c.fecha_hora) AS ultima_visita
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
		var paciente PacienteRelacionado
		if err := rows.Scan(&paciente.ID, &paciente.NombreCompleto, &paciente.Telefono, &paciente.Direccion, &paciente.UltimaVisita); err != nil {
			return nil, err
		}
		pacientes = append(pacientes, paciente)
	}
	return pacientes, rows.Err()
}

// ObtenerPacienteRelacionado devuelve el detalle visible de un paciente.
//
// El JOIN con citas es la regla de seguridad clave: un medico solo puede ver
// pacientes con los que ya tiene una cita registrada.
func (s *Servicio) ObtenerPacienteRelacionado(ctx context.Context, medicoID, pacienteID uuid.UUID) (*DetallePaciente, error) {
	sqlPaciente := `
		SELECT p.usuario_id, p.nombre_completo, COALESCE(p.telefono, ''), COALESCE(p.direccion, ''), MAX(c.fecha_hora) AS ultima_visita
		FROM pacientes p
		JOIN citas c ON c.paciente_id = p.usuario_id
		WHERE c.medico_id = $1 AND p.usuario_id = $2
		GROUP BY p.usuario_id, p.nombre_completo, p.telefono, p.direccion
	`

	var detalle DetallePaciente
	var ultimaVisita *time.Time
	err := s.db.Pool.QueryRow(ctx, sqlPaciente, medicoID, pacienteID).Scan(
		&detalle.ID,
		&detalle.NombreCompleto,
		&detalle.Telefono,
		&detalle.Direccion,
		&ultimaVisita,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	detalle.UltimaVisita = ultimaVisita

	sqlConsultas := `
		SELECT c.id, c.fecha_hora, COALESCE(c.motivo, ''), c.estado::text, m.nombre_completo,
		       COALESCE(c.direccion_atencion, ''), COALESCE(c.duracion_minutos, 30)
		FROM citas c
		JOIN medicos m ON m.usuario_id = c.medico_id
		WHERE c.medico_id = $1 AND c.paciente_id = $2
		ORDER BY c.fecha_hora DESC
		LIMIT 20
	`
	rows, err := s.db.Pool.Query(ctx, sqlConsultas, medicoID, pacienteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var consulta ConsultaPaciente
		if err := rows.Scan(
			&consulta.ID,
			&consulta.FechaHora,
			&consulta.Motivo,
			&consulta.Estado,
			&consulta.DoctorNombre,
			&consulta.Direccion,
			&consulta.DuracionMinutos,
		); err != nil {
			return nil, err
		}
		if detalle.MotivoActual == "" && consulta.Motivo != "" {
			detalle.MotivoActual = consulta.Motivo
		}
		detalle.Consultas = append(detalle.Consultas, consulta)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if detalle.Consultas == nil {
		detalle.Consultas = []ConsultaPaciente{}
	}
	return &detalle, nil
}

// ObtenerEstadisticas calcula metricas de rendimiento del medico.
func (s *Servicio) ObtenerEstadisticas(ctx context.Context, medicoID uuid.UUID) (*EstadisticasMedico, error) {
	sql := `
		SELECT
			(SELECT COUNT(DISTINCT paciente_id) FROM citas WHERE medico_id = $1 AND estado NOT IN ('cancelada')) AS pacientes_atendidos,
			(SELECT COALESCE(calificacion, 0.00) FROM medicos WHERE usuario_id = $1) AS calificacion,
			(SELECT COUNT(*) FROM citas WHERE medico_id = $1 AND estado = 'completada') AS citas_completadas,
			(SELECT COUNT(*) FROM citas WHERE medico_id = $1 AND estado IN ('pendiente_confirmacion', 'confirmada')) AS citas_pendientes,
			(SELECT COALESCE(SUM(p.monto), 0.0) FROM pagos p JOIN citas c ON p.cita_id = c.id WHERE c.medico_id = $1 AND p.estado = 'pagado') AS ingresos_estimados
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

// Handler traduce HTTP a llamadas del servicio.
type Handler struct {
	svc *Servicio
}

// NuevoHandler conecta el servicio con sus endpoints HTTP.
func NuevoHandler(svc *Servicio) *Handler {
	return &Handler{svc: svc}
}

// RegistrarRutas existe para tests o routers que quieran montar el modulo completo.
func (h *Handler) RegistrarRutas(r chi.Router) {
	r.Get("/pacientes", h.ListarPacientes)
	r.Get("/pacientes/{id}", h.DetallePaciente)
	r.Get("/estadisticas", h.ObtenerEstadisticas)
	r.Get("/", h.Listar)
	r.Get("/{id}", h.Detalle)
}

// Listar expone busqueda publica de medicos autenticados.
func (h *Handler) Listar(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	doctores, err := h.svc.ListarDoctores(r.Context(), q)
	if err != nil {
		http.Error(w, "Error interno", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(doctores)
}

// Detalle expone el perfil publico de un medico por ID.
func (h *Handler) Detalle(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "ID invalido", http.StatusBadRequest)
		return
	}

	medico, err := h.svc.ObtenerPorID(r.Context(), id)
	if err != nil {
		http.Error(w, "Error interno", http.StatusInternalServerError)
		return
	}
	if medico == nil {
		http.Error(w, "Doctor no encontrado", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(medico)
}

// ListarPacientes alimenta la lista compacta del dashboard medico.
func (h *Handler) ListarPacientes(w http.ResponseWriter, r *http.Request) {
	medicoID, ok := obtenerUsuarioIDHTTP(w, r, "ID de medico invalido")
	if !ok {
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

// DetallePaciente alimenta la pantalla mobile /paciente/[id].
func (h *Handler) DetallePaciente(w http.ResponseWriter, r *http.Request) {
	medicoID, ok := obtenerUsuarioIDHTTP(w, r, "ID de medico invalido")
	if !ok {
		return
	}

	pacienteID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "ID de paciente invalido", http.StatusBadRequest)
		return
	}

	paciente, err := h.svc.ObtenerPacienteRelacionado(r.Context(), medicoID, pacienteID)
	if err != nil {
		http.Error(w, "Error al obtener paciente", http.StatusInternalServerError)
		return
	}
	if paciente == nil {
		http.Error(w, "Paciente no encontrado", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(paciente)
}

// ObtenerEstadisticas calcula metricas del medico autenticado.
func (h *Handler) ObtenerEstadisticas(w http.ResponseWriter, r *http.Request) {
	medicoID, ok := obtenerUsuarioIDHTTP(w, r, "ID de medico invalido")
	if !ok {
		return
	}

	stats, err := h.svc.ObtenerEstadisticas(r.Context(), medicoID)
	if err != nil {
		http.Error(w, "Error al obtener estadisticas", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// obtenerUsuarioIDHTTP centraliza el parseo del usuario autenticado del contexto.
func obtenerUsuarioIDHTTP(w http.ResponseWriter, r *http.Request, mensajeIDInvalido string) (uuid.UUID, bool) {
	userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		http.Error(w, "No autorizado", http.StatusUnauthorized)
		return uuid.Nil, false
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, mensajeIDInvalido, http.StatusBadRequest)
		return uuid.Nil, false
	}
	return userID, true
}
