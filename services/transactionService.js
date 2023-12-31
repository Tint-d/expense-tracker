const { ObjectId } = require("mongodb");
const { BadRequest } = require("../utils/AppError");
const { fetchExpenseById } = require("./expenseService");
const { fetchIncomeById } = require("./incomeService");

const fetchReference = async (
  lowercaseType,
  expenseCollection,
  incomeCollection,
  referenceId
) => {
  let reference;
  if (lowercaseType === "expense") {
    reference = await fetchExpenseById(expenseCollection, referenceId);
  } else if (lowercaseType === "income") {
    reference = await fetchIncomeById(incomeCollection, referenceId);
  }
  if (!reference) {
    throw new BadRequest("Invalid referenceId for the transaction type.");
  }
  return reference;
};

const insertTransaction = async (transactionCollection, transactions) => {
  return await transactionCollection.insertOne(transactions);
};

const updateTransaction = async (transactionCollection, transactions, id) => {
  return await transactionCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    { $set: transactions }
  );
};

const fetchAllTransaction = async (transaction, id) => {
  let aggregationPipeline = [
    {
      $lookup: {
        from: "category",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    {
      $unwind: "$categoryDetails",
    },
    {
      $project: {
        _id: 1,
        amount: 1,
        currency: 1,
        description: 1,
        date: 1,
        categoryName: "$categoryDetails.name",
      },
    },
  ];

  if (id) {
    aggregationPipeline.unshift({ $match: { _id: new ObjectId(id) } });
  }
  const result = await transaction.aggregate(aggregationPipeline).toArray();

  return result;
};

module.exports = { fetchReference, insertTransaction, updateTransaction };
