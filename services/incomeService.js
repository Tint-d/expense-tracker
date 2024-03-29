const { ObjectId } = require("mongodb");
const { NotFound } = require("../utils/AppError");
const { getCollections } = require("../utils/handleCollection");

const fetchIncomeById = async (collection, id) => {
  const existIncome = await collection.findOne({
    _id: new ObjectId(id),
  });
  if (!existIncome) {
    throw new NotFound("Income is not found");
  }
  return existIncome;
};

const fetchIncomeByUserId = async (collection, id) => {
  const existuser = await collection.findOne({
    _id: new ObjectId(id),
  });
  if (!existuser) {
    throw new NotFound("User is not found");
  }
  return existuser;
};

const fetchAllIncome = async (income, id) => {
  let aggregationPipeline = [
    {
      $lookup: {
        from: "source",
        localField: "sourceId",
        foreignField: "_id",
        as: "source",
      },
    },
    {
      $unwind: "$source",
    },
    {
      $project: {
        _id: 1,
        amount: 1,
        currency: 1,
        description: 1,
        date: 1,
        source: "$source.name",
      },
    },
  ];

  if (id) {
    aggregationPipeline.unshift({ $match: { _id: new ObjectId(id) } });
  }
  const result = await income.aggregate(aggregationPipeline).toArray();

  return result;
};

const getIncomeBudget = async (selectedBudgetId, categoryId, userId) => {
  const { budgetCollection } = await getCollections();

  if (selectedBudgetId) {
    return await budgetCollection.findOne({
      _id: new ObjectId(selectedBudgetId),
      userId: new ObjectId(userId),
      budgetType: "income",
    });
  } else {
    return await budgetCollection.findOne({
      userId: new ObjectId(userId),
      categoryOrSourceId: new ObjectId(categoryId),
      budgetType: "income",
    });
  }
};

module.exports = {
  fetchIncomeById,
  fetchIncomeByUserId,
  fetchAllIncome,
  getIncomeBudget,
};
