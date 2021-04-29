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
socket.on("getuserinfo", (res)=>{
    console.log(res);
})

let validuser = {
    uid: '608abe5a930fb164d3c54aca'
}

let invaliduser = {
    uid: "marshall@matters.com"
}

let notuser = {
    date: "19/12/2020",
    age: 21,
    essential: true,
}

async function test (){
await sleep(1000)
socket.emit("getuserinfo", validuser);
await sleep(1000)
socket.emit("getuserinfo", invaliduser);
await sleep(1000)
socket.emit("getuserinfo", notuser);
await sleep(1000)
socket.disconnect();
}