const express = require("express");
const router = express.Router({ mergeParams: true });
const passport = require("passport");
const {
  renderLogin,
  isActive,
  requestLogin,
  returnHome,
  logOut,
} = require("../controllers/auth");

router.route("/login").get(renderLogin).post(requestLogin, returnHome);

router.route("/logout").post(logOut);

module.exports = router;
