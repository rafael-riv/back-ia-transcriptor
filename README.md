# Back-end IA Transcriptor

Este es el servidor backend para el proyecto de transcripción de audio en tiempo real utilizando Speechmatics.

## Requisitos Previos

- Node.js (v16 o superior)
- MongoDB instalado y corriendo localmente
- Una cuenta en Speechmatics con API Key

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd back-ia-dictator
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto usando `.env.example` como plantilla:
```bash
PORT=3000
JWT_SECRET=tu-clave-secreta
MONGO_URI=mongodb://localhost:27017/nombre-de-tu-bd
API_KEY=tu-api-key-de-speechmatics
```

## Desarrollo

Para iniciar el servidor en modo desarrollo:
```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000` (o el puerto que hayas configurado).

## Tests

Para ejecutar los tests:
```bash
npm test
```

## Estructura del Proyecto

- `src/`
  - `config/` - Configuraciones de la base de datos
  - `controllers/` - Controladores de la aplicación
  - `middlewares/` - Middlewares personalizados
  - `models/` - Modelos de MongoDB
  - `routes/` - Rutas de la API
  - `services/` - Servicios de terceros (Speechmatics)
  - `utils/` - Utilidades y helpers

## API Endpoints

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login de usuario

### Transcripciones
- `POST /transcribe` - Iniciar una nueva transcripción
- `GET /history` - Obtener historial de transcripciones

## Docker (Opcional)

El proyecto incluye un `docker-compose.yml` para facilitar el despliegue. Para utilizarlo:

```bash
docker-compose up
```

## Tecnologías Principales

- Express.js
- TypeScript
- MongoDB con Mongoose
- Socket.IO
- Jest para testing
- Speechmatics API
