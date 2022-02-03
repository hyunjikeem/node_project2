const mongoose = require('mongoose');

const CommentsSchema = new mongoose.Schema({
  comment: String,
  commentId: Number,
  createdAt: String,
  nickname: String,
  updatedAt: String,
  userId: Number,
  postId: Number,
});
module.exports = mongoose.model('Comments', CommentsSchema);