const { Project, Task, User, TaskReport, File, Avatar } = require("../models");
const { getCurrentDate, logCurrentTime } = require("../utils/helpers");
const wrapAsync = require("../utils/wrapAsync");
const appError = require("../utils/appError");
const fs = require("fs");
const moment = require("moment");

module.exports.renderTask = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findByPk(id, {
    include: [
      {
        model: Project,
        as: "Project",
        include: [
          {
            model: User,
            through: {
              where: {
                isLeader: true,
              },
            },
          },
        ],
      },
      {
        model: User,
        as: "User",
        include: {
          model: Avatar,
          as: "avatar",
        },
      },
      {
        model: TaskReport,
        include: [
          {
            model: User,
            as: "User",
            include: {
              model: Avatar,
            },
          },
          { model: File },
        ],
      },
    ],
  });
  let isManager = false;
  if (req.user.isProjectManager) {
    isManager = true;
  } else {
    for (let el of task.Project.Users) {
      if (req.user.id == el.id && el.ProjectMember.isLeader) {
        isManager = true;
        break;
      }
    }
  }
  res.render("tasks/task", {
    task,
    user: task.User,
    project: task.Project,
    isManager,
  });
});
module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { task } = res.locals;
  createdAt = moment(task.createdAt, "H:mm D/M/YYYY").format(
    "YYYY-MM-DDTHH:mm"
  );
  deadline = moment(task.deadline, "H:mm D/M/YYYY").format("YYYY-MM-DDTHH:mm");
  const users = await User.findAll({
    include: [
      {
        model: Project,
        as: "Projects",
        where: {
          id: task.Project.id,
        },
        required: true,
      },
      {
        model: File,
        as: "avatar",
      },
    ],
  });
  res.render("tasks/edit", {
    task,
    users,
    createdAt,
    deadline,
  });
});

module.exports.checkCredentials = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  let isAllowed = false;
  const task = await Task.findByPk(id, {
    include: [
      {
        model: Project,
        as: "Project",
        include: [
          {
            model: User,
            as: "Members",
            through: {
              where: {
                isLeader: true,
                UserId: req.user.id,
              },
            },
            required: false,
          },
        ],
      },
      {
        model: File,
        as: "Files",
        required: false,
      },
    ],
  });
  if (req.user.accessLevel == 1) {
    isAllowed = true;
  } else {
    if (task.Project.Members.length) {
      isAllowed = true;
    }
  }
  if (!isAllowed) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    return res.redirect(`/tasks/${id}`);
  } else {
    res.locals.task = task;
    next();
  }
});
module.exports.deleteTask = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const task = await Task.findOne({ where: { id } });
  const projectId = task.ProjectId;
  await task.destroy();
  res.redirect(`/projects/${projectId}`);
});

module.exports.editTask = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, goal, user } = req.body;
  const { task } = res.locals;
  if (!user) {
    req.flash("error", "Nhiệm vụ cần có người phụ trách");
    return res.redirect(`/tasks/${id}/edit`);
  }
  if (user != task.UserId) {
    await task.update({
      title,
      description,
      deadline,
      goal,
      UserId: user,
      isRead: false,
      firstTake: null,
    });
  } else {
    await task.update({ title, description, deadline, goal });
  }

  for (let file of req.files) {
    const createFile = await File.create({
      fileDir: "tasks",
      fileDisplay: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      TaskId: task.id,
    });
  }
  res.redirect(`/tasks/${id}`);
});

module.exports.assessTask = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findByPk(id);
  const assessmentObj = {
    assessment: req.body.assessment,
    isAssess: true,
    UserId: req.user.id,
    TaskId: id,
  };
  const rep = await Assessment.create(assessmentObj);
  for (let file of req.files) {
    let info = {
      fileDisplay: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileDir: "reports",
      AssessmentId: rep.id,
      progress: req.body.progress,
    };
    await File.create(info);
  }
  task.progress = req.body.progress;
  if (req.body.progress == 100) task.isComplete = true;

  await task.save();
  res.redirect(`/tasks/${id}`);
});

module.exports.submitReport = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findByPk(id, {
    include: {
      model: User,
      as: "User",
    },
  });
  if (task.User.id != req.user.id) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    return res.redirect(`/tasks/${id}`);
  }

  const assessmentObj = {
    assessment: req.body.assessment,
    isAssess: false,
    UserId: req.user.id,
    TaskId: id,
  };
  const rep = await Assessment.create(assessmentObj);
  for (let file of req.files) {
    let info = {
      fileDisplay: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileDir: "reports",
      AssessmentId: rep.id,
    };
    await File.create(info);
  }
  await task.update({ lastReport: rep.createdAt, isRead: true });
  res.redirect(`/tasks/${id}`);
});

module.exports.deleteReport = wrapAsync(async (req, res) => {
  const { id, repId } = req.params;
  console.log(repId);
  const assessment = await Assessment.findByPk(repId, {
    include: [
      {
        model: User,
        as: "User",
      },
    ],
  });
  console.log(assessment);
  if (req.user.id !== assessment.User.id) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    console.log("err");
    return res.redirect(`/tasks/${id}`);
  }
  await assessment.destroy();
  res.redirect(`/tasks/${id}`);
});

module.exports.confirmRead = async (req, res) => {
  const { id } = req.params;
  Task.findByPk(id, {})
    .then(async (task) => {
      if (task.UserId != req.user.id) {
        return res.status(401);
      }
      if (task.isRead) {
        return res.status(400);
      }
      const time = moment(req.body.time, "HH:mm DD/MM/YYYY");
      console.log(time.toDate());
      await task.update({
        firstTaken: time.toDate(),
        isRead: true,
      });
    })
    .then((r) => {
      return res.status(200).json({ done: "done" });
    })
    .catch((e) => {
      return res.status(400);
    });
};

module.exports.setStatus = async (req, res) => {
  Task.findByPk(req.params.id, {
    include: [
      {
        model: Project,
        as: "Project",
        include: [
          {
            model: User,
            as: "Members",
            through: {
              where: {
                isLeader: true,
              },
            },
          },
        ],
      },
    ],
  })
    .then(async (task) => {
      let isAllow = false;
      if (task.UserId == req.user.id || req.user.accessLevel <= 1) {
        isAllow = true;
      } else {
        for (let el of task.Project.Members) {
          if (req.user.id === el.id && el.ProjectMember.isLeader) {
            isAllow = true;
            break;
          }
        }
      }
      if (isAllow) {
        const status = req.body.status == "complete" ? true : false;
        await task.update({
          isComplete: status,
        });
      }
    })
    .then(() => {
      res.status(200).json();
    })
    .catch(() => {
      res.status(400).json();
    });
};

module.exports.deleteFile = wrapAsync(async (req, res, next) => {
  const { fileid, id } = req.params;
  const { task } = res.locals;
  if (task) {
    File.findOne({
      where: {
        id: fileid,
        TaskId: task.id,
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
  }
});
