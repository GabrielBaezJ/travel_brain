# 🧪 Tests de API - Travel Brain

## 📋 Resumen de Endpoints

### Endpoints para USUARIOS NORMALES
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Registro |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/destinations/{page}/{size}` | Mis destinos |
| GET | `/api/destinations/{id}` | Ver destino |
| POST | `/api/destinations` | Crear destino |
| PUT | `/api/destinations/{id}` | Actualizar destino |
| DELETE | `/api/destinations/{id}` | Eliminar destino |
| GET | `/api/trips/{page}/{size}` | Mis viajes |
| GET | `/api/trips/{id}` | Ver viaje |
| POST | `/api/trips` | Crear viaje |
| PUT | `/api/trips/{id}` | Actualizar viaje |
| DELETE | `/api/trips/{id}` | Eliminar viaje |
| GET | `/api/routes/favorites/{page}/{size}` | Mis rutas favoritas |
| POST | `/api/routes/favorites` | Guardar ruta |
| DELETE | `/api/routes/favorites/{id}` | Eliminar ruta |
| GET | `/api/weather/current/{lat}/{lon}/{log}` | Clima actual |
| GET | `/api/weather/history/{page}/{size}` | Historial clima |

### Endpoints SOLO ADMIN
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/users/{page}/{size}` | Todos los usuarios |
| GET | `/api/admin/destinations/{page}/{size}` | Todos los destinos |
| GET | `/api/admin/trips/{page}/{size}` | Todos los viajes |
| GET | `/api/admin/itineraries/{page}/{size}` | Todos los itinerarios |
| GET | `/api/admin/routes/{page}/{size}` | Todas las rutas |
| GET | `/api/admin/expenses/{page}/{size}` | Todos los gastos |
| GET | `/api/admin/weather/{page}/{size}` | Todas las búsquedas clima |

---

## 🔐 1. AUTENTICACIÓN

### Test 1.1: Registro de usuario
```
POST {{base_url}}/api/auth/register
Content-Type: application/json

{
  "name": "Usuario Test",
  "email": "test@example.com",
  "password": "Test123456"
}
```
**Respuesta esperada (201):**
```json
{
  "ok": true,
  "message": "Usuario registrado correctamente"
}
```

### Test 1.2: Login usuario normal
```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123456"
}
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "user": {
    "_id": "...",
    "name": "Usuario Test",
    "email": "test@example.com",
    "role": "user",
    "createdAt": "2024-12-07 10:30:00"
  }
}
```
⚠️ **IMPORTANTE:** Postman guardará la cookie de sesión automáticamente.

### Test 1.3: Obtener usuario actual
```
GET {{base_url}}/api/auth/me
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "user": {
    "_id": "...",
    "name": "Usuario Test",
    "email": "test@example.com",
    "role": "user",
    "createdAt": "2024-12-07 10:30:00"
  }
}
```

### Test 1.4: Logout
```
POST {{base_url}}/api/auth/logout
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "message": "Sesión cerrada"
}
```

---

## 🌍 2. DESTINOS (Usuario Normal)

### Test 2.1: Crear destino
```
POST {{base_url}}/api/destinations
Content-Type: application/json

{
  "name": "Quito Centro Histórico",
  "country": "Ecuador",
  "description": "Capital de Ecuador con hermoso centro histórico",
  "lat": -0.2201641,
  "lng": -78.5123274
}
```
**Respuesta esperada (201):**
```json
{
  "ok": true,
  "id": "675a1234567890abcdef1234"
}
```
📝 **Guardar el `id` para los siguientes tests.**

### Test 2.2: Listar MIS destinos (paginado)
```
GET {{base_url}}/api/destinations/1/10
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "items": [
    {
      "_id": "...",
      "name": "Quito Centro Histórico",
      "country": "Ecuador",
      "userId": "...",
      "createdAt": "2024-12-07 10:30:00",
      "updatedAt": "2024-12-07 10:30:00"
    }
  ],
  "page": 1,
  "size": 10
}
```
⚠️ **Nota:** Solo muestra destinos del usuario autenticado.

### Test 2.3: Listar destinos con búsqueda
```
GET {{base_url}}/api/destinations/1/10/Quito
```
**Respuesta esperada (200):** Destinos que contengan "Quito" en nombre o país.

### Test 2.4: Ver un destino específico
```
GET {{base_url}}/api/destinations/{{destination_id}}
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "destination": {
    "_id": "...",
    "name": "Quito Centro Histórico",
    "country": "Ecuador",
    ...
  }
}
```

### Test 2.5: Actualizar destino
```
PUT {{base_url}}/api/destinations/{{destination_id}}
Content-Type: application/json

{
  "name": "Quito - Centro Histórico UNESCO",
  "description": "Patrimonio de la Humanidad"
}
```
**Respuesta esperada (200):**
```json
{
  "ok": true
}
```

### Test 2.6: Eliminar destino
```
DELETE {{base_url}}/api/destinations/{{destination_id}}
```
**Respuesta esperada (200):**
```json
{
  "ok": true
}
```

---

## ✈️ 3. VIAJES (Usuario Normal)

### Test 3.1: Crear viaje
```
POST {{base_url}}/api/trips
Content-Type: application/json

{
  "title": "Vacaciones en Galápagos",
  "destination": "Islas Galápagos, Ecuador",
  "startDate": "2025-01-15",
  "endDate": "2025-01-22",
  "budget": 2500,
  "notes": "Llevar protector solar y cámara"
}
```
**Respuesta esperada (201):**
```json
{
  "ok": true,
  "id": "675a1234567890abcdef5678"
}
```
📝 **Guardar el `id` para los siguientes tests.**

### Test 3.2: Listar MIS viajes (paginado)
```
GET {{base_url}}/api/trips/1/10
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "items": [
    {
      "_id": "...",
      "title": "Vacaciones en Galápagos",
      "destination": "Islas Galápagos, Ecuador",
      "startDate": "2025-01-15 00:00:00",
      "endDate": "2025-01-22 00:00:00",
      "budget": 2500,
      "userId": "...",
      "createdAt": "2024-12-07 10:30:00"
    }
  ],
  "page": 1,
  "size": 10,
  "total": 1
}
```

### Test 3.3: Ver un viaje específico
```
GET {{base_url}}/api/trips/{{trip_id}}
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "trip": { ... }
}
```

### Test 3.4: Actualizar viaje
```
PUT {{base_url}}/api/trips/{{trip_id}}
Content-Type: application/json

{
  "title": "Aventura en Galápagos 2025",
  "budget": 3000
}
```

### Test 3.5: Eliminar viaje
```
DELETE {{base_url}}/api/trips/{{trip_id}}
```

---

## 🗺️ 4. RUTAS FAVORITAS (Usuario Normal)

### Test 4.1: Guardar ruta favorita
```
POST {{base_url}}/api/routes/favorites
Content-Type: application/json

{
  "origin": {
    "label": "Quito, Ecuador",
    "lat": -0.1807,
    "lng": -78.4678
  },
  "destination": {
    "label": "Guayaquil, Ecuador",
    "lat": -2.1894,
    "lng": -79.8891
  },
  "distance": 420.5,
  "duration": 28800,
  "mode": "driving"
}
```
**Respuesta esperada (201):**
```json
{
  "ok": true,
  "id": "675a1234567890abcdef9012"
}
```

### Test 4.2: Listar MIS rutas favoritas
```
GET {{base_url}}/api/routes/favorites/1/10
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "items": [
    {
      "_id": "...",
      "origin": { "label": "Quito, Ecuador", ... },
      "destination": { "label": "Guayaquil, Ecuador", ... },
      "distance": 420.5,
      "createdAt": "2024-12-07 10:30:00"
    }
  ],
  "page": 1,
  "size": 10,
  "total": 1
}
```

### Test 4.3: Eliminar ruta favorita
```
DELETE {{base_url}}/api/routes/favorites/{{route_id}}
```

---

## 🌤️ 5. CLIMA (Usuario Normal)

### Test 5.1: Consultar clima actual (sin log)
```
GET {{base_url}}/api/weather/current/-0.1807/-78.4678/0
```
**Respuesta esperada (200):**
```json
{
  "location": "Quito",
  "temp": 18,
  "condition": "Parcialmente nublado",
  "humidity": 65,
  "windSpeed": 12.5,
  ...
}
```

### Test 5.2: Consultar clima y guardar en historial
```
GET {{base_url}}/api/weather/current/-0.1807/-78.4678/1
```
El parámetro `1` al final indica que se debe guardar en el historial.

### Test 5.3: Ver MI historial de búsquedas
```
GET {{base_url}}/api/weather/history/1/10
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "items": [
    {
      "_id": "...",
      "label": "Quito, Ecuador",
      "temp": 18,
      "condition": "Parcialmente nublado",
      "createdAt": "2024-12-07 10:30:00"
    }
  ],
  "page": 1,
  "size": 10,
  "total": 1
}
```

---

## 👑 6. ADMIN (Solo rol admin)

### Test 6.1: Login como admin
```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@travelbrain.com",
  "password": "Admin123"
}
```

### Test 6.2: Listar TODOS los usuarios
```
GET {{base_url}}/api/admin/users/1/20
```
**Respuesta esperada (200):**
```json
{
  "ok": true,
  "items": [...todos los usuarios...],
  "page": 1,
  "size": 20,
  "total": 50
}
```

### Test 6.3: Ver usuario específico
```
GET {{base_url}}/api/admin/users/{{user_id}}
```

### Test 6.4: Actualizar usuario (cambiar rol)
```
PUT {{base_url}}/api/admin/users/{{user_id}}
Content-Type: application/json

{
  "role": "admin"
}
```

### Test 6.5: Desactivar usuario
```
DELETE {{base_url}}/api/admin/users/{{user_id}}
```
**Nota:** Es soft-delete, cambia status a "deactivated".

### Test 6.6-6.11: Listar todas las colecciones
```
GET {{base_url}}/api/admin/destinations/1/20
GET {{base_url}}/api/admin/trips/1/20
GET {{base_url}}/api/admin/itineraries/1/20
GET {{base_url}}/api/admin/routes/1/20
GET {{base_url}}/api/admin/expenses/1/20
GET {{base_url}}/api/admin/weather/1/20
```

---

## ❌ 7. TESTS DE ERROR

### Test 7.1: Acceso sin autenticación
```
GET {{base_url}}/api/trips/1/10
```
**Sin cookie de sesión**
**Respuesta esperada (401):**
```json
{
  "ok": false,
  "error": "No autenticado"
}
```

### Test 7.2: Usuario normal accede a admin
```
GET {{base_url}}/api/admin/users/1/10
```
**Con sesión de usuario normal**
**Respuesta esperada (403):**
```json
{
  "ok": false,
  "error": "No autorizado"
}
```

### Test 7.3: ID inválido
```
GET {{base_url}}/api/destinations/invalid-id
```
**Respuesta esperada (400 o 404):**
```json
{
  "ok": false,
  "error": "ID inválido"
}
```

### Test 7.4: Recurso no encontrado
```
GET {{base_url}}/api/trips/000000000000000000000000
```
**Respuesta esperada (404):**
```json
{
  "ok": false,
  "error": "Viaje no encontrado"
}
```

---

## 🔧 Variables de Entorno Postman

```json
{
  "base_url": "http://localhost:8080",
  "destination_id": "",
  "trip_id": "",
  "route_id": "",
  "user_id": ""
}
```

---

## 📊 Flujo de Test Recomendado

1. **Setup:**
   - Registrar usuario test
   - Login usuario test
   
2. **CRUD Destinos:**
   - Crear destino → guardar ID
   - Listar destinos (verificar que aparece)
   - Ver destino por ID
   - Actualizar destino
   - Eliminar destino
   
3. **CRUD Viajes:**
   - Crear viaje → guardar ID
   - Listar viajes
   - Ver viaje
   - Actualizar viaje
   - Eliminar viaje
   
4. **Rutas Favoritas:**
   - Guardar ruta → guardar ID
   - Listar rutas
   - Eliminar ruta
   
5. **Clima:**
   - Consultar clima sin log
   - Consultar clima con log
   - Ver historial
   
6. **Admin (cambiar sesión):**
   - Login admin
   - Probar todos los endpoints admin
   
7. **Tests de Error:**
   - Probar sin sesión
   - Probar usuario normal en admin
   - Probar IDs inválidos

---

## ✅ Checklist de Tests

- [ ] Auth: Register
- [ ] Auth: Login
- [ ] Auth: Me
- [ ] Auth: Logout
- [ ] Destinations: Create
- [ ] Destinations: List
- [ ] Destinations: Show
- [ ] Destinations: Update
- [ ] Destinations: Delete
- [ ] Trips: Create
- [ ] Trips: List
- [ ] Trips: Show
- [ ] Trips: Update
- [ ] Trips: Delete
- [ ] Routes: Create
- [ ] Routes: List
- [ ] Routes: Delete
- [ ] Weather: Current
- [ ] Weather: History
- [ ] Admin: Users (list, show, update, delete)
- [ ] Admin: Destinations
- [ ] Admin: Trips
- [ ] Admin: Itineraries
- [ ] Admin: Routes
- [ ] Admin: Expenses
- [ ] Admin: Weather
- [ ] Error: 401 sin auth
- [ ] Error: 403 usuario en admin
- [ ] Error: 404 no encontrado
