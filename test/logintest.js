const io = require("socket.io-client");
var socket = io.connect("http://172.26.127.94:3000");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 
socket.on("connect", () => {
    test();
  });
socket.on("login", (res)=>{
    console.log(res);
})

let validuser = { // Success true; Valid in test environment.
    email: "pingvin@linux.com",
    hashed_password: "Bubber",

}

let invaliduser = { // Success false; Valid in test environment.
    email: "marshall@matters.com",
    hashed_password: "UMOM",
}

let notuser = { // Success false; Should also never be valid.
    date: "19/12/2020",
    age: 21,
    essential: true,
}

async function test (){
await sleep(1000)
socket.emit("login", validuser);
await sleep(1000)
socket.emit("login", invaliduser);
await sleep(1000)
socket.emit("login", notuser);
await sleep(1000)
socket.disconnect();
}