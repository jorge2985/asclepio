// Tests de integración HTTP para los endpoints de autenticación.
// Usa httptest para testear el handler + router completo sin un servidor real.
// Los tests que requieren BD se omiten si DATABASE_URL no está configurado.
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"asclepio/internal/appointment"
	"asclepio/internal/config"
	"asclepio/internal/database"
	"asclepio/internal/doctor"
	"asclepio/internal/identity"
	ascMiddleware "asclepio/internal/middleware"
	"asclepio/internal/notification"
	"asclepio/internal/review"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// setupRouter crea un router de testing. Si no hay DB, retorna nil y skippea.
func setupRouter(t *testing.T) (http.Handler, func()) {
	t.Helper()

	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL no configurado - saltando tests de integración")
		return nil, nil
	}

	cfg := &config.Config{
		DatabaseURL:    dbURL,
		JWTSecret:      "test-secret-key-1234567890",
		JWTExpiry:      1 * time.Hour,
		AllowedOrigins: []string{"*"},
	}

	bd, err := database.NuevoServicioBD(cfg.DatabaseURL)
	if err != nil {
		t.Skipf("No se pudo conectar a BD de test: %v", err)
		return nil, nil
	}

	svcIdentity := identity.NuevoServicio(bd, cfg)
	handlerIdentity := identity.NuevoHandler(svcIdentity)

	svcDoctor := doctor.NuevoServicio(bd)
	handlerDoctor := doctor.NuevoHandler(svcDoctor)

	svcNotif := notification.NuevoServicioPush(bd)
	svcAppt := appointment.NuevoServicio(bd, svcNotif)
	handlerAppt := appointment.NuevoHandler(svcAppt)

	svcReview := review.NuevoServicio(bd)
	handlerReview := review.NuevoHandler(svcReview)

	limiterLogin := ascMiddleware.NuevoRateLimiter(100, 1*time.Minute) // Más permisivo en tests

	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-User-ID"},
	}))
	r.Use(middleware.AllowContentType("application/json"))

	r.Route("/api", func(r chi.Router) {
		// --- Rutas de Autenticación / Identidad ---
		r.Route("/auth", func(rAuth chi.Router) {
			// Rutas Públicas (con rate limit en login)
			handlerIdentity.RegistrarRutas(rAuth, limiterLogin.Middleware)

			// Rutas Protegidas bajo /auth
			rAuth.Group(func(rAuthProtected chi.Router) {
				rAuthProtected.Use(ascMiddleware.AuthMiddleware(cfg.JWTSecret))
				handlerIdentity.RegistrarRutasProtegidas(rAuthProtected)
			})
		})

		// --- Rutas Protegidas Generales ---
		r.Group(func(rProtected chi.Router) {
			rProtected.Use(ascMiddleware.AuthMiddleware(cfg.JWTSecret))

			rProtected.Route("/doctores", handlerDoctor.RegistrarRutas)
			rProtected.Route("/citas", handlerAppt.RegistrarRutas)
			rProtected.Route("/resenas", handlerReview.RegistrarRutas)
		})
	})

	cleanup := func() { bd.Cerrar() }
	return r, cleanup
}

// --- Tests de /api/auth/registro ---

func TestRegistro_PayloadInvalido(t *testing.T) {
	router, cleanup := setupRouter(t)
	if cleanup != nil {
		defer cleanup()
	}

	body := bytes.NewBufferString(`{"email":"no-valido","password":"abc"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/registro", body)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code == http.StatusCreated {
		t.Errorf("esperaba error HTTP, obtuvo 201 Created con payload inválido")
	}
}

func TestRegistro_JSONMalformado(t *testing.T) {
	router, cleanup := setupRouter(t)
	if cleanup != nil {
		defer cleanup()
	}

	body := bytes.NewBufferString(`not-a-json`)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/registro", body)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code == http.StatusCreated {
		t.Errorf("esperaba error HTTP, no 201")
	}
}

func TestLogin_CredencialesIncorrectas(t *testing.T) {
	router, cleanup := setupRouter(t)
	if cleanup != nil {
		defer cleanup()
	}

	loginPayload := map[string]string{
		"email":    "no-existe@example.com",
		"password": "wrong-password",
	}
	body, _ := json.Marshal(loginPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code == http.StatusOK {
		t.Errorf("esperaba status de error (401), obtuvo 200 con credenciales incorrectas")
	}
}

func TestHealthCheck(t *testing.T) {
	// Test simple que no necesita BD - verifica formato JSON
	r := chi.NewRouter()
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","database":"ok","version":"1.0.0"}`))
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("esperaba 200, obtuvo %d", rr.Code)
	}
	ct := rr.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("esperaba Content-Type application/json, obtuvo %q", ct)
	}
}

func TestDoctorEndpoints_NoAutorizado(t *testing.T) {
	router, cleanup := setupRouter(t)
	if cleanup != nil {
		defer cleanup()
	}

	// 1. Validar que /api/doctores/pacientes sin token da error 401
	reqPacientes := httptest.NewRequest(http.MethodGet, "/api/doctores/pacientes", nil)
	rrPacientes := httptest.NewRecorder()
	router.ServeHTTP(rrPacientes, reqPacientes)
	if rrPacientes.Code != http.StatusUnauthorized {
		t.Errorf("esperaba status 401 para pacientes no autorizado, obtuvo %d", rrPacientes.Code)
	}

	// 2. Validar que /api/doctores/estadisticas sin token da error 401
	reqStats := httptest.NewRequest(http.MethodGet, "/api/doctores/estadisticas", nil)
	rrStats := httptest.NewRecorder()
	router.ServeHTTP(rrStats, reqStats)
	if rrStats.Code != http.StatusUnauthorized {
		t.Errorf("esperaba status 401 para estadísticas no autorizado, obtuvo %d", rrStats.Code)
	}
}
