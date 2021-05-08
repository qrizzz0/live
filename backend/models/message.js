const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  //sender: { type: mongoose.Types.ObjectId, ref: "User" },
  sender: String,
  timestamp: Date,
  text: String,
  file: { type: mongoose.Types.ObjectId, ref: "File" },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
