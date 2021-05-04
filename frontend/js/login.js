var socket = io.connect("https://websocket.sovsehytten.tk");
var email = document.getElementById("email");
var hash_password = document.getElementById("myPassword");

function setCookieID(input) {
    localStorage.setItem("cookieID", input);
}

function getCookieID() {
    var cID = localStorage.getItem("cookieID");
    return cID;
}

function checkCookieID() {
    if (getCookieID() === null){
        console.log("User has no CookieID");
    } else {
       // window.location.replace("/room.html");
    }
}

function checkFormInput(){
    if (!email.checkValidity() || !hash_password.checkValidity()) {
        document.getElementById("valid1") = email.validationMessage;
        document.getElementById("valid2") = hash_password.validationMessage;
        return false;
    } else {
        return true;
    }
}

function showPassword() {
	var getPassword = document.getElementById("myPassword");
	if (getPassword.type === "password") {
		getPassword.type = "text";
	} else {
		getPassword.type = "password";
	}
}

checkCookieID();
console.log("CookieID: ", getCookieID());

socket.on("login", (res) => {
    console.log("Respond from login: ", res);
    if (res.success){
        //window.location.replace("/room.html");
    }
});


function login() {
    if (!checkFormInput()){
        console.log("FOrm not valid");
    } else{
        setCookieID(document.getElementById("name").value);
        socket.emit("login", {
            email,
            hash_password
        });
    }
}
