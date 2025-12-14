const mongoose = require("mongoose")
const weatherSchema = new mongoose.Schema(
    {
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false},
    label: {type:String},
    lat: {type:Number},
    lon: {type:Number},
    temp: {type:Number},
    condition: {type:String},
    humidity: {type:Number},
    windSpeed: {type:Number},
    pressure: {type:Number},
    precipitation: {type:Number},
    createdAt: {type: Date, default: Date.now}
    },
    {collection: "weather_searches"}
);
module.exports = mongoose.model("Weather", weatherSchema);