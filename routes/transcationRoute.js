const { Router } = require("express");
const {
  setTransaction,
  modifyTransaction,
  getTransaction,
} = require("../controller/transactionController");
const { authenticate } = require("../middleware/authenticate");

const transcationRoute = Router();

transcationRoute.route("/").get(authenticate, getTransaction);
transcationRoute.route("/create").post(authenticate, setTransaction);
transcationRoute.route("/update/:id").put(authenticate, modifyTransaction);

module.exports = transcationRoute;
