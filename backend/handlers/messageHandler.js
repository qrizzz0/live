var moment = require("moment");

class MessageHandler {
	constructor(clientInfo) {
		this.clientInfo = clientInfo;
	}

	message(socket, text) {
		socket.emit("message", {
			text: text,
			name: "System",
			timestamp: moment().valueOf(),
		});
	}

	broadcastTyping(socket, msg) {
		socket.broadcast.to(this.clientInfo[socket.id].room).emit("typing", msg);
	}

	broadcastMessage(socket, name, msg) {
		socket.broadcast.to(this.clientInfo[socket.id].room).emit("message", {
			text: msg,
			name: name,
			timestamp: moment().valueOf(),
		});
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
		// filte name based on rooms
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
}

module.exports = MessageHandler;
