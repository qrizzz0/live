var PORT = process.env.PORT || 3000; // take port from heroku or for loacalhost
var WebSocketUploader = require('./uploader.js')

var http = require("http").Server();

//moment js for timestamps
var moment = require("moment");
const fs = require('fs');

var clientInfo = {};
var currentUploads = {};

//socket io module
var io = require("socket.io")(http, {
  cors: {
    origin: "http://130.225.170.76",
    methods: ["GET", "POST"]
  }
});


// send current users to provided scoket
function sendCurrentUsers(socket) { // loading current users
  var info = clientInfo[socket.id];
  var users = [];
  if (typeof info === 'undefined') {
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
    text: "Current Users : " + users.join(', '),
    timestamp: moment().valueOf()
  });

}


// io.on listens for events
io.sockets.on("connection", function (socket) {

  socket.on('upload first slice', function (input) {
    currentUploads[input.id] = new WebSocketUploader(socket, input);
    console.log("receiving first slice for id: " + input.id + " name: " + input.name);

    var uploader = currentUploads[input.id];
    uploader.push(input);

    var userInfo = clientInfo[socket.id];
    io.in(userInfo.room).emit("message", {
      text: '<a href="data/' + input.name + '" target="_blank">' + input.name + '</a>' + " was sent" + " from user: " + userInfo.name,
      name: "System",
      timestamp: moment().valueOf()
    });
  });

  socket.on('upload next slice', function (input) {
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
        timestamp: moment().valueOf()
      });
      console.log("User: " + userdata.name + " has left" + " from room: " + userdata.room);
      // delete user data-
      delete clientInfo[socket.id];

    }
  });

  socket.on('login', function (hej) {
    if (database.brugernavn.exists) {
      if (hej.passwordhash == database.passwordhash) {
        clientInfo[socket.id].user = "kristofer"
      } else {
        socket.emit("failed password", {
          besked: "fuck dig dit brugernavn eksitstweteqet ikke",
        })
      }
    }

  });

  socket.on('get rooms', function (hej) {
    socket.emit("list of rooms", {
      roomCount: 0,
      etc: "et eller andet who knows",
    })
  });

  // for private chat
  socket.on('joinRoom', function (req) {
    clientInfo[socket.id] = req;
    socket.join(req.room);
    //broadcast new user joined room
    socket.broadcast.to(req.room).emit("message", {
      name: "System",
      text: req.name + ' has joined',
      timestamp: moment().valueOf()
    });
    console.log("User: " + req.name + " has joined room: " + req.room);

  });

  // to show who is typing Message

  socket.on('typing', function (message) { // broadcast this message to all users in that room
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
    name: "System"
  });

  // listen for client message
  socket.on("message", function (message) {
    console.log("Message Received : " + message.text + "\nFrom room: " + clientInfo[socket.id].room + " \nFrom user: " + clientInfo[socket.id].name);
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

http.listen(PORT, function () {
  console.log("server started");
});