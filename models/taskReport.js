const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  const TaskReport = sequelize.define("TaskReport", {
    content: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    progress: {
      type: DataTypes.INTEGER,
    },
    files: {
      type: DataTypes.JSON,
    },
    isAssess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fileIds: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  return TaskReport;
};
