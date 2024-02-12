const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  setRecurring,
  getRecurring,
  deleteAllRecurring,
  pauseRecurring,
  resumeRecurring,
  modifyRecurring,
} = require("../controller/recurringController");
const { pipelineForRecur } = require("../services/recurringService");
const paginationMiddleware = require("../middleware/pagination");

const recurringRouter = Router();

recurringRouter
  .route("/")
  .get(
    paginationMiddleware("recurringCollection", pipelineForRecur),
    getRecurring
  );
// recurringRouter.route("/").get(getRecurring);
recurringRouter.route("/create").post(authenticate, setRecurring);
recurringRouter.route("/deleteAll").delete(deleteAllRecurring);
recurringRouter.route("/pause/:recurringId").put(authenticate, pauseRecurring);
recurringRouter
  .route("/resume/:recurringId")
  .put(authenticate, resumeRecurring);
recurringRouter.route("/update/:id").put(authenticate, modifyRecurring);

module.exports = recurringRouter;
