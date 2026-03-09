package middleware

import (
	"net/http"
	"sync"
	"time"
)

type visitante struct {
	intentos   int
	primeraVez time.Time
}

// RateLimiter limita los intentos por IP en una ventana de tiempo
type RateLimiter struct {
	mu          sync.Mutex
	visitantes  map[string]*visitante
	maxIntentos int
	ventana     time.Duration
}

// NuevoRateLimiter crea un rate limiter (ej: 5 intentos cada 15 minutos)
func NuevoRateLimiter(maxIntentos int, ventana time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitantes:  make(map[string]*visitante),
		maxIntentos: maxIntentos,
		ventana:     ventana,
	}

	// Limpiar visitantes expirados cada minuto
	go func() {
		for {
			time.Sleep(time.Minute)
			rl.limpiar()
		}
	}()

	return rl
}

func (rl *RateLimiter) limpiar() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	for ip, v := range rl.visitantes {
		if time.Since(v.primeraVez) > rl.ventana {
			delete(rl.visitantes, ip)
		}
	}
}

func (rl *RateLimiter) permitir(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, existe := rl.visitantes[ip]
	if !existe {
		rl.visitantes[ip] = &visitante{intentos: 1, primeraVez: time.Now()}
		return true
	}

	// Si la ventana expiró, reiniciar
	if time.Since(v.primeraVez) > rl.ventana {
		v.intentos = 1
		v.primeraVez = time.Now()
		return true
	}

	if v.intentos >= rl.maxIntentos {
		return false
	}

	v.intentos++
	return true
}

// Middleware retorna un middleware HTTP que aplica rate limiting
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := obtenerIP(r)
		if !rl.permitir(ip) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "900") // 15 min
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"demasiados intentos, espere 15 minutos"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func obtenerIP(r *http.Request) string {
	// Verificar headers de proxy
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded
	}
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}
	return r.RemoteAddr
}
