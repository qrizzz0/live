var UserModel = require("../models/user.js");
var mongoose = require("mongoose");
const apiinput = require("../validators/APIvalidators");
const basicUserInfo = ["username", "email"];

// Validate mail format, by matching with RFC 2822 standard regex.
// Return boolean.
// https://stackoverflow.com/questions/46155/how-to-va lidate-an-email-address-in-javascript
function validateMail(mail) {
  var rfc2822regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  return rfc2822regex.test(mail);
}

class UserHandler {
  async signup(socket, req) {
    var res = {};
    // Get signup information about the new user.
    if (!apiinput.validateInput(req, apiinput.validators.signup)) {
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
    console.log("new user:" + newuser);
    user
      .save()
      .then((r) => {
        res.success = true;
        res.user = r;
        socket.emit("signup", res);
      })
      .catch((err) => {
        res.success = false;
        res.err = err;
        socket.emit("signup", res);
        console.log("ERR: " + err);
      });
  }

  async login(socket, req) {
    var res = {};

    if (!apiinput.validateInput(req, apiinput.validators.login)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("login", res);
      return;
    }

    // get user information; mail and hashed password
    var user = req;

    let doc = {};

    if (apiinput.validateMail(user.login)) {
      doc = await UserModel.findOne({ email: user.login }).exec();
      if (doc === null) {
        // no user found
        res.success = false;
        res.err = "No user is found";
        socket.emit("login", res);
        return;
      }
    } else {
      doc = await UserModel.findOne({ username: user.login }).exec();
      if (doc === null) {
        // no user found
        res.success = false;
        res.err = "No user is found";
        socket.emit("login", res);
        return;
      }
    }

    // Select password from user. Match the stored password with the given.
    if (doc.hashed_password === user.hashed_password) {
      // Emit true if authenticated.
      res.success = true;
      res.user = doc;
      socket.authorized = true;
      socket.emit("login", res);
    } else {
      // Emit false if not authenticated.
      // Wrong password
      res.success = false;
      res.err = "Wrong password!";
      socket.emit("login", res);
      return;
    }
  }

  async getUserInfo(socket, req) {
    // UserID is sent.
    var res = {};
    // Get userID information about the new user.
    if (apiinput.validateInput(req, apiinput.validators.getuserinfo)) {
      res.success = false;
      res.err = "Invalid JSON Request";
      socket.emit("getuserinfo", res);
      return;
    }
    // Find user and sort out only basic info.
    var doc = await UserModel.findOne({ _id: req.uid })
      .select(basicUserInfo)
      .exec();
    if (doc === null) {
      res.success = false;
      res.err = "User couldn't be found";
      socket.emit("getuserinfo", res);
      return;
    }

    // Send back userinfo.
    res.success = true;
    res.user = doc;
    socket.emit("getuserinfo", res);
  }

  async modFriend(socket, req) {
    var res = {};
    // Finds user that adds another user to friend list
    var user = await UserModel.findOne({ _id: req.userID }).exec((err) => {
      if (err) {
        res.success = false;
        res.err = "Can't find user ID";
        socket.emit("modFriend", res);
        return;
      }
    });

    var friend = await UserModel.findOne({ _id: req.friendName }).exec(
      (err) => {
        if (err) {
          res.success = false;
          res.err = "Can't find friend Name";
          socket.emit("modFriend", res);
          return;
        }
      }
    );

    if (user.err == null && friend.err == null) {
      var cmd;
      if (req.addFriend) {
        cmd = $push;
      } else {
        cmd = $pull;
      }

      let updated = await UserModel.updateOne(
        { _id: user._id }, // Filter
        {
          user,
          // Update
          cmd: {
            friends: friend,
          },
        }
      );

      if (!(updated.nModified > 0)) {
        res.success = false;
        res.err = "User friendlist not updated";
        socket.emit("modFriend", res);
        return;
      }

      updated.clear();
      updated = await UserModel.updateOne(
        { _id: friend._id }, // Filter
        {
          friend,
          // Update
          cmd: {
            friends: user,
          },
        }
      );

      if (!(updated.nModified > 0)) {
        res.success = false;
        res.err = "Friend friendlist not updated";
        socket.emit("modFriend", res);
        return;
      }
    }

    res.succes = true;
    socket.emit("modFriend", res);
  }
}

module.exports = UserHandler;
