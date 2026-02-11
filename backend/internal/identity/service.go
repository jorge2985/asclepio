package identity

import (
	"context"
	"errors"
	"fmt"
	"time"

	"asclepio/internal/database"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type Servicio struct {
	bd   *database.ServicioBD
	repo Repository
}

func NuevoServicio(bd *database.ServicioBD) *Servicio {
	return &Servicio{
		bd:   bd,
		repo: NewRepository(bd.Pool),
	}
}

// Structs para Request/Response
type RegistroRequest struct {
	Email          string `json:"email"`
	Password       string `json:"password"`
	Rol            string `json:"rol"` // paciente, medico
	NombreCompleto string `json:"nombre_completo"`
	// Campos opcionales dependiendo del rol
	Especialidad string  `json:"especialidad,omitempty"`
	TarifaHora   float64 `json:"tarifa_hora,omitempty"`
	Telefono     string  `json:"telefono,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token   string  `json:"token"`
	Usuario Usuario `json:"usuario"`
}

func (s *Servicio) Registrar(ctx context.Context, req RegistroRequest) (*Usuario, error) {
	// Validar entrada
	if err := ValidateRegistroRequest(&req); err != nil {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	rol := Rol(req.Rol)

	tx, err := s.bd.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Crear Usuario usando repository
	usuarioID := uuid.New()
	fechaCreacion, err := s.repo.CreateUser(ctx, tx, usuarioID, req.Email, string(hash), rol)
	if err != nil {
		return nil, fmt.Errorf("error creando usuario: %w", err)
	}

	// 2. Crear Perfil (Medico o Paciente) usando repository
	if rol == RolMedico {
		err = s.repo.CreateMedico(ctx, tx, usuarioID, req.NombreCompleto, req.Especialidad, req.TarifaHora)
	} else {
		err = s.repo.CreatePaciente(ctx, tx, usuarioID, req.NombreCompleto, req.Telefono)
	}

	if err != nil {
		return nil, fmt.Errorf("error creando perfil: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, err
	}

	return &Usuario{
		ID:            usuarioID,
		Email:         req.Email,
		Rol:           rol,
		FechaCreacion: fechaCreacion,
	}, nil
}

func (s *Servicio) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	// Validar entrada
	if err := ValidateLoginRequest(&req); err != nil {
		return nil, err
	}

	// Buscar usuario usando repository
	u, hash, err := s.repo.FindByEmail(ctx, req.Email)

	if err == pgx.ErrNoRows {
		return nil, errors.New("credenciales inválidas")
	} else if err != nil {
		return nil, err
	}

	// Validar password
	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	// Generar JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": u.ID.String(),
		"rol": u.Rol,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	})

	// TODO: Mover secret a variable de entorno
	tokenString, err := token.SignedString([]byte("secreto_super_seguro"))
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:   tokenString,
		Usuario: *u,
	}, nil
}
