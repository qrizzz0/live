function setCookieID(input) {
    localStorage.setItem("cookieID", input);
}

function getCookieID() {
    var cID = localStorage.getItem("cookieID");
    return cID;
}

function checkCookieID() {
    if (!getCookieID().empty){
        //window.location.replace("http://130.225.170.76/room.html")
    } else {
        setCookieID("tester123");
    }
}

checkCookieID();
console.log(getCookieID());