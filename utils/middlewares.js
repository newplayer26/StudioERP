
const {User, Project, Tasks} = require("../models")

const wrapAsync = require("./wrapAsync")



module.exports.isLoggedIn = (req, res, next) => {
  if (req.url === "/login") return next();
  if (!req.isAuthenticated()) {
    console.log(req.url);
    if(req.url !== '/home' && req.url !== "/" && req.url !== '/login')
      req.flash("error", "Vui lòng đăng nhập trước khi tiếp tục.");
    res.redirect("/login");
  } else return next();
};


