const wrapAsync = require("../utils/wrapAsync");
const {
  User,
  Project,
  File,
  FinancialReport,
  sequelize,
  Avatar,
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

module.exports.checkCredentials = (req, res, next) => {
  if (req.user.isFinanceManager) {
    return next();
  }
  req.flash("error", "Bạn không có quyền thực hiện thao tác này");
  return res.redirect(`/`);
};

module.exports.isOwnReport = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const finance = await FinancialReport.findByPk(id);
  if (finance.creatorId == req.user.id) {
    return next();
  }
  req.flash("error", "Bạn không có quyền thực hiện thao tác này");
  return res.redirect(`/`);
});

module.exports.postNew = wrapAsync(async (req, res) => {
  let body = req.body;
  let { projectId, title, isExpense, note, amount, date } = body;
  if (date == "") {
    date = new Date();
  }
  const fileIds = [];
  if (body.onlinefiles) {
    for (let file of body.onlinefiles) {
      if (!file) continue;
      const createFile = await File.create({
        fileDisplay: file.name,
        isLocal: false,
        fileUrl: file.url,
      });
      fileIds.push(createFile.id);
    }
  }
  for (let file of req.files) {
    const createFile = await File.create({
      fileDir: "finance",
      fileDisplay: file.originalname,
      fileName: file.filename,
      isLocal: true,
    });
    fileIds.push(createFile.id);
  }
  const finance = await FinancialReport.create({
    projectId,
    title,
    isExpense,
    note,
    amount,
    date,
    creatorId: req.user.id,
    fileIds: fileIds,
  });
  res.redirect("/manage/finance");
});

module.exports.fetchFinances = wrapAsync(async (req, res) => {
  const { month, projectId } = req.query;
  try {
    FinancialReport.findAll({
      order: [["date", "DESC"]],
      where: sequelize.or(
        sequelize.and(
          sequelize.where(
            sequelize.fn(
              "EXTRACT",
              sequelize.literal("YEAR FROM FinancialReport.date")
            ),
            parseInt(month.split("-")[0])
          ),
          sequelize.where(
            sequelize.fn(
              "EXTRACT",
              sequelize.literal("MONTH FROM FinancialReport.date")
            ),
            parseInt(month.split("-")[1])
          )
        ),
        sequelize.and(
          sequelize.where(
            sequelize.fn(
              "EXTRACT",
              sequelize.literal("YEAR FROM FinancialReport.createdAt")
            ),
            parseInt(month.split("-")[0])
          ),
          sequelize.where(
            sequelize.fn(
              "EXTRACT",
              sequelize.literal("MONTH FROM FinancialReport.createdAt")
            ),
            parseInt(month.split("-")[1])
          ),
          sequelize.literal(
            "FinancialReport.date IS NULL OR FinancialReport.date = ''"
          )
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
            model: Avatar,
          },
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
              let file = `<a href="${
                el.isLocal
                  ? `/uploads/${el.fileDir}/${el.fileName}`
                  : el.fileUrl
              }" target="_blank">
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
            isExpense = "Chi phí";
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
  } catch (e) {
    console.log(e);
  }
});

module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { inproject } = req.query;
  const finance = await FinancialReport.findByPk(id, {
    include: [
      {
        model: Project,
        required: false,
      },
    ],
  });

  res.render("finance/edit", { finance, date: finance.date });
});

module.exports.pushEdit = wrapAsync(async (req, res) => {
  const { inproject } = req.query;
  const { id } = req.params;
  let { projectId, title, isExpense, note, amount, date } = req.body;
  if (date == "") {
    date = new Date();
  }
  const finance = await FinancialReport.findByPk(id);
  const fileIds = [];
  if (req.body.onlinefiles) {
    for (let file of req.body.onlinefiles) {
      if (!file) continue;
      const createFile = await File.create({
        fileDisplay: file.name,
        isLocal: false,
        fileUrl: file.url,
      });
      fileIds.push(createFile.id);
    }
  }
  for (let file of req.files) {
    const createFile = await File.create({
      fileDir: "tasks",
      fileDisplay: file.originalname,
      fileName: file.filename,
      isLocal: true,
    });
    fileIds.push(createFile.id);
  }
  finance.fileIds =
    typeof finance.fileIds === "object"
      ? finance.fileIds
      : JSON.parse(finance.fileIds);
  finance.fileIds = finance.fileIds.concat(fileIds);

  finance.title = title;
  finance.note = note;
  finance.date = date;
  finance.projectId = finance.projectId;
  finance.amount = amount;
  finance.isExpense = isExpense;
  await finance.save();
  res.redirect(`/manage/finance`);
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
  FinancialReport.findAll({
    include: {
      model: Project,
      required: false,
    },
    where: {
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
      //console.log(line);
      finances.forEach((el) => {
        if (option == "date") {
          let date = new Date(moment(el.date, "YYYY-MM-DD").toDate());
          let dateDay = parseInt(date.getDate());
          let dateMonth = parseInt(date.getMonth()) + 1;
          let dateYear = parseInt(date.getFullYear());

          line[`${dateDay}/${dateMonth}/${dateYear}`][
            `${!el.isExpense ? "revenue" : "expense"}`
          ] += el.amount;
        } else {
          let date = new Date(moment(el.date, "YYYY-MM-DD").toDate());
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
});

module.exports.deleteFile = wrapAsync(async (req, res, next) => {
  const { fileid, id } = req.params;
  const { isLeader } = res.locals;
  File.findOne({
    where: {
      id: fileid,
    },
  })
    .then((file) => {
      console.log(file);
      file.destroy();
    })
    .catch((e) => {
      console.log(e);
      next(e);
    });
});
