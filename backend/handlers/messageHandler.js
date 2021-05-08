var moment = require("moment");

class MessageHandler {
	constructor(clientInfo) {
		this.clientInfo = clientInfo;
	}

	message(socket, name, text) {
		socket.emit("message", {
			text: text,
			name: name,
			timestamp: moment().valueOf(),
		});
	}

	broadcastTyping(socket, msg) {
		socket.broadcast.to(this.clientInfo[socket.id].room).emit("typing", msg);
	}

	broadcastMessage(socket, name, msg) { //Broadcasts to all except self
		console.log('broadcasting message: ' + msg);
		socket.broadcast.to(this.clientInfo[socket.id].room).emit("message", {
			text: msg,
			name: name,
			timestamp: moment().valueOf(),
		});
	}

	sendMessageToRoom(socket, name, msg) { //Broadcasts message to all including self
		//This could be done like: io.in(userInfo.room).emit("message", { but this is easier to work with:
		this.broadcastMessage(socket, name, msg);
		this.message(socket, name, msg);
	}

	messageFromUsers(socket, msg) {
		console.log(
			"Message Received : " +
				msg.text +
				"\nFrom room: " +
				this.clientInfo[socket.id].room +
				" \nFrom user: " +
				this.clientInfo[socket.id].name
		);
		// to show all current users
		if (msg.text === "@currentUsers") {
			sendCurrentUsers(socket);
		} else {
			//broadcast to all users except for sender
			msg.timestamp = moment().valueOf();
			// now message should be only sent to users who are in same room
			socket.broadcast.to(this.clientInfo[socket.id].room).emit("message", msg);
		}
	}

	// send current users to provided scoket
	sendCurrentUsers(socket) {
		// loading current users
		var info = this.clientInfo[socket.id];
		var users = [];
		if (typeof info === "undefined") {
			return;
		}
		// filter name based on rooms
		Object.keys(this.clientInfo).forEach(function (socketId) {
			var userinfo = this.clientInfo[socketId];
			// check if user room and selcted room same or not
			// as user should see names in only his chat room
			if (info.room == userinfo.room) {
				users.push(userinfo.name);
			}
		});
		// emit message when all users list

		this.message(socket, "Current Users : " + users.join(", "));
	}

	getNameFromSocket(socket) {
		return this.clientInfo[socket.id].name;
	}
}

module.exports = MessageHandler;
