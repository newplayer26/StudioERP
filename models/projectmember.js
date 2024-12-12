"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const ProjectMember = sequelize.define("ProjectMember", {
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isLeader: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
  return ProjectMember;
};
