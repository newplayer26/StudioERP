const moment = require('moment');
module.exports = (sequelize, DataTypes) => {
    const Asset = sequelize.define("Asset", {
      title: {
          type: DataTypes.TEXT,
          allowNull: false,
      },
      description: {
          type: DataTypes.TEXT,
      },
      accessLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        
      }
    });
    return Asset;
  };