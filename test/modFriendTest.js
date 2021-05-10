const io = require("socket.io-client");
var socket = io.connect("http://localhost:3005");
var answer;

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

socket.on("connect", () => {
	connect();
});

socket.on("signup", (res) => {
	console.log(res);
});

socket.on("login", (res) => {
	console.log(res);
	answer = res;
	testFriend();
});

socket.on("modFriend", (res) => {
	console.log(res);
});

let validuser0 = {
	// Success true; only the first time ;)
	email: "pingvin@linux.com",
	username: "Bubber",
	hashed_password: "Bubber",
};

let validuser1 = {
	// Success true; only the first time ;)
	email: "isbjørn@linux.com",
	username: "Anders",
	hashed_password: "Anders",
};

let loginUser0 = {
	email: "pingvin@linux.com",
	hashed_password: "Bubber",
};

async function connect() {
	await sleep(1000);
	socket.emit("signup", validuser0);
	await sleep(1000);
	socket.emit("signup", validuser1);
	await sleep(1000);
	socket.emit("login", loginUser0);
	await sleep(1000);
}

async function testFriend() {
	let addFriend = {
		userID: answer.user._id,
		friendName: "Anders",
		addFriend: true,
	};

	let removeFriend = {
		userID: answer.user._id,
		friendName: "Anders",
		addFriend: false,
	};

	socket.emit("modFriend", addFriend);
	await sleep(1000);
	socket.emit("modFriend", removeFriend);
	await sleep(1000);

	socket.disconnect();
}
