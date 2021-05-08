var socket = io.connect("https://websocket.sovsehytten.tk");

var checkEmail = document.getElementById("email");
var checkUser = document.getElementById("name");
var hash_password = document.getElementById("myPassword");

var user = {};
var checkResponseSignUp = false;

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
        console.log("User: ", user);
    } else {
        console.log("CookieID112312123: ", localStorage.getItem("cookieID"));
        window.location.replace("/room.html");
    }
}

function checkEmailInput() {
    var rfc2822regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    var mail = document.getElementById("email");
    return rfc2822regex.test(mail);
}

function checkFormInput(){
    if (!email.checkValidity() || !checkUser.checkValidity() || !hash_password.checkValidity()) {
        document.getElementById("valid1") = email.validationMessage;
        document.getElementById("valid2") = checkUser.validationMessage;
        document.getElementById("valid3") = hash_password.validationMessage;
        return false;
    } else{
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
        return false;
    }
}

checkCookieID();
console.log("CookieID: ", getCookieID());

socket.on("signup", (res) => {
    console.log("Respond from signup: ", res);
    if(res.success){
        checkResponseSignUp = true;
    }else {
        checkResponseSignUp = false;
    }
});

function signup () {  
    
    if(!checkFormInput()){
        console.log("Not a valid form!")
    } else if (!checkPasswords()){
        alert("Passwords must be the same!");
        console.log("Passwords must be the same!");
    }else{
        user.email = email.value;
        user.username = checkUser.value;
        user.hashed_password = hash_password.value;

        console.log("User", user);
        socket.emit("signup", user);
        setCookieID(document.getElementById("email").value);
        window.location.replace("/room.html");
    }
    
    
    

}