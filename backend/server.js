var PORT = process.env.PORT || 3005; // take port from heroku or for loacalhost
var WebSocketUploader = require("./uploader.js");
var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/chattest", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {});

/* Get Mongoose models for database work */
var UserModel = require("./models/user");
var FileModel = require("./models/file");
var RoomModel = require("./models/room");
var MessageModel = require("./models/message");

var http = require("http").Server();

//moment js for timestamps
var moment = require("moment");
const fs = require("fs");

var clientInfo = {};
var currentUploads = {};

//socket io module
var io = require("socket.io")(http, {
	cors: {
		origin: "http://130.225.170.76",
		methods: ["GET", "POST"],
	},
});

// Helper functions

// Validate mail format, by matching with RFC 2822 standard regex.
// Return boolean.
// https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function validateMail(mail) {
	var rfc2822regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
	return rfc2822regex.test(mail);
}

// send current users to provided scoket
function sendCurrentUsers(socket) {
	// loading current users
	var info = clientInfo[socket.id];
	var users = [];
	if (typeof info === "undefined") {
		return;
	}
	// filte name based on rooms
	Object.keys(clientInfo).forEach(function (socketId) {
		var userinfo = clientInfo[socketId];
		// check if user room and selcted room same or not
		// as user should see names in only his chat room
		if (info.room == userinfo.room) {
			users.push(userinfo.name);
		}
	});
	// emit message when all users list

	socket.emit("message", {
		name: "System",
		text: "Current Users : " + users.join(", "),
		timestamp: moment().valueOf(),
	});
}

// io.on listens for events
io.sockets.on("connection", function (socket) {
	socket.on("upload first slice", function (input) {
		currentUploads[input.id] = new WebSocketUploader(socket, input);
		console.log(
			"receiving first slice for id: " + input.id + " name: " + input.name
		);

		var uploader = currentUploads[input.id];
		uploader.push(input);

		var userInfo = clientInfo[socket.id];
		io.in(userInfo.room).emit("message", {
			text:
				'<a href="data/' +
				input.name +
				'" target="_blank">' +
				input.name +
				"</a>" +
				" was sent" +
				" from user: " +
				userInfo.name,
			name: "System",
			timestamp: moment().valueOf(),
		});
	});

	socket.on("upload next slice", function (input) {
		console.log("Receiving next slice of data for id: " + input.id);
		var uploader = currentUploads[input.id];
		uploader.push(input);
	});

	//for disconnection
	socket.on("disconnect", function () {
		var userdata = clientInfo[socket.id];
		if (typeof (userdata !== undefined)) {
			socket.leave(userdata.room); // leave the room
			//broadcast leave room to only memebers of same room
			socket.broadcast.to(userdata.room).emit("message", {
				text: userdata.name + " has left",
				name: "System",
				timestamp: moment().valueOf(),
			});
			console.log(
				"User: " + userdata.name + " has left" + " from room: " + userdata.room
			);
			// delete user data-
			delete clientInfo[socket.id];
		}
	});
	/* Server side login functionality.
		Wants mail and hashed_password.
		Returns err on failure
		Returns user object on success*/
	socket.on("login", function (req) {
		var res;
		// get user information; mail and hashed password
		var user = req;

		// Authenticate mail and password;
		UserModel.find({ email: user.email }, (err, docs) => {
			if (err) {
				// Database error
				res.success = false;
				res.err = err;
				socket.emit("login", res);
				return;
			}
			if (docs.length != 1) {
				//Doesn't exist or multiple instances of user.
				res.success = false;
				res.err =
					"Email couldn't be identified, either multiple instances or none exist.";
				socket.emit("login", res);
				return;
			}
			// Select password from user. Match the stored password with the given.
			docs.select("hashed_password").exec((password) => {
				if (password.equals(user.password)) {
					// Emit true if authenticated.
					res.success = true;
					res.user = docs;
					socket.emit("login", res);
				} else {
					// Emit false if not authenticated.
					// Wrong password
					res.success = false;
					res.err = "Wrong password!";
					socket.emit("login", res);
					return;
				}
			});
		});
		/*
		if (database.brugernavn.exists) {
			if (hej.passwordhash == database.passwordhash) {
				clientInfo[socket.id].user = "kristofer";
			} else {
				socket.emit("failed password", {
					besked: "fuck dig dit brugernavn eksitstweteqet ikke",
				});
			}
		}

		*/
	});
	socket.on("signup", (req) => {
		console.log("Signing up user!");
		var res;
		// Get signup information about the new user.
		var newuser = req;
		newuser._id = new mongoose.Types.ObjectId();
		// Validate mailstring
		if (!validateMail(newuser.email)) {
			res.success = false;
			res.err = "Not a valid email format";
			socket.emit("signup", res);
			return;
		}
		// Check if username or mail exists.
		UserModel.exists({ email: newuser.email }, function (err, doc) {
			if (err) {
				res.success = false;
				res.err = "Error in looking up existing user mail";
				socket.emit("signup", res);
				return;
			} else {
				if (doc) {
					//true if at least one case is found.
					res.success = false;
					res.err = "Mail already used";
					socket.emit("signup", res);
					return;
				}
			}
		});
		UserModel.exists({ username: newuser.username }, function (err, doc) {
			if (err) {
				res.success = false;
				res.err = "Error in looking up existing username";
				socket.emit("signup", res);
				return;
			} else {
				if (doc) {
					//true if at least one case is found.
					res.success = false;
					res.err = "Username already used";
					socket.emit("signup", res);
					return;
				}
			}
		});
		// Create newuser with valid information. And return success.
		// Else return failure message.
		var user = UserModel(newuser);
		user
			.save()
			.then((r) => {
				res.success = true;
				socket.emit("signup", res);
			})
			.catch((err) => {
				res.success = false;
				res.err = err;
				socket.emit("signup", res);
				console.log("ERR: " + err);
			});
	});

	socket.on("get rooms", function (hej) {
		socket.emit("list of rooms", {
			roomCount: 0,
			etc: "et eller andet who knows",
		});
	});

	// for private chat
	socket.on("joinRoom", function (req) {
		clientInfo[socket.id] = req;
		socket.join(req.room);
		//broadcast new user joined room
		socket.broadcast.to(req.room).emit("message", {
			name: "System",
			text: req.name + " has joined",
			timestamp: moment().valueOf(),
		});
		console.log("User: " + req.name + " has joined room: " + req.room);
	});

	// to show who is typing Message

	socket.on("typing", function (message) {
		// broadcast this message to all users in that room
		socket.broadcast.to(clientInfo[socket.id].room).emit("typing", message);
	});

	// to check if user seen Message
	socket.on("userSeen", function (msg) {
		socket.broadcast.to(clientInfo[socket.id].room).emit("userSeen", msg);
		//socket.emit("message", msg);
	});

	socket.emit("message", {
		text: "Welcome to Chat Application !",
		timestamp: moment().valueOf(),
		name: "System",
	});

	// listen for client message
	socket.on("message", function (message) {
		console.log(
			"Message Received : " +
				message.text +
				"\nFrom room: " +
				clientInfo[socket.id].room +
				" \nFrom user: " +
				clientInfo[socket.id].name
		);
		// to show all current users
		if (message.text === "@currentUsers") {
			sendCurrentUsers(socket);
		} else {
			//broadcast to all users except for sender
			message.timestamp = moment().valueOf();
			//socket.broadcast.emit("message",message);
			// now message should be only sent to users who are in same room
			socket.broadcast.to(clientInfo[socket.id].room).emit("message", message);
			//socket.emit.to(clientInfo[socket.id].room).emit("message", message);
		}
	});
});

/* Socket.io for database controllers */

http.listen(PORT, function () {
	console.log("server started");
});
