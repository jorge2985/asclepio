// Command fix-password actualiza hashes de password para usuarios especificos.
// Pensado solo para desarrollo/mantenimiento local, no para flujos de producto.
package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// AUTH_EMAILS permite corregir varios usuarios con una sola ejecucion.
	connStr := os.Getenv("DATABASE_URL")
	password := os.Getenv("AUTH_PASSWORD")
	emailList := os.Getenv("AUTH_EMAILS")
	if connStr == "" || password == "" || emailList == "" {
		fmt.Fprintln(os.Stderr, "Uso: define DATABASE_URL, AUTH_EMAILS y AUTH_PASSWORD")
		os.Exit(1)
	}

	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a la BD: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	for _, email := range strings.Split(emailList, ",") {
		email = strings.TrimSpace(email)
		if email == "" {
			continue
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error generando hash para %s: %v\n", email, err)
			continue
		}

		_, err = conn.Exec(context.Background(), "UPDATE usuarios SET password_hash=$1 WHERE email=$2", string(hash), email)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error actualizando %s: %v\n", email, err)
			continue
		}

		var storedHash string
		err = conn.QueryRow(context.Background(), "SELECT password_hash FROM usuarios WHERE email=$1", email).Scan(&storedHash)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error verificando %s: %v\n", email, err)
			continue
		}

		err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
		if err != nil {
			fmt.Printf("%s: verificacion fallida\n", email)
		} else {
			fmt.Printf("%s: contrasena actualizada y verificada\n", email)
		}
	}
}
