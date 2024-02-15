const { BadRequest } = require("../utils/AppError");
const { getCollections } = require("../utils/handleCollection");
const { tryCatch } = require("../utils/tryCatch");
const moment = require("moment");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const uuid = require("uuid");

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

exports.exportReport = tryCatch(async (req, res) => {
  const { format } = req.query;

  if (!format || (format !== "excel" && format !== "pdf")) {
    throw new BadRequest("Invalid format specified. Specify 'excel' or 'pdf'.");
  }

  const { startDate, endDate, period } = req.query;
  let report;

  if (period) {
    report = await generateReportByPeriod(period);
  } else if (startDate && endDate) {
    report = await generateReportByDateRange(startDate, endDate);
  } else {
    throw new BadRequest(
      "Invalid request. Specify either period or start date and end date."
    );
  }

  // Export report based on specified format
  let filePath;
  if (format === "excel") {
    filePath = await exportReportAsExcel(report);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for a short period to ensure file is written
    res.download(filePath, "report.xlsx", () => {
      // Clean up the temporary file after download
      fs.unlinkSync(filePath);
    });
  } else {
    filePath = await exportReportAsPDF(report);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for a short period to ensure file is written
    res.download(filePath, "report.pdf", () => {
      // Clean up the temporary file after download
      fs.unlinkSync(filePath);
    });
  }
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

async function exportReportAsExcel(reportData) {
  const excelFilePath = `report_${uuid.v4()}.xlsx`; // Generate a unique filename
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  worksheet.addRow([
    "Start Date",
    "End Date",
    "Total Expenses",
    "Total Incomes",
    "Net Balance",
  ]);
  const { startDate, endDate, totalExpenses, totalIncomes, netBalance } =
    reportData;
  worksheet.addRow([
    startDate,
    endDate,
    totalExpenses,
    totalIncomes,
    netBalance,
  ]);

  await workbook.xlsx.writeFile(excelFilePath);
  console.log("Excel file saved at:", excelFilePath); // Add this line
  return excelFilePath;
}

async function exportReportAsPDF(reportData) {
  const pdfFilePath = `report_${uuid.v4()}.pdf`; // Generate a unique filename
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfFilePath);

  doc.pipe(stream);

  doc.fontSize(12).text("Start Date: " + reportData.startDate);
  doc.fontSize(12).text("End Date: " + reportData.endDate);
  doc.fontSize(12).text("Total Expenses: " + reportData.totalExpenses);
  doc.fontSize(12).text("Total Incomes: " + reportData.totalIncomes);
  doc.fontSize(12).text("Net Balance: " + reportData.netBalance);

  doc.end();

  return pdfFilePath;
}
