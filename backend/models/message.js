const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
	_id: ObjectID,
	sender: ObjectID,
	timestamp: Date,
	text: String,
	file: ObjectID,
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
