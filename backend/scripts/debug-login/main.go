package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	connStr := os.Getenv("DATABASE_URL")
	email := os.Getenv("AUTH_EMAIL")
	password := os.Getenv("AUTH_PASSWORD")
	if connStr == "" || email == "" || password == "" {
		fmt.Fprintln(os.Stderr, "Uso: define DATABASE_URL, AUTH_EMAIL y AUTH_PASSWORD")
		os.Exit(1)
	}

	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a la BD: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	var storedHash string
	err = conn.QueryRow(context.Background(), "SELECT password_hash FROM usuarios WHERE email=$1", email).Scan(&storedHash)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error buscando usuario: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Email: %s\n", email)
	fmt.Printf("Hash en BD: %s\n", storedHash)

	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	if err != nil {
		fmt.Printf("Comparacion fallida: %v\n", err)
	} else {
		fmt.Println("Comparacion exitosa: la contrasena coincide con el hash.")
	}
}
