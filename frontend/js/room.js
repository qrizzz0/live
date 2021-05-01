var socket = io.connect("http://130.225.170.76/room.html");

var name = getQueryVariable("name") || "Anonymous";
var greetings = "Welcome " + localStorage.getItem("cookieID") + "!";
document.getElementById("header-text").innerHTML = greetings;
console.log(name);
console.log("Local storage: ", localStorage.getItem("cookieID"));

socket.on("getallroms", (res) => {
    console.log("Respond: ", res);
});

function redirectToLogin() {
    localStorage.removeItem("cookieID");
    window.location.replace("/login.html");
}

function searchRooms(){
    //socket.emit("getallrooms");
    let rooms = document.getElementById("rooms");
    console.log("Rooms: ", rooms);
}