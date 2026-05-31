package identity

import (
	"testing"
)

// --- enmascararEmail ---

func TestEnmascararEmail_Normal(t *testing.T) {
	result := enmascararEmail("jorge@example.com")
	expected := "jo***@example.com"
	if result != expected {
		t.Errorf("esperaba %q, obtuvo %q", expected, result)
	}
}

func TestEnmascararEmail_CortoAntesDe3(t *testing.T) {
	// Si el local tiene menos de 3 chars, debe retornar sin cambios
	result := enmascararEmail("ab@example.com")
	if result != "ab@example.com" {
		t.Errorf("email corto no debería enmascararse, obtuvo %q", result)
	}
}

// --- isValidPhone ---

func TestIsValidPhone_Valido(t *testing.T) {
	if !isValidPhone("12345678") {
		t.Error("esperaba que '12345678' fuese válido")
	}
}

func TestIsValidPhone_ConEspacios(t *testing.T) {
	if !isValidPhone("1234 5678") {
		t.Error("esperaba que telefono con espacios sea normalizable y válido")
	}
}

func TestIsValidPhone_ConGuiones(t *testing.T) {
	if !isValidPhone("1234-5678") {
		t.Error("esperaba que telefono con guiones sea normalizable y válido")
	}
}

func TestIsValidPhone_DemasiadoCorto(t *testing.T) {
	if isValidPhone("1234") {
		t.Error("esperaba que '1234' sea inválido (muy corto)")
	}
}

func TestIsValidPhone_DemasiadoLargo(t *testing.T) {
	if isValidPhone("1234567890123456") { // 16 dígitos
		t.Error("esperaba que 16-digit phone sea inválido")
	}
}

func TestIsValidPhone_ConLetras(t *testing.T) {
	if isValidPhone("123abc456") {
		t.Error("esperaba que teléfono con letras sea inválido")
	}
}

// --- isValidEmail ---

func TestIsValidEmail_Correcto(t *testing.T) {
	casos := []string{
		"user@example.com",
		"test123@domain.org",
		"sub.dir+tag@company.co",
	}
	for _, c := range casos {
		if !isValidEmail(c) {
			t.Errorf("esperaba que %q sea válido", c)
		}
	}
}

func TestIsValidEmail_Invalido(t *testing.T) {
	casos := []string{
		"nodomain",
		"@example.com",
		"user@",
		"user @example.com",
		"",
	}
	for _, c := range casos {
		if isValidEmail(c) {
			t.Errorf("esperaba que %q sea inválido", c)
		}
	}
}
