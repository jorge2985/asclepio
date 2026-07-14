// Package identity contiene autenticacion, registro, 2FA, JWT y refresh tokens.
//
// Este archivo adapta HTTP al servicio: decodifica JSON, llama a la regla de
// negocio y escribe la respuesta. No deberia contener SQL ni logica compleja.
package identity

import (
	"encoding/json"
	"net/http"

	ascMiddleware "asclepio/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	svc *Servicio
}

func NuevoHandler(svc *Servicio) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegistrarRutas(r chi.Router, rateLimiter func(http.Handler) http.Handler) {
	// Rutas publicas: registro, login, verificacion 2FA y refresh token.
	r.Post("/registro", h.handleRegistro)
	r.Post("/refresh", h.handleRefresh)

	if rateLimiter != nil {
		r.With(rateLimiter).Post("/login", h.handleLogin)
		r.With(rateLimiter).Post("/verificar", h.handleVerificar)
		r.With(rateLimiter).Post("/reenviar-codigo", h.handleReenviarCodigo)
	} else {
		r.Post("/login", h.handleLogin)
		r.Post("/verificar", h.handleVerificar)
		r.Post("/reenviar-codigo", h.handleReenviarCodigo)
	}
}

func (h *Handler) RegistrarRutasProtegidas(r chi.Router) {
	// Rutas protegidas: requieren que AuthMiddleware haya puesto user_id en context.
	r.Put("/push-token", h.handleGuardarPushToken)
	r.Get("/me", h.handleObtenerPerfil)
	r.Put("/me", h.handleActualizarPerfil)
}

func (h *Handler) handleRegistro(w http.ResponseWriter, r *http.Request) {
	var req RegistroRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	usuario, err := h.svc.Registrar(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(usuario)
}

func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.Login(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) handleVerificar(w http.ResponseWriter, r *http.Request) {
	var req VerificarCodigoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.VerificarCodigo(r.Context(), req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) handleReenviarCodigo(w http.ResponseWriter, r *http.Request) {
	var req ReenviarCodigoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.ReenviarCodigo(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) handleRefresh(w http.ResponseWriter, r *http.Request) {
	var req RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.RefreshToken(r.Context(), req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) handleGuardarPushToken(w http.ResponseWriter, r *http.Request) {
	userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		http.Error(w, "Usuario invalido", http.StatusUnauthorized)
		return
	}
	usuarioID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario inválido", http.StatusUnauthorized)
		return
	}

	var req PushTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	err = h.svc.GuardarPushToken(r.Context(), req, usuarioID)
	if err != nil {
		http.Error(w, "Error guardando push token", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"mensaje": "Push token actualizado correctamente"})
}

func (h *Handler) handleObtenerPerfil(w http.ResponseWriter, r *http.Request) {
	usuarioID, ok := obtenerUsuarioIDDesdeRequest(w, r)
	if !ok {
		return
	}

	perfil, err := h.svc.ObtenerPerfil(r.Context(), usuarioID)
	if err != nil {
		http.Error(w, "Error obteniendo perfil", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(perfil)
}

func (h *Handler) handleActualizarPerfil(w http.ResponseWriter, r *http.Request) {
	usuarioID, ok := obtenerUsuarioIDDesdeRequest(w, r)
	if !ok {
		return
	}

	var req ActualizarPerfilRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON invalido", http.StatusBadRequest)
		return
	}

	perfil, err := h.svc.ActualizarPerfil(r.Context(), usuarioID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(perfil)
}

func obtenerUsuarioIDDesdeRequest(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	userIDStr := ascMiddleware.GetUserID(r.Context())
	if userIDStr == "" {
		http.Error(w, "Usuario invalido", http.StatusUnauthorized)
		return uuid.Nil, false
	}

	usuarioID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Usuario invalido", http.StatusUnauthorized)
		return uuid.Nil, false
	}

	return usuarioID, true
}
