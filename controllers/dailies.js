const {
  Project,
  Task,
  User,
  Daily,
  ProjectMember,
  File,
  Finance,
} = require("../models");
const db = require("../models");

const wrapAsync = require("../utils/wrapAsync");
const appError = require("../utils/appError");
const { Op } = require("sequelize");
const moment = require("moment");

module.exports.checkCredentials = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const daily = await Daily.findOne({
    where: {
      id,
    },
    include: [
      {
        model: Project,
      },
      {
        model: File,
        as: "Files",
      },
    ],
  });
  if (req.user.accessLevel <= 1) {
    res.locals.daily = daily;
    return next();
  } else {
    const leader = await ProjectMember.findOne({
      where: {
        UserId: req.user.id,
        ProjectId: daily.Project.id,
        isLeader: true,
      },
    });
    if (leader) {
      res.locals.daily = daily;
      return next();
    }
  }
  res.redirect(`/projects/${daily.Project.id}`);
});

module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const daily = res.locals.daily;
  const users = await User.findAll({
    include: [
      {
        model: Project,
        as: "Projects",
        where: {
          id: daily.Project.id,
        },
        required: true,
      },
      {
        model: File,
        as: "avatar",
      },
    ],
  });
  res.render("dailies/edit", { daily, project: daily.Project, users });
});

module.exports.deleteFile = wrapAsync(async (req, res, next) => {
  const { fileid, id } = req.params;

  const daily = await Daily.findOne({
    where: {
      id,
    },
    include: [
      {
        model: Project,
      },
      {
        model: File,
        as: "Files",
        where: {
          id: fileid,
        },
      },
    ],
  });
  if (req.user.accessLevel <= 1) {
    await daily.Files[0].destroy();
    return res.send("done");
  } else {
    const leader = await ProjectMember.findOne({
      where: {
        UserId: req.user.id,
        ProjectId: daily.Project.id,
        isLeader: true,
      },
    });
    if (leader) {
      await daily.Files[0].destroy();
      return res.send("done");
    }
  }
  res.send("unauthorized");
});

module.exports.postEdit = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const daily = res.locals.daily;
  let { title, description, user } = req.body;
  if (!user) {
    req.flash("error", "Nhiệm vụ cần có người phụ trách");
    return res.redirect(`/dailies/${id}/edit`);
  }
  for (let file of req.files) {
    const filebody = {
      fileDir: "dailies",
      fileDisplay: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      DailyId: daily.id,
    };
    const fileCreated = await File.create(filebody);
  }
  await daily.update({ title, description, UserId: user });
  res.redirect(`/projects/${daily.Project.id}`);
});
