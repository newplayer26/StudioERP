const moment = require("moment");
const { Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const TaskReport = sequelize.define("TaskReport", {
    content: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    progress: {
      type: DataTypes.INTEGER,
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
  TaskReport.addHook("afterFind", async (instances) => {
    if (!instances) return instances;

    const records = Array.isArray(instances) ? instances : [instances];

    for (const record of records) {
      if (record.fileIds) {
        const parsedIds =
          typeof record.fileIds === "object"
            ? record.fileIds
            : JSON.parse(record.fileIds);

        if (parsedIds.length) {
          record.Files = await sequelize.models.File.findAll({
            where: {
              id: {
                [Op.in]: parsedIds,
              },
            },
          });
        } else {
          record.Files = [];
        }
      }
    }

    return instances;
  });
  return TaskReport;
};
