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
    origin: "*", //Maybe change this to single domain for security at some point.
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

// Maybe move into API validator.
function validateInput(input, expected) {
  var inputKeys = Object.keys(input);
  var expectedKeys = Object.keys(expected);
  return _.isEqual(inputKeys, expectedKeys);
}

// io.on listens for events
io.sockets.on("connection", function (socket) {
  new WebSocketUploader(socket); //Kris will connect this to datasbase

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

  // VALDEMAR TESTED
  /* Server side login functionality.
  expected req.
    {
      email,
      hashed_password
    }
		Wants mail and hashed_password.
		Returns err on failure
		Returns user object on success*/
  socket.on("login", function (req) {
    var res = {};

    if (!validateInput(req, apiinput.login)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("login", res);
      return;
    }

    // get user information; mail and hashed password
    var user = req;

    // Authenticate mail and password;
    UserModel.findOne({ email: user.email }).exec((err, doc) => {
      if (err) {
        // Emit true if authenticated.
        res.success = false;
        res.err = err;
        socket.emit("login", res);
        return;
      }
      if (doc === null) {
        // no user found
        res.success = false;
        res.err = "No user is found";
        socket.emit("login", res);
        return;
      }
      // Select password from user. Match the stored password with the given.
      if (doc.hashed_password === user.hashed_password) {
        // Emit true if authenticated.
        res.success = true;
        res.user = doc;
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

  // VALDEMAR TESTED
  /* Server side signup functionality.
  expected req.
    {
      email,
      username,
      hashed_password,
    }
		Wants mail and hashed_password.
		Returns err on failure
		Returns user object on success*/
  socket.on("signup", async (req) => {
    var res = {};
    // Get signup information about the new user.
    if (!validateInput(req, apiinput.signup)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("signup", res);
      return;
    }
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
    var doc = await UserModel.exists({ email: newuser.email });
    if (doc) {
      //true if at least one case is found.
      res.success = false;
      res.err = "Mail already used";
      socket.emit("signup", res);
      return;
    }
    var doc = await UserModel.exists({ username: newuser.username });
    if (doc) {
      //true if at least one case is found.
      res.success = false;
      res.err = "Username already used";
      socket.emit("signup", res);
      return;
    }
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
  // Websocket for adding friends.
  // Theis will take this
  // Websocket for removing friends.
  // And Theis will take this

  // VALDEMAR TESTED
  // Websocket for getting user info.
  socket.on("getuserinfo", (req) => {
    // UserID is sent.
    var res = {};
    // Get userID information about the new user.
    if (!validateInput(req, apiinput.getuserinfo)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("getuserinfo", res);
      return;
    }
    // Find user and sort out only basic info.
    UserModel.findOne({ _id: req.uid })
      .select(basicUserInfo)
      .exec((err, doc) => {
        if (err) {  
          res.success = false;
          res.err = err;
          socket.emit("getuserinfo", res);
          return;
        }

        // Send back userinfo.
        res.success = true;
        res.user = doc;
        socket.emit("getuserinfo", res);
      });
  });

  // VALDEMAR NOT TESTED
  // Websocket for creating new Rooms
  socket.on("createroom", async (req) => {
    var res = {};

    // UserId creating room is sent
    if (!validateInput(req, apiinput.createroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("createroom", res);
      return;
    }
    // Check if the user trying to create room exists.
    var doc = await UserModel.exists({ _id: req.uid });
    if (!doc) {
      //false if it doesn't exist.
      res.success = false;
      res.err = "User couldn't be identified";
      socket.emit("createroom", res);
      return;
    }

    // New room is created in database.
    var newroom = {};
    newroom._id = new mongoose.Types.ObjectId();

    // UserID is added as admin.
    newroom.admin = req.uid;

    // UserÌD is added to room.
    newroom.users = [req.uid];
    var room = new RoomModel(rewroom);

    // Add the room to database.
    room.save(async (err) => {
      if (err) {
        res.success = false;
        res.err = err;
        socket.emit("createroom", res);
        return;
      }

      // Room is added to users list of rooms.
      let updated = await UserModel.updateOne(
        { _id: req.uid },
        {
          $push: {
            rooms: newroom._id,
          },
        }
      );
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
          // Slet fil SKAL LAVES !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
