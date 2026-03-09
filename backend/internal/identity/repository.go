// backend/internal/identity/repository.go
package identity

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegistroVerificacion almacena los datos de un código de verificación
type RegistroVerificacion struct {
	ID        uuid.UUID
	UsuarioID uuid.UUID
	Email     string
	Codigo    string
	ExpiraEn  time.Time
	Usado     bool
	Intentos  int
}

// Repository define la interfaz para acceso a datos de identidad
type Repository interface {
	// Usuario
	FindByEmail(ctx context.Context, email string) (*Usuario, string, error)
	CreateUser(ctx context.Context, tx pgx.Tx, id uuid.UUID, email, passwordHash string, rol Rol) (time.Time, error)

	// Médico
	CreateMedico(ctx context.Context, tx pgx.Tx, usuarioID uuid.UUID, nombreCompleto, especialidad string, tarifaHora float64) error

	// Paciente
	CreatePaciente(ctx context.Context, tx pgx.Tx, usuarioID uuid.UUID, nombreCompleto, telefono string) error

	// Verificación 2FA
	CrearCodigoVerificacion(ctx context.Context, usuarioID uuid.UUID, codigo string, duracion time.Duration) (uuid.UUID, error)
	ObtenerCodigoVerificacion(ctx context.Context, id uuid.UUID) (*RegistroVerificacion, error)
	MarcarCodigoUsado(ctx context.Context, id uuid.UUID) error
	IncrementarIntentos(ctx context.Context, id uuid.UUID) error

	// Refresh Tokens
	FindByID(ctx context.Context, id uuid.UUID) (*Usuario, string, error)
	CrearRefreshToken(ctx context.Context, usuarioID uuid.UUID, hash string, duracion time.Duration) error
	ObtenerRefreshToken(ctx context.Context, hash string) (*RegistroRefreshToken, error)
	RevocarRefreshToken(ctx context.Context, id uuid.UUID) error
}

// RegistroRefreshToken almacena los datos de un refresh token
type RegistroRefreshToken struct {
	ID        uuid.UUID
	UsuarioID uuid.UUID
	TokenHash string
	ExpiraEn  time.Time
	Revocado  bool
}

// postgresRepository implementa Repository usando PostgreSQL
type postgresRepository struct {
	pool *pgxpool.Pool
}

// NewRepository crea una nueva instancia del repositorio
func NewRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{pool: pool}
}

// FindByID busca un usuario por ID y retorna el usuario y su hash de contraseña
func (r *postgresRepository) FindByID(ctx context.Context, id uuid.UUID) (*Usuario, string, error) {
	var u Usuario
	var hash string

	query := `SELECT id, email, password_hash, rol, fecha_creacion FROM usuarios WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(&u.ID, &u.Email, &hash, &u.Rol, &u.FechaCreacion)

	if err != nil {
		return nil, "", err
	}

	return &u, hash, nil
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

// ---- Verificación 2FA ----

func (r *postgresRepository) CrearCodigoVerificacion(ctx context.Context, usuarioID uuid.UUID, codigo string, duracion time.Duration) (uuid.UUID, error) {
	id := uuid.New()
	expiraEn := time.Now().Add(duracion)

	query := `INSERT INTO codigos_verificacion (id, usuario_id, codigo, expira_en) VALUES ($1, $2, $3, $4)`
	_, err := r.pool.Exec(ctx, query, id, usuarioID, codigo, expiraEn)
	if err != nil {
		return uuid.Nil, err
	}
	return id, nil
}

func (r *postgresRepository) ObtenerCodigoVerificacion(ctx context.Context, id uuid.UUID) (*RegistroVerificacion, error) {
	reg := &RegistroVerificacion{}

	query := `
		SELECT cv.id, cv.usuario_id, u.email, cv.codigo, cv.expira_en, cv.usado, cv.intentos
		FROM codigos_verificacion cv
		JOIN usuarios u ON u.id = cv.usuario_id
		WHERE cv.id = $1
	`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&reg.ID, &reg.UsuarioID, &reg.Email, &reg.Codigo, &reg.ExpiraEn, &reg.Usado, &reg.Intentos,
	)
	if err != nil {
		return nil, err
	}
	return reg, nil
}

func (r *postgresRepository) MarcarCodigoUsado(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE codigos_verificacion SET usado = TRUE WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

func (r *postgresRepository) IncrementarIntentos(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

// ---- Refresh Tokens ----

func (r *postgresRepository) CrearRefreshToken(ctx context.Context, usuarioID uuid.UUID, hash string, duracion time.Duration) error {
	expiraEn := time.Now().Add(duracion)
	query := `INSERT INTO refresh_tokens (usuario_id, token_hash, expira_en) VALUES ($1, $2, $3)`
	_, err := r.pool.Exec(ctx, query, usuarioID, hash, expiraEn)
	return err
}

func (r *postgresRepository) ObtenerRefreshToken(ctx context.Context, hash string) (*RegistroRefreshToken, error) {
	reg := &RegistroRefreshToken{}
	query := `SELECT id, usuario_id, token_hash, expira_en, revocado FROM refresh_tokens WHERE token_hash = $1 AND revocado = FALSE`
	err := r.pool.QueryRow(ctx, query, hash).Scan(&reg.ID, &reg.UsuarioID, &reg.TokenHash, &reg.ExpiraEn, &reg.Revocado)
	if err != nil {
		return nil, err
	}
	return reg, nil
}

func (r *postgresRepository) RevocarRefreshToken(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE refresh_tokens SET revocado = TRUE WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}
