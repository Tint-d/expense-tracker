const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  setExpense,
  getExpense,
  allDeleteExpense,
  modifyExpense,
  getExpenseOne,
} = require("../controller/expenseController");

const expenseRouter = Router();

expenseRouter.route("/").get(getExpense);
expenseRouter.route("/:id").get(getExpenseOne);
expenseRouter.route("/create").post(authenticate, setExpense);
expenseRouter.route("/update/:id").put(authenticate, modifyExpense);
expenseRouter.route("/delete").delete(allDeleteExpense);

module.exports = expenseRouter;
