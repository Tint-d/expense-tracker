const { ObjectId } = require("mongodb");
const { fetchCategoryById } = require("../services/categoryService");
const { fetchSourceById } = require("../services/sourceService");
const { BadRequest, NotFound } = require("../utils/AppError");
const { getCollections } = require("../utils/handleCollection");
const { tryCatch } = require("../utils/tryCatch");
const { formatDateWithMoment, isValidCurrency } = require("../utils/validate");
const moment = require("moment");
const { fetchUserById } = require("../services/userService");
const {
  fetchBudgetById,
  pipelineForBudget,
} = require("../services/budgetService");

exports.getBudget = tryCatch(async (req, res) => {
  const { paginationResult, totalCount } = req.pagination;
  res
    .status(200)
    .json({ message: true, totalBudget: totalCount, budget: paginationResult });
});

exports.setBudget = tryCatch(async (req, res) => {
  const {
    categoryCollection,
    userCollection,
    budgetCollection,
    sourceCollection,
  } = await getCollections();
  const { limit, amount, budgetType, date, categoryOrSourceId, currency } =
    req.body;

  const userId = req.userId;

  await fetchUserById(userCollection, userId);

  if (budgetType !== "expense" && budgetType !== "income") {
    throw new BadRequest({ message: "Invalid budget type" });
  }

  let categoryOrSource;
  if (budgetType === "expense") {
    categoryOrSource = await fetchCategoryById(
      categoryCollection,
      categoryOrSourceId
    );
  } else {
    categoryOrSource = await fetchSourceById(
      sourceCollection,
      categoryOrSourceId
    );
  }

  if (!categoryOrSource) {
    throw new NotFound({ message: "Category or source not found" });
  }

  const budgetDate = date
    ? formatDateWithMoment(date)
    : moment().format("DD-MM-YYYY");

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }

  const budgetCurrency = currency || "USD";

  const newBudget = {
    userId: new ObjectId(userId),
    amount: amount ? amount : 0,
    currency: budgetCurrency,
    limit,
    budgetType,
    date: budgetDate,
    categoryOrSourceId: new ObjectId(categoryOrSourceId),
  };

  await budgetCollection.insertOne(newBudget);

  const response = {
    amount,
    currency: budgetCurrency,
    limit,
    budgetType,
    date: budgetDate,
    categoryOrSource: categoryOrSource.name,
  };

  res
    .status(201)
    .json({ message: "Budget created successfully", budget: response });
});

exports.getOneBudget = tryCatch(async (req, res) => {
  const { budgetCollection, userCollection } = await getCollections();
  const { id } = req.params;
  const userId = req.userId;
  await fetchBudgetById(budgetCollection, id);

  await fetchUserById(userCollection, userId);
  let pipeline = pipelineForBudget();
  pipeline.unshift({ $match: { _id: new ObjectId(id) } });

  const existBudget = await budgetCollection.aggregate(pipeline).toArray();

  res.status(200).json({ message: true, budget: existBudget });
});

exports.modifybudget = tryCatch(async (req, res) => {
  const {
    budgetCollection,
    userCollection,
    sourceCollection,
    categoryCollection,
  } = await getCollections();

  const { id } = req.params;
  const userId = req.userId;
  const { limit, amount, budgetType, date, categoryOrSourceId, currency } =
    req.body;

  await fetchUserById(userCollection, userId);

  const existingBudget = await fetchBudgetById(budgetCollection, id);

  const categoryOrSourceIdToUse =
    categoryOrSourceId || existingBudget.categoryOrSourceId.toString();

  const categoryOrSource =
    existingBudget.budgetType === "expense"
      ? await fetchCategoryById(categoryCollection, categoryOrSourceIdToUse)
      : await fetchSourceById(sourceCollection, categoryOrSourceIdToUse);

  if (!categoryOrSource) {
    throw new NotFound({ message: "Category or source not found" });
  }

  const budgetDate = date
    ? formatDateWithMoment(date)
    : moment().format("DD-MM-YYYY");

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }

  const updatedFields = {
    limit: limit !== undefined ? limit : existingBudget.limit,
    budgetType:
      budgetType !== undefined ? budgetType : existingBudget.budgetType,
    amount: amount !== undefined ? amount : existingBudget.amount,
    currency: currency || existingBudget.currency,
    date: budgetDate,
    categoryOrSourceId: new ObjectId(categoryOrSourceIdToUse),
  };

  const updated = await budgetCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedFields }
  );

  if (updated.modifiedCount === 0) {
    return res.status(400).json({ message: "Update fail" });
  }

  res.status(200).json({ message: "Update Successfully", budget: updated });
});

exports.deleteBudget = tryCatch(async (req, res) => {
  const { budgetCollection, userCollection } = await getCollections();
  const { id } = req.params;
  const userId = req.userId;
  await fetchBudgetById(budgetCollection, id);

  await fetchUserById(userCollection, userId);

  await budgetCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.status(200).json({ message: "Delete Successfully" });
});

exports.deleteAllBudget = tryCatch(async (req, res) => {
  const { budgetCollection } = await getCollections();
  const result = await budgetCollection.deleteMany({});
  res.json({ deletedCount: result.deletedCount });
});
