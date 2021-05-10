var socket = io.connect("https://websocket.sovsehytten.tk");

socket.on("connect", function () {
	let userInfo = getCookieID();
	if (userInfo === null) {
		alert("You cannot access the chat module when not logged in!");
		window.location.replace("/login.html");
	}
	socket.emit("login", {
		login: userInfo.email,
		hashed_password: userInfo.hashed_password,
	});
});

socket.on("login", function (res) {
	if (res.success) {
		console.log("Is Authorized");
	} else {
		alert("You have to log in!");
		window.location.replace("/login.html");
	}
});

socket.on("addroom", (res) => {
	if (res.success) {
		console.log("Successfully added user to room");
	} else {
		console.log("Addroom ERR: " + res.err);
	}
});

function getCookieID() {
	var cID = localStorage.getItem("cookieID");
	return JSON.parse(cID);
}
function setCookieID(input) {
	localStorage.setItem("cookieID", input);
}
function setRoomCookie(input) {
	localStorage.setItem("roomID", input);
}
function getRoomCookie() {
	var rID = localStorage.getItem("roomID");
	return rID;
}

var greetings = "Welcome " + getCookieID().username + "!";
document.getElementById("header-text").innerHTML = greetings;
console.log("CookieID: ", getCookieID());
console.log("RoomID: ", getRoomCookie());
var room;

socket.on("createroom", (res) => {
	console.log("Respond: ", res);
	if (res.success) {
		console.log("ROOM CREATED!");
		socket.emit("getallrooms", {});
	}
});

socket.on("getallrooms", (res) => {
	document.getElementById("list-group").innerHTML = "";

	console.log("Socket test: ", socket.id);
	console.log("RoomCookie: ", getRoomCookie());
	if (res.success) {
		res.rooms.forEach(function (item, index, array) {
			// var thisIssBullshiet = document.createElement("li");
			var allRooms = document.createElement("li");
			var textnode = document.createTextNode(item.name);
			allRooms.appendChild(textnode);
			allRooms.setAttribute("class", "rooms");
			var currentRoom = document.createElement("input");
			var roomInfo = document.createTextNode(JSON.stringify(item));
			currentRoom.setAttribute("type", "radio");
			currentRoom.setAttribute("name", "room");

			currentRoom.setAttribute("class", "radioBtn");
			currentRoom.setAttribute("value", item.name);
			currentRoom.appendChild(roomInfo);

			allRooms.appendChild(currentRoom);
			// thisIssBullshiet.appendChild(allRooms);
			document.getElementById("list-group").appendChild(allRooms);
		});
	}
	console.log("Respond: ", res);
});
socket.emit("getallrooms", {});

console.log("Room cookie: ", getRoomCookie());

function redirectToChat() {
	const rbs = document.querySelectorAll('input[name="room"]');
	for (const rb of rbs) {
		if (rb.checked) {
			console.log("Button checked with name : ", rb);
			setRoomCookie(rb.textContent);
			var room = JSON.parse(rb.textContent);
			var user = getCookieID();
			if (!room.users.includes(user._id))
				socket.emit("addroom", {
					uid: user._id,
					roomid: room._id,
				});
			window.location.replace("/chat.html");
		}
	}
}

function redirectToLogin() {
	localStorage.removeItem("cookieID");
	window.location.replace("/login.html");
}

function searchRooms() {
	// Man skal ikke kunne joine 'No room selected'
	// Man skal ikke komme videre til at vælge rooms uden at være logget ind

	var input = document.getElementById("search");
	var filter = input.value.toUpperCase();
	var ul = document.getElementById("list-group");
	var li = ul.getElementsByTagName("li");
	var a, txtValue;
	for (i = 0; i < li.length; i++) {
		a = li[i].getElementsByTagName("input")[0];
		txtValue = a.textContent || a.innerText;
		if (txtValue.toUpperCase().indexOf(filter) > -1) {
			li[i].style.display = "";
		} else {
			li[i].style.display = "none";
		}
	}
}

function createRooms() {
	var name = document.getElementById("create").value;
	var uid = getCookieID()._id; //SKal være dynamisk og ikke hardcodet
	console.log("Room name: ", name);

	socket.emit("createroom", {
		uid,
		name,
	});
}
