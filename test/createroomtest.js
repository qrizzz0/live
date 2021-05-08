const io = require("socket.io-client");
var socket = io.connect("http://localhost:3005");
const apiinput = require("../backend/validators/APIvalidators");

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

socket.on("signup", (res) => {
  console.log(res);
});

socket.on("login", (res) => {
	console.log(res);
  validCreateRoom.uid = res.uid;
  validCreateRoom.name = res.name;
});


async function test() {
  await sleep(1000);
  socket.emit("login", loginuser);
  await sleep(1000);
  socket.emit("createroom", validCreateRoom);
  await sleep(1000);
  socket.disconnect();
}

let validuser = {
	// Success true; only the first time ;)
	email: "pingvin@linux.com",
	username: "Bubber",
	hashed_password: "Bubber",
};

let loginuser = {
	// Success true; only the first time ;)
	login: "pingvin@linux.com",
	hashed_password: "Bubber",
};


let validCreateRoom = {
  uid: "",
  name: "",
}