var PORT = process.env.PORT || 3005; // take port from heroku or for loacalhost
var WebSocketUploader = require("./WebSocketUploader/WebSocketUploader.js");

var mongoose = require("mongoose");

const apiinput = require("./validators/APIvalidators");

mongoose.connect("mongodb://localhost/chattest", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {});

/* Get Mongoose models for database work */
var UserModel = require("./models/user");
var RoomModel = require("./models/room");
var MessageModel = require("./models/message");

var MessageHandler = require("./handlers/messageHandler.js");
var RoomHandler = require("./handlers/roomHandler.js");
var UserHandler = require("./handlers/userHandler.js");

var http = require("http").Server();

const basicUserInfo = ["username", "email"];

//moment js for timestamps
var moment = require("moment");
const fs = require("fs");
const { getuserinfo } = require("./validators/APIvalidators");

var clientInfo = new Array();
const messageHandler = new MessageHandler(clientInfo);
const roomHandler = new RoomHandler(clientInfo, messageHandler);
const userHandler = new UserHandler();

//socket io module
var io = require("socket.io")(http, {
  cors: {
    origin: "*", //Maybe change this to single domain for security at some point.
    methods: ["GET", "POST"],
  },
});

// io.on listens for events
io.sockets.on("connection", function (socket) {
  new WebSocketUploader(socket, messageHandler); //Kris will connect this to datasbase

  //for disconnection SKAL FIKSES
  /*socket.on("disconnect", function () {
		var userdata = clientInfo[socket.id];
		if (typeof (userdata !== undefined)) {
			//socket.leave(userdata.room); // leave the room
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
*/
  socket.on("login", function (req) {
    userHandler.login(socket, req);
  });

  socket.on("signup", async function (req) {
    userHandler.signup(socket, req);
  });

  socket.on("modFriend", function (req) {
    userHandler.modFriend(socket, req);
  });

  socket.on("getuserinfo", function (req) {
    userHandler.getUserInfo(socket, req);
  });

  // Websocket for getting all rooms.
  socket.on("getallrooms", (req) => {
    roomHandler.getallrooms(socket, req);
  });

  // VALDEMAR TESTED
  // Websocket for creating new Rooms
  socket.on("createroom", async (req) => {
    roomHandler.createroom(socket, req);
  });

  // VALDEMAR NOT TESTED
  // Websocket for changing admin.
  // Find room.
  // Criteria the new admin must be part of the room.
  // UserInfo for the new admin is sent.
  // User is found.
  // Room is found and update the admin to the new user.
  socket.on("changeadmin", async (req) => {
    roomHandler.changeadmin(socket, req);
  });

  // VALDEMAR NOT TESTED
  // Websocket for adding users to rooms, and vice-versa.
  socket.on("addroom", async (req) => {
    roomHandler.addroom(socket, req);
  });

  //VALDEMAR NOT TESTED
  // Websocket for removing from room from user.
  socket.on("removeroom", async (req) => {
    roomHandler.removeroom(socket, req);
  });

  // VALDEMAR NOT TESTED
  // Websocket for deleting existing rooms.
  // Only room admin is allowed to delete chatrooms.
  // UserInfo is sent.
  // User is found.
  // Compare user to registered admin.
  // delete all messages
  // if same, then remove room from each user in the room.
  // and then delete delete room.
  // else error.
  socket.on("deleteroom", async (req) => {
    roomHandler.deleteroom(socket, req);
  });

  // VALDEMAR NOT TESTED
  // Websocket for joining rooms. Joins the socket to a room.
  // UserInfo is sent.
  // Find the linked room.
  // Add user to its list.
  // Send back list of messages.
  socket.on("joinroom", async (req) => {
    roomHandler.joinroom(socket, req);
  });

  // VALDEMAR NOT TESTED
  // Websocket for leaving rooms. Removes the socket from the room.
  // UserInfo is sent.
  // Find the wished room.
  // remove user from room.
  // remove the room from the user.
  socket.on("leaveroom", async (req) => {
    roomHandler.leaveroom(socket, req);
  });

  // Websocket for handling messages.
  // UserInfo, RoomInfo and message is sent.
  // Create new message.
  // If file do file transfer.
  // Add message to room.
  // Broadcast message to members.

  // NOT TESTED
  // Delete message.
  // Message info is sent.
  // If there is a file.
  // Find file.
  // Delete physical file.
  // Remove file from database.
  // Remove message from database.
  socket.on("deletemessage", async (req) => {
    var messageID = req.messageID;
    var roomID = req.roomID;
    var userID = req.userID;

    var room = await RoomModel.find({ _id: req.roomID }, (err) => {
      if (err) {
        res.success = false;
        res.err = "Can't find room ID";
        socket.emit("deletemessage", res);
        return;
      }
    });

    var message = await room.find({ messages: req.messageID }, (err) => {
      if (err) {
        res.success = false;
        res.err = "Can't find message ID";
        socket.emit("deletemessage", res);
        return;
      }
    });

    if (room.err == null && message.err == null) {
      if (req.userID == room.admin || req.userID == message.sender) {
        if (message.file.exists()) {
          // Slet fil  SKAL LAVES !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          console.log("File:" + message.file + " deleted");
        }

        // Slet besked
        MessageModel.findByIdAndDelete({ id_: message._id }, (err) => {
          if (err) {
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
  socket.on("LogInToSocket", function (req) {
    roomHandler.LogIn(socket, req);
  });

  // Room welcome message
  messageHandler.message(socket, "System", "Welcome to Chat Application !");

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

/* NICE MONGOOSE REFERENCES
  Working with array of objects.
  https://tech-blog.maddyzone.com/node.js/add-update-delete-object-array-schema-mongoosemongodb

  Basic CRUD in Mongoose.
  https://coursework.vschool.io/mongoose-crud/

  Mongoose delete.
  https://kb.objectrocket.com/mongo-db/mongoose-delete-817

  Mongoose docs.
  https://mongoosejs.com/docs/api.html
  */
