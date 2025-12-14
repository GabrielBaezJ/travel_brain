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

// Rutas de las APIs
const weatherRoutes = require("./routes/weatherRoutes");
const userRoutes = require("./routes/userRoutes");
const tripRoutes = require("./routes/tripRoutes");

// Rutas API simples para el frontend
const apiAuthRoutes = require("./routes/apiAuthRoutes");
const apiCurrencyRoutes = require("./routes/apiCurrencyRoutes");
const apiTripRoutes = require("./routes/apiTripRoutes");
const apiOtherRoutes = require("./routes/apiOtherRoutes");

app.use("/", weatherRoutes);
app.use("/", userRoutes);
app.use("/", tripRoutes);
app.use("/", apiAuthRoutes);
app.use("/", apiCurrencyRoutes);
app.use("/", apiTripRoutes);
app.use("/", apiOtherRoutes);

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
