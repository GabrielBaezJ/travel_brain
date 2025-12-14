const port = process.env.PORT || 3004;
const express = require("express");
const app = express();
const mongoose = require("mongoose");

// Configure mongoose
mongoose.set('strictQuery', false);

// Middleware ANTES de conectar a la BD
app.use(express.json());

// Rutas ANTES de conectar a la BD
const weatherRoutes = require("./routes/weatherRoutes");
const userRoutes = require("./routes/userRoutes");
const tripRoutes = require("./routes/tripRoutes");
app.use("/", weatherRoutes);
app.use("/", userRoutes);
app.use("/", tripRoutes);

// Connect to MongoDB with proper options
mongoose.connect(`mongodb+srv://SrJCBM:bdd2025@cluster0.tjvfmrk.mongodb.net/travel_brain?retryWrites=true&w=majority`, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("System connected to MongoDb Database");
    // Start server only after DB connection is established
    app.listen(port, '0.0.0.0', () => console.log("TravelBrain Server is running on port -->" + port));
})
.catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
});

const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB error:", error));
db.on("disconnected", () => console.log("MongoDB disconnected"));