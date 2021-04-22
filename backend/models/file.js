const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
	_id: mongoose.Types.ObjectId,
	fileid: Number,
	name: String,
	path: String,
	fileSize: Number,
	fileType: String,
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
