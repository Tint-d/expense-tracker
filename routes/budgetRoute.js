const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  setBudget,
  getBudget,
  deleteAllBudget,
  modifybudget,
  getOneBudget,
  deleteBudget,
} = require("../controller/budgetController");
const paginationMiddleware = require("../middleware/pagination");
const { pipelineForBudget } = require("../services/budgetService");

const budgetRouter = Router();


 
budgetRouter
  .route("/")
  .get(paginationMiddleware("budgetCollection", pipelineForBudget), getBudget);
budgetRouter.route("/:id").get(authenticate,getOneBudget)
budgetRouter.route("/create").post(authenticate, setBudget);
budgetRouter.route("/update/:id").put(authenticate, modifybudget);
budgetRouter.route("/deleteAll").delete(deleteAllBudget);
budgetRouter.route("/delete/:id").delete(authenticate,deleteBudget);

module.exports = budgetRouter;
