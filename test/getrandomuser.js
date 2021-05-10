const fetch = require("node-fetch");

async function getrandomuser() {
  randomuserraw = await fetch("https://randomuser.me/api/", {
    method: "get",
  });
  return await randomuserraw.json();
}
