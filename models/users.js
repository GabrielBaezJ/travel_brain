const mongoose = require("mongoose")
const userSchema = new mongoose.Schema(
    {
    username: {type: String},
    email: {type:String},
    passwordHash: {type:String},
    name: {type:String},
    role: {type:String, enum:['ADMIN', 'REGISTERED']},
    status: {type:String, enum:['ACTIVE', 'INACTIVE']},
    tz: {type:String},
    createdAt: {type: Date, default: Date.now}
    },
    {collection: "users"}
);
module.exports = mongoose.model("User", userSchema);