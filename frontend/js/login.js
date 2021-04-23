function setCookieID(input) {
    localStorage.setItem("cookieID", input);
}

function getCookieID() {
    var cID = localStorage.getItem("cookieID");
    return cID;
}

function checkCookieID() {
    if (!getCookieID().empty){
        console.log(localStorage.getItem());
        window.location.replace("http://130.225.170.76/room.html");
    } else {
        setCookieID(document.getElementById("name"));
    }
}

function checkEmail() {
    var rfc2822regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    var mail = document.getElementById("email");
    return rfc2822regex.test(mail);
}

function checkFormInput(){
    var checkEmail = document.getElementById("email");
    var checkUser = document.getElementById("name");
    var checkPassword = document.getElementById("myPassword");
    if (!checkEmail.checkValidity || !checkUser.checkValidity || !checkPassword.checkValidity) {
        document.getElementById("valid1") = checkEmail.validationMessage;
        document.getElementById("valid2") = checkUser.validationMessage;
        document.getElementById("valid3") = checkPassword.validationMessage;
    } else {
        document.getElementById("valid1").innerHTML = "Input OK";
        document.getElementById("valid2").innerHTML = "Input OK";
        document.getElementById("valid3").innerHTML = "Input OK";
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

function main () {
    checkCookieID();
    console.log(getCookieID());
    checkFormInput();
    if (!checkEmail()){
        alert("Not a valid email");
        console.log("Not a valid email");
    }
    //window.location.replace("http://130.225.170.76/room.html"
}
