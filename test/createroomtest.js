const io = require("socket.io-client");
var socket = io.connect("http://localhost:3000");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
socket.on("connect", () => {
  test();
});
socket.on("login", (res) => {
  console.log(res);
});

let validchat = {
  // Success true; Valid in test environment.
  uid: "608d3ec173828f9ca07ca655",
  name: "BubberChat",
};

let validchat1 = {
  // Success true; Valid in test environment.
  uid: "608d3ec173828f9ca07ca655",
  name: "LinusTechChat",
};

let invalidchat = {
  // Success true; Valid in test environment.
  uid: "608d3ec173828f8ca07ca655",
  name: "BubberChat",
};

let notchat = {
  // Success false; Should also never be valid.
  date: "19/12/2020",
  age: 21,
  essential: true,
};

async function test() {
  await sleep(1000);
  socket.emit("login", validchat);
  await sleep(1000);
  socket.emit("login", validchat1);
  await sleep(1000);
  socket.emit("login", invalidchat);
  await sleep(1000);
  socket.emit("login", notchat);
  await sleep(1000);
  socket.disconnect();
}
