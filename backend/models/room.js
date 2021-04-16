const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
	_id: ObjectId,
	users: Array,
	messages: Array,
	admin: Array,
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
