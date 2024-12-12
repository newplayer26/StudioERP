const wrapAsync = require("../utils/wrapAsync");
const {
  User,
  Task,
  Project,
  Daily,
  File,
  Salary,
  Finance,
  sequelize,
  Timekeep,
  Asset,
} = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");
const { getDates, getLastDateOfMonth } = require("../utils/helpers");

module.exports.renderAll = (req, res) => {
  res.render("main/manageFinance");
};

module.exports.renderNew = (req, res) => {
  res.render("finance/new");
};

module.exports.checkProject = wrapAsync(async (req, res, next) => {
  const { projectId } = req.query;
  if (!projectId || projectId == null) {
    return next();
  }
  if (req.user.accessLevel <= 1 || req.user.isHr) {
    return next();
  }
  const project = await Project.findOne({
    include: {
      model: User,
      as: "Members",
      where: {
        id: req.user.id,
      },
      required: false,
    },
    where: {
      id: projectId,
    },
  });
  if (project.Members.length) {
    return next();
  } else {
    req.flash("error", `Bạn không phải thành viên dự án ${project.title}`);
    return res.redirect("/manage/finance/new");
  }
});
module.exports.postNew = wrapAsync(async (req, res) => {
  let {
    ProjectId,
    title,
    isExpense,
    note,
    amount,
    date,
    isAdvanced = false,
  } = req.body;
  if (date == "") {
    date = new Date();
  }
  if (isExpense == "advanced") {
    isExpense = true;
    isAdvanced = true;
  }
  const finance = await Finance.create({
    ProjectId,
    title,
    isExpense,
    isAdvanced,
    note,
    amount,
    date,
    UserId: req.user.id,
  });
  console.log(req.files);
  for (let file of req.files) {
    const createFile = await File.create({
      fileDir: "finance",
      fileDisplay: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      FinanceId: finance.id,
    });
  }
  res.redirect("/manage/finance");
});

module.exports.fetchFinances = wrapAsync(async (req, res) => {
  const { month, projectId } = req.query;
  if (projectId && projectId != "") {
    Finance.findAll({
      order: [["date", "DESC"]],
      where: sequelize.and(
        sequelize.where(sequelize.col("Finance.ProjectId"), projectId),
        sequelize.or(
          sequelize.and(
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal("YEAR FROM Finance.date")
              ),
              parseInt(month.split("-")[0])
            ),
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal("MONTH FROM Finance.date")
              ),
              parseInt(month.split("-")[1])
            )
          ),
          sequelize.and(
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal("YEAR FROM Finance.createdAt")
              ),
              parseInt(month.split("-")[0])
            ),
            sequelize.where(
              sequelize.fn(
                "EXTRACT",
                sequelize.literal("MONTH FROM Finance.createdAt")
              ),
              parseInt(month.split("-")[1])
            ),

            sequelize.literal("Finance.date IS NULL OR Finance.date = ''")
          )
        )
      ),
      include: [
        {
          model: User,
          include: {
            model: File,
            as: "avatar",
          },
          required: false,
        },
        {
          model: File,
          as: "Files",
          required: false,
        },
      ],
    })
      .then((finances) => {
        const data = [];
        finances.forEach((el) => {
          let fileStr = "-";
          if (el.Files.length) {
            fileStr = "";
            el.Files.forEach((el) => {
              let file = `<a href="/uploads/finance/${el.fileName}" target="_blank">
                <i class='bx bx-file' ></i> ${el.fileDisplay}
                </a> <br>`;
              fileStr += file;
            });
          }
          let userStr = `-`;
          if (el.User) {
            userStr = `<a href="/users/${el.User.id}" class="avt-link"><span>
        <img src="/uploads/avatars/${
          el.User.getavatar().fileName
        }" alt="user-image"
        width="32"
        height="32"
        class="rounded-circle">
      </span>
      ${el.User.name}</a>`;
          }
          const btnStr = `<a class="btn btn-sm btn-outline-primary" href="/manage/finance/${el.id}/edit?inproject=true">Chỉnh sửa</a>`;
          let one = [
            userStr,
            el.date,
            el.title,
            el.note,
            !el.isExpense ? "Doanh thu" : "Chi tiêu",
            el.amount,
            fileStr,
            btnStr,
          ];
          data.push(one);
        });
        res.json(data);
      })
      .catch((er) => {
        console.log(er);
      });
  } else {
    Finance.findAll({
      order: [["date", "DESC"]],
      where: sequelize.or(
        sequelize.and(
          sequelize.where(
            sequelize.fn(
              "EXTRACT",
              sequelize.literal("YEAR FROM Finance.date")
            ),
            parseInt(month.split("-")[0])
          ),
          sequelize.where(
            sequelize.fn(
              "EXTRACT",
              sequelize.literal("MONTH FROM Finance.date")
            ),
            parseInt(month.split("-")[1])
          )
        ),
        sequelize.and(
          sequelize.where(
            sequelize.fn(
              "EXTRACT",
              sequelize.literal("YEAR FROM Finance.createdAt")
            ),
            parseInt(month.split("-")[0])
          ),
          sequelize.where(
            sequelize.fn(
              "EXTRACT",
              sequelize.literal("MONTH FROM Finance.createdAt")
            ),
            parseInt(month.split("-")[1])
          ),
          sequelize.literal("Finance.date IS NULL OR Finance.date = ''")
        )
      ),

      include: [
        {
          model: Project,

          required: false,
        },
        {
          model: User,
          include: {
            model: File,
            as: "avatar",
          },
          required: false,
        },
        {
          model: File,
          as: "Files",
          required: false,
        },
      ],
    })
      .then((finances) => {
        const data = [];
        finances.forEach((el) => {
          let fileStr = "-";
          if (el.Files.length) {
            fileStr = "";
            el.Files.forEach((el) => {
              let file = `<a href="/uploads/finance/${el.fileName}" target="_blank">
                <i class='bx bx-file' ></i> ${el.fileDisplay}
                </a> <br>`;
              fileStr += file;
            });
          }
          let projStr = "-";
          let userStr = `-`;
          if (el.User) {
            userStr = `<a href="/users/${el.User.id}" class="avt-link"><span>
        <img src="/uploads/avatars/${
          el.User.getavatar().fileName
        }" alt="user-image"
        width="32"
        height="32"
        class="rounded-circle">
      </span>
      ${el.User.name}</a>`;
          }
          if (el.Project) {
            projStr = `<a href="/projects/${el.Project.id}" style="text-decoration: none;">
      ${el.Project.title}</a>`;
          }
          let isExpense = "";
          if (el.isExpense) {
            isExpense = el.isAdvanced ? "Chi phí ứng" : "Chi phí";
          } else isExpense = "Doanh thu";
          const btnStr = `<a class="btn btn-sm btn-outline-primary" href="/manage/finance/${el.id}/edit">Chỉnh sửa</a>`;
          let one = [
            userStr,
            el.date,
            el.title,
            projStr,
            el.note,
            isExpense,
            el.amount,
            fileStr,
            btnStr,
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

module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { inproject } = req.query;
  const finance = await Finance.findByPk(id, {
    include: [
      {
        model: Project,
        required: false,
        include: [
          {
            model: User,
            as: "Members",
            where: {
              id: req.user.id,
            },
            required: false,
          },
        ],
      },
      {
        model: File,
        as: "Files",
      },
    ],
  });
  const date = moment(finance.date, "D/M/YYYY").format("YYYY-MM-DD");
  let redirect = "/manage/finance";
  if (finance.ProjectId) {
    if (inproject) {
      redirect = `/projects/${finance.ProjectId}/finance`;
    }
  }
  if (!finance.UserId || finance.UserId == "") {
    if (req.user.accessLevel <= 1) {
      return res.render("finance/edit", { finance, date, inproject });
    } else {
      req.flash("error", "Bạn không có quyền thực hiện thao tác này");
      return res.redirect(redirect);
    }
  } else if (req.user.id != finance.UserId) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    return res.redirect(redirect);
  }

  res.render("finance/edit", { finance, date, inproject });
});

module.exports.pushEdit = wrapAsync(async (req, res) => {
  const { inproject } = req.query;
  const { id } = req.params;
  let {
    ProjectId,
    title,
    isExpense,
    note,
    amount,
    date,
    isAdvanced = false,
  } = req.body;
  if (isExpense == "advanced") {
    isExpense = true;
    isAdvanced = true;
  }
  if (date == "") {
    date = new Date();
  }
  const finance = await Finance.findByPk(id);
  let redirect = "/manage/finance";
  if (finance.ProjectId) {
    if (inproject) {
      redirect = `/projects/${finance.ProjectId}/finance`;
    }
  }
  if (!finance.UserId || finance.UserId == "") {
    if (req.user.accessLevel <= 1) {
      await finance.update({
        UserId: req.user.id,
        ProjectId,
        title,
        isExpense,
        isAdvanced,
        note,
        amount,
        date,
      });
      for (let file of req.files) {
        const createFile = await File.create({
          fileDir: "finance",
          fileDisplay: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          FinanceId: finance.id,
        });
      }
    } else {
      req.flash("error", "Bạn không có quyền thực hiện thao tác này");
      return res.redirect(redirect);
    }
  } else {
    if (req.user.id != finance.UserId) {
      req.flash("error", "Bạn không có quyền thực hiện thao tác này");
      return res.redirect(redirect);
    } else {
      await finance.update({
        ProjectId,
        title,
        isExpense,
        note,
        amount,
        date,
        isAdvanced,
      });
      for (let file of req.files) {
        const createFile = await File.create({
          fileDir: "finance",
          fileDisplay: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          FinanceId: finance.id,
        });
      }
    }
  }
  res.redirect(redirect);
});
module.exports.deleteFinance = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { inproject } = req.query;
  const finance = await Finance.findByPk(id);
  let redirect = "/manage/finance";
  if (finance.ProjectId) {
    if (inproject) {
      redirect = `/projects/${finance.ProjectId}/finance`;
    }
  }
  if (!finance.UserId || finance.UserId == "") {
    if (req.user.accessLevel <= 1) {
      await finance.destroy();
    } else {
      req.flash("error", "Bạn không có quyền thực hiện thao tác này");
      return res.redirect(redirect);
    }
  } else {
    if (req.user.id != finance.UserId) {
      req.flash("error", "Bạn không có quyền thực hiện thao tác này");
      return res.redirect(redirect);
    } else {
      await finance.destroy();
    }
  }
  res.redirect(redirect);
});

module.exports.fetchCharts = wrapAsync(async (req, res, next) => {
  const { from, to, option, project } = req.query;
  console.log(from);
  const startDate = moment(from, "YYYY-MM-DD").toDate();
  let endDate;
  if (option == "month") {
    endDate = getLastDateOfMonth(to);
  } else {
    endDate = moment(to, "YYYY-MM-DD").toDate();
  }
  if (!project || project == "") {
    Finance.findAll({
      include: {
        model: Project,
        required: false,
      },
      where: {
        isAdvanced: false,
        [Op.or]: {
          date: {
            [Op.between]: [startDate, endDate],
          },
          [Op.and]: {
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
            date: null,
          },
        },
      },
      order: [["date", "ASC"]],
    })
      .then((finances) => {
        let pie = {};
        let line = {};
        const dates = getDates(startDate, endDate);
        if (option == "month") {
          dates.forEach((el) => {
            let one = new Date(moment(el, "D/M/YYYY").toDate());
            let toMonth = parseInt(one.getMonth()) + 1;
            let toYear = parseInt(one.getFullYear());
            if (!(`${toMonth}/${toYear}` in line)) {
              line[`${toMonth}/${toYear}`] = { expense: 0, revenue: 0 };
            }
          });
        } else {
          dates.forEach((el) => {
            line[el] = { expense: 0, revenue: 0 };
          });
        }
        finances.forEach((el) => {
          if (option == "date") {
            line[el.date][`${!el.isExpense ? "revenue" : "expense"}`] +=
              el.amount;
          } else {
            let date = new Date(moment(el.date, "D/M/YYYY").toDate());
            let dateMonth = parseInt(date.getMonth()) + 1;
            let dateYear = parseInt(date.getFullYear());

            line[`${dateMonth}/${dateYear}`][
              `${!el.isExpense ? "revenue" : "expense"}`
            ] += el.amount;
          }
          if (el.Project) {
            if (el.Project.id in pie) {
              pie[el.Project.id][`${!el.isExpense ? "revenue" : "expense"}`] +=
                el.amount;
            } else
              pie[el.Project.id] = {
                title: el.Project.title,
                revenue: el.isExpense ? 0 : el.amount,
                expense: !el.isExpense ? 0 : el.amount,
              };
          } else {
            if ("other" in pie) {
              pie["other"][`${!el.isExpense ? "revenue" : "expense"}`] +=
                el.amount;
            } else
              pie["other"] = {
                title: "Khác",
                revenue: el.isExpense ? 0 : el.amount,
                expense: !el.isExpense ? 0 : el.amount,
              };
          }
          console.log(pie);
        });
        console.log(pie);
        res.json([pie, line]);
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  } else {
    Finance.findAll({
      where: {
        isAdvanced: false,
        [Op.and]: {
          ProjectId: project,
          [Op.or]: {
            date: {
              [Op.between]: [startDate, endDate],
            },
            [Op.and]: {
              createdAt: {
                [Op.between]: [startDate, endDate],
              },
              date: null,
            },
          },
        },
      },
      order: [["date", "ASC"]],
    })
      .then((finances) => {
        let line = {};
        const dates = getDates(startDate, endDate);
        if (option == "month") {
          dates.forEach((el) => {
            let one = new Date(moment(el, "D/M/YYYY").toDate());
            let toMonth = parseInt(one.getMonth()) + 1;
            let toYear = parseInt(one.getFullYear());
            if (!(`${toMonth}/${toYear}` in line)) {
              line[`${toMonth}/${toYear}`] = { expense: 0, revenue: 0 };
            }
          });
        } else {
          dates.forEach((el) => {
            line[el] = { expense: 0, revenue: 0 };
          });
        }
        finances.forEach((el) => {
          if (option == "date") {
            line[el.date][`${!el.isExpense ? "revenue" : "expense"}`] +=
              el.amount;
          } else {
            let date = new Date(moment(el.date, "D/M/YYYY").toDate());
            let dateMonth = parseInt(date.getMonth()) + 1;
            let dateYear = parseInt(date.getFullYear());

            line[`${dateMonth}/${dateYear}`][
              `${!el.isExpense ? "revenue" : "expense"}`
            ] += el.amount;
          }
        });

        res.json(["", line]);
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  }
});

module.exports.deleteFile = wrapAsync(async (req, res, next) => {
  const { fileid, id } = req.params;
  Finance.findByPk(id, {})
    .then((finance) => {
      if (finance.UserId == req.user.id) {
        File.findOne({
          where: {
            id: fileid,
            FinanceId: finance.id,
          },
        }).then((file) => file.destroy());
      } else {
        if (!finance.UserId) {
          if (req.user.accessLevel <= 1) {
            File.findOne({
              where: {
                id: fileid,
                FinanceId: finance.id,
              },
            }).then((file) => file.destroy());
          }
        }
      }
    })

    .catch((e) => {
      console.log(e);
      next(e);
    });
});
