const wrapAsync = require("../utils/wrapAsync");
const {
  Asset,
  Project,
  ProjectMember,
  User,
  ProjectAsset,
} = require("../models");
const { Op } = require("sequelize");

module.exports.renderAll = (req, res) => {
  res.render("main/manageAssets");
};

module.exports.fetchAll = wrapAsync(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) {
    Asset.findAll({
      include: {
        model: Project,
        as: "Projects",
        required: false,
      },
    })
      .then((assets) => {
        const data = [];
        assets.forEach((el) => {
          let btnStr = `<a class="btn btn-sm btn-outline-primary" href="/manage/assets/${el.id}/edit">Chi tiết</a>`;
          let projectStr = "-";
          if (el.Projects.length) {
            projectStr = "";
            el.Projects.forEach((project) => {
              projectStr = projectStr.concat(
                `<a class="text-decoration-none" href="/projects/${project.id}">${project.title}</a><br>`
              );
            });
          }
          let one = [
            assets.indexOf(el) + 1,
            el.title,
            projectStr,
            el.description,
            btnStr,
          ];
          data.push(one);
        });
        res.json(data);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Asset.findAll({
      include: {
        model: Project,
        as: "Projects",
        where: {
          id: projectId,
        },
        required: true,
      },
    })
      .then((assets) => {
        const data = [];
        assets.forEach((el) => {
          let btnStr = `<a class="btn btn-sm btn-outline-primary" href="/manage/assets/${el.id}/edit">Chi tiết</a>`;
          let one = [assets.indexOf(el) + 1, el.title, el.description, btnStr];
          data.push(one);
        });
        console.log(data);
        res.json(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

module.exports.renderEdit = wrapAsync(async (req, res) => {
  const { projectId } = req.query;
  const { id } = req.params;
  let redirect = "/manage/assets";
  if (projectId) {
    redirect = `/projects/${projectId}`;
  }
  if (req.user.accessLevel > 1 && !req.user.isHr) {
    return res.redirect(redirect);
  }
  const asset = await Asset.findOne({
    where: {
      id: id,
    },
    include: {
      model: Project,
      as: "Projects",
    },
  });
  res.render("asset/edit", { asset, projectId });
  // if (asset.Project) {
  //   if (asset.Project.Members.length) {
  //     return res.render("asset/edit", { asset, projectId });
  //   } else if (req.user.accessLevel <= 1) {
  //     return res.render("asset/edit", { asset, projectId });
  //   }
  // } else {
  //   return res.render("asset/edit", { asset, projectId });
  // }
  // res.redirect(redirect);
});

module.exports.renderNew = wrapAsync(async (req, res) => {
  const { projectId } = req.query;
  if (projectId) {
    const project = await Project.findByPk(projectId, {
      include: {
        model: User,
        as: "Members",
        through: {
          model: ProjectMember,
          where: {
            UserId: req.user.id,
          },
        },
        required: false,
      },
    });
    if (project) {
      if (project.Members.length || req.user.accessLevel <= 1) {
        return res.render("asset/new", { project });
      }
    }
  }
  res.render("asset/new", { project: null });
});

module.exports.pushEdit = wrapAsync(async (req, res) => {
  const { projectId } = req.query;
  let redirect = "/manage/assets";
  if (projectId) {
    redirect = `/projects/${projectId}`;
  }
  if (req.user.accessLevel > 1 && !req.user.isHr) {
    return res.redirect(redirect);
  }
  const { id } = req.params;
  const asset = await Asset.findByPk(id, {
    include: {
      model: Project,
      as: "Projects",
    },
  });
  const { title, description, ProjectId, removedProjects } = req.body;
  if (removedProjects) {
    await asset.removeProjects(removedProjects);
  }
  if (ProjectId) {
    for (let el of ProjectId) {
      const found = asset.Projects.find((element) => element.id == el);
      if (found) continue;
      await asset.addProject(el);
    }
  }
  await asset.update({ title, description });
  res.redirect(redirect);
});

module.exports.postNew = wrapAsync(async (req, res) => {
  const { projectId } = req.query;
  const { title, description, accessLevel, ProjectId } = req.body;
  let redirect = "/manage/assets";
  const asset = await Asset.create({
    title,
    description,
    accessLevel,
  });
  console.log(ProjectId);
  console.log("\n\n\n");
  if (ProjectId && ProjectId.length) {
    if (req.user.accessLevel <= 1) {
      asset.addProjects(ProjectId);
    } else {
      const projects = await ProjectMember.findAll({
        where: {
          UserId: req.user.id,
          ProjectId: {
            [Op.in]: ProjectId,
          },
        },
      });
      console.log(projects);
      if (projects && projects.length) {
        asset.addProjects(projects.map((el) => el.id));
      }
    }
  }
  res.redirect(redirect);
});

module.exports.deleteAsset = wrapAsync(async(req,res) => {
  let redirect = "/manage/assets";
  if (req.user.accessLevel > 1 && !req.user.isHr) {
    return res.redirect(redirect);
  }
  const { id } = req.params;
  const asset = await Asset.findByPk(id, {
    include: {
      model: Project,
      as: "Projects",
    },
  });

  await asset.destroy();
  res.redirect(redirect);
})