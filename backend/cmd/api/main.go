package main

import (
	"encoding/json"
	"net/http"
	"time"

	"asclepio/internal/appointment"
	"asclepio/internal/config"
	"asclepio/internal/database"
	"asclepio/internal/doctor"
	"asclepio/internal/identity"
	"asclepio/internal/logger"
	ascMiddleware "asclepio/internal/middleware"
	"asclepio/internal/notification"
	"asclepio/internal/review"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// 1. Cargar Configuración
	cfg := config.Cargar()
	logger.Info("Iniciando Asclepio API", "env", "development")

	// 2. Conexión a BD
	logger.Info("Conectando a base de datos...")
	bd, err := database.NuevoServicioBD(cfg.DatabaseURL)
	if err != nil {
		logger.Error("Error fatal conectando a BD", "error", err)
		return
	}
	defer bd.Cerrar()
	logger.Info("Conexión a base de datos exitosa")

	// 3. Inicializar Servicios
	svcIdentity := identity.NuevoServicio(bd, cfg)
	handlerIdentity := identity.NuevoHandler(svcIdentity)

	svcDoctor := doctor.NuevoServicio(bd)
	handlerDoctor := doctor.NuevoHandler(svcDoctor)

	svcNotif := notification.NuevoServicioPush(bd)

	svcAppt := appointment.NuevoServicio(bd, svcNotif)
	handlerAppt := appointment.NuevoHandler(svcAppt)

	svcReview := review.NuevoServicio(bd)
	handlerReview := review.NuevoHandler(svcReview)

	// 4. Rate Limiter (5 intentos por minuto para login/verificación)
	limiterLogin := ascMiddleware.NuevoRateLimiter(5, 1*time.Minute)

	// 5. Router principal
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-User-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.AllowContentType("application/json"))

	// API Routes
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

	// Health Check enriquecido con JSON y estado de BD
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		type healthResponse struct {
			Status   string `json:"status"`
			Database string `json:"database"`
			Version  string `json:"version"`
		}

		res := healthResponse{
			Status:  "ok",
			Version: "1.0.0",
		}

		// Verificar conectividad de BD
		if err := bd.Pool.Ping(r.Context()); err != nil {
			res.Database = "unavailable"
			res.Status = "degraded"
			w.WriteHeader(http.StatusServiceUnavailable)
		} else {
			res.Database = "ok"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	logger.Info("Servidor escuchando", "port", cfg.Port)
	err = http.ListenAndServe(":"+cfg.Port, r)
	if err != nil {
		logger.Error("Error iniciando servidor", "error", err)
	}
}
