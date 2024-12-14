const moment = require("moment");
const { Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const FinancialReport = sequelize.define("FinancialReport", {
    title: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    isExpense: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    note: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fileIds: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.INTEGER,
    },
  });
  FinancialReport.addHook("afterFind", async (instances) => {
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
  return FinancialReport;
};
