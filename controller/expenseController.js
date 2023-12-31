const { ObjectId } = require("mongodb");
const { getDB } = require("../db/db");
const { NotFound, BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");
const moment = require("moment");
const { isValidCurrency, formatDateWithMoment } = require("../utils/validate");
const {
  fetchExpenseById,
  fetchAllExpense,
  fetchExpenseByUserId,
} = require("../services/expenseService");
const { fetchUserById } = require("../services/userService");
const { fetchCategoryById } = require("../services/categoryService");

exports.searchExpense = tryCatch(async (req, res) => {
  const expenseCollection = await getDB("expense").collection("expense");
  const name = req.query;
  const regex = new RegExp(name, "i");
  if (name) {
  }
});

exports.getExpense = tryCatch(async (req, res) => {
  const expenseCollection = await getDB("expense").collection("expense");

  const expenses = await fetchAllExpense(expenseCollection);

  res.status(200).json({ message: "Success", expense: expenses });
});

exports.setExpense = tryCatch(async (req, res) => {
  const expenseCollection = await getDB("expense").collection("expense");
  const userCollection = await getDB("expense").collection("user");
  const categoryCollection = await getDB("expense").collection("category");
  const { amount, description, date, categoryId, currency } = req.body;

  const userId = req.userId;

  await fetchUserById(userCollection, userId);

  const category = await fetchCategoryById(categoryCollection, categoryId);

  const expenseDate = date
    ? formatDateWithMoment(date)
    : moment().format("DD-MM-YYYY");

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }

  const expenseCurrency = currency || "USD";

  const expense = {
    amount,
    currency: expenseCurrency,
    categoryId: new ObjectId(categoryId),
    description,
    date: expenseDate,
    userId: new ObjectId(userId),
  };

  await expenseCollection.insertOne(expense);

  const response = {
    amount,
    currency: expenseCurrency,
    categoryName: category.name,
    description,
    date: expenseDate,
  };

  res
    .status(201)
    .json({ message: "Expense created successfully", expense: response });
});

exports.modifyExpense = tryCatch(async (req, res) => {
  const expenseCollection = await getDB("expense").collection("expense");
  const userCollection = await getDB("expense").collection("user");
  const { amount, description, date, categoryId, currency } = req.body;
  const userId = req.userId;
  const id = req.params.id;

  await fetchExpenseByUserId(userCollection, userId);

  await fetchExpenseById(expenseCollection, id);

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }

  const expenseCurrency = currency || "USD";
  const expenseDate = date
    ? formatDateWithMoment(date)
    : moment().format("DD-MM-YYYY");

  const updatedExpense = {
    amount,
    description,
    date: expenseDate,
    categoryId: new ObjectId(categoryId),
    currency: expenseCurrency,
  };

  const updateResult = await expenseCollection.updateOne(
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

exports.getExpenseOne = tryCatch(async (req, res) => {
  const expenseCollection = getDB("expense").collection("expense");
  const id = req.params.id;

  await fetchExpenseById(expenseCollection, id);

  const result = await fetchAllExpense(expenseCollection, id);

  res.status(200).json({ message: "true", expesnse: result });
});

exports.allDeleteExpense = tryCatch(async (req, res) => {
  const expenseCollection = await getDB("expense").collection("expense");
  const result = await expenseCollection.deleteMany({});
  res.json({ deletedCount: result.deletedCount });
});
