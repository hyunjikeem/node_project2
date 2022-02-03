const mongoose = require('mongoose');

const PostsSchema = new mongoose.Schema({
  content: String,
  createdAt: String,
  nickname: String,
  postId: Number,
  title: String,
  updatedAt: String,
  userId: Number,
});
module.exports = mongoose.model('Posts', PostsSchema);