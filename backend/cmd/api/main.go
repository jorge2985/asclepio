package main

import (
	"fmt"
	"net/http"
	"os"

	"asclepio/internal/appointment"
	"asclepio/internal/database"
	"asclepio/internal/doctor"
	"asclepio/internal/identity"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Default local
		dbURL = "postgres://postgres:18zeta29@localhost:5433/asclepio?sslmode=disable"
	}

	// 1. Conexión a BD
	fmt.Println("Conectando a base de datos...")
	bd, err := database.NuevoServicioBD(dbURL)
	if err != nil {
		fmt.Printf("Error fatal conectando a BD: %s\n", err)
		os.Exit(1)
	}
	defer bd.Cerrar()
	fmt.Println("Conexión exitosa.")

	// 2. Inicializar Servicios
	svcIdentity := identity.NuevoServicio(bd)
	handlerIdentity := identity.NuevoHandler(svcIdentity)

	svcDoctor := doctor.NuevoServicio(bd)
	handlerDoctor := doctor.NuevoHandler(svcDoctor)

	svcAppt := appointment.NuevoServicio(bd)
	handlerAppt := appointment.NuevoHandler(svcAppt)

	// 3. Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS - Permitir peticiones desde el frontend
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:8081", "http://localhost:19006", "http://localhost:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-User-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.AllowContentType("application/json"))

	// r.Use(AuthMiddleware) -> Pendiente, usando Header X-User-ID por ahora para simplicidad

	// API Routes
	r.Route("/api", func(r chi.Router) {
		r.Route("/auth", handlerIdentity.RegistrarRutas)
		r.Route("/doctores", handlerDoctor.RegistrarRutas)
		r.Route("/citas", handlerAppt.RegistrarRutas)
	})

	// Health Check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	fmt.Printf("Servidor iniciando en puerto %s...\n", port)
	err = http.ListenAndServe(":"+port, r)
	if err != nil {
		fmt.Printf("Error iniciando servidor: %s\n", err)
	}
}
