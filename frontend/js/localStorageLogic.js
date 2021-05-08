export function getCookieID() {
    var cID = localStorage.getItem("cookieID");
    return JSON.parse(cID);
}

export function setCookieID(input) {
    localStorage.setItem("cookieID", input);
}

export function getRoomCookie() {
    var rID = localStorage.getItem("roomID");
    return JSON.parse(rID);
}

export function setRoomCookie(input) {
    localStorage.setItem("roomID", JSON.stringify(input));
}

// Ingen ide om hvordan man inkludere funktionerne i andre filer