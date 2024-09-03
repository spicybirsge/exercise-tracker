const mongoose = require("mongoose");

const users = mongoose.Schema({
    _id: String,
    username: String,
    exercises: Array
})

module.exports = mongoose.model('Users', users)