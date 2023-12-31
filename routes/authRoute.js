const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  getUsers,
  register,
  login,
  logout,
} = require("../controller/authController");

const authRouter = Router();

authRouter.route("/").get(authenticate, getUsers);
authRouter.route("/register").post(register);
authRouter.route("/login").post(login);
authRouter.route("/logout").post(authenticate, logout);

module.exports = authRouter;
