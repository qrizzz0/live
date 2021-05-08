var moment = require("moment");
const MessageModel = require("../models/message");
const mongoose = require("mongoose");

class MessageHandler {
	constructor(clientInfo) {
		this.clientInfo = clientInfo;
	}

	message(socket, name, text) {
		var msg = {};
		msg.text = text;
		msg.timestamp = moment().valueOf();
		msg.name = name;

		this.addMessageToDB(msg, null);

		socket.emit("message", msg);
	}

	broadcastTyping(socket, text) {
		socket.broadcast.to(this.clientInfo[socket.id].room).emit("typing", text);
	}

	broadcastMessage(socket, name, text, fileID) {
		console.log('broadcasting message: ' + msg);

		var msg = {};
		msg.text = text;
		msg.timestamp = moment().valueOf();
		msg.name = name;

		this.addMessageToDB(msg, fileID);

		//Broadcasts to all except self
		socket.broadcast.to(this.clientInfo[socket.id].room).emit("message", msg);
		//Also send to self
		socket.emit("message", msg);
	}

	messageFromUsers(socket, msg) {
		console.log("Message Received : " +	msg.text + "\nFrom room: " + this.clientInfo[socket.id].room + " \nFrom user: " + this.clientInfo[socket.id].name);

		this.addMessageToDB(msg, null);

		socket.broadcast.to(this.clientInfo[socket.id].room).emit("message", msg);
	}

	getNameFromSocket(socket) {
		return this.clientInfo[socket.id].name;
	}

	addMessageToDB(msg, file) {
		console.log("Adding message to DB: " + msg.text);
		var message = new MessageModel();

		message._id = new mongoose.Types.ObjectId();
		message.sender = msg.name;
		message.timestamp = msg.timestamp;
		message.text = msg.text;
		if (file) {
			message.file = file;
		}

		message.save(async (err) => {
			if (err) {
			  throw err;
			  return;
			}
		  });
	}
}

module.exports = MessageHandler;
