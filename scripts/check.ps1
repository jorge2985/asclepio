# Verificacion local completa de Asclepio.
#
# Este script no necesita proveedores externos. Usa caches dentro del workspace
# para evitar errores de permisos y ejecuta las mismas comprobaciones basicas de CI.

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Backend = Join-Path $Root "backend"
$Mobile = Join-Path $Root "mobile"
$GoCache = Join-Path $Backend ".gocache"

Write-Host "== Backend: tests, vet y build =="
New-Item -ItemType Directory -Force $GoCache | Out-Null
Push-Location $Backend
try {
    $env:GOCACHE = (Resolve-Path $GoCache).Path
    go test ./...
    go vet ./...
    go build -buildvcs=false ./...
}
finally {
    Pop-Location
}

Write-Host "== Mobile: tests y lint =="
Push-Location $Mobile
try {
    npm test -- --runInBand
    npm run lint
}
finally {
    Pop-Location
}

Write-Host "== Secret scan basico =="
Push-Location $Root
try {
    rg -n "18zeta29|dev_secreto_seguro_asclepio_2026|postgres://postgres:18zeta29|192\.168\.0\.5" `
        -g "!node_modules" -g "!.git" -g "!project_status.md" `
        -g "!project_status_detailed.md" -g "!HOJA_DE_RUTA_USO_MASIVO.md" `
        -g "!scripts/check.ps1" -g "!.github/workflows/ci.yml" .
    if ($LASTEXITCODE -eq 0) {
        throw "Se encontraron secretos o IPs locales conocidas en archivos activos."
    }
    if ($LASTEXITCODE -gt 1) {
        throw "El escaneo de secretos fallo con codigo $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}

Write-Host "OK: verificaciones internas completadas."
