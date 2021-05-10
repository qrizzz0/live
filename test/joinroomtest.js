const io = require("socket.io-client");
var socket = io.connect("http://localhost:3005");

var answer;
var email = "theis0@linux.com";
var username = "theis0";
var pass = "theis0";

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
	console.log("login");
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
	socket.emit("signup", signupuser);
	await sleep(1000);
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

	socket.emit("joinroom", {
		uid: answer.user._id,
		roomid: "ChatRoomTest",
	});
	await sleep(1000);

	// succes: true
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
