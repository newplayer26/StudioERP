const Joi = require("joi");

module.exports.dateToObj = (dateString) => {
  // Split the date string into year, month, and day using the hyphen as the delimiter
  const dateParts = dateString.split("-");

  // Create a new object with day, month, and year properties and return it
  const dateObject = {
    year: dateParts[0],
    month: dateParts[1],
    day: dateParts[2],
  };
  return dateObject;
};

module.exports.getCurrentDate = function () {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

module.exports.logCurrentTime = function () {
  const now = new Date();
  const time = now.toLocaleTimeString();
  const date = now.toLocaleDateString();
  const formattedDate = `${time} - ${date}`;
  return formattedDate;
};

module.exports.standardizeDate = function (dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

module.exports.validatePiBody = function (pi) {
  const schema = Joi.object({
    dob: Joi.string().allow("").required(),
    gender: Joi.string()
      .allow("")
      .valid("Nam", "Nữ", "Khác")
      .required()
      .messages({
        "string.empty": `Vui lòng nhập đầy đủ thông tin`,
      }),
    location: Joi.object({
      city: Joi.string().allow("").required().messages({
        "string.empty": `Vui lòng nhập đầy đủ thông tin`,
      }),
      district: Joi.string().allow("").required().messages({
        "string.empty": `Vui lòng nhập đầy đủ thông tin`,
      }),
      address: Joi.string().allow("").required().messages({
        "string.empty": `Vui lòng nhập đầy đủ thông tin`,
      }),
    }).required(),
  });
  return schema.validate(pi);
};
module.exports.validateUserInfo = function (info) {
  const schema = Joi.object({
    document: Joi.string().pattern(/^\d+$/).required().messages({
      "any.required": "Vui lòng nhập đầy đủ thông tin",
    }),
    superiorId: Joi.number(),
    name: Joi.string().required().messages({
      "any.required": "Vui lòng nhập đầy đủ thông tin",
    }),
    isActive: Joi.string().valid("true", "false").required().messages({
      "any.required": "Vui lòng nhập đầy đủ thông tin",
      "any.only": "Giá trị không hợp lệ",
    }),
    isFulltime: Joi.string().valid("true", "false").required().messages({
      "any.required": "Vui lòng nhập đầy đủ thông tin",
      "any.only": "Giá trị không hợp lệ",
    }),
    phone: Joi.string()
      .pattern(/^\d+$/)
      .required()
      .messages({
        "any.required": "Vui lòng nhập đầy đủ thông tin",
        "string.pattern.base": "Số điện thoại không hợp lệ",
      }),
    email: Joi.string().required().email().messages({
      "any.required": "Vui lòng nhập đầy đủ thông tin",
      "string.email": "Email không hợp lệ",
    }),
    isHr: Joi.string().valid("true", "false").required().messages({
      "any.required": "Vui lòng nhập đầy đủ thông tin",
      "any.only": "Giá trị không hợp lệ",
    }),
    accessLevel: Joi.number().min(1).max(3).required().messages({
      "any.required": "Vui lòng nhập đầy đủ thông tin",
      "number.min": "Giá trị không hợp lệ",
      "number.max": "Giá trị không hợp lệ",
    }),
  });
  return schema.validate(info);
};

module.exports.getDates =  function(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(`${currentDate.getDate().toString()}/${(currentDate.getMonth() + 1).toString()}/${currentDate.getFullYear()}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

module.exports.getMonths =  function(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(`${currentDate.getDate().toString()}/${(currentDate.getMonth() + 1).toString()}/${currentDate.getFullYear()}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}
module.exports.getLastDateOfMonth = function(monthString) {
  const year = parseInt(monthString.substring(0, 4));
  const month = parseInt(monthString.substring(5)) - 1;
  const lastDate = new Date(year, month + 1, 0);
  return lastDate;
}