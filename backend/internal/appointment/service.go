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
	ascMiddleware "asclepio/internal/middleware"
	"asclepio/internal/notification"
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
	PacienteNombre  string    `json:"paciente_nombre,omitempty"` // Join
}

type CrearCitaRequest struct {
	MedicoID  uuid.UUID `json:"medico_id"`
	FechaHora time.Time `json:"fecha_hora"`
	Motivo    string    `json:"motivo"`
	Direccion string    `json:"direccion"`
}

type ReprogramarCitaRequest struct {
	NuevaFechaHora time.Time `json:"nueva_fecha_hora"`
}

type PagarCitaRequest struct {
	Metodo string `json:"metodo"` // tarjeta, efectivo, seguro
}

// --- Service ---

type Servicio struct {
	db    *database.ServicioBD
	notif notification.Servicio
}

func NuevoServicio(db *database.ServicioBD, notif notification.Servicio) *Servicio {
	return &Servicio{db: db, notif: notif}
}

func (s *Servicio) Crear(ctx context.Context, req CrearCitaRequest, pacienteID uuid.UUID) (*Cita, error) {
	// Validar colisiones horarias: verificar que el médico no tenga otra cita activa en el mismo horario exacto
	var colision bool
	sqlCheck := `
		SELECT EXISTS (
			SELECT 1 FROM citas 
			WHERE medico_id = $1 
			  AND fecha_hora = $2 
			  AND estado NOT IN ('cancelada')
		)
	`
	err := s.db.Pool.QueryRow(ctx, sqlCheck, req.MedicoID, req.FechaHora).Scan(&colision)
	if err != nil {
		return nil, fmt.Errorf("error al verificar disponibilidad del médico: %w", err)
	}
	if colision {
		return nil, fmt.Errorf("el médico no está disponible en la fecha y hora seleccionada")
	}

	sql := `
		INSERT INTO citas (medico_id, paciente_id, fecha_hora, motivo, direccion_atencion, estado)
		VALUES ($1, $2, $3, $4, $5, 'pendiente_confirmacion')
		RETURNING id, estado
	`
	var id uuid.UUID
	var estado string
	err = s.db.Pool.QueryRow(ctx, sql, req.MedicoID, pacienteID, req.FechaHora, req.Motivo, req.Direccion).Scan(&id, &estado)
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

func (s *Servicio) ListarPorMedico(ctx context.Context, medicoID uuid.UUID) ([]Cita, error) {
	sql := `
		SELECT c.id, c.medico_id, c.paciente_id, c.fecha_hora, c.motivo, c.estado, c.direccion_atencion,
		       p.nombre_completo as paciente_nombre
		FROM citas c
		JOIN pacientes p ON c.paciente_id = p.usuario_id
		WHERE c.medico_id = $1
		ORDER BY c.fecha_hora ASC
	`
	rows, err := s.db.Pool.Query(ctx, sql, medicoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var citas []Cita
	for rows.Next() {
		var c Cita
		if err := rows.Scan(&c.ID, &c.MedicoID, &c.PacienteID, &c.FechaHora, &c.Motivo, &c.Estado, &c.Direccion, &c.PacienteNombre); err != nil {
			return nil, err
		}
		citas = append(citas, c)
	}
	return citas, nil
}

func (s *Servicio) Confirmar(ctx context.Context, id uuid.UUID, medicoID uuid.UUID) error {
	var pacienteID uuid.UUID
	err := s.db.Pool.QueryRow(ctx, "UPDATE citas SET estado = 'confirmada' WHERE id = $1 AND medico_id = $2 RETURNING paciente_id", id, medicoID).Scan(&pacienteID)
	if err != nil {
		return err
	}
	
	s.notif.EnviarNotificacion(ctx, pacienteID, "Cita Confirmada", "Tu cita ha sido confirmada por el médico.", nil)
	return nil
}

func (s *Servicio) Cancelar(ctx context.Context, id uuid.UUID, usuarioID uuid.UUID) error {
    var pacienteID, medicoID uuid.UUID
	err := s.db.Pool.QueryRow(ctx, "UPDATE citas SET estado = 'cancelada' WHERE id = $1 AND (paciente_id = $2 OR medico_id = $2) RETURNING paciente_id, medico_id", id, usuarioID).Scan(&pacienteID, &medicoID)
	if err != nil {
		return err
	}
	
    if usuarioID == pacienteID {
	    s.notif.EnviarNotificacion(ctx, medicoID, "Cita Cancelada", "El paciente ha cancelado la cita.", nil)
    } else {
        s.notif.EnviarNotificacion(ctx, pacienteID, "Cita Cancelada", "El médico ha cancelado la cita.", nil)
    }
	return nil
}

func (s *Servicio) Reprogramar(ctx context.Context, id uuid.UUID, pacienteID uuid.UUID, nuevaFechaHora time.Time) error {
	var medicoID uuid.UUID
	err := s.db.Pool.QueryRow(ctx, "UPDATE citas SET estado = 'pendiente_confirmacion', fecha_hora = $1 WHERE id = $2 AND paciente_id = $3 RETURNING medico_id", nuevaFechaHora, id, pacienteID).Scan(&medicoID)
	if err != nil {
		return err
	}
	
	s.notif.EnviarNotificacion(ctx, medicoID, "Cita Reprogramada", "Un paciente ha solicitado reprogramar su cita.", nil)
	return nil
}

func (s *Servicio) Pagar(ctx context.Context, id uuid.UUID, pacienteID uuid.UUID, metodo string) error {
	var precio float64
	err := s.db.Pool.QueryRow(ctx, "SELECT COALESCE(precio_estimado, 50.00) FROM citas WHERE id = $1 AND paciente_id = $2", id, pacienteID).Scan(&precio)
	if err != nil {
		return err
	}

	sqlPago := `
		INSERT INTO pagos (cita_id, monto, metodo, estado, referencia_externa, fecha_pago)
		VALUES ($1, $2, $3, 'pagado', 'simulacion_mvp_1234', CURRENT_TIMESTAMP)
	`
	_, err = s.db.Pool.Exec(ctx, sqlPago, id, precio, metodo)
	if err != nil {
		return err
	}

	s.notif.EnviarNotificacion(ctx, pacienteID, "Pago Aprobado", fmt.Sprintf("Se ha procesado exitosamente tu pago de $%.2f.", precio), nil)
	return nil
}

func (s *Servicio) GetDisponibilidad(ctx context.Context, medicoID uuid.UUID, fecha time.Time) ([]string, error) {
    diaSemana := int(fecha.Weekday())
    
    // Obtener bloques de disponibilidad del doctor
    sqlDispo := `SELECT hora_inicio, hora_fin FROM dispo_medicos WHERE medico_id = $1 AND dia_semana = $2 AND es_recurrente = TRUE`
    rows, err := s.db.Pool.Query(ctx, sqlDispo, medicoID, diaSemana)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var bloques []string
    type Rango struct {
        Inicio time.Time
        Fin    time.Time
    }
    var rangos []Rango

    for rows.Next() {
        var ini, fin time.Time
        if err := rows.Scan(&ini, &fin); err != nil {
            return nil, err
        }
        rangos = append(rangos, Rango{Inicio: ini, Fin: fin})
    }

    if len(rangos) == 0 {
        return []string{}, nil
    }

    // Obtener citas existentes para ese día
    inicioDia := time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, fecha.Location())
    finDia := inicioDia.Add(24 * time.Hour)
    
    sqlCitas := `SELECT fecha_hora FROM citas WHERE medico_id = $1 AND fecha_hora >= $2 AND fecha_hora < $3 AND estado NOT IN ('cancelada')`
    rowsCitas, err := s.db.Pool.Query(ctx, sqlCitas, medicoID, inicioDia, finDia)
    if err != nil {
        return nil, err
    }
    defer rowsCitas.Close()

    citasOcupadas := make(map[string]bool)
    for rowsCitas.Next() {
        var hCita time.Time
        if err := rowsCitas.Scan(&hCita); err == nil {
            citasOcupadas[hCita.Local().Format("15:04")] = true
        }
    }

    // Generar slots de 30 mins
    for _, r := range rangos {
        actual := r.Inicio
        for actual.Before(r.Fin) {
            horaStr := actual.Format("15:04")
            if !citasOcupadas[horaStr] {
                bloques = append(bloques, actual.Format("03:04 PM")) // ej: 09:00 AM
            }
            actual = actual.Add(30 * time.Minute)
        }
    }

    return bloques, nil
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
	r.Get("/medico", h.ListarPorMedico)
	r.Get("/disponibilidad", h.Disponibilidad)
	r.Put("/{id}/confirmar", h.Confirmar)
	r.Put("/{id}/cancelar", h.Cancelar)
	r.Put("/{id}/reprogramar", h.Reprogramar)
	r.Post("/{id}/pago", h.Pagar)
}

func (h *Handler) Crear(w http.ResponseWriter, r *http.Request) {
	userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		userIDStr = r.Header.Get("X-User-ID")
	}
	pacienteID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}

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
	userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		userIDStr = r.Header.Get("X-User-ID")
	}
	pacienteID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}

	citas, err := h.svc.ListarPorPaciente(r.Context(), pacienteID)
	if err != nil {
		http.Error(w, "Error listando citas", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(citas)
}

func (h *Handler) ListarPorMedico(w http.ResponseWriter, r *http.Request) {
    userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		userIDStr = r.Header.Get("X-User-ID")
	}
	medicoID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}

	citas, err := h.svc.ListarPorMedico(r.Context(), medicoID)
	if err != nil {
		http.Error(w, "Error listando citas", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(citas)
}

func (h *Handler) Disponibilidad(w http.ResponseWriter, r *http.Request) {
    medicoIDStr := r.URL.Query().Get("medico_id")
    fechaStr := r.URL.Query().Get("fecha") // YYYY-MM-DD
    
    medicoID, err := uuid.Parse(medicoIDStr)
    if err != nil {
        http.Error(w, "ID de médico inválido", http.StatusBadRequest)
        return
    }
    
    fecha, err := time.Parse("2006-01-02", fechaStr)
    if err != nil {
        http.Error(w, "Fecha inválida (YYYY-MM-DD)", http.StatusBadRequest)
        return
    }
    
    bloques, err := h.svc.GetDisponibilidad(r.Context(), medicoID, fecha)
    if err != nil {
        http.Error(w, "Error buscando disponibilidad", http.StatusInternalServerError)
        return
    }
    
    json.NewEncoder(w).Encode(bloques)
}

func (h *Handler) Confirmar(w http.ResponseWriter, r *http.Request) {
    citaIDStr := chi.URLParam(r, "id")
    citaID, err := uuid.Parse(citaIDStr)
    if err != nil {
        http.Error(w, "ID de cita inválido", http.StatusBadRequest)
        return
    }
    
    userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		userIDStr = r.Header.Get("X-User-ID")
	}
	medicoID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}
    
    err = h.svc.Confirmar(r.Context(), citaID, medicoID)
    if err != nil {
        http.Error(w, "Error confirmando cita", http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(map[string]string{"mensaje": "Cita confirmada"})
}

func (h *Handler) Cancelar(w http.ResponseWriter, r *http.Request) {
    citaIDStr := chi.URLParam(r, "id")
    citaID, err := uuid.Parse(citaIDStr)
    if err != nil {
        http.Error(w, "ID de cita inválido", http.StatusBadRequest)
        return
    }
    
    userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		userIDStr = r.Header.Get("X-User-ID")
	}
	usuarioID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}
    
    err = h.svc.Cancelar(r.Context(), citaID, usuarioID)
    if err != nil {
        http.Error(w, "Error cancelando cita", http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(map[string]string{"mensaje": "Cita cancelada"})
}

func (h *Handler) Reprogramar(w http.ResponseWriter, r *http.Request) {
    citaIDStr := chi.URLParam(r, "id")
    citaID, err := uuid.Parse(citaIDStr)
    if err != nil {
        http.Error(w, "ID de cita inválido", http.StatusBadRequest)
        return
    }
    
    userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		userIDStr = r.Header.Get("X-User-ID")
	}
	pacienteID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}
    
    var req ReprogramarCitaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}
    
    err = h.svc.Reprogramar(r.Context(), citaID, pacienteID, req.NuevaFechaHora)
    if err != nil {
        http.Error(w, "Error reprogramando cita", http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(map[string]string{"mensaje": "Cita reprogramada"})
}

func (h *Handler) Pagar(w http.ResponseWriter, r *http.Request) {
    citaIDStr := chi.URLParam(r, "id")
    citaID, err := uuid.Parse(citaIDStr)
    if err != nil {
        http.Error(w, "ID de cita inválido", http.StatusBadRequest)
        return
    }
    
    userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		userIDStr = r.Header.Get("X-User-ID")
	}
	pacienteID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}
    
    var req PagarCitaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}
    
    err = h.svc.Pagar(r.Context(), citaID, pacienteID, req.Metodo)
    if err != nil {
		fmt.Println("Error pago:", err)
        http.Error(w, "Error procesando pago", http.StatusInternalServerError)
        return
    }
    
	w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"mensaje": "Pago procesado exitosamente"})
}

