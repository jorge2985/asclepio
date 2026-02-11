// backend/internal/identity/validator.go
package identity

import (
	"errors"
	"regexp"
	"strings"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// ValidateLoginRequest valida los datos de login
func ValidateLoginRequest(req *LoginRequest) error {
	if req.Email == "" {
		return errors.New("el email es requerido")
	}

	if !isValidEmail(req.Email) {
		return errors.New("el email no es válido")
	}

	if req.Password == "" {
		return errors.New("la contraseña es requerida")
	}

	return nil
}

// ValidateRegistroRequest valida los datos de registro
func ValidateRegistroRequest(req *RegistroRequest) error {
	// Validar email
	if req.Email == "" {
		return errors.New("el email es requerido")
	}

	if !isValidEmail(req.Email) {
		return errors.New("el email no es válido")
	}

	// Validar contraseña
	if req.Password == "" {
		return errors.New("la contraseña es requerida")
	}

	if len(req.Password) < 6 {
		return errors.New("la contraseña debe tener al menos 6 caracteres")
	}

	// Validar rol
	if req.Rol != string(RolPaciente) && req.Rol != string(RolMedico) {
		return errors.New("el rol debe ser 'paciente' o 'medico'")
	}

	// Validar nombre completo
	if req.NombreCompleto == "" {
		return errors.New("el nombre completo es requerido")
	}

	if len(strings.TrimSpace(req.NombreCompleto)) < 3 {
		return errors.New("el nombre completo debe tener al menos 3 caracteres")
	}

	// Validaciones específicas por rol
	if req.Rol == string(RolMedico) {
		if req.Especialidad == "" {
			return errors.New("la especialidad es requerida para médicos")
		}

		if req.TarifaHora <= 0 {
			return errors.New("la tarifa por hora debe ser mayor a 0")
		}
	}

	if req.Rol == string(RolPaciente) {
		if req.Telefono != "" && !isValidPhone(req.Telefono) {
			return errors.New("el teléfono no es válido")
		}
	}

	return nil
}

// isValidEmail valida el formato de un email
func isValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// isValidPhone valida el formato de un teléfono (básico)
func isValidPhone(phone string) bool {
	// Remover espacios y guiones
	cleaned := strings.ReplaceAll(strings.ReplaceAll(phone, " ", ""), "-", "")

	// Verificar que tenga entre 8 y 15 dígitos
	if len(cleaned) < 8 || len(cleaned) > 15 {
		return false
	}

	// Verificar que solo contenga dígitos
	for _, c := range cleaned {
		if c < '0' || c > '9' {
			return false
		}
	}

	return true
}
