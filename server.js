require("dotenv").config();
const express = require("express");
const { connectDB, getDB } = require("./db/db");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { faker } = require("@faker-js/faker"); // Use 'faker' instead of '@faker-js/faker'
const authRouter = require("./routes/authRoute");
const expenseRouter = require("./routes/expenseRoute");
const incomeRouter = require("./routes/incomeRoute");
const transcationRoute = require("./routes/transcationRoute");

const app = express();
const port = 5000;

// function generateFakeExpenseData() {
//   const name = faker.lorem.words({ min: 1, max: 3 });
//   const amount = faker.number.int();
//   const description = faker.lorem.words();
//   const date = faker.date.soon({ refDate: "2023-01-01T00:00:00.000Z" });
//   const currency = faker.helpers.arrayElement([
//     "USD",
//     "EUR",
//     "GBP",
//     "JPY",
//     "CAD",
//   ]);
//   const categoryId = faker.number.int();
//   const userId = faker.number.int();

//   return {
//     amount,
//     description,
//     date,
//     currency,
//     categoryId,
//     userId,
//   };
//   return { name };
// }

// Function to insert fake expense data into MongoDB
// async function insertFakeExpenses(numRecords) {
//   const db = await getDB("expense");
//   const expensesCollection = db.collection("category");

//   const fakeExpenses = Array.from({ length: numRecords }, () =>
//     generateFakeExpenseData()
//   );

//   try {
//     await expensesCollection.insertMany(fakeExpenses);
//     console.log(`${numRecords} fake expense records inserted successfully.`);
//   } catch (err) {
//     console.error("Error inserting fake expense records:", err);
//   }
// }

connectDB()
  .then(() => {
    app.use(express.json());

    app.use("/api/v1/user", authRouter);
    app.use("/api/v1/expense", expenseRouter);
    app.use("/api/v1/income", incomeRouter);
    app.use("/api/v1/transaction", transcationRoute);

    // insertFakeExpenses(10);

    app.use(notFound);
    app.use(errorHandler);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err, "Connecting error");
  });
