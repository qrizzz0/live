const io = require("socket.io-client");
const fetch = require("node-fetch");

var socket = io.connect("http://localhost:3005");
/*
    Use case test 1:
    Get random user info.
    User signs up an account.
    user logins to account.
    Creates a room.
    Joins the room.
    Then sends a message.
    Then leaves the room.
*/

let randomuser = {};

let signup = {};
let user = {};
let room = {};

async function getrandomuser() {
  randomuserraw = await fetch("https://randomuser.me/api/", {
    method: "get",
  });
  return await randomuserraw.json();
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function test() {
  await sleep(1000);
  socket.emit("signup", signup);
}

socket.on("connect", async () => {
  console.log("Succesfully connected, administering test: ");
  let randomuserlist = await getrandomuser();

  randomuser = randomuserlist.results[0];
  signup = {
    email: randomuser.email,
    username: randomuser.login.username,
    hashed_password: randomuser.login.password,
  };

  test();
});

socket.on("signup", (res) => {
  console.log("Socket.id: " + socket.id);
  console.log("Signup response: " + JSON.stringify(res));
  if (res.success) {
    user = res.user;
    socket.emit("login", {
      login: user.username,
      hashed_password: user.hashed_password,
    });
  } else console.log("Signup error: " + res.err);
});

socket.on("login", (res) => {
  console.log("Socket.id: " + socket.id);
  console.log("Login response: " + JSON.stringify(res));
  if (res.success) {
    console.log("Socket authorized: " + socket.authorized);
    socket.emit("createroom", { uid: user._id, name: user.username + " Room" });
  } else console.log("Login error: " + res.err);
});

socket.on("createroom", (res) => {
  console.log("Socket.id: " + socket.id);
  console.log("Createroom response: " + JSON.stringify(res));
  if (res.success) {
    room = res.room;
    socket.emit("joinroom", { uid: user._id, roomid: room._id });
  } else console.log("Createroom error: " + res.err);
});

socket.on("joinroom", (res) => {
  console.log("Socket.id: " + socket.id);
  console.log("Joinroom: " + JSON.stringify(res));
  if (res.success) {
    socket.emit("leaveroom", { uid: user._id, roomid: room._id }); // When sendmessage is made
  } else console.log("Joinroom error: " + res.err);
});

socket.on("sendmessage", (res) => {
  console.log("Socket.id: " + socket.id);
  console.log("Sendmessage response: " + JSON.stringify(res));
});

socket.on("leaveroom", (res) => {
  console.log("Socket.id: " + socket.id);
  console.log("Leaveroom response: " + JSON.stringify(res));
  if (res.success) {
    // End connection:
    socket.disconnect();
  } else console.log("Leaveroom error: " + res.err);
});
// User account
