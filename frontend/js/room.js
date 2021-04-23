
var name = getQueryVariable("name") || "Anonymous";
var greetings = "Wellcome " + localStorage.getItem("cookieID") + "!";
document.getElementById("header-text").innerHTML = greetings;
console.log(name);
console.log("Local storage: ", localStorage.getItem("cookieID"));

function redirectToLogin() {
    localStorage.removeItem("cookieID");
    window.location.replace("/login.html");
}