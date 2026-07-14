package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	apiURL := getEnv("AUTH_API_URL", "http://localhost:8080/api")
	email := os.Getenv("AUTH_EMAIL")
	password := os.Getenv("AUTH_PASSWORD")
	if email == "" || password == "" {
		fmt.Fprintln(os.Stderr, "Uso: define AUTH_EMAIL y AUTH_PASSWORD")
		os.Exit(1)
	}

	payload, err := json.Marshal(map[string]string{
		"email":    email,
		"password": password,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creando payload: %v\n", err)
		os.Exit(1)
	}

	req, err := http.NewRequest(http.MethodPost, apiURL+"/auth/login", bytes.NewBuffer(payload))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creando request: %v\n", err)
		os.Exit(1)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error haciendo request: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Status Code:", resp.Status)
	fmt.Println("Body:", string(body))
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
