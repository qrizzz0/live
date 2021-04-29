/*
    This file is to give a recipe for the input.
    We can then control the format of inputs depending on the each API function.
*/

let validators = {
  login: {
    email: "",
    hashed_password: "",
  },
  signup: {
    email: "",
    username: "",
    hashed_password: "",
  },
  getuserinfo: {
    uid: "",
  },
  createroom: {
    uid: "",
  },
  removeroom: {
    roomid: "",
    uid: "",
  },
  leaveroom: {},
  joinroom: {
    uid: "",
    roomid: "",
  },
  changeadmin: {
    roomid: "",
    newadminid: "",
  },
};
module.exports = validators;
