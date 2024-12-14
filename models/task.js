const { standardizeDate } = require("../utils/helpers");
const moment = require("moment");
const { Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define("Task", {
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    fileIds: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  Task.addHook("afterFind", async (instances) => {
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

  return Task;
};
