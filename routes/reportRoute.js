const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  generateReport,
  exportReport,
} = require("../controller/reportController");

const reportRouter = Router();

reportRouter.route("/").get(authenticate, generateReport);
reportRouter.route("/export").get(authenticate, exportReport);

module.exports = reportRouter;
