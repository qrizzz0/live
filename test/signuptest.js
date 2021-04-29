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
  socket.on("signup", (res)=>{
      console.log(res);
  })
  
let validuser = {
    email: "pingvin@linux.com",
    username: "Bubber",
    hashed_password: "Bubber",
}

let alreadyuser = {
    email: "pingvin@lagger.com",
    username: "Bubber",
    hashed_password: "Bubber",
}

let invaliduser = {
    email: "pingvin@localhost",
    username: "",
    hashed_password: "UMOM",
}

let notuser = {
    date: "19/12/2020",
    age: 21,
    essential: true,
}

async function test (){
    await sleep(1000)
    socket.emit("signup", validuser);
    await sleep(1000)
    socket.emit("signup", alreadyuser);
    await sleep(1000)
    socket.emit("signup", invaliduser);
    await sleep(1000)
    socket.emit("signup", notuser);
    await sleep(1000)
    socket.disconnect();
    }