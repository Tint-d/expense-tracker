const { ObjectId } = require("mongodb");
const { NotFound } = require("../utils/AppError");
const { getCollections } = require("../utils/handleCollection");

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

const pipelineForExpense = () => {
  let aggregataionPipeline = [
    {
      $lookup: {
        from: "category",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryDetail",
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        amount: 1,
        date: 1,
        notes: 1,
        currency: 1,
        category: { $arrayElemAt: ["$categoryDetail.name", 0] },
      },
    },
  ];
  return aggregataionPipeline;
};

const pipelineForCategoryExpense = (id) => {
  let aggregataionPipeline = [
    { $match: { categoryId: new ObjectId(id) } },
    {
      $lookup: {
        from: "category",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryDetail",
      },
    },
    { $unwind: "$categoryDetail" },
    {
      $project: {
        _id: 1,
        title: 1,
        amount: 1,
        date: 1,
        notes: 1,
        currency: 1,
        categoryName: "$categoryDetail.name",
      },
    },
  ];
  return aggregataionPipeline;
};

// const processExpenseData = async (req) => {
//   const { expenseCollection, userCollection, categoryCollection } =
//     await getCollections();
//   const { title, amount, categoryId, date, notes, currency } = req.body;
//   const userId = req.userId;

//   await fetchUserById(userCollection, userId);
//   await fetchCategoryById(categoryCollection, categoryId);

//   if (!isValidCurrency(currency)) {
//     throw new BadRequest("Currency is not allowed");
//   }

//   const expenseDate = formateDate(date);

//   const expenseCurrency = currency || "USD";

//   return {
//     expenseCollection,
//     expense: {
//       title,
//       amount,
//       categoryId: new ObjectId(categoryId),
//       date: expenseDate,
//       notes,
//       currency: expenseCurrency,
//     },
//   };
// };

const getBudget = async (selectedBudgetId, categoryId, userId) => {
  const { budgetCollection } = await getCollections();

  if (selectedBudgetId) {
    return await budgetCollection.findOne({
      _id: new ObjectId(selectedBudgetId),
      userId: new ObjectId(userId),
      budgetType: "expense",
    });
  } else {
    return await budgetCollection.findOne({
      userId: new ObjectId(userId),
      categoryOrSourceId: new ObjectId(categoryId),
      budgetType: "expense",
    });
  }
};

const validateBudgetLimit = (req, budget, amount) => {
  if (budget && budget.amount + amount > budget.limit) {
    req.emitExpenseNotification(
      userId,
      "Expense amount exceeds the budget limit"
    );
    throw new BadRequest("Expense amount exceeds the budget limit");
  }
};

module.exports = {
  fetchExpenseById,
  fetchAllExpense,
  fetchExpenseByUserId,
  pipelineForExpense,
  pipelineForCategoryExpense,
  getBudget,
  validateBudgetLimit,
};
