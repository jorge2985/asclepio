# Asclepio Mobile

Aplicacion movil de Asclepio construida con React Native, Expo Router, Zustand y Axios.

## Configuracion

```bash
npm install
cp .env.example .env
```

Configura `EXPO_PUBLIC_API_URL` segun el entorno:

- Web/iOS local: `http://localhost:8080/api`
- Android emulator: `http://10.0.2.2:8080/api`
- Dispositivo fisico: `http://<IP-LAN-DE-TU-PC>:8080/api`
- Staging/produccion: URL publica del backend

Tambien hay plantillas para `staging` y `production`:

- `.env.staging.example`
- `.env.production.example`

## Desarrollo

```bash
npx expo start
```

## Tests

```bash
npm test -- --runInBand
npm run lint
```
