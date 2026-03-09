package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "123456"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	fmt.Printf("UPDATE usuarios SET password_hash = '%s' WHERE email = 'juan@test.com';\n", hash)
}
