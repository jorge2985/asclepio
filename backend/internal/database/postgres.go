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

func NuevoServicioBD(cadenaConexion string) (*ServicioBD, error) {
	config, err := pgxpool.ParseConfig(cadenaConexion)
	if err != nil {
		return nil, fmt.Errorf("error al parsear configuración de BD: %w", err)
	}

	// Configurar pool
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
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("no se pudo hacer ping a la BD: %w", err)
	}

	return &ServicioBD{Pool: pool}, nil
}

func (s *ServicioBD) Cerrar() {
	if s.Pool != nil {
		s.Pool.Close()
	}
}
