const {
  Project,
  Task,
  User,
  ProjectMember,
  File,
  Avatar,
  sequelize,
} = require("../models");
const db = require("../models");
const { getCurrentDate } = require("../utils/helpers");
const wrapAsync = require("../utils/wrapAsync");
const appError = require("../utils/appError");
const { Op } = require("sequelize");
const { wrap } = require("module");
const moment = require("moment");
function isEmpty(obj) {
  return Object.entries(obj).length === 0;
}

module.exports.renderProjectPage = wrapAsync(async (req, res, next) => {
  const ownProjects = await Project.findAll({
    include: [
      {
        model: User,
        where: { id: req.user.id },
        through: ProjectMember,
        attributes: [], // excludes User data from result
      },
      { model: Task, as: "Tasks" },
    ],
    order: [
      [sequelize.literal("calculatedRevenue / projectedRevenue"), "DESC"], // or 'ASC'
    ],
  });
  let projects = [];
  if (req.user.isProjectManager) {
    projects = await Project.findAll({
      include: [
        {
          model: Task,
          as: "Tasks",
        },
      ],
      order: [
        [sequelize.literal("calculatedRevenue / projectedRevenue"), "DESC"], // or 'ASC'
      ],
    });
  }
  res.render("projects/home", {
    projects,
    isAdmin: req.user.isProjectManager,
    ownProjects,
  });
});

module.exports.isOwnProject = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  if (req.user.isProjectManager) {
    return next();
  }
  ProjectMember.findOne({
    where: {
      ProjectId: id,
      UserId: req.user.id,
    },
  })
    .then((projectmember) => {
      if (projectmember) next();
      else {
        req.flash("error", "Bạn không có quyền thực hiện thao tác này");
        res.redirect(`/projects/${id}`);
      }
    })
    .catch((err) => {
      req.flash("error", "Bạn không có quyền thực hiện thao tác này");
      res.redirect(`/projects/${id}`);
    });
});

module.exports.checkCredentials2 = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findByPk(id, {
    include: [
      {
        model: User,
        as: "Members",

        through: {
          model: ProjectMember,
          where: {
            isLeader: true,
          },
        },
        where: {
          id: req.user.id,
        },
        required: false,
      },
    ],
  });
  if (project.Members.length || req.user.isProjectManager) {
    res.locals.isLeader = true;
    return next();
  } else {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    return res.redirect(`/projects/${id}`);
  }
});

module.exports.checkCredentials = (req, res, next) => {
  if (!req.user.isProjectManager) {
    req.flash("error", "Bạn không có quyền thực hiện thao tác này");
    return res.redirect("/home");
  } else next();
};

module.exports.renderNew = wrapAsync(async (req, res) => {
  const users = await User.findAll({
    where: {
      isActive: true,
    },
  });
  const all = [];
  for (let user of users) {
    let one = {
      id: user.id,
      name: user.name,
    };
    all.push(one);
  }
  let created = moment(new Date()).format("YYYY-MM-DDTHH:mm");
  res.render("projects/new", { created, all });
});

module.exports.renderProject = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { chart, KPI } = req.query;
  let currentMonth = new Date();
  const project = await Project.findByPk(id, {
    include: [
      {
        model: Task,
        as: "Tasks",
        where: {
          UserId: {
            [Op.eq]: req.user.id,
          },
        },
        include: [
          {
            model: User,
            as: "User",
            include: {
              model: Avatar,
            },
          },
        ],
        order: [
          ["createdAt", "DESC"],
          ["progress", "ASC"],
        ],
        required: false,
      },
      {
        model: User,
        through: {
          model: ProjectMember,
        },
        include: [
          {
            model: Avatar,
          },
        ],
      },
    ],
  });
  const projectNotUser = await Project.findByPk(id, {
    include: [
      {
        model: Task,
        as: "Tasks",
        where: {
          UserId: {
            [Op.ne]: req.user.id,
          },
        },
        include: [
          {
            model: User,
            as: "User",
            include: {
              model: Avatar,
            },
          },
        ],
        order: [
          ["createdAt", "DESC"],
          ["progress", "ASC"],
        ],
        required: false,
      },
    ],
  });
  const tasks = project.Tasks.concat(projectNotUser.Tasks);
  let isLeader = false;
  let isMember = false;
  const leaders = [];
  project.Users.forEach((element) => {
    if (element.ProjectMember.isLeader) {
      if (req.user.id == element.id) isLeader = true;
      leaders.push(element);
    }
    if (req.user.id == element.id) isMember = true;
  });
  if (req.user.isProjectManager) isLeader = true;

  res.render("projects/show", {
    project,
    tasks,
    leaders,
    members: project.Users,
    isLeader,
    isMember,
  });
});

module.exports.createProject = wrapAsync(async (req, res) => {
  const body = req.body;
  body.creatorId = req.user.id;
  console.log(body);

  const project = await Project.create(body);
  const { leaders, members } = body;
  await ProjectMember.bulkCreate(
    members.map((el) => {
      return {
        projectId: project.id,
        userId: el,
        isLeader: leaders.includes(el),
      };
    })
  );
  res.redirect(`/projects/${project.id}/members`);
});

module.exports.postTask = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  if (!body.user) {
    req.flash("error", "Nhiệm vụ cần có người phụ trách");
    return res.redirect(`/projects/${id}/tasks/new`);
  }
  console.log(body);
  body.projectId = id;
  body.userId = body.user;
  body.creatorId = req.user.id;
  const fileIds = [];
  if (body.onlinefiles) {
    for (let file of body.onlinefiles) {
      if (!file) continue;
      const createFile = await File.create({
        fileDisplay: file.name,
        isLocal: false,
        fileUrl: file.url,
      });
    }
    fileIds.push(createFile.id);
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
  body.fileIds = fileIds;
  const task = await Task.create(body);
  const project = await Project.findByPk(id, {
    include: [
      {
        model: User,
        where: {
          id: body.user,
        },
        required: false,
      },
    ],
  });
  res.redirect(`/projects/${id}`);
});

module.exports.deleteProject = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const project = await Project.destroy({ where: { id } });
  res.redirect("/");
});

module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findByPk(id);
  createdAt = moment(project.createdAt, "H:mm D/M/YYYY").format(
    "YYYY-MM-DDTHH:mm"
  );
  deadline = moment(project.deadline, "H:mm D/M/YYYY").format(
    "YYYY-MM-DDTHH:mm"
  );
  console.log(project);
  res.render("projects/edit", { project, createdAt, deadline });
});

module.exports.editProject = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const project = await Project.update(body, {
    where: {
      id,
    },
  });
  res.redirect(`/projects/${id}`);
});

// module.exports.postKpi = wrapAsync(async (req, res, next) => {
//   const { id } = req.params;
//   const { KPI } = req.body;
//   await Project.update(
//     { KPI },
//     {
//       where: {
//         id,
//       },
//     }
//   );
//   res.redirect(`/projects/${id}`);
// });

module.exports.addFiles = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  for (let file of req.files) {
    const createFile = await File.create({
      fileDir: "projects",
      fileDisplay: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      ProjectId: id,
    });
  }
  res.redirect(`/projects/${id}`);
});

module.exports.deleteFile = wrapAsync(async (req, res, next) => {
  const { fileid, id } = req.params;
  File.findOne({
    where: {
      id: fileid,
      ProjectId: id,
    },
  })
    .then((file) => file.destroy())
    .catch((e) => {
      console.log(e);
      next(e);
    });
});

module.exports.newTaskForm = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findByPk(id, {
    include: {
      model: User,
      include: {
        model: Avatar,
      },

      order: ["accessLevel", "ASC"],
    },
  });
  let created = moment(new Date()).format("YYYY-MM-DDTHH:mm");
  res.render("tasks/new", { created, project });
});

module.exports.renderMembersPage = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findByPk(id, {
    include: [
      {
        model: User,
        as: "Members",
        order: [["accessLevel", "ASC"]],
        include: {
          model: File,
          as: "avatar",
        },
      },
    ],
  });
  const { Members } = project;

  res.render("projects/members", { members: Members, project });
});

module.exports.deleteMember = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  const project = await Project.findByPk(id);
  await project.removeMembers(user);
  res.redirect(`/projects/${id}/members`);
});

module.exports.addMembers = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { members } = req.body;
  const project = await Project.findByPk(id, {
    include: [
      {
        model: User,
        as: "Members",
      },
    ],
  });
  for (let el of Object.entries(members)) {
    const found = project.Members.find(
      (element) =>
        element.id == (Array.isArray(el[1].id) ? el[1].id[0] : el[1].id)
    );
    if (found) continue;
    const mem = Array.isArray(el[1].id) ? el[1].id[0] : el[1].id;
    const right = Array.isArray(el[1].isLeader)
      ? el[1].isLeader[0]
      : el[1].isLeader;
    await project.addMember(mem, {
      through: {
        isLeader: right,
      },
    });
  }
  res.redirect(`/projects/${id}`);
});

module.exports.editMemberRights = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const projectMember = await ProjectMember.update(
    { isLeader: req.body.isLeader },
    {
      where: {
        [Op.and]: {
          UserId: req.body.user,
          ProjectId: id,
        },
      },
    }
  );
  res.redirect(`/projects/${id}/members`);
});
