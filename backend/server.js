var PORT = process.env.PORT || 3000; // take port from heroku or for loacalhost
var WebSocketUploader = require("./WebSocketUploader/WebSocketUploader.js");

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

var MessageHandler = require("./handlers/messageHandler.js");
var RoomHandler = require("./handlers/roomHandler.js");

var http = require("http").Server();

const basicUserInfo = ["username", "email"];

//moment js for timestamps
var moment = require("moment");
const fs = require("fs");

var clientInfo = new Array();
const messageHandler = new MessageHandler(clientInfo);
const roomHandler = new RoomHandler(clientInfo, messageHandler);

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

// io.on listens for events
io.sockets.on("connection", function (socket) {
	new WebSocketUploader(socket);

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
		var res = {};
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
		var res = {};
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

	// Websocket for adding friends.

	// Websocket for removing friends.

	// Websocket for getting user info.
	socket.on("getuserinfo", (req) => {
		// UserID is sent.
		var res = {};

		// User is found.
		UserModel.findOne({ _id: req.uid }, (err, doc) => {
			if (err) {
				res.success = false;
				res.err = err;
				socket.emit("getuserinfo", res);
				console.log("ERR: " + err);
				return;
			}

			// Keep only basic infomation.
			doc.select(basicUserInfo, (err, doc) => {
				if (err) {
					res.success = false;
					res.err = err;
					socket.emit("getuserinfo", res);
					console.log("ERR: " + err);
					return;
				}

				// Send back userinfo.
				res.success = true;
				res.user = doc;
				socket.emit("getuserinfo", res);
			});
		});
	});

	// Websocket for creating new Rooms
		// UserId creating room is sent
		// New room is created in database.
		// UserÌD is added to room.
		// UserID is added as admin.


	// Websocket for changing admin.
	// Criteria the new admin must be part of the room.
	// UserInfo for the new admin is sent.
	// User is found.
	// Room is found and update the admin to the new user.

	// Websocket for deleting existing rooms.
	// Only room admin is allowed to remove chatrooms.
	// UserInfo is sent.
	// User is found.
	// Compare user to registered admin.
	// if same, then remove room from each user in the room.
	// and then delete delete room.
	// else error.


	// Websocket for joining rooms.
	// UserInfo is sent.
	// Find the linked room.
	// Add user to its list.
	// Send back list of messages.

	// Websocket for leaving rooms.
	// UserInfo is sent.
	// Find the wished room.
	// remove user from room.
	
	// Websocket for handling messages.
	// UserInfo, RoomInfo and message is sent.
	// Create new message.
	// If file do file transfer.
	// Add message to room.
	// Broadcast message to members.

	// Delete message.
	// Message info is sent.
	// If there is a file.
	// Find file.
	// Delete physical file.
	// Remove file from database.
	// Remove message from database.
	socket.on("deletemessage", async (req) =>{
		var messageID = req.messageID;
		var roomID = req.roomID;
		var userID = req.userID;

		var room = await RoomModel.find({_id: req.roomID}, (err) => {
			if (err){
				res.success = false;
				res.err = "Can't find room ID";
				socket.emit("deletemessage", res);
				return;			
			}
		});

		var message = await room.find({messages: req.messageID}, (err) => {
			if (err){
				res.success = false;
				res.err = "Can't find message ID";
				socket.emit("deletemessage", res);
				return;			
			}
		});

		if (room.err == null && message.err == null){
			if (req.userID == room.admin || req.userID == message.sender){
				if (message.file.exists()){
					// Slet fil
					console.log("File:" + message.file +  " deleted");
				}
				
				// Slet besked
				MessageModel.findByIdAndDelete({id_: message._id}, (err) => {
					if (err){
						res.success = false;
						res.err = "Can't delete message";
						socket.emit("deletemessage", res);
						return;
					}
				});
				console.log("Message" + message.text + " deleted");
				res.success = true;
				res.err = "Message deleted";
				socket.emit("deletemessage", res);	
			}
		}
	});

	// for private chat
	socket.on("joinRoom", function (req) {
		roomHandler.joinRoom(socket, "joinRoom", req);
	});

	// Room welcome message
	messageHandler.message(socket, "Welcome to Chat Application !");

	// listen for client typing messages
	socket.on("typing", function (message) {
		messageHandler.broadcastTyping(socket, message);
	});

	// listen for client message
	socket.on("message", function (message) {
		messageHandler.messageFromUsers(socket, message);
	});
});
/* Socket.io for database controllers */

http.listen(PORT, function () {
	console.log("server started");
});
