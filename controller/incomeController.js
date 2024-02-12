const { ObjectId } = require("mongodb");
const { getDB } = require("../db/db");
const { fetchUserById } = require("../services/userService");
const { BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");
const { isValidCurrency, formatDateWithMoment } = require("../utils/validate");
const moment = require("moment");
const {
  fetchIncomeById,
  fetchIncomeByUserId,
  fetchAllIncome,
} = require("../services/incomeService");
const { fetchSourceById } = require("../services/sourceService");
const { updateBudgetAmount } = require("../services/budgetService");
const { getCollections } = require("../utils/handleCollection");

exports.getIncome = tryCatch(async (req, res) => {
  const incomeCollection = await getDB("expense").collection("income");

  const income = await fetchAllIncome(incomeCollection);

  res.status(200).json({ message: "Success", income });
});

exports.setIncome = tryCatch(async (req, res) => {
  const incomeCollection = await getDB("expense").collection("income");
  const userCollection = await getDB("expense").collection("user");
  const sourceCollection = await getDB("expense").collection("source");
  const { title, amount, sourceId, date, currency, selectedBudgetId } =
    req.body;
  const userId = req.userId;

  await fetchUserById(userCollection, userId);

  const source = await fetchSourceById(sourceCollection, sourceId);

  const inComeDate = date
    ? formatDateWithMoment(date)
    : moment().format("DD-MM-YYYY");

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }
  const incomeCurrency = currency || "USD";

  const income = {
    title,
    amount,
    currency: incomeCurrency,
    sourceId: new ObjectId(sourceId),
    date: inComeDate,
    userId: new ObjectId(userId),
  };

  const budget = await getBudgetForIncome(selectedBudgetId, sourceId, userId);

  if (budget && budget.amount + amount > budget.limit) {
    req.emitExpenseNotification(
      userId,
      "Expense amount exceeds the budget limit"
    );
    throw new BadRequest("Expense amount exceeds the budget limit");
  }

  await incomeCollection.insertOne(income);

  if (selectedBudgetId) {
    await updateBudgetAmount(
      selectedBudgetId,
      sourceId,
      userId,
      inComeDate,
      false
    );
  } else {
    await updateBudgetAmount(null, sourceId, userId, inComeDate, false);
  }

  const response = {
    amount,
    currency: incomeCurrency,
    title,
    date: inComeDate,
    source: source.name,
  };

  res
    .status(201)
    .json({ message: "Income created successfully", income: response });
});

const getBudgetForIncome = async (selectedBudgetId, sourceId, userId) => {
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
      categoryOrSourceId: new ObjectId(sourceId),
      budgetType: "income",
    });
  }
};

exports.modifyIncome = tryCatch(async (req, res) => {
  const incomeCollection = await getDB("expense").collection("income");
  const userCollection = await getDB("expense").collection("user");
  const { title, amount, sourceId, date, currency } = req.body;
  const userId = req.userId;
  const id = req.params.id;

  await fetchIncomeByUserId(userCollection, userId);

  await fetchIncomeById(incomeCollection, id);

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }

  const incomeCurrency = currency || "USD";
  const incomeDate = date
    ? formatDateWithMoment(date)
    : moment().format("DD-MM-YYYY");

  const updatedExpense = {
    amount,
    sourceId: new ObjectId(sourceId),
    title,
    date: incomeDate,
    currency: incomeCurrency,
  };

  const updateResult = await incomeCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedExpense }
  );

  if (updateResult.modifiedCount === 0) {
    return res.status(400).json({ message: "Update failed" });
  }

  res
    .status(200)
    .json({ message: "Update successful", expense: updatedExpense });
});

exports.getIncomeOne = tryCatch(async (req, res) => {
  const incomeCollection = getDB("expense").collection("income");
  const id = req.params.id;

  await fetchIncomeById(incomeCollection, id);

  const result = await fetchAllIncome(incomeCollection, id);

  res.status(200).json({ message: "true", income: result });
});

exports.allDeleteIncome = tryCatch(async (req, res) => {
  const incomeCollection = await getDB("expense").collection("income");
  const result = await incomeCollection.deleteMany({});
  res.json({ deletedCount: result.deletedCount });
});
