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
        console.log("CookieID112312123: ", localStorage.getItem("cookieID"));
        window.location.replace("http://130.225.170.76/room.html");
    }
}

function checkEmail() {
    var rfc2822regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    var mail = document.getElementById("email");
    return rfc2822regex.test(mail);
}

function checkFormInput(){
    var checkName = document.getElementById("name");
    var checkPassword = document.getElementById("myPassword");
    if (!checkName.checkValidity || !checkPassword.checkValidity) {
        document.getElementById("valid1") = checkName.validationMessage;
        document.getElementById("valid2") = checkPassword.validationMessage;
    } else {
        document.getElementById("valid1").innerHTML = "Input OK";
        document.getElementById("valid2").innerHTML = "Input OK";
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
function main () {
    checkFormInput();
    
    setCookieID(document.getElementById("name").value);
    if (!checkEmail()){
        console.log("Not a valid email");
    }
}
