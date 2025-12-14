# TravelBrain - Travel Itinerary Planner

**TravelBrain** es una aplicación web que genera itinerarios de viaje personalizados basados en clima, presupuesto y distancia. El sistema integra múltiples APIs para proporcionar datos en tiempo real para planificación de viajes.

## 🚀 Stack Tecnológico

- **Backend**: Node.js + Express.js
- **Base de datos**: MongoDB Atlas
- **Autenticación**: JWT (JSON Web Tokens)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **APIs externas**: 
  - Frankfurter (conversión de monedas)
  - OpenWeather (clima)
  - Mapbox (mapas y geocodificación)

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 8.0.0
- Cuenta de MongoDB Atlas
- API Keys (opcional para funcionalidades completas):
  - OpenWeather API Key
  - Mapbox Token

## 🔧 Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/SrJCBM/ESPE-AWD27819-ODII.git
cd ESPE-AWD27819-ODII
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto (o configura las variables de entorno):

```env
PORT=3004
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/
MONGO_DB=travel_brain
JWT_SECRET=tu-secreto-super-seguro-cambialo-en-produccion
OPENWEATHER_API_KEY=tu-api-key-de-openweather
MAPBOX_TOKEN=tu-token-de-mapbox
```

4. **Iniciar el servidor**
```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3004`

## 🌐 Despliegue en Render.com

### Configuración del Servicio

1. **Crear nuevo Web Service en Render**
   - Ve a [Render Dashboard](https://dashboard.render.com/)
   - Clic en "New" → "Web Service"
   - Conecta tu repositorio de GitHub

2. **Configuración del servicio**
   - **Name**: `travelbrain-app` (o el nombre que prefieras)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (o el plan que prefieras)

3. **Variables de Entorno en Render**

Ve a "Environment" y añade estas variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `PORT` | 8080 | Puerto del servidor (Render lo configura automáticamente) |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/` | URI de conexión a MongoDB Atlas |
| `MONGO_DB` | `travel_brain` | Nombre de la base de datos |
| `JWT_SECRET` | `tu-secreto-seguro-aleatorio` | Secreto para firmar tokens JWT |
| `OPENWEATHER_API_KEY` | `tu-api-key` | API Key de OpenWeather (opcional) |
| `MAPBOX_TOKEN` | `tu-token` | Token de Mapbox (opcional) |

4. **Configurar MongoDB Atlas**
   - Ve a MongoDB Atlas → Network Access
   - Añade la IP `0.0.0.0/0` (permitir desde cualquier IP) o las IPs específicas de Render
   - Asegúrate de tener un usuario de base de datos con los permisos necesarios

5. **Deploy**
   - Render desplegará automáticamente tu aplicación
   - Los deploys subsiguientes se harán automáticamente al hacer push a la rama `main`

### Troubleshooting en Render

Si encuentras errores:

1. **Error 404 en rutas API**: Asegúrate que el Start Command sea `npm start` (no `yarn start`)
2. **Error de conexión a MongoDB**: Verifica que la URI de MongoDB esté correcta y que MongoDB Atlas permita conexiones desde Render
3. **Variables de entorno**: Verifica que todas las variables estén configuradas en la sección Environment de Render

Revisa los logs en Render Dashboard → tu servicio → Logs

## 📚 Estructura del Proyecto

```
├── index.js                 # Punto de entrada del servidor Express
├── package.json            # Dependencias y scripts
├── routes/                 # Rutas de la API
│   ├── authRoutes.js       # Autenticación (login, register, logout)
│   ├── adminRoutes.js      # Rutas de administración
│   ├── currencyRoutes.js   # Conversión de monedas
│   ├── destinationRoutes.js # CRUD de destinos
│   ├── itineraryRoutes.js  # Gestión de itinerarios
│   ├── rateRoutes.js       # Calificaciones y favoritos
│   ├── routeFavoritesRoutes.js # Rutas favoritas
│   ├── tripRoutes.js       # Gestión de viajes
│   ├── userRoutes.js       # Gestión de usuarios
│   └── weatherRoutes.js    # Información meteorológica
├── models/                 # Modelos de Mongoose (legado)
│   ├── trips.js
│   ├── users.js
│   └── weather.js
├── public/                 # Archivos estáticos (frontend)
│   ├── assets/
│   │   ├── css/           # Estilos
│   │   ├── js/            # Scripts del frontend
│   │   └── img/           # Imágenes
│   └── config.js
└── src/
    └── views/             # Vistas HTML
        ├── home/
        ├── auth/
        ├── destinations/
        ├── trips/
        ├── itinerary/
        ├── routes/
        ├── weather/
        ├── currency/
        └── admin/
```

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación:

1. **Registro**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login` → devuelve un token
3. **Uso del token**: Incluir en el header `Authorization: Bearer <token>`
4. **Verificar sesión**: `GET /api/auth/me`
5. **Logout**: `POST /api/auth/logout`

## 📝 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Información del usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Destinos
- `GET /api/destinations/:page/:size/:search?` - Listar destinos
- `GET /api/destinations/:id` - Obtener un destino
- `POST /api/destinations` - Crear destino
- `PUT /api/destinations/:id` - Actualizar destino
- `DELETE /api/destinations/:id` - Eliminar destino

### Itinerarios
- `POST /api/trips/:tripId/itinerary` - Crear/actualizar itinerario
- `GET /api/trips/:tripId/itinerary` - Obtener itinerario de un viaje
- `GET /api/users/me/itineraries/:page/:size` - Mis itinerarios

### Monedas
- `GET /api/currency/rates/:base` - Obtener tasas de cambio
- `POST /api/currency/convert` - Convertir moneda

### Admin
- `GET /api/admin/metrics` - Métricas del sistema
- `GET /api/admin/users/:page/:size` - Listar usuarios
- `PATCH /api/admin/users/:userId/role` - Cambiar rol
- `PATCH /api/admin/users/:userId/status` - Cambiar estado

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC License

## 👥 Autores

- ESPE - Universidad de las Fuerzas Armadas
- Desarrollo Web Avanzado - AWD27819-ODII
