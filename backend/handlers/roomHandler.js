/*
  API CALLS:
  getallrooms: This gives back an list of all the rooms in the database. NON-AUTHORIZED
  createroom: This creates a new room in the database. And adds the room to the user whom created it. AUTHORIZED
  deleteroom: This removes a room from the database, and cleans up the models depending on the room. AUTHORIZED
  addroom: This is for adding a user to the room, and vice versa. Linking users to their rooms in the database. AUTHORIZED
  removeroom: This is for removing a user to the room, and vice versa. Unlinking users to their rooms in the database. AUTHORIZED
  joinroom: This is for joining the socket to an socket room. This is used for grouping sockets to their chatrooms. AUTHORIZED
  leaveroom: This is for leaving the socket from its socket room. We can then controlling the clients sockets. AUTHORIZED
  changeadmin: This is for changing the rooms registred admin to someone else. AUTHORIZED
*/

/* Get Mongoose models for database work */
var UserModel = require("./models/user");
var RoomModel = require("./models/room");
var MessageModel = require("./models/message");

const apiinput = require("../validators/APIvalidators");

var mongoose = require("mongoose");

class RoomHandler {
  constructor(clientInfo, messageHandler) {
    this.clientInfo = clientInfo;
    this.messageHandler = messageHandler;
  }

  async getallrooms(socket, req) {
    var res = {};

    // UserId creating room is sent
    if (!apiinput.validateInput(req, apiinput.validators.getallrooms)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("getallrooms", res);
      return;
    }

    RoomModel.find().exec((err, docs) => {
      if (err) {
        res.success = false;
        res.err = err;
        socket.emit("getallrooms", res);
        return;
      }
      res.success = true;
      res.rooms = docs;
      socket.emit("getallrooms", res);
      return;
    });
  }

  async createroom(socket, req) {
    var res = {};
    console.log("Socket.id " + socket.id);
    console.log("Socket is authorized? " + socket.authorized);
    // KRIS This is how we force authorized use of the API. Only when the socket has been authorized. This API Call can be used.
    // We this will force the frontend, to either re-login using the cached login info, or go to the login screen.
    if (!socket.authorized) {
      res.success = false;
      res.err = "Socket isn't authorized";
      socket.emit("createroom", res);
      return;
    }
    console.log("Validating input.");
    // UserId creating room is sent
    if (!apiinput.validateInput(req, apiinput.validators.createroom)) {
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

    console.log("Preparing data");
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
      res.room = room;
      socket.emit("createroom", res);
    });
  }

  async changeadmin(socket, req) {
    var res = {};
    if (!apiinput.validateInput(req, apiinput.validators.changeadmin)) {
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
  }

  async addroom(socket, req) {
    res = {};
    console.log("Socket.id " + socket.id);
    console.log("Socket is authorized? " + socket.authorized);
    // KRIS DO THIS
    if (!socket.authorized) {
      res.success = false;
      res.err = "Socket isn't authorized";
      socket.emit("addroom", res);
      return;
    }
    // Get user and room ids.
    if (!apiinput.validateInput(req, apiinput.validators.addroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("addroom", res);
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
      socket.emit("addroom", res);
      return;
    }

    let room = await RoomModel.findOne({ _id: req.roomid });
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
      socket.emit("addroom", res);
      return;
    }

    res.success = true;
    res.room = room;
    socket.emit("addroom", res);
    // Send back room to update frontend.
  }
  async removeroom(socket, req) {
    res = {};
    console.log("Socket.id " + socket.id);
    console.log("Socket is authorized? " + socket.authorized);

    if (!socket.authorized) {
      res.success = false;
      res.err = "Socket isn't authorized";
      socket.emit("removeroom", res);
      return;
    }
    // Get user and room ids.
    if (!apiinput.validateInput(req, apiinput.validators.removeroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("removeroom", res);
      return;
    }
    // Remove user from room list.
    let updated = await RoomModel.updateOne(
      { _id: req.roomid }, // Filter
      { $pullAll: { users: [req.uid] } }
    );

    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "Room couldn't be removed";
      socket.emit("removeroom", res);
      return;
    }
    // remove room from user list.
    updated = await UserModel.updateOne(
      { _id: req.uid }, // Filter
      { $pullAll: { rooms: [room._id] } }
    );

    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "User couldn't be removed";
      socket.emit("removeroom", res);
      return;
    }

    res.success = true;
    socket.emit("removeroom", res);
    // Send back room to update frontend.
  }

  async deleteroom(socket, req) {
    var res = {};

    if (!apiinput.validateInput(req, apiinput.validators.removeroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("deleteroom", res);
      return;
    }
    if (!socket.authorized) {
      res.success = false;
      res.err = "Socket isn't authorized";
      socket.emit("deleteroom", res);
      return;
    }
    let room = await RoomModel.findOne({ _id: req.roomid }).exec();

    if (!(room.admin === req.uid)) {
      res.success = false;
      res.err = "User isn't admin, therefore can't delete the chatroom.";
      socket.emit("deleteroom", res);
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
      socket.emit("deleteroom", res);
      return;
    }

    // Remove the room object from the list user room, in each user.
    let updated = await UserModel.updateMany(
      { _id: { $in: room.users } },
      { $pullAll: { rooms: [room._id] } }
    );
    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "Messages couldn't be deleted";
      socket.emit("deleteroom", res);
      return;
    }

    // Delete the room itself.
    await RoomModel.deleteOne({ _id: room._id }, (err) => {
      if (err) {
        res.success = false;
        res.err = err;
        socket.emit("deleteroom", res);
        return;
      }
      res.success = true;
      socket.emit("deleteroom", res);
    });
  }

  async joinroom(socket, req) {
    res = {};
    console.log("Socket.id " + socket.id);
    console.log("Socket is authorized? " + socket.authorized);
    // KRIS DO THIS
    if (!socket.authorized) {
      res.success = false;
      res.err = "Socket isn't authorized";
      socket.emit("joinroom", res);
      return;
    }
    // Get user and room ids.
    if (!apiinput.validateInput(req, apiinput.validators.joinroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("joinroom", res);
      return;
    }
    // Find room.

    let room = await RoomModel.findOne({ _id: req.roomid }).exec();
    if (room === null) {
      res.success = false;
      res.err = "Room couldn't be identified";
      socket.emit("joinroom", res);
      return;
    }
    // Find user.
    let user = await UserModel.findOne({ _id: req.uid }).exec();
    if (user === null) {
      res.success = false;
      res.err = "User couldn't be identified";
      socket.emit("joinroom", res);
      return;
    }

    // Is user part of the room and is the room part of room.
    console.log("Room contains user? " + room.users.includes(req.uid));
    console.log("User contains room? " + user.rooms.includes(req.roomid));
    if (!(room.users.includes(req.uid) || user.rooms.includes(req.roomid))) {
      res.success = false;
      res.err = "Either user wasn't a part of the room, or the reverse";
      socket.emit("joinroom", res);
      return;
    }
    res.success = true;
    res.room = room;

    // KRIS Gave functionality to leave and join socket rooms dependent on socket.authorized. rooms names are their id.
    socket.join(room._id);
    socket.emit("joinroom", res);
    // Send back list of messages.
  }

  async leaveroom(socket, req) {
    var res = {};
    if (!apiinput.validateInput(req, apiinput.validators.leaveroom)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("leaveroom", res);
      return;
    }

    // Remove user from the room.
    let updated = await RoomModel.updateOne(
      { _id: req.roomid },
      { $pullAll: { users: [req.uid] } } // <--- Notice the array of userid. It is how you use it.
    );

    if (!(updated.nModified > 0)) {
      res.success = false;
      res.err = "User couldn't be removed from the room";
      socket.emit("leaveroom", res);
      return;
    }
    // Find room.

    let room = await RoomModel.findOne({ _id: req.roomid }).exec();
    if (room === null) {
      res.success = false;
      res.err = "Room couldn't be identified";
      socket.emit("leaveroom", res);
      return;
    }
    // Find user.
    let user = await UserModel.findOne({ _id: req.uid }).exec();
    if (user === null) {
      res.success = false;
      res.err = "User couldn't be identified";
      socket.emit("leaveroom", res);
      return;
    }

    // Is user part of the room and is the room part of room.
    console.log("Room contains user? " + room.users.includes(req.uid));
    console.log("User contains room? " + user.rooms.includes(req.roomid));
    if (!(room.users.includes(req.uid) || user.rooms.includes(req.roomid))) {
      res.success = false;
      res.err = "Either user wasn't a part of the room, or the reverse";
      socket.emit("leaveroom", res);
      return;
    }

    res.success = true;
    // KRIS Gave functionality to leave and join socket rooms dependent on socket.authorized.
    socket.leave(room._id);
    socket.emit("leaveroom", res);
  }

  LogIn(socket, req) {
    // KRIS This pseudocode has been implemented in userHandler.login, where we set the authorized attribute on the specific socket which logged in.
    // KRIS The part where joining the sockets to socket rooms, has been implemented in joinroom and leaveroom. They have been rewritten to be
    // about allowing allow join and leave in socket rooms.
    // while addroom and removeroom have been added to be about manipulating the rooms in the database.
    //
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
