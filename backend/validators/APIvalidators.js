var _ = require("lodash");
/*
    This file is to give a recipe for the input.
    We can then control the format of inputs depending on the each API function.
*/
function validateInput(input, expected) {
  var inputKeys = Object.keys(input);
  var expectedKeys = Object.keys(expected);
  inputKeys.sort();
  expectedKeys.sort();
  return _.isEqual(inputKeys, expectedKeys);
}

let validators = {
  login: {
    login: "",
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
    name: "",
  },
  getallrooms: {},
  findroom: {
    name: "",
  },
  addroom: {
    uid: "",
    roomid: "",
  },
  deleteroom: {
    roomid: "",
    uid: "",
  },
  removeroom: {
    roomid: "",
    uid: "",
  },
  leaveroom: {
    uid: "",
    roomid: "",
  },
  joinroom: {
    uid: "",
    roomid: "",
  },
  changeadmin: {
    roomid: "",
    newadminid: "",
  },
  createfile: {
    id: "",
    filename: "",
    size: 0,
  },
  removefile: {
    id: "",
  },
  message: {
    uid: "",
    roomid: "",
    msg: "",
  },
};
module.exports.validators = validators;
module.exports.validateInput = validateInput;
