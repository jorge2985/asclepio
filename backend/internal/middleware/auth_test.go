package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestRequireRolePermiteRolAutorizado(t *testing.T) {
	token := firmarTokenTest(t, "user-1", "medico", "secret")
	handler := AuthMiddleware("secret")(RequireRole("medico")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("esperaba 204, obtuvo %d", rr.Code)
	}
}

func TestRequireRoleBloqueaRolNoAutorizado(t *testing.T) {
	token := firmarTokenTest(t, "user-1", "paciente", "secret")
	handler := AuthMiddleware("secret")(RequireRole("medico")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("esperaba 403, obtuvo %d", rr.Code)
	}
}

func firmarTokenTest(t *testing.T, userID, rol, secret string) string {
	t.Helper()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"rol": rol,
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("no se pudo firmar token: %v", err)
	}
	return signed
}
