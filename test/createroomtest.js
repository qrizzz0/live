const io = require("socket.io-client");
var socket = io.connect("http://localhost:3005");

var answer;
var email = "theis1@linux.com";
var username = "theis1";
var pass = "theis1";

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

	// succes: false - error in object uid
	socket.emit("createroom", {
		uid: "notWorking",
		name: "ChatRoomTest",
	});
	await sleep(1000);

	// succes: false - uid does not exist in database
	socket.emit("createroom", {
		uid: "608d3c2bd148e810166b1df1",
		name: "ChatRoomTest",
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
