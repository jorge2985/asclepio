package identity

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"

	"asclepio/internal/config"
	"asclepio/internal/database"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type Servicio struct {
	bd   *database.ServicioBD
	repo Repository
	cfg  *config.Config
}

func NuevoServicio(bd *database.ServicioBD, cfg *config.Config) *Servicio {
	return &Servicio{
		bd:   bd,
		repo: NewRepository(bd.Pool),
		cfg:  cfg,
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

type VerificarCodigoRequest struct {
	VerificacionID string `json:"verificacion_id"`
	Codigo         string `json:"codigo"`
}

type ReenviarCodigoRequest struct {
	VerificacionID string `json:"verificacion_id"`
}

type AuthResponse struct {
	Token        string  `json:"token"`
	RefreshToken string  `json:"refresh_token"`
	Usuario      Usuario `json:"usuario"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// LoginResponse — respuesta del login antes de verificar 2FA
type LoginResponse struct {
	RequiereVerificacion bool   `json:"requiere_verificacion"`
	VerificacionID       string `json:"verificacion_id"`
	EmailEnmascarado     string `json:"email_enmascarado"`
	Mensaje              string `json:"mensaje"`
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

func (s *Servicio) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
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

	// Generar código de verificación de 6 dígitos
	codigo, err := generarCodigo6Digitos()
	if err != nil {
		return nil, fmt.Errorf("error generando código: %w", err)
	}

	// Guardar código en BD (expira en 5 minutos)
	verificacionID, err := s.repo.CrearCodigoVerificacion(ctx, u.ID, codigo, 5*time.Minute)
	if err != nil {
		return nil, fmt.Errorf("error guardando código: %w", err)
	}

	// Log del código en consola (en producción se enviaría por SMS/email)
	fmt.Printf("🔐 Código de verificación para %s: %s\n", u.Email, codigo)

	return &LoginResponse{
		RequiereVerificacion: true,
		VerificacionID:       verificacionID.String(),
		EmailEnmascarado:     enmascararEmail(u.Email),
		Mensaje:              "Código de verificación enviado",
	}, nil
}

func (s *Servicio) VerificarCodigo(ctx context.Context, req VerificarCodigoRequest) (*AuthResponse, error) {
	if req.VerificacionID == "" || req.Codigo == "" {
		return nil, errors.New("verificación ID y código son requeridos")
	}

	verificacionID, err := uuid.Parse(req.VerificacionID)
	if err != nil {
		return nil, errors.New("verificación ID inválido")
	}

	// Buscar y validar código
	registro, err := s.repo.ObtenerCodigoVerificacion(ctx, verificacionID)
	if err == pgx.ErrNoRows {
		return nil, errors.New("código de verificación no encontrado")
	} else if err != nil {
		return nil, err
	}

	// Verificar que no esté usado
	if registro.Usado {
		return nil, errors.New("código ya fue utilizado")
	}

	// Verificar que no haya expirado
	if time.Now().After(registro.ExpiraEn) {
		return nil, errors.New("código expirado, solicite uno nuevo")
	}

	// Verificar intentos (máximo 5)
	if registro.Intentos >= 5 {
		return nil, errors.New("demasiados intentos, solicite un nuevo código")
	}

	// Incrementar intentos
	_ = s.repo.IncrementarIntentos(ctx, verificacionID)

	// Verificar código
	if registro.Codigo != req.Codigo {
		return nil, errors.New("código incorrecto")
	}

	// Marcar como usado
	_ = s.repo.MarcarCodigoUsado(ctx, verificacionID)

	// Buscar usuario para generar JWT
	u, _, err := s.repo.FindByEmail(ctx, registro.Email)
	if err != nil {
		return nil, errors.New("usuario no encontrado")
	}

	// Generar JWT
	tokenString, err := s.generarJWT(u)
	if err != nil {
		return nil, err
	}

	// Generar refresh token
	refreshToken, err := s.generarRefreshToken(ctx, u.ID)
	if err != nil {
		return nil, fmt.Errorf("error generando refresh token: %w", err)
	}

	return &AuthResponse{
		Token:        tokenString,
		RefreshToken: refreshToken,
		Usuario:      *u,
	}, nil
}

func (s *Servicio) ReenviarCodigo(ctx context.Context, req ReenviarCodigoRequest) (*LoginResponse, error) {
	if req.VerificacionID == "" {
		return nil, errors.New("verificación ID es requerido")
	}

	verificacionID, err := uuid.Parse(req.VerificacionID)
	if err != nil {
		return nil, errors.New("verificación ID inválido")
	}

	// Obtener registro original para saber el usuario
	registro, err := s.repo.ObtenerCodigoVerificacion(ctx, verificacionID)
	if err != nil {
		return nil, errors.New("verificación no encontrada")
	}

	// Invalidar código anterior
	_ = s.repo.MarcarCodigoUsado(ctx, verificacionID)

	// Generar nuevo código
	nuevoCodigo, err := generarCodigo6Digitos()
	if err != nil {
		return nil, fmt.Errorf("error generando código: %w", err)
	}

	nuevoID, err := s.repo.CrearCodigoVerificacion(ctx, registro.UsuarioID, nuevoCodigo, 5*time.Minute)
	if err != nil {
		return nil, fmt.Errorf("error guardando código: %w", err)
	}

	fmt.Printf("🔐 Nuevo código de verificación para %s: %s\n", registro.Email, nuevoCodigo)

	return &LoginResponse{
		RequiereVerificacion: true,
		VerificacionID:       nuevoID.String(),
		EmailEnmascarado:     enmascararEmail(registro.Email),
		Mensaje:              "Nuevo código de verificación enviado",
	}, nil
}

// RefreshToken renueva un access token usando un refresh token válido
func (s *Servicio) RefreshToken(ctx context.Context, req RefreshTokenRequest) (*AuthResponse, error) {
	if req.RefreshToken == "" {
		return nil, errors.New("refresh token es requerido")
	}

	// Hashear el refresh token para buscar en BD
	hash := hashToken(req.RefreshToken)

	// Buscar en BD
	registro, err := s.repo.ObtenerRefreshToken(ctx, hash)
	if err == pgx.ErrNoRows {
		return nil, errors.New("refresh token inválido")
	} else if err != nil {
		return nil, err
	}

	if registro.Revocado {
		return nil, errors.New("refresh token revocado")
	}

	if time.Now().After(registro.ExpiraEn) {
		return nil, errors.New("refresh token expirado")
	}

	// Revocar el refresh token usado (rotación)
	_ = s.repo.RevocarRefreshToken(ctx, registro.ID)

	// Buscar usuario
	u, _, err := s.repo.FindByID(ctx, registro.UsuarioID)
	if err != nil {
		return nil, errors.New("usuario no encontrado")
	}

	// Generar nuevo access token
	tokenString, err := s.generarJWT(u)
	if err != nil {
		return nil, err
	}

	// Generar nuevo refresh token
	nuevoRefreshToken, err := s.generarRefreshToken(ctx, u.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:        tokenString,
		RefreshToken: nuevoRefreshToken,
		Usuario:      *u,
	}, nil
}

// ---- Helpers ----

func (s *Servicio) generarJWT(u *Usuario) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": u.ID.String(),
		"rol": u.Rol,
		"exp": time.Now().Add(s.cfg.JWTExpiry).Unix(),
	})
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *Servicio) generarRefreshToken(ctx context.Context, usuarioID uuid.UUID) (string, error) {
	// Generar token aleatorio de 32 bytes
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	rawToken := hex.EncodeToString(b) // 64 chars hex

	// Guardar hash del token en BD
	hash := hashToken(rawToken)
	err := s.repo.CrearRefreshToken(ctx, usuarioID, hash, s.cfg.RefreshTokenExpiry)
	if err != nil {
		return "", err
	}

	return rawToken, nil
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

func generarCodigo6Digitos() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(999999))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func enmascararEmail(email string) string {
	at := -1
	for i, c := range email {
		if c == '@' {
			at = i
			break
		}
	}
	if at <= 2 {
		return email
	}
	return email[:2] + "***" + email[at:]
}
