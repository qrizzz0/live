var PORT = process.env.PORT || 3000; // take port from heroku or for loacalhost
var SocketIOFileUpload = require('socketio-file-upload');
//var express = require("express");
//var app = express()
//    .use(SocketIOFileUpload.router)
//    .listen(PORT);
//var app = express(); // express app which is used boilerplate for HTTP
//var http = require("http").Server(app);

var http = require("http").Server();

//moment js for timestamps
var moment = require("moment");
const fs = require('fs');

var clientInfo = {};

//socket io module
var io = require("socket.io")(http, {
  cors: {
    origin: "http://130.225.170.76",
    methods: ["GET", "POST"]
  }
});

var files = {}, 
    struct = { 
        name: null, 
        type: null, 
        size: 0, 
        data: [], 
        slice: 0, 
    };

// expose the folder via express thought
//app.use(express.static(__dirname + '/public'));

// send current users to provided scoket
function sendCurrentUsers(socket) { // loading current users
  var info = clientInfo[socket.id];
  var users = [];
  if (typeof info === 'undefined') {
    return;
  }
  // filte name based on rooms
  Object.keys(clientInfo).forEach(function(socketId) {
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
io.sockets.on("connection", function(socket) {
  console.log("User is connected");


  var uploader = new SocketIOFileUpload();
  uploader.dir = "/home/cloud/live/backend/data";
  uploader.listen(socket);
  
  uploader.on("start", function(event){
    console.log(event);
  });

  uploader.on("saved", function(event){
    console.log(event.file);
  });

  // Error handler:
  uploader.on("error", function(event){
    console.log("Error from uploader", event);
  });

  socket.on('upload slice', function(input) {
      var userInfo = clientInfo[socket.id];
      console.log("Nice nice.")
      if (!files[input.name]) {
        files[input.name] = Object.assign({}, struct, input);  //Lav ny files (struct) med navn data.name
        files[input.name].data = []; 
      }

      input.data = new Buffer(new Uint8Array(input.data)); //Fix buffer til hvad end man bruger i dag

      files[input.name].data.push(input.data); 
      files[input.name].slice++;

      if (files[input.name].slice * 100000 >= files[input.name].size) {  //Hvis vi ændrer slice størrelse skal den ændres her
        //do something with the data 
        socket.emit('end upload'); 

        fs.writeFile('/home/cloud/live/frontend/data/' + files[input.name].name, files[input.name].data[0], FileSaveCallback);
        
        console.log("data er blevet uploadet. Nice nice.")
      } else { 
        socket.emit('request slice upload', { 
            currentSlice: files[input.name].slice 
        });  
      }

      io.in(userInfo.room).emit("message", {
        text: input.name + " was sent" + " from user: " + userInfo.name,
        name: "System",
        timestamp: moment().valueOf()        
      });

  });


  //for disconnection
  socket.on("disconnect", function() {
    var userdata = clientInfo[socket.id];
    if (typeof(userdata !== undefined)) {
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

  // for private chat
  socket.on('joinRoom', function(req) {
    clientInfo[socket.id] = req;
    socket.join(req.room);
    //broadcast new user joined room
    socket.broadcast.to(req.room).emit("message", {
      name: "System",
      text: req.name + ' has joined',
      timestamp: moment().valueOf()
    });

  });

  // to show who is typing Message

  socket.on('typing', function(message) { // broadcast this message to all users in that room
    socket.broadcast.to(clientInfo[socket.id].room).emit("typing", message);
  });

  // to check if user seen Message
  socket.on("userSeen", function(msg) {
    socket.broadcast.to(clientInfo[socket.id].room).emit("userSeen", msg);
    //socket.emit("message", msg);

  });

  socket.emit("message", {
    text: "Welcome to Chat Application !",
    timestamp: moment().valueOf(),
    name: "System"
  });

  // listen for client message
  socket.on("message", function(message) {
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

http.listen(PORT, function() {
  console.log("server started");
});

var FileSaveCallback = (err) => {
  if (err) throw err;
  console.log('File is saved!');
}