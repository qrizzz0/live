const io = require("socket.io-client");

var socket = io.connect("http://localhost:3005");
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

let validuser = {
	// Success true; only the first time ;)
	email: "pingvin@linux.com",
	username: "Bubber",
	hashed_password: "Bubber",
};

let alreadyuser = {
	// Success false; Username is already used.
	email: "pingvin@lagger.com",
	username: "Bubber",
	hashed_password: "Bubber",
};

let invaliduser = {
	// Success false; Invalid mail format. Also should check username.
	email: "pingvin@localhost",
	username: "",
	hashed_password: "UMOM",
};

let notuser = {
	// Success false; Invalid JSON. Should never be valid.
	date: "19/12/2020",
	age: 21,
	essential: true,
};

async function test() {
	await sleep(1000);
	socket.emit("signup", validuser);
	await sleep(1000);
	socket.emit("signup", alreadyuser);
	await sleep(1000);
	socket.emit("signup", invaliduser);
	await sleep(1000);
	socket.emit("signup", notuser);
	await sleep(1000);
	socket.disconnect();
}
