class RoomHandler {
	constructor(clientInfo, messageHandler) {
		this.clientInfo = clientInfo;
		this.messageHandler = messageHandler;
	}

	LogIn(socket, req) {
		/*var user = req;
		var doc = await UserModel.exists({ email: user.email });
		if (!doc) {
		  //true if no user is found
		  res.success = false;
		  res.err = "User doesn't exist";
		  socket.emit("signup", res);
		  return;
		}

		req.roomInfo //Eksiterer rum i database
		if (doesRoomExists(req.roomInfo)) {
			this.clientInfo.roomExists = true;
		}

     	req.userInfo //Eksisterer bruger, er password korrekt? 		Er rum tilkynttet bruger?
		if (userIsValid(req.userInfo)) {
			this.clientInfo.authorized = true;
		}
		
		if (this.clientInfo.authorized && the.clientInfo.roomExists) {
			socket.join(req.room)
		} else {
			socket.emit("Not Authorized", {
				userValid: the.clientInfo.authorized,
				roomValid: the.clientInfo.roomExists,
			});
		}
*/
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
