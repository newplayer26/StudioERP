const {
  User,
  Project,
  Task,
  Daily,
  Notification,
  Finance,
  Salary,
  Timekeep,
  Asset,
} = require("../models");
const { getCurrentDate } = require("../utils/helpers");
async function seed() {
  const user = {
    phone: "0000000000",
    email: "user@gmail.com",
    isHr: false,
    isProjectManager: false,
    isFinanceManager: false,
    name: "user",
    salt: "0",
    password: "1",
  };

  await User.create(user);
}
seed();
