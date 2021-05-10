var moment = require("moment");
var UserModel = require("../models/user");
var RoomModel = require("../models/room");
var MessageModel = require("../models/message");
const mongoose = require("mongoose");

const apiinput = require("../validators/APIvalidators");

const basicUserInfo = ["username", "email"];

class MessageHandler {
	constructor(clientInfo) {
		this.clientInfo = clientInfo;
	}

	messageWithoutDB(socket, name, text, roomid) {
		var res = {};
		var msg = {};
		msg.text = text;
		msg.timestamp = moment().valueOf();
		msg.sender = {};
		msg.sender.username = name;

		//this.addMessageToDB(msg, null);
		res.success = true;
		res.msg = msg;

		//Broadcasts to all except self
		socket.broadcast.to(roomid).emit("message", res);
		socket.emit("message", res);
	}

	broadcastTyping(socket, req) {
		socket.broadcast.to(req.roomid).emit("typing", req.text);
	}

	messageWithDB(socket, uid, text, fileID, roomid) {
		var res = {};
		var msg = {};
		msg.text = text;
		msg.timestamp = moment().valueOf();
		msg.sender = uid;
		console.log("broadcasting message: " + msg);

		this.addMessageToDB(msg, fileID, roomid)
			.then((message) => {
				res.success = true;
				res.msg = message;
				console.log(message);
				//Broadcasts to all except self
				socket.broadcast.to(roomid).emit("message", res);
				//Also send to self
				socket.emit("message", res);
			})
			.catch((err) => {
				console.log("Message to DB ERR: " + err);

				res.success = false;
				res.err = err;
				socket.emit("message", res);
			});
	}

	messageFromUsers(socket, msg) {
		var res = {};
		// UserId creating room is sent
		if (!apiinput.validateInput(msg, apiinput.validators.message)) {
			res.success = false;
			res.err = "Invalid JSON Request";
			socket.emit("message", res);
			return;
		}

		console.log(
			"Message Received : " +
				msg.msg +
				"\nFrom room: " +
				msg.roomid +
				" \nFrom user: " +
				msg.uid
		);
		var newmessage = {
			text: msg.msg,
			timestamp: moment().valueOf(),
			sender: msg.uid,
			_id: new mongoose.Types.ObjectId(),
		};
		var message = new MessageModel(newmessage);

		message.save(async (err) => {
			if (err) {
				res.success = false;
				res.err = err;
				socket.emit("message", res);
				return;
			}
			var updated = await RoomModel.updateOne(
				{ _id: msg.roomid },
				{
					$push: {
						messages: newmessage._id,
					},
				}
			);
			if (!(updated.nModified > 0)) {
				res.success = false;
				res.err = err;
				socket.emit("message", res);
				return;
			}
			// Find user and sort out only basic info.
			var doc = await UserModel.findOne({ _id: msg.uid })
				.select(basicUserInfo)
				.exec();
			if (doc === null) {
				res.success = false;
				res.err = "User couldn't be found";
				socket.emit("getuserinfo", res);
				return;
			}
			//this.addMessageToDB(msg, null);
			newmessage.sender = doc;
			res.msg = newmessage;
			res.success = true;
			socket.broadcast.to(msg.roomid).emit("message", res);
		});
	}
	async getallmessages(socket, req) {
		var res = {};
		// UserId creating room is sent
		if (!apiinput.validateInput(req, apiinput.validators.getallmessages)) {
			res.success = false;
			res.err = "Invalid JSON Request";
			socket.emit("getallmessages", res);
			return;
		}

		let room = await RoomModel.findOne({ _id: req.roomid }).populate({
			path: "messages",
			populate: {
				path: "sender",
				select: basicUserInfo,
			},
		});
		if (room === null) {
			res.success = false;
			res.err = "Couldn't find the room";
			socket.emit("getallmessages", res);
			return;
		}
		res.success = true;
		res.messages = room.messages;
		socket.emit("getallmessages", res);
	}

	// Adding message to database:
	// create a message instance for db.
	// if file, create file instance for db. And link to
	// Add uid of message sender to message.
	// Add message _id, to the intended room.

	async addMessageToDB(msg, file, roomid) {
		console.log("Adding message to DB: " + msg.text);
		var message = new MessageModel();

		message._id = new mongoose.Types.ObjectId();
		message.sender = msg.sender;
		message.timestamp = msg.timestamp;
		message.text = msg.text;
		if (file) {
			message.file = file;
		}

		await message.save(async (err) => {
			if (err) {
				throw err;
				return;
			}
			var updated = await RoomModel.updateOne(
				{ _id: roomid },
				{
					$push: {
						messages: message._id,
					},
				}
			);
			if (!(updated.nModified > 0)) {
				throw "Couldn't update the room with the message.";
				return;
			}
		});

		return await MessageModel.findOne({ _id: message._id })
			.populate({
				path: "sender",
				select: basicUserInfo,
			})
			.exec();
	}
}

module.exports = MessageHandler;
