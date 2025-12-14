const mongoose = require("mongoose")
const userSchema = new mongoose.Schema(
    {
    username: {type: String},
    email: {type:String},
    passwordHash: {type:String},
    password: {type:String}, // Campo legacy para migración
    name: {type:String},
    role: {type:String, enum:['ADMIN', 'REGISTERED']},
    status: {type:String, enum:['ACTIVE', 'INACTIVE']},
    tz: {type:String},
    lastLogin: {type: Date},
    createdAt: {type: Date, default: Date.now}
    },
    {collection: "users", strict: false}
);
module.exports = mongoose.model("User", userSchema);