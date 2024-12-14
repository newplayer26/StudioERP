const moment = require("moment");
const { Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    "Project",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      start: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      fileIds: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      projectedRevenue: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      progress: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            (parseInt(this.getDataValue("calculatedRevenue") || 0) /
              this.getDataValue("projectedRevenue")) *
            100
          );
        },
      },
      creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      defaultScope: {
        attributes: {
          include: [
            [
              sequelize.literal(`(
              SELECT COALESCE(SUM(amount), 0)
              FROM FinancialReports
              WHERE 
                FinancialReports.projectId = Project.id 
                AND FinancialReports.isExpense = false
            )`),
              "calculatedRevenue",
            ],
          ],
        },
      },
    }
  );
  Project.addHook("afterFind", async (instances) => {
    if (!instances) return instances;

    const records = Array.isArray(instances) ? instances : [instances];

    for (const record of records) {
      record.Files = [];
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
  return Project;
};
