const {
  Project,
  Task,
  User,
  TaskReport,
  File,
  Avatar,
  ProjectMember,
} = require("../models");
const { getCurrentDate, logCurrentTime } = require("../utils/helpers");
const wrapAsync = require("../utils/wrapAsync");
const appError = require("../utils/appError");
const fs = require("fs");
const moment = require("moment");
const { Op } = require("sequelize");

module.exports.renderTask = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findByPk(id, {
    include: [
      {
        model: Project,
      },
      {
        model: User,
        include: {
          model: Avatar,
        },
      },
    ],
  });
  const taskReports = await TaskReport.findAll({
    where: {
      taskId: id,
    },
    include: [
      {
        model: User,
        include: {
          model: Avatar,
        },
      },
    ],
  });
  let isManager = false;
  if (req.user.isProjectManager) {
    isManager = true;
  } else {
    const instance = await ProjectMember.findOne({
      where: {
        projectId: task.projectId,
        userId: task.userId,
        isLeader: true,
      },
    });
    if (instance) {
      isManager = true;
    }
  }
  res.render("tasks/task", {
    task,
    taskReports,
    user: task.User,
    project: task.Project,
    isManager,
  });
});
module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { task } = res.locals;
  const projectId = task.Project.id;
  createdAt = moment(task.start, "H:mm D/M/YYYY").format("YYYY-MM-DDTHH:mm");
  deadline = moment(task.deadline, "H:mm D/M/YYYY").format("YYYY-MM-DDTHH:mm");
  const project = await Project.findByPk(projectId, {
    include: [
      {
        model: User,
        include: [
          {
            model: Avatar,
          },
        ],
      },
    ],
  });
  res.render("tasks/edit", {
    task,
    users: project.Users,
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
        include: [
          {
            model: User,
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
    ],
  });
  if (req.user.isProjectManager) {
    isAllowed = true;
  } else {
    if (task.Project.Users.length) {
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
  const { title, description, deadline, start, user } = req.body;
  const { task } = res.locals;
  console.log(req.body);
  if (!user) {
    req.flash("error", "Nhiệm vụ cần có người phụ trách");
    return res.redirect(`/tasks/${id}/edit`);
  }
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
  task.fileIds =
    typeof task.fileIds === "object" ? task.fileIds : JSON.parse(task.fileIds);
  task.fileIds = task.fileIds.concat(fileIds);

  task.title = title;
  task.description = description;
  task.start = start;
  task.deadline = deadline;
  task.user = user;
  await task.save();
  res.redirect(`/tasks/${id}`);
});

module.exports.assessTask = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findByPk(id);
  const body = req.body;
  const assessmentObj = {
    content: body.content,
    progress: body.progress,
    isAssess: true,
    userId: req.user.id,
    taskId: id,
  };
  await Task.update(
    {
      progress: assessmentObj.progress,
    },
    { where: { id: id } }
  );
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
      fileDir: "task_reports",
      fileDisplay: file.originalname,
      fileName: file.filename,
      isLocal: true,
    });
    fileIds.push(createFile.id);
  }
  assessmentObj.fileIds = fileIds;
  const rep = await TaskReport.create(assessmentObj);
  res.redirect(`/tasks/${id}`);
});

module.exports.submitReport = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const task = await Task.findByPk(id);
  if (task.userId != req.user.id) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    return res.redirect(`/tasks/${id}`);
  }

  const repObj = {
    content: body.content,
    isAssess: false,
    userId: req.user.id,
    taskId: id,
  };
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
      fileDir: "task_reports",
      fileDisplay: file.originalname,
      fileName: file.filename,
      isLocal: true,
    });
    fileIds.push(createFile.id);
  }
  repObj.fileIds = fileIds;
  const rep = await TaskReport.create(repObj);
  res.redirect(`/tasks/${id}`);
});

module.exports.deleteReport = wrapAsync(async (req, res) => {
  const { id, repId } = req.params;
  const taskReport = await TaskReport.findByPk(repId, {
    include: [
      {
        model: User,
        as: "User",
      },
    ],
  });
  if (req.user.id !== taskReport.User.id) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    return res.redirect(`/tasks/${id}`);
  }
  await taskReport.destroy();
  res.redirect(`/tasks/${id}`);
});

module.exports.deleteFile = wrapAsync(async (req, res, next) => {
  const { fileid, id } = req.params;
  const { task } = res.locals;
  if (task) {
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
  }
});
