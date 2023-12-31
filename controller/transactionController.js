const { ObjectId } = require("mongodb");
const { getDB } = require("../db/db");
const { fetchUserById } = require("../services/userService");
const { BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");
const {
  isValidCurrency,
  formatDate,
  validateType,
} = require("../utils/validate");
const { getCollections } = require("../utils/handleCollection");
const {
  fetchReference,
  insertTransaction,
  updateTransaction,
} = require("../services/transactionService");

exports.setTransaction = tryCatch(async (req, res) => {
  const { amount, type, date, referenceId, currency } = req.body;
  const userId = req.userId;

  const { transactionCollection, expenseCollection, incomeCollection } =
    await getCollections();

  const transactionDate = formatDate(date);
  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }
  const lowercaseType = validateType(type);

  const reference = await fetchReference(
    lowercaseType,
    expenseCollection,
    incomeCollection,
    referenceId
  );

  const transactions = {
    amount,
    currency: currency || "USD",
    date: transactionDate,
    referenceId: reference._id,
    type,
  };

  await insertTransaction(transactionCollection, transactions);

  sendTransactionResponse(res, transactions, "Create transaction successful");
});

exports.modifyTransaction = tryCatch(async (req, res) => {
  const { amount, type, date, referenceId, currency } = req.body;
  const id = req.params.id;
  const { transactionCollection, expenseCollection, incomeCollection } =
    await getCollections();

  const transactionDate = formatDate(date);
  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }
  const lowercaseType = validateType(type);

  const reference = await fetchReference(
    lowercaseType,
    expenseCollection,
    incomeCollection,
    referenceId
  );

  const transactions = {
    amount,
    currency: currency || "USD",
    date: transactionDate,
    referenceId: reference._id,
    type,
  };

  await updateTransaction(transactionCollection, transactions, id);
  res
    .status(200)
    .json({ message: "Update Successful", transaction: transactions });
});

exports.getTransaction = tryCatch(async (req, res) => {
  const { transactionCollection, expenseCollection, incomeCollection } =
    await getCollections();

  const result = await transactionCollection.find({}).toArray();
  const transactions = await transactionCollection
    .aggregate([
      {
        $facet: {
          expenses: [
            {
              $match: { type: "expense" },
            },
            {
              $lookup: {
                from: "expense", // Name of the expense collection
                localField: "referenceId",
                foreignField: "_id",
                as: "reference",
              },
            },
            {
              $unwind: "$reference",
            },
            {
              $project: {
                _id: 1,
                amount: 1,
                currency: 1,
                date: 1,
                reference: 1,
                type: 1,
              },
            },
          ],
          incomes: [
            {
              $match: { type: "income" },
            },
            {
              $lookup: {
                from: "income", // Name of the income collection
                localField: "referenceId",
                foreignField: "_id",
                as: "reference",
              },
            },
            {
              $unwind: "$reference",
            },
            {
              $project: {
                _id: 1,
                amount: 1,
                currency: 1,
                date: 1,
                reference: 1,
                type: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          transaction: { $concatArrays: ["$expenses", "$incomes"] },
        },
      },
      {
        $unwind: "$transaction",
      },
      {
        $replaceRoot: { newRoot: "$transaction" },
      },
      // Other stages if needed
    ])
    .toArray();
  res.status(200).json({ message: true, transaction: transactions });
});

function sendTransactionResponse(res, transactions, message) {
  res.status(201).json({
    message,
    transaction: transactions,
  });
}
