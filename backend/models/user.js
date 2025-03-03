const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  username: String,
  email: String,
  hashed_password: String,
  rooms: [{ type: mongoose.Types.ObjectId, ref: "Room" }],
  friends: [{ type: mongoose.Types.ObjectId, ref: "User" }],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
