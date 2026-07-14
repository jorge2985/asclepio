// Command generate-hash imprime un hash bcrypt para una password local.
// Sirve para preparar datos de prueba sin escribir hashes a mano.
package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := os.Getenv("AUTH_PASSWORD")
	if password == "" {
		fmt.Fprintln(os.Stderr, "Uso: define AUTH_PASSWORD")
		os.Exit(1)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error generando hash: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(string(hash))
}
