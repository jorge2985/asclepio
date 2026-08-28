// Command migrate aplica migraciones SQL pendientes contra DATABASE_URL.
//
// Es intencionalmente simple: guarda cada archivo aplicado en schema_migrations
// y ejecuta solo los que faltan. Para bases existentes sin historial previo,
// primero conviene validar el estado manualmente antes de usarlo.
package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"github.com/jackc/pgx/v5"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL es obligatorio")
		os.Exit(1)
	}

	migrationsDir := getEnv("MIGRATIONS_DIR", "database/migrations")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, databaseURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a la BD: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	if err := ensureSchemaMigrations(ctx, conn); err != nil {
		fmt.Fprintf(os.Stderr, "Error preparando schema_migrations: %v\n", err)
		os.Exit(1)
	}

	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error leyendo migraciones: %v\n", err)
		os.Exit(1)
	}
	sort.Strings(files)

	for _, file := range files {
		name := filepath.Base(file)
		applied, err := wasApplied(ctx, conn, name)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error verificando %s: %v\n", name, err)
			os.Exit(1)
		}
		if applied {
			fmt.Printf("skip %s\n", name)
			continue
		}

		if err := applyMigration(ctx, conn, name, file); err != nil {
			fmt.Fprintf(os.Stderr, "Error aplicando %s: %v\n", name, err)
			os.Exit(1)
		}
		fmt.Printf("ok %s\n", name)
	}
}

func ensureSchemaMigrations(ctx context.Context, conn *pgx.Conn) error {
	_, err := conn.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

func wasApplied(ctx context.Context, conn *pgx.Conn, name string) (bool, error) {
	var exists bool
	err := conn.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE name = $1)", name).Scan(&exists)
	return exists, err
}

func applyMigration(ctx context.Context, conn *pgx.Conn, name, file string) error {
	sqlBytes, err := os.ReadFile(file)
	if err != nil {
		return err
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (name) VALUES ($1)", name); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
