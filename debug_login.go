package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Conexión a la BD
	connStr := "postgres://postgres:18zeta29@localhost:5433/asclepio?sslmode=disable"
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a la BD: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	email := "juan@test.com"
	password := "123456"

	var storedHash string
	err = conn.QueryRow(context.Background(), "SELECT password_hash FROM usuarios WHERE email=$1", email).Scan(&storedHash)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error buscando usuario: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Email: %s\n", email)
	fmt.Printf("Hash en BD: %s\n", storedHash)

	// Probar comparación
	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	if err != nil {
		fmt.Printf("❌ Comparación fallida: %v\n", err)
	} else {
		fmt.Println("✅ Comparación EXITOSA: La contraseña coincide con el hash.")
	}
}
