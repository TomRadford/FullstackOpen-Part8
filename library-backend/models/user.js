const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    minlength: 3,
    required: true,
  },
  favouriteGenre: String,
  passwordHash: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model('User', userSchema)
