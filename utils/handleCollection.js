const { getDB } = require("../db/db");

const getCollections = async () => {
  const transactionCollection = await getDB("expense").collection(
    "transaction"
  );
  const userCollection = await getDB("expense").collection("user");
  const expenseCollection = await getDB("expense").collection("expense");
  const incomeCollection = await getDB("expense").collection("income");

  return {
    transactionCollection,
    userCollection,
    expenseCollection,
    incomeCollection,
  };
};

module.exports = { getCollections };
