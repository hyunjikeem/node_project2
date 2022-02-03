const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  createdAt: String,
  nickname: String,
  password: String,
  userId: Number,
});
module.exports = mongoose.model('User', UserSchema);