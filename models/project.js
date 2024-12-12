const moment = require("moment");

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
            parseInt(this.getDataValue("calculatedRevenue") || 0) /
            this.getDataValue("projectedRevenue")
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
  return Project;
};
