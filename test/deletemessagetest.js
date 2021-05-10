const io = require("socket.io-client");
var socket = io.connect("http://localhost:3005");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

var timeout = 200;
var answer;
var message;
var room;


socket.on("connect", () => {
  test();
});

socket.on("signup", (res) => {
  console.log("signup");
  console.log(res);
});

socket.on("login", (res) => {
  console.log("login");
  answer = res;
  console.log(answer);
  test2();
});

socket.on("createroom", (res) => {
  console.log("createroom");
  room = res;
  console.log(room);
});

socket.on("message", (res) => {
  console.log("message");
  message = res;
  console.log(message);
});

socket.on("deletemessage", (res) => {
  console.log("deletemessage");
  console.log(res);
});


async function test() {
  await sleep(timeout);
  socket.emit("signup", validsignup);
  await sleep(timeout);
  socket.emit("login", validlogin);
  await sleep(timeout);
}

async function test2() {
	socket.emit("createroom", {
		uid: answer.user._id,
		name: "ChatRoomTest",
	});
	await sleep(timeout);

//MESSAGE DOES NOT WORK, THERFORE THE REST OF THE CODE IS UNTESTED !!!!!!!!!!!!!!!!!!

	socket.emit("message", {
        text: "testbesked",
        name: answer.user.username,
        timestamp:"asd",
	});
	await sleep(timeout);

	socket.emit("deletemessage", {
        roomid: room._id,
        messageid: message._id,
        userid: answer.user._id,
	});
	await sleep(timeout);

  socket.disconnect();
}


let validsignup = {
	// Success true; only the first time ;)
	email: "pingvin2@linux.com",
    username: "Bubber2",
	hashed_password: "Bubber2",
};


let validlogin = {
	// Success true; only the first time ;)
	login: "pingvin2@linux.com",
	hashed_password: "Bubber2",
};

/*
let validCreateRoom = {
  uid: user._id,
  name: "ChatRoomTest",
}

let validmessage = {
    text: "testbesked",
    name: user.username,
    timestamp:"asd",
}

let validmessagedelete = {
    roomid: room._id,
    messageid: message._id,
    userid: user._id,
}
*/
/*  deletemessage: {
    roomid: "",
    messageid: "",
    userid: "",
  },
  */ 