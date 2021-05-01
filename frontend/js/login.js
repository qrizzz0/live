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
    var checkName = document.getElementById("name");
    var checkPassword = document.getElementById("myPassword");
    if (!checkName.checkValidity() || !checkPassword.checkValidity()) {
        document.getElementById("valid1") = checkName.validationMessage;
        document.getElementById("valid2") = checkPassword.validationMessage;
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

function login() {
    if (!checkFormInput()){
        console.log("FOrm not valid");
    } else{
        setCookieID(document.getElementById("name").value);
        window.location.replace("/room.html");
    }
        
    
    
}
