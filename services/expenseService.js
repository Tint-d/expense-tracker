const { ObjectId } = require("mongodb");
const { NotFound } = require("../utils/AppError");

const fetchExpenseById = async (collection, id) => {
  const existExpense = await collection.findOne({
    _id: new ObjectId(id),
  });
  if (!existExpense) {
    throw new NotFound("Expense is not found");
  }
  return existExpense;
};

const fetchExpenseByUserId = async (collection, id) => {
  const existuser = await collection.findOne({
    _id: new ObjectId(id),
  });
  if (!existuser) {
    throw new NotFound("User is not found");
  }
  return existuser;
};

const fetchAllExpense = async (expense, id) => {
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
  const result = await expense.aggregate(aggregationPipeline).toArray();

  return result;
};

module.exports = { fetchExpenseById, fetchAllExpense, fetchExpenseByUserId };
