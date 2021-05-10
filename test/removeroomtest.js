const io = require("socket.io-client");
var socket = io.connect("http://localhost:3005");
var answer;

var email = "theis2@testen.com";
var username = "theis2";
var pass = "theis2";

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
socket.on("connect", () => {
	test();
});

socket.on("signup", (res) => {
	console.log(res);
});

socket.on("login", (res) => {
	console.log(res);
	answer = res;
	test2();
});

socket.on("createroom", (res) => {
	console.log(res);
});

socket.on("removeroom", (res) => {
	console.log(res);
});

async function test() {
	// succes: true/false - depents if user is created already
	socket.emit("signup", signupuser);
	await sleep(1000);
	// succes: true
	socket.emit("login", loginuser);
	await sleep(1000);
}

async function test2() {
	// succes: true
	socket.emit("createroom", {
		uid: answer.user._id,
		name: "ChatRoomTest",
	});
	await sleep(1000);
	// succes: false - invalid roomid
	socket.emit("removeroom", {
		roomid: "6096673afd8cfb32794b1ccb",
		uid: answer.user._id,
	});

	// succes: false - invalid uid
	await sleep(1000);
	socket.emit("removeroom", {
		roomid: answer.user.rooms[0],
		uid: "608d3c2bd148e810166babcd",
	});

	// succes: true
	await sleep(1000);
	socket.emit("removeroom", {
		roomid: answer.user.rooms[0],
		uid: answer.user._id,
	});
	await sleep(1000);

	socket.disconnect();
}

let signupuser = {
	email: email,
	username: username,
	hashed_password: pass,
};

let loginuser = {
	login: email,
	hashed_password: pass,
};
