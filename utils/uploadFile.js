const multer = require("multer");
const AppError = require("./../utils/appError");
const println = require("./println");

const multerStorage = multer.memoryStorage();

// Allow only image file
const multerFilter = (req, file, cb) => {
  if (file && file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    println({service: "uploadFile", level:"error", message: "invalid file, it must be an image"})
    cb(new AppError("Please provide a valid image file!", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

module.exports = upload;
