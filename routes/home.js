const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const { Task, Project, ProjectMember, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");
const { emitWarning } = require("process");

router.get(
  "",
  wrapAsync(async (req, res) => {
    res.render("main/home", { tasks: [], dailies:[], projects:[] });
  })
);

router.get("/tasks", async (req, res) => {
  Task.findAll({
    where: {
      UserId: req.user.id,
    },
    include: {
      model: Project,
    },
  })
    .then((tasks) => {
      let completed = 0,
        ongoing = 0,
        not_taken = 0;
      tasks.forEach((el) => {
        if (el.Project.progress < 100) {
          if (!el.isRead) {
            not_taken++;
          } else {
            if (el.progress == 100) completed++;
            else ongoing++;
          }
        } else completed++;
      });
      res.json({ completed, ongoing, not_taken });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/projects", async (req, res) => {
  if (req.user.accessLevel <= 1) {
    Project.findAll({
      include: [
        { model: Task, as: "Tasks" },
        { model: Daily, as: "Dailies" },
      ],
    })
      .then((projects) => {
        let completed = 0,
          ongoing = 0,
          planning = 0;
        projects.forEach((el) => {
          if (el.Tasks.length + el.Dailies.length) {
            if (el.progress == 100) completed++;
            else ongoing++;
          } else planning++;
        });
        res.json({ completed, ongoing, planning });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Project.findAll({
      include: [
        {
          model: User,
          as: "Members",
          through: ProjectMember,
          where: { id: req.user.id },
          required: true,
        },
        { model: Task, as: "Tasks" },
        { model: Daily, as: "Dailies" },
      ],
    })
      .then((projects) => {
  
        let completed = 0,
          ongoing = 0,
          planning = 0;
        projects.forEach((el) => {
          if (el.Tasks.length + el.Dailies.length) {
            if (el.progress == 100) completed++;
            else ongoing++;
          } else planning++;
        });
        res.json({ completed, ongoing, planning });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

module.exports = router;
