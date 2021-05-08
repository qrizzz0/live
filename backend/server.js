var PORT = process.env.PORT || 3000; // take port from heroku or for loacalhost
var WebSocketUploader = require("./WebSocketUploader/WebSocketUploader.js");

var mongoose = require("mongoose");

var _ = require("lodash");

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

// Helper functions

// Validate mail format, by matching with RFC 2822 standard regex.
// Return boolean.
// https://stackoverflow.com/questions/46155/how-to-va lidate-an-email-address-in-javascript
function validateMail(mail) {
  var rfc2822regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  return rfc2822regex.test(mail);
}

// Maybe move into API validator.
function validateInput(input, expected) {
  var inputKeys = Object.keys(input);
  var expectedKeys = Object.keys(expected);
  return _.isEqual(inputKeys, expectedKeys);
}

module.exports.validateInput = validateInput;
module.exports.validateMail = validateMail;

// io.on listens for events
io.sockets.on("connection", function (socket) {
  new WebSocketUploader(socket); //Kris will connect this to datasbase

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

  // VALDEMAR NOT TESTED
  // Websocket for creating new Rooms
  socket.on("createroom", async (req) => {
    var res = {};
    console.log("Validating input.")
    // UserId creating room is sent
    if (!validateInput(req, apiinput.createroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("createroom", res);
      return;
    }
    
    console.log("Checking the user exists");
    // Check if the user trying to create room exists.
    var doc = await UserModel.exists({ _id: req.uid });
    if (!doc) {
      //false if it doesn't exist.
      res.success = false;
      res.err = "User couldn't be identified";
      socket.emit("createroom", res);
      return;
    }
    
    console.log("Preparing data")
    // New room is created in database.
    var newroom = {};
    newroom._id = new mongoose.Types.ObjectId();

    // UserID is added as admin.
    newroom.admin = req.uid;

    // Room name is added
    newroom.name = req.name;

    // UserÌD is added to room.
    newroom.users = [req.uid];

    
    console.log("New room ready for database: " + newroom);

    var room = new RoomModel(newroom);

    // Add the room to database.
    room.save(async (err) => {
      if (err) {
        res.success = false;
        res.err = err;
        socket.emit("createroom", res);
        return;
      }
      
    console.log("Room saved in database");
      // Room is added to users list of rooms.
      let updated = await UserModel.updateOne(
        { _id: req.uid },
        {
          $push: {
            rooms: newroom._id,
          },
        }
      );
      
    console.log("Updated user: " + updated);
      if (!(updated.nModified > 0)) {
        res.success = false;
        res.err = err;
        socket.emit("createroom", res);
        return;
      }

      res.success = true;
      socket.emit("createroom", res);
    });
  });

  // VALDEMAR NOT TESTED
  // Websocket for changing admin.
  // Find room.
  // Criteria the new admin must be part of the room.
  // UserInfo for the new admin is sent.
  // User is found.
  // Room is found and update the admin to the new user.
  socket.on("changeadmin", async (req) => {
    res = {};
    if (!validateInput(req, apiinput.changeadmin)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("changeadmin", res);
      return;
    }
    // TODO: Fix error checking
    // Get list of users in the requested room.
    let users = await RoomModel.findOne({ _id: req.roomid })
      .select("users")
      .exec();
    if (users === null) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("changeadmin", res);
      return;
    }
    // Check if the new admin is in the list of users.
    if (!users.includes(req.newadminid)) {
      res.success = false;
      res.err = "The user is not a part of the chat.";
      socket.emit("changeadmin", res);
      return;
    }
    // Find the room and update the admin to the newadmin.
    let updated = await RoomModel.updateOne(
      { _id: req.roomid },
      { admin: req.newadminid }
    );
    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = err;
      socket.emit("changeadmin", res);
      return;
    }

    res.success = true;
    socket.emit("changeadmin", res);
  });

  // VALDEMAR NOT TESTED
  // Websocket for deleting existing rooms.
  // Only room admin is allowed to remove chatrooms.
  // UserInfo is sent.
  // User is found.
  // Compare user to registered admin.
  // Remove all messages
  // if same, then remove room from each user in the room.
  // and then delete delete room.
  // else error.
  socket.on("removeroom", async (req) => {
    res = {};

    if (!validateInput(req, apiinput.removeroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("removeroom", res);
      return;
    }

    let room = await RoomModel.findOne({ _id: req.roomid }).exec();

    if (!(room.admin === req.uid)) {
      res.success = false;
      res.err = "User isn't admin, therefore can't delete the chatroom.";
      socket.emit("removeroom", res);
      return;
    }

    // Remove all messages in the chatroom.
    // TODO: Remember to delete the locally stored files.
    let deleted = await MessageModel.deleteMany({
      _id: { $in: room.messages },
    });

    if (!(deleted.deletedCount > 0)) {
      res.success = false;
      res.err = "Messages couldn't be deleted";
      socket.emit("removeroom", res);
      return;
    }

    // Remove the room object from the list user room, in each user.
    let updated = await UserModel.updateMany(
      { _id: { $in: room.users } },
      { $pull: { rooms: { _id: room._id } } }
    );
    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "Messages couldn't be deleted";
      socket.emit("removeroom", res);
      return;
    }

    // Delete the room itself.
    await RoomModel.deleteOne({ _id: room._id }, (err) => {
      if (err) {
        res.success = false;
        res.err = err;
        socket.emit("removeroom", res);
        return;
      }
      res.success = true;
      socket.emit("removeroom", res);
    });
  });

  // VALDEMAR NOT TESTED
  // Websocket for joining rooms.
  // UserInfo is sent.
  // Find the linked room.
  // Add user to its list.
  // Send back list of messages.
  socket.on("joinroom", async (req) => {
    res = {};
    // Get user and room ids.
    if (!validateInput(req, apiinput.joinroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("joinroom", res);
      return;
    }

    // Add user to room list.
    let updated = await RoomModel.updateOne(
      { _id: req.roomid }, // Filter
      {
        // Update
        $push: {
          users: req.uid,
        },
      }
    );
    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "Room couldn't be identified";
      socket.emit("joinroom", res);
      return;
    }

    // Add room to user list.
    updated = await UserModel.updateOne(
      { _id: req.uid }, // Filter
      {
        // Update
        $push: {
          rooms: req.roomid,
        },
      }
    );
    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "User couldn't be identified";
      socket.emit("joinroom", res);
      return;
    }
    console.log(user);
    console.log(room);

    res.success = true;
    res.messages = room.messages;
    socket.emit("joinroom", res);
    // Send back list of messages.
  });

  // VALDEMAR NOT TESTED
  // Websocket for leaving rooms.
  // UserInfo is sent.
  // Find the wished room.
  // remove user from room.
  // remove the room from the user.
  socket.on("leaveroom", async (req) => {
    var res = {};
    if (!validateInput(req, apiinput.leaveroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("leaveroom", res);
      return;
    }

    // Remove user from the room.
    let updated = await RoomModel.updateOne(
      { _id: req.roomid },
      { $pull: { users: { _id: req.uid } } }
    );
    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "User couldn't be removed from the room";
      socket.emit("leaveroom", res);
      return;
    }

    // Remove room from the user.
    updated = await UserModel.updateOne(
      { _id: req.uid },
      { $pull: { rooms: { _id: req.roomid } } }
    );
    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "Room couldn't be removed from the user";
      socket.emit("leaveroom", res);
      return;
    }

    res.success = true;
    socket.emit("leaveroom", res);
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
  socket.on("joinRoom", function (req) {
    roomHandler.joinRoom(socket, "joinRoom", req);
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
