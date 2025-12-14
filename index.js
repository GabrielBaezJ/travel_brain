const port = process.env.PORT || 3004;
const express = require("express");
const path = require("path");
const app = express();
const mongoose = require("mongoose");

// Configure mongoose
mongoose.set('strictQuery', false);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// IMPORTANTE: Rutas API PRIMERO (más específicas)
const apiAuthRoutes = require("./routes/apiAuthRoutes");
const apiCurrencyRoutes = require("./routes/apiCurrencyRoutes");
const apiTripRoutes = require("./routes/apiTripRoutes");
const apiOtherRoutes = require("./routes/apiOtherRoutes");

app.use(apiAuthRoutes);
app.use(apiCurrencyRoutes);
app.use(apiTripRoutes);
app.use(apiOtherRoutes);

// Rutas originales de mongoose
const weatherRoutes = require("./routes/weatherRoutes");
const userRoutes = require("./routes/userRoutes");
const tripRoutes = require("./routes/tripRoutes");

app.use(weatherRoutes);
app.use(userRoutes);
app.use(tripRoutes);

// Rutas para servir HTML (al final)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'src/views/home/index.html')));
app.get('/destinations', (req, res) => res.sendFile(path.join(__dirname, 'src/views/destinations/destinations.html')));
app.get('/favorites', (req, res) => res.sendFile(path.join(__dirname, 'src/views/destinations/favorites.html')));
app.get('/trips', (req, res) => res.sendFile(path.join(__dirname, 'src/views/trips/trips-form.html')));
app.get('/budget', (req, res) => res.sendFile(path.join(__dirname, 'src/views/trips/budget.html')));
app.get('/routes', (req, res) => res.sendFile(path.join(__dirname, 'src/views/routes/route.html')));
app.get('/weather', (req, res) => res.sendFile(path.join(__dirname, 'src/views/weather/weather.html')));
app.get('/currency', (req, res) => res.sendFile(path.join(__dirname, 'src/views/currency/currency.html')));
app.get('/itinerary', (req, res) => res.sendFile(path.join(__dirname, 'src/views/itinerary/itinerary.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'src/views/admin/index.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(__dirname, 'src/views/admin/users.html')));
app.get('/auth/login', (req, res) => res.sendFile(path.join(__dirname, 'src/views/auth/login.html')));
app.get('/auth/register', (req, res) => res.sendFile(path.join(__dirname, 'src/views/auth/register.html')));

// Connect to MongoDB with proper options
mongoose.connect(process.env.MONGO_URI || `mongodb+srv://SrJCBM:bdd2025@cluster0.tjvfmrk.mongodb.net/travel_brain?retryWrites=true&w=majority`, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("✅ System connected to MongoDB Database");
    // Start server only after DB connection is established
    app.listen(port, '0.0.0.0', () => console.log(`🚀 TravelBrain Server running on port ${port}`));
})
.catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
});

const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB error:", error));
db.on("disconnected", () => console.log("MongoDB disconnected"));
