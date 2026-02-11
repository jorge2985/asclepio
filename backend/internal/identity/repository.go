// backend/internal/identity/repository.go
package identity

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository define la interfaz para acceso a datos de identidad
type Repository interface {
	// Usuario
	FindByEmail(ctx context.Context, email string) (*Usuario, string, error)
	CreateUser(ctx context.Context, tx pgx.Tx, id uuid.UUID, email, passwordHash string, rol Rol) (time.Time, error)

	// Médico
	CreateMedico(ctx context.Context, tx pgx.Tx, usuarioID uuid.UUID, nombreCompleto, especialidad string, tarifaHora float64) error

	// Paciente
	CreatePaciente(ctx context.Context, tx pgx.Tx, usuarioID uuid.UUID, nombreCompleto, telefono string) error
}

// postgresRepository implementa Repository usando PostgreSQL
type postgresRepository struct {
	pool *pgxpool.Pool
}

// NewRepository crea una nueva instancia del repositorio
func NewRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{pool: pool}
}

// FindByEmail busca un usuario por email y retorna el usuario y su hash de contraseña
func (r *postgresRepository) FindByEmail(ctx context.Context, email string) (*Usuario, string, error) {
	var u Usuario
	var hash string

	query := `SELECT id, email, password_hash, rol, fecha_creacion FROM usuarios WHERE email = $1`
	err := r.pool.QueryRow(ctx, query, email).Scan(&u.ID, &u.Email, &hash, &u.Rol, &u.FechaCreacion)

	if err != nil {
		return nil, "", err
	}

	return &u, hash, nil
}

// CreateUser crea un nuevo usuario en la base de datos
func (r *postgresRepository) CreateUser(ctx context.Context, tx pgx.Tx, id uuid.UUID, email, passwordHash string, rol Rol) (time.Time, error) {
	query := `INSERT INTO usuarios (id, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING fecha_creacion`
	var fechaCreacion time.Time
	err := tx.QueryRow(ctx, query, id, email, passwordHash, rol).Scan(&fechaCreacion)
	return fechaCreacion, err
}

// CreateMedico crea un perfil de médico
func (r *postgresRepository) CreateMedico(ctx context.Context, tx pgx.Tx, usuarioID uuid.UUID, nombreCompleto, especialidad string, tarifaHora float64) error {
	query := `INSERT INTO medicos (usuario_id, nombre_completo, especialidad, tarifa_hora) VALUES ($1, $2, $3, $4)`
	_, err := tx.Exec(ctx, query, usuarioID, nombreCompleto, especialidad, tarifaHora)
	return err
}

// CreatePaciente crea un perfil de paciente
func (r *postgresRepository) CreatePaciente(ctx context.Context, tx pgx.Tx, usuarioID uuid.UUID, nombreCompleto, telefono string) error {
	query := `INSERT INTO pacientes (usuario_id, nombre_completo, telefono) VALUES ($1, $2, $3)`
	_, err := tx.Exec(ctx, query, usuarioID, nombreCompleto, telefono)
	return err
}
