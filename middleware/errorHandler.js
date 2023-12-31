const {
  AppError,
  BadRequest,
  NotFound,
  Unauthorized,
} = require("../utils/AppError");

const errorHandler = (error, req, res, next) => {
  console.log(error, "middleware");
  if (error instanceof AppError) {
    return res.status(error.getCode()).json({ message: error.message });
  }
  if (error instanceof BadRequest) {
    return res.status(error.getCode()).json({ message: error.message });
  }

  if (error instanceof NotFound) {
    return res.status(error.getCode()).json({ message: error.message });
  }

  if (error instanceof Unauthorized) {
    return res.status(error.getCode()).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal Server Error!" });
};

module.exports = errorHandler;
