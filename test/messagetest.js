const io = require("socket.io-client");
var socket = io.connect("http://localhost:3005");

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  