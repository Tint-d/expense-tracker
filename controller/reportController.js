const { BadRequest } = require("../utils/AppError");
const { getCollections } = require("../utils/handleCollection");
const { tryCatch } = require("../utils/tryCatch");
const moment = require("moment");

exports.generateReport = tryCatch(async (req, res) => {
  const { startDate, endDate, period } = req.query;
  let report;

  if (period) {
    report = await generateReportByPeriod(period);
    console.log();
  } else if (startDate && endDate) {
    report = await generateReportByDateRange(startDate, endDate);
  } else {
    throw new BadRequest(
      "Invalid request. Specify either period or start date and end date."
    );
  }

  res.status(200).json({ mesage: "Success", report });
});

async function generateReportByPeriod(period) {
  let startDate, endDate;

  switch (period) {
    case "daily":
      startDate = moment().startOf("day").format("DD-MM-YYYY");
      endDate = moment().endOf("day").format("DD-MM-YYYY");
      break;
    case "weekly":
      startDate = moment().startOf("isoWeek").format("DD-MM-YYYY");
      endDate = moment().endOf("isoWeek").format("DD-MM-YYYY");
      break;
    case "monthly":
      startDate = moment().startOf("month").format("DD-MM-YYYY");
      endDate = moment().endOf("month").format("DD-MM-YYYY");
      break;
    case "yearly":
      startDate = moment().startOf("year").format("DD-MM-YYYY");
      endDate = moment().endOf("year").format("DD-MM-YYYY");
      break;
    case "yesterday":
      startDate = moment().subtract(1, "days").format("DD-MM-YYYY");
      endDate = moment().subtract(1, "days").format("DD-MM-YYYY");
      break;
    case "lastWeek":
      startDate = moment()
        .subtract(1, "weeks")
        .startOf("isoWeek")
        .format("DD-MM-YYYY");
      endDate = moment()
        .subtract(1, "weeks")
        .endOf("isoWeek")
        .format("DD-MM-YYYY");
      break;
    case "lastMonth":
      startDate = moment()
        .subtract(1, "months")
        .startOf("month")
        .format("DD-MM-YYYY");
      endDate = moment()
        .subtract(1, "months")
        .endOf("month")
        .format("DD-MM-YYYY");
      break;
    case "lastYear":
      startDate = moment()
        .subtract(1, "years")
        .startOf("year")
        .format("DD-MM-YYYY");
      endDate = moment()
        .subtract(1, "years")
        .endOf("year")
        .format("DD-MM-YYYY");
      break;
    default:
      throw new BadRequest("Invalid period specified.");
  }

  return generateReportByDateRange(startDate, endDate);
}

async function generateReportByDateRange(startDate, endDate) {
  const { expenseCollection, incomeCollection } = await getCollections();

  const totalExpensesResult = await expenseCollection
    .aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])
    .toArray();

  const totalIncomesResult = await incomeCollection
    .aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])
    .toArray();

  const totalExpenses =
    totalExpensesResult.length > 0 ? totalExpensesResult[0].total : 0;
  const totalIncomes =
    totalIncomesResult.length > 0 ? totalIncomesResult[0].total : 0;

  const netBalance = totalIncomes - totalExpenses;

  return {
    startDate,
    endDate,
    totalExpenses,
    totalIncomes,
    netBalance,
  };
}
