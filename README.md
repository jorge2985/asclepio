# Asclepio - Sistema de Gestión Médica

Sistema completo de gestión médica con backend en Go y frontend móvil en React Native + Expo.

## 🏗️ Arquitectura

### Backend (Go)
- **Clean Architecture** con separación por dominios
- **Repository Pattern** para acceso a datos
- **JWT** para autenticación
- **PostgreSQL** como base de datos
- **Validadores** centralizados

### Frontend (React Native + Expo)
- **Hooks personalizados** para lógica reutilizable
- **Validaciones** centralizadas
- **Manejo de errores** consistente
- **Zustand** para estado global
- **Expo Router** para navegación

## 📁 Estructura del Proyecto

```
asclepio/
├── backend/                 # Backend en Go
│   ├── cmd/api/            # Punto de entrada
│   ├── internal/           # Lógica de negocio
│   │   ├── identity/       # Autenticación
│   │   ├── doctor/         # Gestión de doctores
│   │   ├── appointment/    # Gestión de citas
│   │   └── database/       # Configuración DB
│   └── database/
│       └── migrations/     # Migraciones SQL
│
├── mobile/                  # Frontend móvil
│   ├── app/                # Rutas y pantallas
│   ├── components/         # Componentes reutilizables
│   ├── hooks/              # Hooks personalizados
│   ├── services/           # API y servicios
│   ├── stores/             # Estado global
│   ├── styles/             # Temas y estilos
│   └── utils/              # Utilidades
│
└── design_reference/        # Diseños de referencia
```

## 🚀 Instalación y Ejecución

### Requisitos Previos

- **Go** 1.21+
- **Node.js** 18+
- **PostgreSQL** 14+
- **Expo CLI**

### Backend

1. Configurar base de datos PostgreSQL:
```bash
createdb asclepio
```

2. Ejecutar migraciones:
```bash
cd backend/database/migrations
psql -U postgres -d asclepio -f 001_schema_inicial.sql
psql -U postgres -d asclepio -f 002_datos_adicionales.sql
psql -U postgres -d asclepio -f 003_datos_prueba.sql
```

3. Iniciar servidor:
```bash
cd backend
go run cmd/api/main.go
```

El servidor estará disponible en `http://localhost:8080`

### Frontend Móvil

1. Instalar dependencias:
```bash
cd mobile
npm install
```

2. Iniciar Expo:
```bash
npx expo start
```

3. Opciones:
   - Presiona `a` para abrir en Android
   - Presiona `i` para abrir en iOS
   - Escanea el QR con Expo Go en tu dispositivo

## 📱 Credenciales de Prueba

- **Email:** `juan@test.com`
- **Contraseña:** `123456`

## 🎯 Funcionalidades

### Pacientes
- ✅ Registro e inicio de sesión
- ✅ Búsqueda de doctores por especialidad
- ✅ Ver detalles de doctores
- ✅ Historial de citas
- ✅ Perfil de usuario

### Médicos
- ✅ Perfil profesional
- ✅ Gestión de disponibilidad
- ✅ Historial de pacientes

## 🏛️ Arquitectura Refactorizada

### Mejoras Implementadas

#### Frontend
- **Hooks personalizados** (`useAuth.js`) - Abstrae lógica de autenticación
- **Validaciones centralizadas** (`validation.js`) - Reutilizable y testeable
- **Error handler** (`errorHandler.js`) - Manejo consistente de errores
- **Componentes limpios** - Enfocados solo en UI

#### Backend
- **Repository Pattern** - Separa acceso a datos de lógica de negocio
- **Validadores** - Validación de entrada centralizada
- **Clean Architecture** - Código mantenible y testeable

### Calidad del Código

- **Separación de responsabilidades:** 9/10
- **Testabilidad:** 9/10
- **Mantenibilidad:** 9/10
- **Adherencia a SOLID:** 8/10

## 📚 Documentación

- [Auditoría de Arquitectura](docs/auditoria_arquitectura.md)
- [Guía de Android](docs/guia_android.md)
- [Resumen de Refactorización](docs/resumen_refactorizacion.md)

## 🛠️ Tecnologías

### Backend
- Go 1.21
- PostgreSQL 14
- JWT
- bcrypt
- pgx/v5

### Frontend
- React Native 0.81
- Expo 54
- Expo Router 6
- Zustand 5
- Axios

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

Jorge - [GitHub](https://github.com/jorge2985)
