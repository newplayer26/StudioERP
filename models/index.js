const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];
const crypto = require("crypto");
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

const {
  User,
  Project,
  Task,
  TaskReport,
  File,
  FinancialReport,
  //Asset,
  ProjectMember,
  Avatar,
} = db;

Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: "projectId",
  otherKey: "userId",
});

User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: "userId",
  otherKey: "projectId",
});

Project.hasMany(Task, { onDelete: "cascade", foreignKey: "projectId" });
Task.belongsTo(Project, { foreignKey: "projectId" });

Project.hasMany(FinancialReport, { foreignKey: "projectId" });
FinancialReport.belongsTo(Project, { foreignKey: "projectId" });

User.hasMany(Task, { foreignKey: "userId" });
Task.belongsTo(User, { foreignKey: "userId" });

User.hasMany(FinancialReport, { foreignKey: "creatorId" });
FinancialReport.belongsTo(User, { foreignKey: "creatorId" });

Task.hasMany(TaskReport, { onDelete: "cascade", foreignKey: "taskId" });
TaskReport.belongsTo(Task, { foreignKey: "taskId" });

User.hasMany(TaskReport, { foreignKey: "userId" });
TaskReport.belongsTo(User, { foreignKey: "userId" });

Avatar.beforeDestroy(async (file, options) => {
  fs.unlink(file.filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
});
File.beforeDestroy(async (file, options) => {
  if (!file.isLocal) {
    return;
  }
  fs.unlink(file.filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
});

Task.beforeDestroy(async (task, options) => {
  if (task.fileIds && typeof task.fileIds !== "object") {
    try {
      task.fileIds = JSON.parse(task.fileIds);
    } catch (error) {
      console.error("Failed to parse fileIds:", error);
      task.fileIds = []; // or handle the error as needed
    }
  }
  let files = await File.destroy({
    where: {
      id: {
        [Op.in]: task.fileIds,
      },
    },
  });
});

FinancialReport.beforeDestroy(async (row, options) => {
  if (row.fileIds && typeof row.fileIds !== "object") {
    try {
      row.fileIds = JSON.parse(row.fileIds);
    } catch (error) {
      console.error("Failed to parse fileIds:", error);
      row.fileIds = []; // or handle the error as needed
    }
  }
  let files = await File.destroy({
    where: {
      id: {
        [Op.in]: row.fileIds,
      },
    },
  });
});

TaskReport.beforeDestroy(async (row, options) => {
  if (row.fileIds && typeof row.fileIds !== "object") {
    try {
      row.fileIds = JSON.parse(row.fileIds);
    } catch (error) {
      console.error("Failed to parse fileIds:", error);
      row.fileIds = []; // or handle the error as needed
    }
  }
  let files = await File.destroy({
    where: {
      id: {
        [Op.in]: row.fileIds,
      },
    },
  });
});

Task.beforeDestroy(async (task, options) => {
  await TaskReport.destroy({
    where: {
      taskId: task.id,
    },
    transaction: options.transaction,
  });
});

User.hasOne(Avatar, { foreignKey: "userId" });
Avatar.belongsTo(User, { foreignKey: "userId" });

User.prototype.getavatar = function () {
  if (this.Avatar) {
    return this.Avatar; // if the user has an avatar, return it
  } else {
    // if the user doesn't have an avatar, return a default avatar object
    return {
      fileName: "download.png",
      filePath: "",
      fileDir: "avatars",
      fileDisplay: "",
    };
  }
};

module.exports = db;
