const wrapAsync = require("../utils/wrapAsync");
const {
  User,
  Task,
  Project,
  File,
  Avatar,
  FinancialReports,
  sequelize,
  Timekeep,
  Asset,
} = require("../models");
const {
  getCurrentDate,
  getDates,
  getLastDateOfMonth,
} = require("../utils/helpers");

const { Op } = require("sequelize");
const moment = require("moment");

module.exports.renderDashboard = (req, res) => {
  res.render("main/manageDashboard");
};

module.exports.checkAccessLevel = (req, res, next) => {
  if (req.user.accessLevel >= 2 && !req.user.isHr) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    return res.redirect("");
  }
  next();
};

module.exports.renderProjects = wrapAsync(async (req, res) => {
  const ownProjects = await Project.findAll({
    include: [
      {
        model: User,
        as: "Members",
        where: {
          id: req.user.id,
        },
        required: true,
      },
      { model: Task, as: "Tasks" },
      { model: Daily, as: "Dailies" },
    ],
    order: [
      ["createdAt", "DESC"],
      ["progress", "ASC"],
    ],
  });

  const projects = await Project.findAll({
    include: [
      { model: Task, as: "Tasks" },
      { model: Daily, as: "Dailies" },
      {
        model: User,
        as: "Members",
      },
    ],
    order: [
      ["createdAt", "DESC"],
      ["progress", "ASC"],
    ],
  });

  let isAdmin = false;
  if (req.user.accessLevel <= 1) isAdmin = true;
  res.render("main/manageProject", { projects, isAdmin, ownProjects });
});

module.exports.renderUsers = wrapAsync(async (req, res) => {
  let isHr = req.user.isHr;
  res.render("main/manageUsers", { isHr });
});

module.exports.renderTimekeep = (req, res) => {
  res.render("main/timekeep", { dateNow: getCurrentDate() });
};

module.exports.fetchUsers = async (req, res) => {
  User.findAll(
    {
      where: {
        isActive: true,
      },
      include: [
        {
          model: Avatar,
        },
      ],
    },
    {}
  )
    .then((users) => {
      let all = [];
      let salaries = [];
      users.forEach(function (user) {
        let userStr = `<a href="/users/${user.id}" class="avt-link"><span>
      <img src="/uploads/avatars/${user.getavatar().fileName}" alt="user-image"
      width="32"
      height="32"
      class="rounded-circle">
    </span>
    ${user.name}</a>`;

        let one = [users.indexOf(user) + 1, userStr, user.phone, user.email];
        all.push(one);
      });
      res.json(all);
    })
    .catch((er) => {
      console.log(er);
    });
};

module.exports.fetchSalary = wrapAsync(async (req, res) => {
  const { month } = req.query;
  console.log(month);
  if (req.user.isHr || req.user.accessLevel <= 1) {
    User.findAll({
      where: {
        isActive: true,
      },
      include: [
        {
          model: File,
          as: "avatar",
        },
        {
          model: Timekeep,
          as: "Timekeeps",
          where: sequelize.and(
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal("YEAR FROM Timekeeps.date")
              ),
              parseInt(month.split("-")[0])
            ),
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal("MONTH FROM Timekeeps.date")
              ),
              parseInt(month.split("-")[1])
            ),
            sequelize.where(sequelize.col("start"), {
              [Op.not]: null,
            }),
            sequelize.where(sequelize.col("end"), {
              [Op.not]: null,
            })
          ),
          required: false,
        },
        {
          model: Salary,
          required: false,
        },
        {
          model: Finance,
          where: sequelize.and(
            sequelize.where(sequelize.col("Finances.isExpense"), true),
            sequelize.where(sequelize.col("Finances.isAdvanced"), true),
            sequelize.or(
              sequelize.and(
                sequelize.where(
                  sequelize.fn(
                    "EXTRACT",
                    sequelize.literal("YEAR FROM Finances.date")
                  ),
                  parseInt(month.split("-")[0])
                ),
                sequelize.where(
                  sequelize.fn(
                    "EXTRACT",
                    sequelize.literal("MONTH FROM Finances.date")
                  ),
                  parseInt(month.split("-")[1])
                )
              ),
              sequelize.and(
                sequelize.where(
                  sequelize.fn(
                    "EXTRACT",
                    sequelize.literal("YEAR FROM Finances.createdAt")
                  ),
                  parseInt(month.split("-")[0])
                ),
                sequelize.where(
                  sequelize.fn(
                    "EXTRACT",
                    sequelize.literal("MONTH FROM Finances.createdAt")
                  ),
                  parseInt(month.split("-")[1])
                ),

                sequelize.literal("Finances.date IS NULL OR Finances.date = ''")
              )
            )
          ),
          required: false,
        },
      ],
      order: [["accessLevel", "ASC"]],
    })
      .then((users) => {
        let data = [];
        users.forEach((user) => {
          console.log(user.Timekeeps);
          let time = 0;
          let userStr = `<a href="/users/${user.id}" class="avt-link"><span>
        <img src="/uploads/avatars/${
          user.getavatar().fileName
        }" alt="user-image"
        width="32"
        height="32"
        class="rounded-circle">
      </span>
      ${user.name}</a>`;
          let expense = 0;
          if (user.Finances.length) {
            user.Finances.forEach((el) => {
              expense += el.amount;
            });
          }
          if (user.Timekeeps.length) {
            user.Timekeeps.forEach((el) => {
              console.log(el.start);
              const startStr = `1970-01-01T` + `${el.start}` + `Z`;
              const endStr = `1970-01-01T` + `${el.end}` + `Z`;

              const start = new Date(startStr);
              const end = new Date(endStr);
              console.log(end);
              time += end - start;
            });
          }
          let hours = time / 3600 / 1000;
          hours = Math.round((hours + Number.EPSILON) * 100) / 100;
          let salaryStr = "";
          let calSalary = 0;
          let unit = "-";
          let bankName = "-";
          let bankNumber = "-";
          if (!user.Salary) {
            salaryStr = "-";
          } else {
            unit = user.Salary.isMonthly ? "Tháng" : "Giờ";
            salaryStr = `${user.Salary.amount}`;
            if (user.Salary.bankName && user.Salary.bankNumber) {
              bankName = user.Salary.bankName;
              bankNumber = user.Salary.bankNumber;
            }
            if (!user.Salary.isMonthly) {
              calSalary = user.Salary.amount * hours;
            } else calSalary = user.Salary.amount;
          }

          let one = [
            users.indexOf(user) + 1,
            userStr,
            salaryStr,
            unit,
            hours,
            expense,
            calSalary + expense,
            bankName,
            bankNumber,
          ];
          data.push(one);
        });
        res.json(data);
      })
      .catch((er) => {
        console.log(er);
        console.log("not found");
      });
  } else {
    User.findAll({
      where: {
        id: req.user.id,
        isActive: true,
      },
      include: [
        {
          model: File,
          as: "avatar",
        },
        {
          model: Timekeep,
          as: "Timekeeps",
          where: sequelize.and(
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal("YEAR FROM Timekeeps.date")
              ),
              parseInt(month.split("-")[0])
            ),
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal("MONTH FROM Timekeeps.date")
              ),
              parseInt(month.split("-")[1])
            ),
            sequelize.where(sequelize.col("start"), {
              [Op.not]: null,
            }),
            sequelize.where(sequelize.col("end"), {
              [Op.not]: null,
            })
          ),
          required: false,
        },
        {
          model: Salary,
          required: false,
        },
        {
          model: Finance,
          where: sequelize.and(
            sequelize.where(sequelize.col("Finances.isExpense"), true),
            sequelize.where(sequelize.col("Finances.isAdvanced"), true),
            sequelize.or(
              sequelize.and(
                sequelize.where(
                  sequelize.fn(
                    "EXTRACT",
                    sequelize.literal("YEAR FROM Finances.date")
                  ),
                  parseInt(month.split("-")[0])
                ),
                sequelize.where(
                  sequelize.fn(
                    "EXTRACT",
                    sequelize.literal("MONTH FROM Finances.date")
                  ),
                  parseInt(month.split("-")[1])
                )
              ),
              sequelize.and(
                sequelize.where(
                  sequelize.fn(
                    "EXTRACT",
                    sequelize.literal("YEAR FROM Finances.createdAt")
                  ),
                  parseInt(month.split("-")[0])
                ),
                sequelize.where(
                  sequelize.fn(
                    "EXTRACT",
                    sequelize.literal("MONTH FROM Finances.createdAt")
                  ),
                  parseInt(month.split("-")[1])
                ),

                sequelize.literal("Finances.date IS NULL OR Finances.date = ''")
              )
            )
          ),
          required: false,
        },
      ],
      order: [["accessLevel", "ASC"]],
    })
      .then((users) => {
        let data = [];
        users.forEach((user) => {
          console.log(user.Timekeeps);
          let time = 0;
          let userStr = `<a href="/users/${user.id}" class="avt-link"><span>
        <img src="/uploads/avatars/${
          user.getavatar().fileName
        }" alt="user-image"
        width="32"
        height="32"
        class="rounded-circle">
      </span>
      ${user.name}</a>`;
          let expense = 0;
          if (user.Finances.length) {
            user.Finances.forEach((el) => {
              expense += el.amount;
            });
          }
          if (user.Timekeeps.length) {
            user.Timekeeps.forEach((el) => {
              console.log(el.start);
              const startStr = `1970-01-01T` + `${el.start}` + `Z`;
              const endStr = `1970-01-01T` + `${el.end}` + `Z`;

              const start = new Date(startStr);
              const end = new Date(endStr);
              console.log(end);
              time += end - start;
            });
          }
          let hours = time / 3600 / 1000;
          hours = Math.round((hours + Number.EPSILON) * 100) / 100;
          let salaryStr = "";
          let calSalary = 0;
          let unit = "-";
          let bankName = "-";
          let bankNumber = "-";
          if (!user.Salary) {
            salaryStr = "-";
          } else {
            if (user.Salary.bankName && user.Salary.bankNumber) {
              bankName = user.Salary.bankName;
              bankNumber = user.Salary.bankNumber;
            }
            unit = user.Salary.isMonthly ? "Tháng" : "Giờ";
            salaryStr = `${user.Salary.amount}`;
            if (!user.Salary.isMonthly) {
              calSalary = user.Salary.amount * hours;
            } else calSalary = user.Salary.amount;
          }

          let one = [
            users.indexOf(user) + 1,
            userStr,
            salaryStr,
            unit,
            hours,
            expense,
            calSalary + expense,
            bankName,
            bankNumber,
          ];
          data.push(one);
        });
        res.json(data);
      })
      .catch((er) => {
        console.log(er);
      });
  }
});

module.exports.fetchChartProjects = async (req, res) => {
  const { month } = req.query;
  console.log(month);
  Project.findAll({
    where: sequelize.and(
      sequelize.where(
        sequelize.fn("EXTRACT", sequelize.literal("YEAR FROM createdAt")),
        parseInt(month.split("-")[0])
      ),
      sequelize.where(
        sequelize.fn("EXTRACT", sequelize.literal("MONTH FROM createdAt")),
        parseInt(month.split("-")[1])
      )
    ),
  })
    .then((projects) => {
      const now = new Date();
      let completed = 0,
        ongoing = 0,
        behind = 0;
      projects.forEach((el) => {
        const deadline = new Date(el.deadline);
        if (now >= deadline) {
          behind++;
        } else {
          if (el.progress == 100) completed++;
          else ongoing++;
        }
      });
      res.json({ completed, ongoing, behind });
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports.rednerSalary = (req, res) => {
  res.render("main/manageSalary");
};
module.exports.fetchTimekeep = async (req, res, next) => {
  const search = req.query.search;
  const date = moment(search, "YYYY-MM-DD").format("DD/MM/YYYY");
  if (req.user.isHr || req.user.accessLevel <= 1) {
    User.findAll(
      {
        where: {
          isActive: true,
        },
        include: [
          {
            model: File,
            as: "avatar",
          },
          {
            model: Timekeep,
            as: "Timekeeps",
            where: {
              date: {
                [Op.like]: search,
              },
            },
            required: false,
          },
        ],
        order: [
          ["accessLevel", "ASC"],
          [{ model: Timekeep, as: "Timekeeps" }, "createdAt", "ASC"],
        ],
      },
      {}
    )
      .then((users) => {
        let data = [];
        users.forEach((user) => {
          let userStr = `<a href="/users/${user.id}" class="avt-link"><span>
        <img src="/uploads/avatars/${
          user.getavatar().fileName
        }" alt="user-image"
        width="32"
        height="32"
        class="rounded-circle">
      </span>
      ${user.name}</a>`;
          if (!user.Timekeeps.length) {
            let one = [users.indexOf(user) + 1, userStr, date, "-", "-"];
            data.push(one);
          } else {
            user.Timekeeps.forEach((el) => {
              let index;
              if (user.Timekeeps.indexOf(el) == 0) {
                index = users.indexOf(user) + 1;
              } else index = "-";
              let one = [index, userStr, date, el.start, el.end ? el.end : "-"];
              data.push(one);
            });
          }
        });

        return res.json(data);
      })
      .catch((err) => {
        res.status(401).send("Not found");
        next(err);
      });
  } else {
    User.findAll(
      {
        where: {
          isActive: true,
          [Op.or]: [
            {
              id: req.user.id,
            },
            {
              superiorId: req.user.id,
            },
          ],
        },
        include: [
          {
            model: File,
            as: "avatar",
          },
          {
            model: Timekeep,
            as: "Timekeeps",
            where: {
              date: {
                [Op.like]: search,
              },
            },
            required: false,
          },
        ],
        order: [
          ["accessLevel", "ASC"],
          [{ model: Timekeep, as: "Timekeeps" }, "createdAt", "ASC"],
        ],
      },
      {}
    )
      .then((users) => {
        let data = [];
        users.forEach((user) => {
          let userStr = `<a href="/users/${user.id}" class="avt-link"><span>
        <img src="/uploads/avatars/${
          user.getavatar().fileName
        }" alt="user-image"
        width="32"
        height="32"
        class="rounded-circle">
      </span>
      ${user.name}</a>`;
          if (!user.Timekeeps.length) {
            let one = [users.indexOf(user) + 1, userStr, date, "-", "-"];
            data.push(one);
          } else {
            user.Timekeeps.forEach((el) => {
              let index;
              if (user.Timekeeps.indexOf(el) == 0) {
                index = users.indexOf(user) + 1;
              } else index = "-";
              let one = [index, userStr, date, el.start, el.end ? el.end : "-"];
              data.push(one);
            });
          }
        });

        return res.json(data);
      })
      .catch((err) => {
        res.status(401).send("Not found");
        next(err);
      });
  }
};
