const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
	_id: mongoose.Types.ObjectId,
	users: [{ type: mongoose.Types.ObjectId, ref: "User" }],
	messages: [{ type: mongoose.Types.ObjectId, ref: "Message" }],
	admin: { type: mongoose.Types.ObjectId, ref: "User" },
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
