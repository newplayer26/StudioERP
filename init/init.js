const { User, Project, Task, Daily } = require("../models");

async function init() {
  const admin = {
    phone: "0000000000",
    email: "admin@gmail.com",
    isHr: false,
    accessLevel: 1,
    pi: {
      name: "admin",
      dob: "",
      gender: "",
      location: {
        city: "",
        district: "",
        zipcode: "",
        address: "",
      },
    },
    name: "admin",
    salt: "0",
    password: "1",
    avtFile: "download.png",
    avtPath: "",
  };
  await User.create(admin);
}

module.exports = init;