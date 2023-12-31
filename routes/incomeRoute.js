const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  setIncome,
  allDeleteIncome,
  modifyIncome,
  getIncomeOne,
  getIncome,
} = require("../controller/incomeController");

const incomeRouter = Router();

incomeRouter.route("/").get(authenticate, getIncome);
incomeRouter.route("/:id").get(authenticate, getIncomeOne);
incomeRouter.route("/create").post(authenticate, setIncome);
incomeRouter.route("/update/:id").put(authenticate, modifyIncome);
incomeRouter.route("/delete").delete(allDeleteIncome);

module.exports = incomeRouter;
