const crypto = require("crypto");
const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      salt: {
        type: DataTypes.STRING,
        allowNull: false,
        default: "0",
      },
      name: {
        type: DataTypes.STRING,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      phone: {
        type: DataTypes.STRING,
      },
      location: {
        type: DataTypes.STRING,
      },
      dob: {
        type: DataTypes.DATEONLY,
      },
      isHr: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isProjectManager: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isFinanceManager: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isHr: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      hooks: {
        beforeCreate: (user, options) => {
          user.salt = crypto.randomBytes(16).toString("hex");
          user.password = crypto
            .pbkdf2Sync(user.password, user.salt, 1000, 64, "sha512")
            .toString("hex");
        },
        afterFind: (user, options) => {},
      },
      timestamps: true,
      getterMethods: {
        createdAt() {
          return moment
            .utc(this.getDataValue("createdAt"))
            .utcOffset("+0700")
            .format("H:mm D/M/YYYY");
        },
      },
    }
  );
  return User;
};
