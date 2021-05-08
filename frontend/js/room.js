var socket = io.connect("https://websocket.sovsehytten.tk");

var name = getQueryVariable("name") || "Anonymous";
var greetings = "Welcome " + localStorage.getItem("cookieID") + "!";
document.getElementById("header-text").innerHTML = greetings;
console.log(name);
console.log("Local storage: ", localStorage.getItem("cookieID"));
var room;

socket.on("createroom", (res) => {
    console.log("Respond: ", res);
    if (res.success){
        console.log("ROOM CREATED!");
    }
});


socket.on("getallrooms", (res) => { // Denne funktion virker ikke ordentligt
    console.log("Function call: getallrooms ");
    if (res.success){
        res.rooms.forEach(function(item, index, array){
            var thisIssBullshiet = document.createElement("li");
            var allRooms = document.createElement("a");
            var currentRoom = document.createTextNode(item.name);
            allRooms.appendChild(currentRoom);
            thisIssBullshiet.appendChild(allRooms);
            document.getElementById("list-group").appendChild(thisIssBullshiet);
        });
    }
    console.log("Respond: ", res);
});
socket.emit("getallrooms", {

});



function redirectToLogin() {
    localStorage.removeItem("cookieID");
    window.location.replace("/login.html");
}

function searchRooms(){ // Man skal ikke kunne joine 'No room selected'
    // Man skal ikke komme videre til at vælge rooms uden at være logget ind

    
    var input = document.getElementById("search");
    var filter = input.value.toUpperCase();
    var ul = document.getElementById("list-group");
    var li = ul.getElementsByTagName("li");
    var a, txtValue;
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
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
    var uid = "608d5e6bb3795957df1a9d2f"; //SKal være dynamisk og ikke hardcodet
    console.log("Room name: ", name);

    socket.emit("createroom", {
        uid,
        name
    });
}