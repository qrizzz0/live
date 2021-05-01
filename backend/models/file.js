const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  fileName: String,
  originalName: String,
  path: String,
  fileSize: Number,
  fileType: String,
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
