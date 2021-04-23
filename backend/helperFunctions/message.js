var moment = require("moment");

class MessageHelper {
	message(socket, textString) {
		socket.emit("message", {
			text: textString,
			timestamp: moment().valueOf(),
			name: "System",
		});
	}
}

module.exports = MessageHelper
