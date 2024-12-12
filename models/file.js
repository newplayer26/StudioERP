module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define("File", {
    fileName: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    filePath: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    fileDir: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    fileDisplay: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    isLocal: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    fileUrl: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  });
  return File;
};
