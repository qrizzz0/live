class RoomHandler {
	constructor(clientInfo, messageHandler) {
		this.clientInfo = clientInfo;
		this.messageHandler = messageHandler;
	}

	joinRoom(socket, id, req) {
		this.clientInfo[socket.id] = req;
		socket.join(req.room);
		this.messageHandler.broadcastMessage(
			socket,
			"system",
			req.name + " has joined"
		);
		console.log("User: " + req.name + " has joined room: " + req.room);
	}
}

module.exports = RoomHandler;
