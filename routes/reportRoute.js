const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const { generateReport } = require("../controller/reportController");

const reportRouter = Router();

reportRouter.route("/").get(authenticate, generateReport);

module.exports = reportRouter;
