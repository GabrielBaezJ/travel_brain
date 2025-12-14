const port = process.env.PORT || 3004;
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB URI desde variable de entorno
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://SrJCBM:bdd2025@cluster0.tjvfmrk.mongodb.net/';
const MONGO_DB = process.env.MONGO_DB || 'travel_brain';

// Configure mongoose
mongoose.set('strictQuery', false);

// IMPORTANTE: Conectar MONGOOSE primero (para weather, trips, users routes)
mongoose.connect(`${MONGO_URI}${MONGO_DB}?retryWrites=true&w=majority`, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("✅ Mongoose connected to MongoDB Database");
})
.catch((error) => {
    console.error("❌ Mongoose connection error:", error);
});

const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB error:", error));
db.on("disconnected", () => console.log("MongoDB disconnected"));

// Connect to MongoDB with native driver (para nuevas rutas)
MongoClient.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
.then((client) => {
    console.log("✅ Native MongoDB driver connected");
    
    const nativeDb = client.db(MONGO_DB);
    app.locals.db = nativeDb;

    // Importar rutas con autenticación
    const { router: authRouter, authenticateToken, requireAdmin } = require("./routes/authRoutes");
    const currencyRoutes = require("./routes/currencyRoutes");
    const destinationRoutes = require("./routes/destinationRoutes");
    const itineraryRoutes = require("./routes/itineraryRoutes");
    const rateRoutes = require("./routes/rateRoutes");
    const routeFavoritesRoutes = require("./routes/routeFavoritesRoutes");
    const adminRoutes = require("./routes/adminRoutes");
    
    // Rutas existentes con Mongoose (weather, users, trips)
    const weatherRoutes = require("./routes/weatherRoutes");
    const userRoutes = require("./routes/userRoutes");
    const tripRoutes = require("./routes/tripRoutes");

    // Registrar TODAS las rutas sin autenticación global
    // La autenticación se maneja individualmente en cada ruta que la necesite
    app.use(authRouter);
    app.use(currencyRoutes);
    app.use(destinationRoutes);
    app.use(itineraryRoutes);
    app.use(rateRoutes);
    app.use(routeFavoritesRoutes);
    app.use(adminRoutes);
    app.use(weatherRoutes);
    app.use(userRoutes);
    app.use(tripRoutes);

    // Rutas para servir vistas HTML
    
    // Rutas públicas
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/home/index.html'));
    });

    app.get('/auth/login', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/auth/login.html'));
    });

    app.get('/auth/register', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/auth/register.html'));
    });

    // Rutas permitidas para guests
    app.get('/routes', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/routes/route.html'));
    });

    app.get('/weather', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/weather/weather.html'));
    });

    app.get('/currency', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/currency/currency.html'));
    });

    // Rutas protegidas (requieren autenticación - se valida en frontend)
    app.get('/destinations', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/destinations/destinations.html'));
    });

    app.get('/favorites', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/destinations/favorites.html'));
    });

    app.get('/trips', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/trips/trips-form.html'));
    });

    app.get('/budget', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/trips/budget.html'));
    });

    app.get('/itinerary', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/itinerary/itinerary.html'));
    });

    // Rutas admin
    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/admin/index.html'));
    });

    app.get('/admin/users', (req, res) => {
        res.sendFile(path.join(__dirname, 'src/views/admin/users.html'));
    });

    // Manejo de errores 404
    app.use((req, res) => {
        res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
    });

    // Start server only after DB connection is established
    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 TravelBrain Server is running on port ${port}`);
    });
})
.catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
});