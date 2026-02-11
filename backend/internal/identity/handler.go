package identity

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	svc *Servicio
}

func NuevoHandler(svc *Servicio) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegistrarRutas(r chi.Router) {
	r.Post("/registro", h.handleRegistro)
	r.Post("/login", h.handleLogin)
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

	json.NewEncoder(w).Encode(resp)
}
