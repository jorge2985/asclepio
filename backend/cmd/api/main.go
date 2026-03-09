package main

import (
	"fmt"
	"net/http"
	"time"

	"asclepio/internal/appointment"
	"asclepio/internal/config"
	"asclepio/internal/database"
	"asclepio/internal/doctor"
	"asclepio/internal/identity"
	ascMiddleware "asclepio/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// 1. Cargar Configuración
	cfg := config.Cargar()

	// 2. Conexión a BD
	fmt.Println("Conectando a base de datos...")
	bd, err := database.NuevoServicioBD(cfg.DatabaseURL)
	if err != nil {
		fmt.Printf("Error fatal conectando a BD: %s\n", err)
		return
	}
	defer bd.Cerrar()
	fmt.Println("Conexión exitosa.")

	// 3. Inicializar Servicios
	svcIdentity := identity.NuevoServicio(bd, cfg)
	handlerIdentity := identity.NuevoHandler(svcIdentity)

	svcDoctor := doctor.NuevoServicio(bd)
	handlerDoctor := doctor.NuevoHandler(svcDoctor)

	svcAppt := appointment.NuevoServicio(bd)
	handlerAppt := appointment.NuevoHandler(svcAppt)

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
		// --- Rutas Públicas (con rate limit en login) ---
		r.Route("/auth", func(rAuth chi.Router) {
			handlerIdentity.RegistrarRutas(rAuth, limiterLogin.Middleware)
		})

		// --- Rutas Protegidas ---
		r.Group(func(rProtected chi.Router) {
			rProtected.Use(ascMiddleware.AuthMiddleware(cfg.JWTSecret))

			rProtected.Route("/doctores", handlerDoctor.RegistrarRutas)
			rProtected.Route("/citas", handlerAppt.RegistrarRutas)
		})
	})

	// Health Check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	fmt.Printf("Servidor iniciando en puerto %s...\n", cfg.Port)
	err = http.ListenAndServe(":"+cfg.Port, r)
	if err != nil {
		fmt.Printf("Error iniciando servidor: %s\n", err)
	}
}
