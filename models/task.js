const { standardizeDate } = require("../utils/helpers");
const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    "Task",
    {
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
    },
    {
      defaultScope: {
        include: [
          {
            model: sequelize.models.File,
            where: function () {
              const fileIds = this.fileIds;
              if (!fileIds) return [];
              const parsedIds =
                typeof fileIds === "object" ? fileIds : JSON.parse(fileIds);

              return {
                id: {
                  [Op.in]: parsedIds,
                },
              };
            },
          },
        ],
      },
    }
  );
  return Task;
};
