const { getDB } = require("../db/db");

const getCollections = async () => {
  const userCollection = await getDB("expense").collection("user");
  const expenseCollection = await getDB("expense").collection("expense");
  const incomeCollection = await getDB("expense").collection("income");
  const categoryCollection = await getDB("expense").collection("category");
  const budgetCollection = await getDB("expense").collection("budget");
  const sourceCollection = await getDB("expense").collection("source");
  const recurringCollection = await getDB("expense").collection("recurring");

  return {
    userCollection,
    expenseCollection,
    incomeCollection,
    categoryCollection,
    budgetCollection,
    sourceCollection,
    recurringCollection,
  };
};

module.exports = { getCollections };
