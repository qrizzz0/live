function message(socket, textString) {
	socket.emit(socket, {
		text: textString,
		timestamp: moment().valueOf(),
		name: "System",
	});
}

export { message };
