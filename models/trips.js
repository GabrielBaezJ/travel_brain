const mongoose = require("mongoose")
const tripSchema = new mongoose.Schema(
    {
    userId: {type: Number},
    title: {type:String},
    destination: {type:String},
    startDate: {type:Date},
    endDate: {type:Date},
    budget: {type:Number},
    description: {type:String},
    createdAt: {type: Date, default: Date.now}
    },
    {collection: "trips"}
);
module.exports = mongoose.model("Trip", tripSchema);