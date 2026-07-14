// Package middleware contiene piezas reutilizables del pipeline HTTP.
//
// AuthMiddleware transforma un JWT valido en datos de usuario dentro del
// contexto del request, para que los handlers no tengan que parsear tokens.
package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	ContextKeyUserID  contextKey = "user_id"
	ContextKeyUserRol contextKey = "user_rol"
)

func writeJSONError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(`{"error":"` + message + `"}`))
}

// AuthMiddleware verifica el JWT en Authorization: Bearer <token>.
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeJSONError(w, "token requerido", http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				writeJSONError(w, "formato de token invalido", http.StatusUnauthorized)
				return
			}

			token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				writeJSONError(w, "token invalido o expirado", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				writeJSONError(w, "claims invalidos", http.StatusUnauthorized)
				return
			}

			userID, _ := claims["sub"].(string)
			userRol, _ := claims["rol"].(string)
			if userID == "" || userRol == "" {
				writeJSONError(w, "token sin usuario o rol", http.StatusUnauthorized)
				return
			}

			// Guardar user_id/rol en context evita confiar en datos enviados por el cliente.
			ctx := context.WithValue(r.Context(), ContextKeyUserID, userID)
			ctx = context.WithValue(ctx, ContextKeyUserRol, userRol)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole permite entrar solo a usuarios con alguno de los roles indicados.
// Debe ejecutarse despues de AuthMiddleware, porque lee el rol desde context.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, rol := range roles {
		allowed[rol] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRol := GetUserRol(r.Context())
			if userRol == "" {
				writeJSONError(w, "rol requerido", http.StatusUnauthorized)
				return
			}
			if !allowed[userRol] {
				writeJSONError(w, "no tienes permisos para esta accion", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// GetUserID obtiene el ID del usuario autenticado desde el context.
func GetUserID(ctx context.Context) string {
	if id, ok := ctx.Value(ContextKeyUserID).(string); ok {
		return id
	}
	return ""
}

// GetUserRol obtiene el rol del usuario autenticado desde el context.
func GetUserRol(ctx context.Context) string {
	if rol, ok := ctx.Value(ContextKeyUserRol).(string); ok {
		return rol
	}
	return ""
}
