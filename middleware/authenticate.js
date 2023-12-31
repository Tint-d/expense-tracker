const jwt = require("jsonwebtoken");
const { Unauthorized } = require("../utils/AppError");

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      throw new Unauthorized("Unauthorized!");
    }
    jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECERT,
      (err, decodedToken) => {
        if (err) {
          throw new Unauthorized("Invalid Access Token!");
        }
        req.userId = decodedToken.userId;
        next();
      }
    );
  } catch (error) {
    next(error);
  }
};
