// Package database encapsula la conexion a PostgreSQL.
//
// El resto del backend recibe un ServicioBD y usa su pool compartido, evitando
// abrir conexiones sueltas en cada handler.
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ServicioBD struct {
	Pool *pgxpool.Pool
}

// NuevoServicioBD crea un pool de conexiones, valida que la BD responda y deja
// la configuracion de concurrencia en un solo lugar.
func NuevoServicioBD(cadenaConexion string) (*ServicioBD, error) {
	config, err := pgxpool.ParseConfig(cadenaConexion)
	if err != nil {
		return nil, fmt.Errorf("error al parsear configuración de BD: %w", err)
	}

	// Configurar pool
	// El pool evita abrir/cerrar conexiones por request y protege a PostgreSQL.
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = 1 * time.Hour

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("error al conectar a la BD: %w", err)
	}

	// Verificar conexión
	// Fallar al inicio es mejor que descubrir una BD rota con usuarios reales.
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("no se pudo hacer ping a la BD: %w", err)
	}

	return &ServicioBD{Pool: pool}, nil
}

// Cerrar libera el pool al apagar la API.
func (s *ServicioBD) Cerrar() {
	if s.Pool != nil {
		s.Pool.Close()
	}
}
