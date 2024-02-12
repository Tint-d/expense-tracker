const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  setExpense,
  getExpense,
  allDeleteExpense,
  modifyExpense,
  getExpenseOne,
  deleteExpense,
  filterExpenseByCategoryId,
} = require("../controller/expenseController");
const paginationMiddleware = require("../middleware/pagination");
const {
  pipelineForExpense,
  pipelineForCategoryExpense,
} = require("../services/expenseService");

const expenseRouter = Router();

expenseRouter
  .route("/")
  .get(
    paginationMiddleware("expenseCollection", pipelineForExpense),
    getExpense
  );
expenseRouter.route("/category/:id").get(
  paginationMiddleware("expenseCollection", (req) =>
    pipelineForCategoryExpense(req.params.id)
  ),
  filterExpenseByCategoryId
);
expenseRouter.route("/:id").get(getExpenseOne);
expenseRouter.route("/create").post(authenticate, setExpense);
expenseRouter.route("/update/:id").put(authenticate, modifyExpense);
expenseRouter.route("/deleteall").delete(allDeleteExpense);
expenseRouter.route("/delete/:id").delete(deleteExpense);

module.exports = expenseRouter;
