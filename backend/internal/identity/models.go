package identity

import (
	"time"

	"github.com/google/uuid"
)

type Rol string

const (
	RolPaciente Rol = "paciente"
	RolMedico   Rol = "medico"
	RolAdmin    Rol = "admin"
)

type Usuario struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"-"`
	Rol           Rol       `json:"rol"`
	FechaCreacion time.Time `json:"fecha_creacion"`
	FechaActualiz time.Time `json:"fecha_actualizacion"`
}

type Paciente struct {
	UsuarioID      uuid.UUID `json:"usuario_id"`
	NombreCompleto string    `json:"nombre_completo"`
	Telefono       string    `json:"telefono"`
	Direccion      string    `json:"direccion"`
}

type Medico struct {
	UsuarioID      uuid.UUID `json:"usuario_id"`
	NombreCompleto string    `json:"nombre_completo"`
	Especialidad   string    `json:"especialidad"`
	Biografia      string    `json:"biografia"`
	TarifaHora     float64   `json:"tarifa_hora"`
	Ubicacion      string    `json:"ubicacion"`
	Calificacion   float64   `json:"calificacion"`
}
