package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	connStr := "postgres://postgres:18zeta29@localhost:5433/asclepio?sslmode=disable"
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a la BD: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	password := "123456"
	emails := []string{"ana@doctor.com", "marcus@doctor.com"}

	for _, email := range emails {
		hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		_, err = conn.Exec(context.Background(), "UPDATE usuarios SET password_hash=$1 WHERE email=$2", string(hash), email)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error actualizando %s: %v\n", email, err)
			continue
		}

		// Verificar
		var storedHash string
		conn.QueryRow(context.Background(), "SELECT password_hash FROM usuarios WHERE email=$1", email).Scan(&storedHash)
		err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
		if err != nil {
			fmt.Printf("❌ %s: verificación fallida\n", email)
		} else {
			fmt.Printf("✅ %s: contraseña corregida y verificada\n", email)
		}
	}
}
