var socket = io.connect("https://websocket.sovsehytten.tk");
var email = document.getElementById("email");
var password = document.getElementById("myPassword");

var checkResponseLogin = false;
function setCookieID(input) {
  localStorage.setItem("cookieID", input);
}

function getCookieID() {
  var cID = localStorage.getItem("cookieID");
  return JSON.parse(cID);
}

function checkCookieID() {
  if (getCookieID() === null) {
    console.log("User has no CookieID");
  } else {
    //window.location.replace("/room.html");
  }
}

function checkFormInput() {
  if (!email.checkValidity() || !password.checkValidity()) {
    document.getElementById("valid1") = email.validationMessage;
    document.getElementById("valid2") = password.validationMessage;
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
  if (res.success) {
    checkResponse = true;
    setCookieID(JSON.stringify(res.user));
    window.location.replace("/room.html");
    console.log("CookieID: ", getCookieID());
  } else {
    alert("User does not exist");
  }
});

function login() {
  if (!checkFormInput()) {
    console.log("Form not valid");
    alert("Form invald");
  } else {
    console.log("Email: " + email.value + " Password: " + password.value);
    const login = email.value;
    const hashed_password = password.value;
    socket.emit("login", {
      login,
      hashed_password,
    });
  }
}
