// Package main es el punto de entrada HTTP de Asclepio.
//
// Este archivo arma la aplicacion completa: carga configuracion, abre la BD,
// crea servicios/handlers y registra las rutas publicas y protegidas.
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
	// La configuracion se carga antes de cualquier servicio para fallar temprano
	// si faltan secretos o URLs obligatorias.
	cfg, err := config.Cargar()
	if err != nil {
		logger.Error("Configuracion invalida", "error", err)
		return
	}
	logger.Info("Iniciando Asclepio API", "env", "development")

	// La conexion a BD se comparte entre todos los servicios del backend.
	logger.Info("Conectando a base de datos...")
	bd, err := database.NuevoServicioBD(cfg.DatabaseURL)
	if err != nil {
		logger.Error("Error fatal conectando a BD", "error", err)
		return
	}
	defer bd.Cerrar()
	logger.Info("Conexion a base de datos exitosa")

	// Cada dominio expone un servicio con reglas de negocio y un handler HTTP.
	svcIdentity := identity.NuevoServicio(bd, cfg)
	handlerIdentity := identity.NuevoHandler(svcIdentity)

	svcDoctor := doctor.NuevoServicio(bd)
	handlerDoctor := doctor.NuevoHandler(svcDoctor)

	svcNotif := notification.NuevoServicioPush(bd)

	svcAppt := appointment.NuevoServicio(bd, svcNotif, cfg)
	handlerAppt := appointment.NuevoHandler(svcAppt)

	svcReview := review.NuevoServicio(bd)
	handlerReview := review.NuevoHandler(svcReview)

	// Rate limiter aplicado a auth para reducir fuerza bruta en login/2FA.
	limiterLogin := ascMiddleware.NuevoRateLimiter(5, 1*time.Minute)

	// Chi permite agrupar middlewares por rama de rutas.
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS define que frontends pueden llamar a esta API desde navegador/app.
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.AllowContentType("application/json"))

	// Todo lo que este dentro de rProtected requiere JWT valido.
	r.Route("/api", func(r chi.Router) {
		r.Route("/auth", func(rAuth chi.Router) {
			handlerIdentity.RegistrarRutas(rAuth, limiterLogin.Middleware)

			rAuth.Group(func(rAuthProtected chi.Router) {
				rAuthProtected.Use(ascMiddleware.AuthMiddleware(cfg.JWTSecret))
				handlerIdentity.RegistrarRutasProtegidas(rAuthProtected)
			})
		})

		r.Group(func(rProtected chi.Router) {
			rProtected.Use(ascMiddleware.AuthMiddleware(cfg.JWTSecret))

			rProtected.Route("/doctores", func(r chi.Router) {
				r.Group(func(rMedico chi.Router) {
					rMedico.Use(ascMiddleware.RequireRole("medico", "admin"))
					rMedico.Get("/pacientes", handlerDoctor.ListarPacientes)
					rMedico.Get("/pacientes/{id}", handlerDoctor.DetallePaciente)
					rMedico.Get("/estadisticas", handlerDoctor.ObtenerEstadisticas)
				})
				r.Get("/", handlerDoctor.Listar)
				r.Get("/{id}", handlerDoctor.Detalle)
			})

			rProtected.Route("/citas", func(r chi.Router) {
				r.With(ascMiddleware.RequireRole("paciente")).Post("/", handlerAppt.Crear)
				r.With(ascMiddleware.RequireRole("paciente")).Get("/", handlerAppt.Historial)
				r.With(ascMiddleware.RequireRole("medico", "admin")).Get("/medico", handlerAppt.ListarPorMedico)
				r.Get("/disponibilidad", handlerAppt.Disponibilidad)
				r.With(ascMiddleware.RequireRole("medico", "admin")).Put("/{id}/confirmar", handlerAppt.Confirmar)
				r.With(ascMiddleware.RequireRole("paciente", "medico", "admin")).Put("/{id}/cancelar", handlerAppt.Cancelar)
				r.With(ascMiddleware.RequireRole("paciente")).Put("/{id}/reprogramar", handlerAppt.Reprogramar)
				r.With(ascMiddleware.RequireRole("paciente")).Post("/{id}/pago", handlerAppt.Pagar)
			})

			rProtected.Route("/resenas", func(r chi.Router) {
				r.With(ascMiddleware.RequireRole("paciente")).Post("/", handlerReview.Crear)
			})
		})
	})

	// Health check usado por monitoreo/load balancers para saber si la API y DB responden.
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
