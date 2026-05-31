package identity

import (
	"testing"
)

// --- ValidateLoginRequest ---

func TestValidateLoginRequest_EmailVacio(t *testing.T) {
	req := &LoginRequest{Email: "", Password: "secret123"}
	if err := ValidateLoginRequest(req); err == nil {
		t.Error("esperaba error por email vacío, pero no hubo ninguno")
	}
}

func TestValidateLoginRequest_EmailMalformado(t *testing.T) {
	req := &LoginRequest{Email: "no-es-un-email", Password: "secret123"}
	if err := ValidateLoginRequest(req); err == nil {
		t.Error("esperaba error por email inválido")
	}
}

func TestValidateLoginRequest_PasswordVacia(t *testing.T) {
	req := &LoginRequest{Email: "user@example.com", Password: ""}
	if err := ValidateLoginRequest(req); err == nil {
		t.Error("esperaba error por contraseña vacía")
	}
}

func TestValidateLoginRequest_Correcto(t *testing.T) {
	req := &LoginRequest{Email: "user@example.com", Password: "password123"}
	if err := ValidateLoginRequest(req); err != nil {
		t.Errorf("no esperaba error, pero obtuvo: %v", err)
	}
}

// --- ValidateRegistroRequest ---

func TestValidateRegistroRequest_EmailVacio(t *testing.T) {
	req := &RegistroRequest{Email: "", Password: "pass123", Rol: "paciente", NombreCompleto: "Juan Perez"}
	if err := ValidateRegistroRequest(req); err == nil {
		t.Error("esperaba error por email vacío")
	}
}

func TestValidateRegistroRequest_PasswordCorta(t *testing.T) {
	req := &RegistroRequest{Email: "u@e.com", Password: "abc", Rol: "paciente", NombreCompleto: "Juan Perez"}
	if err := ValidateRegistroRequest(req); err == nil {
		t.Error("esperaba error por contraseña menor a 6 chars")
	}
}

func TestValidateRegistroRequest_RolInvalido(t *testing.T) {
	req := &RegistroRequest{Email: "u@e.com", Password: "abc123", Rol: "admin", NombreCompleto: "Juan Perez"}
	if err := ValidateRegistroRequest(req); err == nil {
		t.Error("esperaba error por rol inválido")
	}
}

func TestValidateRegistroRequest_NombreCorto(t *testing.T) {
	req := &RegistroRequest{Email: "u@e.com", Password: "abc123", Rol: "paciente", NombreCompleto: "Al"}
	if err := ValidateRegistroRequest(req); err == nil {
		t.Error("esperaba error por nombre muy corto")
	}
}

func TestValidateRegistroRequest_MedicoSinEspecialidad(t *testing.T) {
	req := &RegistroRequest{
		Email: "doc@e.com", Password: "abc123", Rol: "medico",
		NombreCompleto: "Dr. García", Especialidad: "", TarifaHora: 100,
	}
	if err := ValidateRegistroRequest(req); err == nil {
		t.Error("esperaba error por especialidad vacía para médico")
	}
}

func TestValidateRegistroRequest_MedicoTarifaCero(t *testing.T) {
	req := &RegistroRequest{
		Email: "doc@e.com", Password: "abc123", Rol: "medico",
		NombreCompleto: "Dr. García", Especialidad: "Cardiología", TarifaHora: 0,
	}
	if err := ValidateRegistroRequest(req); err == nil {
		t.Error("esperaba error por tarifa = 0 para médico")
	}
}

func TestValidateRegistroRequest_PacienteCorrect(t *testing.T) {
	req := &RegistroRequest{
		Email: "pac@e.com", Password: "abc123", Rol: "paciente",
		NombreCompleto: "Ana López", Telefono: "1234567890",
	}
	if err := ValidateRegistroRequest(req); err != nil {
		t.Errorf("no esperaba error, obtuvo: %v", err)
	}
}

func TestValidateRegistroRequest_MedicoCorrect(t *testing.T) {
	req := &RegistroRequest{
		Email: "doc@e.com", Password: "abc123", Rol: "medico",
		NombreCompleto: "Dr. García", Especialidad: "Cardiología", TarifaHora: 150,
	}
	if err := ValidateRegistroRequest(req); err != nil {
		t.Errorf("no esperaba error, obtuvo: %v", err)
	}
}
