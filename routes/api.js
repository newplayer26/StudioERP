const express = require("express");
const router = express.Router({ mergeParams: true });
const { User, Timekeep, Avatar, Project, Task } = require("../models");
const { Op } = require("sequelize");
const wrapAsync = require("../utils/wrapAsync");
const moment = require("moment");
router.use(express.json());

router.post(
  "/users",
  wrapAsync(async (req, res) => {
    const searchTerm = req.query.search;
    const level = req.query.level;

    User.findAll(
      {
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { email: { [Op.like]: `%${searchTerm}%` } },
            { phone: { [Op.like]: `%${searchTerm}%` } },
          ],
        },
        include: {
          model: Avatar,
        },
      },
      {}
    )
      .then((users) => {
        return res.json(
          users.map((el) => {
            return {
              id: el.id,
              name: el.name,
              title: el.title,
              avatar: el.getavatar(),
            };
          })
        );
      })
      .catch((err) => {
        console.log(err);
      });
  })
);
router.get(
  "/projects",
  wrapAsync(async (req, res) => {
    const searchTerm = req.query.search;
    if (req.user.accessLevel <= 1 || req.user.isHr) {
      Project.findAll(
        {
          where: {
            [Op.or]: [
              { title: { [Op.like]: `%${searchTerm}%` } },
              { description: { [Op.like]: `%${searchTerm}%` } },
            ],
          },
        },
        {}
      )
        .then((projects) => {
          return res.json(
            projects.map((el) => {
              return {
                id: el.id,
                title: el.title,
              };
            })
          );
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      Project.findAll(
        {
          include: {
            model: User,
            as: "Members",
            where: {
              id: req.user.id,
            },
            required: true,
          },
          where: {
            [Op.or]: [
              { title: { [Op.like]: `%${searchTerm}%` } },
              { description: { [Op.like]: `%${searchTerm}%` } },
            ],
          },
        },
        {}
      )
        .then((projects) => {
          return res.json(
            projects.map((el) => {
              return {
                id: el.id,
                title: el.title,
              };
            })
          );
        })
        .catch((err) => {
          console.log(err);
        });
    }
  })
);

function checkAccessLevel(req, res, next) {
  next();
}

router.get(
  "/tasks/chart",
  wrapAsync(async (req, res) => {
    Task.findAll({
      where: {
        UserId: req.user.id,
      },
    }).then((tasks) => {
      let not_taken = 0;
      let completed = 0;
      let ongoing = 0;
      tasks.forEach((el) => {
        if (!el.isRead) {
          not_taken++;
        } else {
          if (el.progress == 100) completed++;
          else ongoing++;
        }
      });
      res.json({
        ongoing,
        completed,
        not_taken,
      });
    });
  })
);

module.exports = router;
