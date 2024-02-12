const { ObjectId } = require("mongodb");
const { getCollections } = require("../utils/handleCollection");
const { tryCatch } = require("../utils/tryCatch");
const { fetchExpenseById } = require("./expenseService");
const { BadRequest, NotFound } = require("../utils/AppError");

const updateBudgetAmount = async (
  selectedBudgetId,
  categoryOrSourceId,
  userId,
  transactionDate,
  isExpense
) => {
  try {
    const { budgetCollection, expenseCollection, incomeCollection } =
      await getCollections();
    const filter = getFilter(
      selectedBudgetId,
      categoryOrSourceId,
      userId,
      isExpense
    );

    const budget = await budgetCollection.findOne(filter);
    if (budget) {
      const transactionCollection = isExpense
        ? expenseCollection
        : incomeCollection;

      const totalTransactions = await transactionCollection
        .find({
          [isExpense ? "categoryId" : "sourceId"]: new ObjectId(
            categoryOrSourceId
          ),
          date: transactionDate,
        })
        .toArray();

      const transactionAmount = totalTransactions.slice(-1)[0]?.amount || 0;

      const updatedBudgetAmount = budget.amount + transactionAmount;

      const bulkOperations = [
        {
          updateOne: {
            filter: { _id: budget._id },
            update: {
              $set: {
                amount: updatedBudgetAmount,
              },
              $push: {
                expenseId: new ObjectId(totalTransactions.slice(-1)[0]?._id),
              },
            },
          },
        },
      ];

      await budgetCollection.bulkWrite(bulkOperations);
    }
  } catch (error) {
    console.log("Error:", error);
  }
};

const deleteExpenseAndUpdateBudget = async (
  selectedBudgetId,
  categoryOrSourceId,
  userId,
  isExpense,
  deleteExpenseId
) => {
  const { expenseCollection, budgetCollection } = await getCollections();
  const filter = getFilter(
    selectedBudgetId,
    categoryOrSourceId,
    userId,
    isExpense
  );

  const budget = await budgetCollection.findOne(filter);

  if (budget) {
    await fetchExpenseById(expenseCollection, deleteExpenseId);

    const deletedExpense = await expenseCollection.findOne({
      _id: new ObjectId(deleteExpenseId),
    });

    const transactionAmount = deletedExpense?.amount || 0;

    const updatedBudgetAmount = budget.amount - transactionAmount;
    const bulkOperations = [
      {
        updateOne: {
          filter: { _id: budget._id },
          update: {
            $set: {
              amount: updatedBudgetAmount,
            },
            $pull: { expenseId: new ObjectId(deleteExpenseId) },
          },
        },
      },
    ];

    await budgetCollection.bulkWrite(bulkOperations);
  }
};

const getFilter = (selectedBudgetId, categoryOrSourceId, userId) =>
  selectedBudgetId
    ? { _id: new ObjectId(selectedBudgetId) }
    : {
        userId: new ObjectId(userId),
        categoryOrSourceId: new ObjectId(categoryOrSourceId),
        budgetType: "expense",
      };

const fetchBudgetById = async (collection, id) => {
  const existBudget = await collection.findOne({
    _id: new ObjectId(id),
  });
  if (!existBudget) {
    throw new NotFound("Budget is not found");
  }
  return existBudget;
};

const pipelineForBudget = () =>{
    const aggregationPipeline = [
      {
        $lookup: {
          from: "category",
          localField: "categoryOrSourceId",
          foreignField: "_id",
          as: "expenseCategory",
        },
      },
      {
        $lookup: {
          from: "source",
          localField: "categoryOrSourceId",
          foreignField: "_id",
          as: "incomeSource",
        },
      },
      {
        $project: {
          amount: 1,
          currency: 1,
          limit: 1,
          budgetType: 1,
          date: 1,
          category: { $arrayElemAt: ["$expenseCategory.name", 0] },
          source: { $arrayElemAt: ["$incomeSource.name", 0] },
        },
      },
    ];
    return aggregationPipeline
}
module.exports = { updateBudgetAmount, deleteExpenseAndUpdateBudget ,fetchBudgetById,pipelineForBudget};
