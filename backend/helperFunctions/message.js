function message(socket, textString) {
	socket.emit("message", {
		text: textString,
		timestamp: moment().valueOf(),
		name: "System",
	});
}
