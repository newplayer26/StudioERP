const { standardizeDate } = require("../utils/helpers");
module.exports = (sequelize, DataTypes) => {
  const Avatar = sequelize.define("Avatar", {
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileDir: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileDisplay: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  return Avatar;
};
