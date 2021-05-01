const io = require("socket.io-client");
var socket = io.connect("http://172.23.96.245:3000");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
socket.on("connect", () => {
  test();
});
socket.on("createroom", (res) => {
  console.log(res);
});

let validroom = {
  // Success true; Valid in test environment.
  uid: "608d3ec173828f9ca07ca655",
};

let invaliduser = {
  // Success false; Valid in test environment.
  email: "marshall@matters.com",
  hashed_password: "UMOM",
};

let notuser = {
  // Success false; Should also never be valid.
  date: "19/12/2020",
  age: 21,
  essential: true,
};

async function test() {
  await sleep(1000);
  socket.emit("createroom", validuser);
  await sleep(1000);
  socket.emit("createroom", invaliduser);
  await sleep(1000);
  socket.emit("createroom", notuser);
  await sleep(1000);
  socket.disconnect();
}
