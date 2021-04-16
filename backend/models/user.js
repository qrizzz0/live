const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	_id: ObjectId,
	username: String,
	email: String,
	hashed_password: String,
	rooms: Array,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
