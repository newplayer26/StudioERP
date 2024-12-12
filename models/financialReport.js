const moment = require("moment");

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
  return FinancialReport;
};
