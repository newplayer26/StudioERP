const express = require("express");
const crypto = require("crypto");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { User, File, Salary, Timekeep } = require("../models");
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
  if (!req.user.isHr && req.user.accessLevel > 1) {
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
    document: body.document,
    superiorId: body.superior,
    name: body.name,
    isActive: body.isActive,
    isFulltime: body.isFulltime,
    phone: body.phone,
    email: body.email,
    isHr: body.isHr,
    accessLevel: body.accessLevel,
  };
  if (body.document) {
    const find = await User.findOne({
      where: {
        document: body.document,
      },
    });
    if (find) {
      req.flash("error", "CCCD/CMND đã tồn tại");
      return res.redirect(`/users/new`);
    }
  }
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(`/users/new`);
  } else {
    if (validateUserInfo(info).error) {
      req.flash("error", validateUserInfo(info).error.details[0].message);
      return res.redirect(`/users/new`);
    }
  }
  if (req.file) {
    const contract = await File.create({
      fileDisplay: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileDir: "contracts",
    });
    info.contractId = contract.id;
  }
  info.salt = "0";
  info.password = "1";
  info.pi = body.pi;
  console.log(info);
  const newEmp = await User.create(info);
  req.flash("success", "Thêm nhân viên thành công");
  res.redirect(`/users/${newEmp.id}`);
});

module.exports.renderProfile = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    include: [
      {
        model: File,
        as: "avatar",
      },
      {
        model: File,
        as: "contract",
      },
      {
        model: Salary,
      },
    ],
  });

  const superior = await User.findByPk(user.superiorId, {
    include: [{ model: File, as: "avatar" }],
  });
  user.superior = superior;

  const { pi } = user;
  console.dir(user.avatar);
  res.render("users/profile", { user, pi });
});

module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    include: [
      { model: File, as: "avatar" },
      {
        model: Salary,
      },
    ],
  });
  let allowedEditPi = false;
  let allowedEditPW = false;
  if (req.user.id == id) {
    allowedEditPW = true;
  }
  if (req.user.isHr || req.user.accessLevel == 1) allowedEditPi = true;

  res.render("users/edit2", {
    user,
    pi: user.pi,
    location:
      user.pi && user.pi.location
        ? user.pi.location
        : { city: "", district: "", address: "" },
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
  const pi = {
    dob: req.body.dob,
    gender: req.body.gender,
    location: req.body.location,
  };
  const { error } = validatePiBody(pi);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(`/users/${id}/edit`);
  }
  const user = await User.update(
    { pi, name: req.body.name, phone: req.body.phone },
    { where: { id } }
  );
  req.flash("success", "Cập nhật thông tin thành công");
  res.redirect(`/users/${id}`);
});

module.exports.setAvatar = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    include: [
      {
        model: File,
        as: "avatar",
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
  const newFile = await File.create({
    fileDisplay: req.file.originalname,
    fileName: req.file.filename,
    filePath: req.file.path,
    fileDir: "avatars",
  });
  user.avatarId = newFile.id;
  await user.save();
  res.redirect(`/users/${id}/edit`);
});

module.exports.workInfoPage = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    include: [
      {
        model: File,
        as: "avatar",
      },
      {
        model: File,
        as: "contract",
      },
    ],
  });
  const superior = await User.findByPk(user.superiorId, {
    include: {
      model: File,
      as: "avatar",
    },
  });
  user.superior = superior;

  res.render("users/work", { user });
});

module.exports.submitInfoPage = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);
  let { document, isFulltime, isHr, accessLevel } = req.body;
  const body = { document, isFulltime, isHr, accessLevel };
  await File.destroy({ where: { id: user.contractId } });
  if (req.file) {
    const newFile = await File.create({
      fileDisplay: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileDir: "contracts",
    });
    body.contractId = newFile.id;
  }
  if (!body.superior) {
    body.superiorId = null;
  } else {
    body.superiorId = body.superior;
  }
  await user.update(body);
  res.redirect(`/users/${user.id}/info`);
});

module.exports.renderSalaryPage = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    include: [
      {
        model: Salary,
      },
    ],
  });

  res.render("users/salary", {
    user,
    salary: user.Salary ? user.Salary : { isMonthly: false, amount: 0 },
  });
});

module.exports.setSalary = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  console.log(req.body);
  Salary.findOne({
    where: {
      UserId: id,
    },
  })
    .then((salary) => {
      salary
        .update({ amount: req.body.amount, isMonthly: req.body.isMonthly })
        .then(() => {
          res.redirect(`/users/${id}`);
        })
        .catch((e) => {
          next(e);
        });
    })
    .catch(() => {
      Salary.create({
        amount: req.body.amount,
        isMonthly: req.body.isMonthly,
        UserId: id,
      })
        .then(() => {
          res.redirect(`/users/${id}`);
        })
        .catch((e) => {
          next(e);
        });
    });
});

module.exports.setTransaction = wrapAsync(async (req, res) => {
  const { id } = req.params;
  Salary.findOne({
    where: {
      UserId: id,
    },
  })
    .then((salary) => {
      salary
        .update({
          bankName: req.body.bankName,
          bankNumber: req.body.bankNumber,
        })
        .then(() => {
          res.redirect(`/users/${id}`);
        })
        .catch((e) => {
          next(e);
        });
    })
    .catch(() => {
      Salary.create({
        bankName: req.body.bankName,
        bankNumber: req.body.bankNumber,
        UserId: id,
      })
        .then(() => {
          res.redirect(`/users/${id}`);
        })
        .catch((e) => {
          next(e);
        });
    });
});

module.exports.getTimekeep = wrapAsync(async (req, res) => {
  const UserId = req.user.id;

  const now = moment.utc().utcOffset("+0700");
  const year = now.year();
  const month = now.month() + 1;
  const day = now.date();
  console.log(day);

  Timekeep.findOne({
    where: {
      UserId,
      date: { [Op.like]: `${year}-${month}-${day}%` },
      start: {
        [Op.not]: null,
      },
      end: null,
    },
  })
    .then((result) => {
      const resArr = result.start.split(":");
      resArr.push(now);
      console.log(res);
      res.json(resArr);
    })
    .catch((e) => {
      res.json({
        found: "none",
      });
    });
});

module.exports.postTimekeep = wrapAsync(async (req, res) => {
  const now = moment.utc().utcOffset("+0700");
  const year = now.year();
  const month = now.month() + 1;
  const day = now.date();
  console.log(day);
  const hours = now.hour();
  const minutes = now.minute();
  const seconds = now.second();
  const time = `${hours}:${minutes}:${seconds}`;
  if (req.body.type == "start") {
    const timekeep = await Timekeep.findOne({
      where: {
        UserId: req.user.id,
        date: { [Op.like]: `${year}-${month}-${day}%` },
        start: {
          [Op.not]: null,
        },
        end: null,
      },
    });
    if (timekeep) {
      res.status(400).send();
    } else {
      await Timekeep.create({
        UserId: req.user.id,
        date: `${year}-${month}-${day}`,
        start: time,
      });
      res.status(200).send();
    }
  } else if (req.body.type == "stop") {
    const timekeep = await Timekeep.findOne({
      where: {
        UserId: req.user.id,
        date: { [Op.like]: `${year}-${month}-${day}%` },
        start: {
          [Op.not]: null,
        },
        end: null,
      },
    });
    if (timekeep) {
      await timekeep.update({
        end: time,
      });
      res.status(200).send();
    } else {
      res.status(400).send();
    }
  }
});
