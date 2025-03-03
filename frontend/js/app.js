var socket = io.connect("https://websocket.sovsehytten.tk");
// listen for server connection
// get query params from url
var room = localStorage.getItem("roomID");

var currentUploads = {};

function getRoomCookie() {
	var rID = localStorage.getItem("roomID");
	return JSON.parse(rID);
}
function setRoomCookie(input) {
	localStorage.setItem("roomID", input);
}
function getCookieID() {
	var cID = localStorage.getItem("cookieID");
	return JSON.parse(cID);
}

console.log("Local storage: ", getRoomCookie());

console.log("RoomID: ", getRoomCookie());

//$(".room-title").text(getRoomCookie().name);

// fires when client successfully conencts to the server
socket.on("connect", function () {
	console.log("Connected to Socket I/O Server!");
	console.log("Socket test: ", socket.id);
	console.log(name + " wants to join  " + room);
	// to join a specific room
	let userInfo = getCookieID();
	let roomInfo = getRoomCookie();
	if (userInfo === null) {
		alert("You cannot access the chat module when not logged in!");
		window.location.replace("/login.html");
	} else if (roomInfo === null) {
		alert("You cannot access the chat module without choosing a room!");
		window.location.replace("/room.html");
	}
	document.getElementById("room-title").innerHTML = getRoomCookie().name;
	socket.emit("login", {
		login: userInfo.email,
		hashed_password: userInfo.hashed_password,
	});
});

socket.on("login", function (res) {
	if (res.success) {
		console.log("Is Authorized");
		var joinroom = {
			uid: getCookieID()._id,
			roomid: getRoomCookie()._id,
		};
		socket.emit("joinroom", joinroom);
	}
});

socket.on("joinroom", (res) => {
	if (res.success) {
		console.log("Successfully joined room");
		socket.emit("getallmessages", { roomid: getRoomCookie()._id });
	} else {
		alert("Joinroom ERR: " + res.err);
		console.log("Joinroom ERR: " + res.err);
	}
});

socket.on("getallmessages", (res) => {
	if (res.success) {
		res.messages.forEach((item, index, array) => {
			// insert messages in container
			var allMessages = $(".messages");
			var currentMessage = $('<li class = "list-group-item"></li>');

			var momentTimestamp = moment
				.utc(item.timestamp)
				.local()
				.format("DD-MM-YY HH:mm a");
			//$(".messages").append($('<p>').text(message.text));
			currentMessage.append(
				"<strong>" + momentTimestamp + " " + item.sender.username + "</strong>"
			);
			currentMessage.append("<p>" + item.text + "</p>");
			allMessages.append(currentMessage);
		});
	} else {
		console.log("Getallmessages ERR: " + res.err);
	}
});
///////////////// Clean this timeout shit up
// below code is to know when typing is there
var timeout;

function timeoutFunction() {
	typing = false;
	//console.log("stopped typing");
	// socket.emit("typing", false);
	socket.emit("typing", {
		text: "", //name + " stopped typing"
		roomid: getRoomCookie()._id,
	});
}

function exitChat() {
	localStorage.removeItem("roomID");
	window.location.replace("/room.html");
}
///////////////// Clean this up
// if key is pressed typing message is seen else auto after 2 sec typing false message is send
// TODO : add broadcast event when server receives typing event
$("#messagebox").keyup(function () {
	console.log("happening");
	typing = true;
	$("#icon-type").removeClass();
	//console.log("typing typing ....");
	//socket.emit('typing', 'typing...');
	socket.emit("typing", {
		text: getCookieID().username + " is typing ...",
		roomid: getRoomCookie()._id,
	});
	clearTimeout(timeout);
	timeout = setTimeout(timeoutFunction, 1000);
});

///////////////// Clean this up
// below is the checking for page visibility api
var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
	// Opera 12.10 and Firefox 18 and later support
	hidden = "hidden";
	visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
	hidden = "mozHidden";
	visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
	hidden = "msHidden";
	visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
	hidden = "webkitHidden";
	visibilityChange = "webkitvisibilitychange";
}

function redirectToRoom() {
	setRoomCookie(null);
	window.location.replace("/room.html");
}

function uploadFileBetter() {
	var fileInput = document.getElementById("file");

	document.getElementById("progressBar").hidden = false;

	if ("files" in fileInput) {
		if (fileInput.files.length == 0) {
			console.log("No file selected!");
		} else {
			for (var i = 0; i < fileInput.files.length; i++) {
				var file = fileInput.files[i];
				var uploader = new WebSocketUploaderClient(
					socket,
					file,
					100000,
					getCookieID()._id,
					getRoomCookie()._id,
				);
				uploader.uploadFirstSlice();
				currentUploads[uploader.getId()] = uploader; //Save the WebSocketUploaderClient in the array of uploads
			}
		}
	}
	document.getElementById("file").value = "";
}

socket.on("request next slice", function (input) {
	if (currentUploads[input.id] === undefined) {
		console.log(
			"File slice for undefined file requested. Sending abort to server."
		);
		socket.emit("abort file upload", {
			id: input.id,
		});
	}

	currentUploads[input.id].uploadSpecificSlice(input.currentSlice);
	console.log(
		"next slice: " + input.currentSlice + "requested, id: " + input.id
	);

	document.getElementById("movingBar").style.width =
		currentUploads[input.id].getProgress(input.currentSlice) + "%";
});

socket.on("end upload", function (input) {
	delete currentUploads[input.id];
	if ((input.success = true)) {
		document.getElementById("progressBar").hidden = true;
	} else {
		document.getElementById("movingBar").style.backgroundColor = "red";
	}
});

//listening for typing  event
socket.on("typing", function (message) {
	$(".typing").text(message.text);
});

//setup for custom events
socket.on("message", function (message) {
	console.log("New Message !");
	console.log(message);
	// insert messages in container
	var allMessages = $(".messages");
	var currentMessage = $('<li class = "list-group-item"></li>');

	var momentTimestamp = moment
		.utc(message.msg.timestamp)
		.local()
		.format("DD-MM-YY HH:mm a");
	//$(".messages").append($('<p>').text(message.text));
	currentMessage.append(
		"<strong>" +
			momentTimestamp +
			" " +
			message.msg.sender.username +
			"</strong>"
	);
	currentMessage.append("<p>" + message.msg.text + "</p>");
	allMessages.append(currentMessage);
	// handle autoscroll
	// manage autoscroll
	var obj = $("ul.messages.list-group");
	var offset = obj.offset();
	var scrollLength = obj[0].scrollHeight;
	//  offset.top += 20;
	$("ul.messages.list-group").animate({
		scrollTop: scrollLength - offset.top,
	});
});

// handles submitting of new message
var $form = $("#messageForm");
var $message1 = $form.find("input[name=message]");
$form.on("submit", function (event) {
	event.preventDefault();
	var msg = $message1.val();
	//prevent js injection attack
	msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
	if (msg === "") return -1; //empty messages cannot be sent
	var user = getCookieID();
	var room = getRoomCookie();
	socket.emit("message", {
		msg: msg,
		uid: user._id,
		roomid: room._id,
	});
	// show user messageForm
	var allMessages = $(".messages"); //Creates DOM HTML element
	var currentMessage = $('<li class = "list-group-item"></li>'); //Creates DOM HTML element

	var momentTimestamp = moment().format("h:mm a");
	// $(".messages").append($('<p>').text(message.text));
	currentMessage.append(
		"<strong>" + momentTimestamp + " " + name + "</strong>"
	);
	//$message.append("<p>" + $message1.val()+ "</p>");
	currentMessage.append(
		$("<p>", {
			class: "mymessages",
			text: $message1.val(),
		})
	);
	allMessages.append(currentMessage);
	$message1.val("");
	// manage autoscroll
	var obj = $("ul.messages.list-group");
	var offset = obj.offset();
	var scrollLength = obj[0].scrollHeight;
	//  offset.top += 20;
	$("ul.messages.list-group").animate({
		scrollTop: scrollLength - offset.top,
	});
});
