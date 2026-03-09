package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Claves para el contexto
type contextKey string

const (
	ContextKeyUserID  contextKey = "user_id"
	ContextKeyUserRol contextKey = "user_rol"
)

// AuthMiddleware verifica el JWT en el header Authorization
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"token requerido"}`, http.StatusUnauthorized)
				return
			}

			// Extraer token del header "Bearer <token>"
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, `{"error":"formato de token inválido"}`, http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]

			// Parsear y validar JWT
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, `{"error":"token inválido o expirado"}`, http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, `{"error":"claims inválidos"}`, http.StatusUnauthorized)
				return
			}

			userID, _ := claims["sub"].(string)
			userRol, _ := claims["rol"].(string)

			if userID == "" {
				http.Error(w, `{"error":"token sin usuario"}`, http.StatusUnauthorized)
				return
			}

			// Agregar datos al contexto
			ctx := context.WithValue(r.Context(), ContextKeyUserID, userID)
			ctx = context.WithValue(ctx, ContextKeyUserRol, userRol)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID obtiene el ID del usuario desde el contexto
func GetUserID(ctx context.Context) string {
	if id, ok := ctx.Value(ContextKeyUserID).(string); ok {
		return id
	}
	return ""
}

// GetUserRol obtiene el rol del usuario desde el contexto
func GetUserRol(ctx context.Context) string {
	if rol, ok := ctx.Value(ContextKeyUserRol).(string); ok {
		return rol
	}
	return ""
}
