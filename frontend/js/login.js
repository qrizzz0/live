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
       window.location.replace("/room.html");
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

function checkEmailInput() {
    var rfc2822regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    var mail = document.getElementById("email");
    return rfc2822regex.test(mail);
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



function login() { //LOGIN VIRKER IKKE ORDENTLIGT. Man bliver logget ind selv om man ikke er en bruger
    if (!checkFormInput()){
        console.log("Form not valid");
        alert("Form invald");
    } else if(!checkCookieID()) {
        alert("No cookie id");
    } else {
        setCookieID(document.getElementById("email").value);
        socket.emit("login", {
            email,
            hash_password
        });
    }
}
