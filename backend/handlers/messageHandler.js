var moment = require("moment");
var UserModel = require("../models/user");
var RoomModel = require("../models/room");
var MessageModel = require("../models/message");
const mongoose = require("mongoose");

const apiinput = require("../validators/APIvalidators");

class MessageHandler {
  constructor(clientInfo) {
    this.clientInfo = clientInfo;
  }

  message(socket, name, text) {
    var msg = {};
    msg.text = text;
    msg.timestamp = moment().valueOf();
    msg.uid = name;

    this.addMessageToDB(msg, null);

    socket.emit("message", msg);
  }

  broadcastTyping(socket, text) {
    socket.broadcast.to(this.clientInfo[socket.id].room).emit("typing", text);
  }

  broadcastMessage(socket, name, text, fileID) {
    console.log("broadcasting message: " + msg);

    var msg = {};
    msg.text = text;
    msg.timestamp = moment().valueOf();
    msg.name = name;

    this.addMessageToDB(msg, fileID);

    //Broadcasts to all except self
    socket.broadcast.to(this.clientInfo[socket.id].room).emit("message", msg);
    //Also send to self
    socket.emit("message", msg);
  }

  messageFromUsers(socket, msg) {
    var res = {};
    // UserId creating room is sent
    if (!apiinput.validateInput(msg, apiinput.validators.message)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("message", res);
      return;
    }

    console.log(
      "Message Received : " +
        msg.msg +
        "\nFrom room: " +
        msg.roomid +
        " \nFrom user: " +
        msg.uid
    );
    var newmessage = {
      text: msg.msg,
      timestamp: moment().valueOf(),
      sender: msg.uid,
      _id: new mongoose.Types.ObjectId(),
    };
    var message = new MessageModel(newmessage);

    message.save(async (err) => {
      if (err) {
        res.success = false;
        res.err = err;
        socket.emit("message", res);
        return;
      }
      var updated = await RoomModel.updateOne(
        { _id: msg.roomid },
        {
          // Update
          $push: {
            messages: newmessage._id,
          },
        }
      );
      if (!(updated.nModified > 0)) {
        res.success = false;
        res.err = err;
        socket.emit("message", res);
        return;
      }
      //this.addMessageToDB(msg, null);
      res = newmessage;
      res.success = true;
      socket.broadcast.to(msg.roomid).emit("message", msg);
    });
  }

  getNameFromSocket(socket) {
    return this.clientInfo[socket.id].name;
  }
  // Adding message to database:
  // create a message instance for db.
  // if file, create file instance for db. And link to
  // Add uid of message sender to message.
  // Add message _id, to the intended room.

  addMessageToDB(msg, file) {
    console.log("Adding message to DB: " + msg.text);
    var message = new MessageModel();

    message._id = new mongoose.Types.ObjectId();
    message.sender = msg.uid;
    message.timestamp = msg.timestamp;
    message.text = msg.text;
    if (file) {
      message.file = file;
    }

    message.save(async (err) => {
      if (err) {
        throw err;
        return;
      }
    });
  }
}

module.exports = MessageHandler;
