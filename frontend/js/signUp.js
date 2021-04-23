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
    var checkEmail = document.getElementById("email");
    var checkUser = document.getElementById("name");
    var checkPassword = document.getElementById("myPassword");
    if (!checkEmail.checkValidity && !checkUser.checkValidity && !checkPassword.checkValidity) {
        document.getElementById("valid1") = checkEmail.validationMessage;
        document.getElementById("valid2") = checkUser.validationMessage;
        document.getElementById("valid3") = checkPassword.validationMessage;
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

function showConfirmPassword() {
    var getConfirmPassword = document.getElementById("confirmPassword");
    if (getConfirmPassword.type === "password") {
		getConfirmPassword.type = "text";
	} else {
		getConfirmPassword.type = "password";
	}
}

function checkPasswords() {
    var password = document.getElementById("myPassword").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    if (password === confirmPassword){
        return true;
    } else{
        document.getElementById("valid4").innerHTML.value = "Passwords must be the same";
        return false;
    }
}

checkCookieID();
checkFormInput();
console.log("CookieID: ", getCookieID());
function main () {
    setCookieID(document.getElementById("name").value);
    if (!checkEmail() || !checkPasswords()){
        
        console.log("Not a valid email");
    } else{}
        window.location.replace("/room.html")
    }
}
   
