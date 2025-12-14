const mongoose = require("mongoose")
const favoriteRouteSchema = new mongoose.Schema(
    {
    userId: {type: String},
    name: {type: String},
    origin: {
        lat: {type: Number},
        lon: {type: Number},
        label: {type: String}
    },
    destination: {
        lat: {type: Number},
        lon: {type: Number},
        label: {type: String}
    },
    distanceKm: {type: Number},
    durationSec: {type: Number},
    mode: {type: String},
    createdAt: {type: Date, default: Date.now}
    },
    {collection: "favorite_routes"}
);
module.exports = mongoose.model("FavoriteRoute", favoriteRouteSchema);