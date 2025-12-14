const mongoose = require("mongoose")
const destinationSchema = new mongoose.Schema(
    {
    name: {type: String},
    country: {type:String},
    description: {type:String},
    lat: {type:Number},
    lng: {type:Number},
    img: {type:String},
    userId: {type:String},
    createdAt: {type: Date, default: Date.now}
    },
    {collection: "destinations"}
);
module.exports = mongoose.model("Destination", destinationSchema);