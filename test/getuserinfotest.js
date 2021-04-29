const io = require("socket.io-client");
var socket = io.connect("http://172.26.127.94:3000");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
socket.on("connect", () => {
  test();
});
socket.on("getuserinfo", (res) => {
  console.log(res);
});

let validuser = {
  // Success true
  uid: "608abe5a930fb164d3c54aca", // Valid on my test case.
};

let invaliduser = {
  // Success false.
  uid: "marshall@matters.com", // Completely invalid objectid.
};

let notuser = {
  // Success false.
  date: "19/12/2020", // What even is this???
  age: 21,
  essential: true,
};

async function test() {
  await sleep(1000);
  socket.emit("getuserinfo", validuser);
  await sleep(1000);
  socket.emit("getuserinfo", invaliduser);
  await sleep(1000);
  socket.emit("getuserinfo", notuser);
  await sleep(1000);
  socket.disconnect();
}
