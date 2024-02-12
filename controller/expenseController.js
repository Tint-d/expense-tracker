const { ObjectId } = require("mongodb");
const { getDB } = require("../db/db");
const { BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");
const moment = require("moment");
const { isValidCurrency, formatDateWithMoment } = require("../utils/validate");
const {
  fetchExpenseById,
  fetchAllExpense,
} = require("../services/expenseService");
const { fetchUserById } = require("../services/userService");
const { fetchCategoryById } = require("../services/categoryService");
const { getCollections } = require("../utils/handleCollection");
const {
  updateBudgetAmount,
  deleteExpenseAndUpdateBudget,
} = require("../services/budgetService");

exports.filterExpenseByCategoryId = tryCatch(async (req, res) => {
  const { categoryCollection } = await getCollections();
  const { id } = req.params;
  const { paginationResult, totalCount } = req.pagination;

  await fetchCategoryById(categoryCollection, id);

  res
    .status(200)
    .json({ message: "Success", totalCount, expenses: paginationResult });
});

exports.getExpense = async (req, res) => {
  const { paginationResult, totalCount } = req.pagination;
  res.status(200).json({
    message: "Success",
    totalExpense: totalCount,
    expenses: paginationResult,
  });
};

exports.setExpense = tryCatch(async (req, res) => {
  const { expenseCollection, userCollection } = await getCollections();

  const { title, amount, categoryId, date, notes, currency, selectedBudgetId } =
    req.body;
  const userId = req.userId;

  await fetchUserById(userCollection, userId);

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed");
  }

  const expenseDate = date
    ? formatDateWithMoment(date)
    : moment().format("DD-MM-YYYY");
  const expenseCurrency = currency || "USD";

  const budget = await getBudget(selectedBudgetId, categoryId, userId);

  if (budget && budget.amount + amount > budget.limit) {
    const errorMessage = "Expense amount exceeds the budget limit";
    req.emitExpenseNotification(userId, errorMessage);
    console.log("userId", userId);
    throw new BadRequest(errorMessage);
  }

  const expense = {
    title,
    amount,
    categoryId: new ObjectId(categoryId),
    date: expenseDate,
    notes,
    currency: expenseCurrency,
    userId: new ObjectId(userId),
  };

  await expenseCollection.insertOne(expense);

  if (selectedBudgetId) {
    await updateBudgetAmount(
      selectedBudgetId,
      categoryId,
      userId,
      expenseDate,
      true
    );
  } else {
    await updateBudgetAmount(null, categoryId, userId, expenseDate, true);
  }

  res.status(201).json({ message: "Expense created successfully", expense });
});

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

exports.modifyExpense = tryCatch(async (req, res) => {
  const { expenseCollection, userCollection, categoryCollection } =
    await getCollections();

  const { title, amount, categoryId, date, notes, currency } = req.body;
  const userId = req.userId;
  const { id } = req.params;

  await fetchUserById(userCollection, userId);

  await fetchCategoryById(categoryCollection, categoryId);

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allow");
  }

  const expenseDate = formateDate(date);

  const expenseCurrency = currency || "USD";

  const expense = {
    title,
    amount,
    categoryId: new ObjectId(categoryId),
    date: expenseDate,
    notes,
    currency: expenseCurrency,
  };

  const updated = await expenseCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: expense }
  );

  if (updated.modifiedCount === 0) {
    return res.status(400).json({ message: "Update fail" });
  }

  res.status(200).json({ message: "Update Sucessfully", expense: updated });
});

exports.getExpenseOne = tryCatch(async (req, res) => {
  const expenseCollection = getDB("expense").collection("expense");
  const id = req.params.id;

  await fetchExpenseById(expenseCollection, id);

  const result = await fetchAllExpense(expenseCollection, id);

  res.status(200).json({ message: "true", expesnse: result });
});

exports.deleteExpense = tryCatch(async (req, res) => {
  const { expenseCollection } = await getCollections();
  const { id } = req.params;
  const { selectedBudgetId } = req.body;

  const deletedExpense = await fetchExpenseById(expenseCollection, id);

  const categoryId = deletedExpense.categoryId;

  await deleteExpenseAndUpdateBudget(
    selectedBudgetId,
    categoryId,
    deletedExpense.userId,
    true,
    id
  );
  await expenseCollection.deleteOne({ _id: new ObjectId(id) });

  res.status(200).json({ message: "Delete Successfully" });
});

exports.allDeleteExpense = tryCatch(async (req, res) => {
  const { expenseCollection } = await getCollections();

  const allExpenses = await expenseCollection.find({}).toArray();

  for (const expense of allExpenses) {
    await deleteExpenseAndUpdateBudget(
      req.body.selectedBudgetId,
      expense.categoryId,
      expense.userId,
      true,
      expense._id.toString()
    );
  }

  const result = await expenseCollection.deleteMany({});

  res.json({ deletedCount: result.deletedCount });
});
