const multer = require("multer");
const mime = require("mime");

module.exports.uploads = function (dir) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `public/uploads/${dir}`);
    },
    filename: (req, file, cb) => {
      const extension = mime.getExtension(file.mimetype);
      const filename = `${file.fieldname}-${Date.now()}.${extension}`;
      cb(null, filename);
    },
  });
  return multer({ storage: storage });
};
