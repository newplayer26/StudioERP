const express = require("express");
const crypto = require("crypto");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { User, File, Avatar } = require("../models");
const { Op } = require("sequelize");
const {
  dateToObj,
  getCurrentDate,
  validatePiBody,
  validateUserInfo,
} = require("../utils/helpers");
const fs = require("fs");
const { isModuleNamespaceObject } = require("util/types");
const { wrap } = require("module");
const moment = require("moment");

module.exports.checkCredentials = (req, res, next) => {
  if (!req.user.isHr) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này!");
    return res.redirect("/home");
  }
  res.locals.isAllowedHr = true;
  next();
};

module.exports.showEmployees = wrapAsync(async (req, res) => {
  const all = await User.findAll({});
  for (let one of all) {
    one.toJSON();
  }
  res.render("users/all", { all });
});

module.exports.renderNewForm = (req, res) => {
  console.log(res.locals.body);
  res.render("users/new");
};

module.exports.createUser = wrapAsync(async (req, res) => {
  const body = req.body;
  let error = validatePiBody(body.pi).error;
  const info = {
    identification: body.identification,
    name: body.name,
    phone: body.phone,
    email: body.email,
    dob: body.dob,
    gender: body.gender,
    isHr: body.isHr == "on" ? true : false,
    isProjectManager: body.isProjectManager == "on" ? true : false,
    isFinanceManager: body.isFinanceManager == "on" ? true : false,
  };
  console.log(body);
  info.salt = "0";
  info.password = "1";
  info.location = Object.values(body.location).join(", ");

  const newEmp = await User.create(info);
  req.flash("success", "Thêm nhân viên thành công");
  res.redirect(`/users/${newEmp.id}`);
});

module.exports.renderProfile = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    include: [
      {
        model: Avatar,
      },
    ],
  });

  res.render("users/profile", { user });
});

module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    include: [{ model: Avatar }],
  });
  let allowedEditPi = false;
  let allowedEditPW = false;
  if (req.user.id == id) {
    allowedEditPW = true;
  }
  if (req.user.isHr) allowedEditPi = true;
  const location = user.location.split(", ", 3);
  if (location.length < 3) {
    location.push(" ");
    location.push(" ");
    location.push(" ");
  }
  res.render("users/edit2", {
    user,
    location,
  });
});
module.exports.editPw = wrapAsync(async (req, res) => {
  const { current_pw, new_pw, new_pw_confirm } = req.body;
  const { id } = req.params;
  const failedValidation = (msg) => {
    req.flash("error", msg);
  };
  if (new_pw !== new_pw_confirm) {
    failedValidation("Nhập lại mật khẩu không đúng");
    return res.redirect(`/users/${id}/edit`);
  }
  const user = await User.findByPk(id);
  if (
    user.password ==
    crypto.pbkdf2Sync(current_pw, user.salt, 1000, 64, "sha512").toString("hex")
  ) {
    user.salt = crypto.randomBytes(16).toString("hex");
    user.password = crypto
      .pbkdf2Sync(new_pw, user.salt, 1000, 64, "sha512")
      .toString("hex");
    await user.save();
    req.flash("success", "Đổi mật khẩu thành công");
    return res.redirect(`/users/${id}/edit`);
  }
});

module.exports.isOwnProfile = (req, res, next) => {
  const { id } = req.params;
  if (req.user.id != id) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này!");
    res.redirect(`/users/${id}`);
  }
  next();
};

module.exports.pushEditPi = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const info = {
    identification: body.identification,
    //name: body.name,
    phone: body.phone,
    email: body.email,
    dob: body.dob,
    gender: body.gender,
  };
  info.location = Object.values(body.location).join(", ");
  const user = await User.update(info, { where: { id } });
  req.flash("success", "Cập nhật thông tin thành công");
  res.redirect(`/users/${id}`);
});

module.exports.setAvatar = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    include: [
      {
        model: Avatar,
      },
    ],
  });

  if (user.getavatar().id) {
    await File.destroy({
      where: {
        id: user.getavatar().id,
      },
    });
  }
  const newFile = await Avatar.create({
    fileDisplay: req.file.originalname,
    fileName: req.file.filename,
    filePath: req.file.path,
    fileDir: "avatars",
    userId: req.user.id,
  });
  res.redirect(`/users/${id}/edit`);
});

module.exports.workInfoPage = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);

  res.render("users/work", { user });
});

module.exports.submitInfoPage = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);
  const body = req.body;
  const info = {
    isHr: body.isHr == "on" ? true : false,
    isProjectManager: body.isProjectManager == "on" ? true : false,
    isFinanceManager: body.isFinanceManager == "on" ? true : false,
  };
  await user.update(info);
  res.redirect(`/users/${user.id}/info`);
});
