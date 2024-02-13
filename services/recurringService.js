const { BadRequest, NotFound } = require("../utils/AppError");
const { getCollections } = require("../utils/handleCollection");
const moment = require("moment");
const { fetchCategoryById } = require("./categoryService");
const { fetchSourceById } = require("./sourceService");
const { ObjectId } = require("mongodb");

const fetchRecurringById = async (collection, id) => {
  const existRecurring = await collection.findOne({
    _id: new ObjectId(id),
  });
  if (!existRecurring) {
    throw new NotFound("Recurring is not found");
  }
  return existRecurring;
};

const validCategoryOrSource = async (
  recurType,
  categoryOrSourceId,
  existRecurType
) => {
  const { categoryCollection, sourceCollection } = await getCollections();
  let categoryOrSource;

  if (recurType === "expense" || existRecurType === "expense") {
    categoryOrSource = await fetchCategoryById(
      categoryCollection,
      categoryOrSourceId
    );
  } else if (recurType === "income") {
    categoryOrSource = await fetchSourceById(
      sourceCollection,
      categoryOrSourceId
    );
  }

  if (!categoryOrSource) {
    throw new NotFound({ message: "Category or source not found" });
  }
  return categoryOrSource;
};

const addRecurringExpenses = async (recurringExpense, isExpense) => {
  try {
    if (recurringExpense.paused === true) {
      return;
    }

    const { expenseCollection, incomeCollection } = await getCollections();
    const currentDate = moment().format("DD-MM-YYYY");

    if (
      recurringExpense.frequency !== "Daily" ||
      (recurringExpense.startDate <= currentDate &&
        recurringExpense.endDate >= currentDate)
    ) {
      const {
        title,
        amount,
        currency,
        userId,
        categoryOrSourceId,
        description,
      } = recurringExpense;

      const newExpense = {
        title,
        amount,
        currency,
        userId,
        categoryId: categoryOrSourceId,
        date: currentDate,
        notes: description,
      };
      const newIncome = {
        title,
        amount,
        currency,
        userId,
        sourceId: categoryOrSourceId,
        date: currentDate,
        notes: description,
      };
      if (isExpense) {
        console.log("in exepnse");
        await expenseCollection.insertOne(newExpense);
      } else {
        console.log("in income");
        await incomeCollection.insertOne(newIncome);
      }
    }
  } catch (error) {
    console.error("Error adding recurring expenses:", error);
  }
};

const handleRecurring = async (frequency, startDate, endDate, isExpense) => {
  const currentDate = moment();
  const startMoment = moment(startDate, "DD-MM-YYYY");

  let shouldContinue = true;

  if (!endDate) {
    shouldContinue = true;
  } else {
    shouldContinue = currentDate.isBefore(moment(endDate, "DD-MM-YYYY"));
  }

  switch (frequency) {
    case "Daily":
      const timeUntilNextDay = startMoment
        .clone()
        .add(1, "day")
        .diff(currentDate, "milliseconds");

      if (timeUntilNextDay > 0) {
        setTimeout(async () => {
          // await addRecurringExpenses(recurringExpense);

          const dailyInterval = 24 * 60 * 60 * 1000;
          const endMoment = moment(endDate, "DD-MM-YYYY");

          const recurringInterval = setInterval(async () => {
            const recurringExpense = await getActiveRecurringExpense();
            console.log("before pause value", recurringExpense.paused);
            if (
              recurringExpense &&
              shouldContinue &&
              recurringExpense.paused === false
            ) {
              console.log("after pause change", recurringExpense.paused);
              await addRecurringExpenses(recurringExpense, false);
            } else {
              clearInterval(recurringInterval);
            }
          }, 3000);
        }, 2000);
      } else {
        throw new BadRequest("Start date is in the past");
      }
      break;

    case "Weekly":
      const daysUntilNextWeek = 7 - startMoment.diff(currentDate, "days");
      const timeUntilNextWeek = daysUntilNextWeek * 24 * 60 * 60 * 1000;

      setTimeout(async () => {
        await addRecurringExpenses();
        const weeklyInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const endMoment = moment(endDate, "DD-MM-YYYY");

        const recurringInterval = setInterval(async () => {
          const recurringExpense = await getActiveRecurringExpense();
          if (shouldContinue && recurringExpense.paused === false) {
            await addRecurringExpenses(recurringExpense);
          } else {
            clearInterval(recurringInterval);
          }
        }, weeklyInterval);
      }, timeUntilNextWeek);
      break;

    case "Yearly":
      const yearsUntilNextYear = startMoment.diff(currentDate, "years", true);
      const monthsUntilNextYear =
        (yearsUntilNextYear - Math.floor(yearsUntilNextYear)) * 12;
      const daysUntilNextYear =
        (monthsUntilNextYear - Math.floor(monthsUntilNextYear)) * 30;
      const timeUntilNextYear =
        (yearsUntilNextYear * 365 +
          monthsUntilNextYear * 30 +
          daysUntilNextYear) *
        24 *
        60 *
        60 *
        1000;

      setTimeout(async () => {
        await addRecurringExpenses();
        const yearlyInterval = 365 * 24 * 60 * 60 * 1000; // 365 days in milliseconds (approx)
        const endMoment = moment(endDate, "DD-MM-YYYY");

        const recurringInterval = setInterval(async () => {
          const recurringExpense = await getActiveRecurringExpense();
          if (shouldContinue && recurringExpense.paused === false) {
            await addRecurringExpenses(recurringExpense);
          } else {
            clearInterval(recurringInterval);
          }
        }, yearlyInterval);
      }, timeUntilNextYear);
      break;

    default:
      throw new BadRequest("Invalid frequency");
  }
};

const getActiveRecurringExpense = async () => {
  const { recurringCollection } = await getCollections();
  const currentDate = moment().format("DD-MM-YYYY");

  const activeRecurringExpense = await recurringCollection.findOne({
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
  });

  return activeRecurringExpense;
};

const pipelineForRecur = () => {
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
        title: 1,
        amount: 1,
        currency: 1,
        frequency: 1,
        recurType: 1,
        startDate: 1,
        endDate: 1,
        description: 1,
        paused: 1,
        category: { $arrayElemAt: ["$expenseCategory.name", 0] },
        source: { $arrayElemAt: ["$incomeSource.name", 0] },
      },
    },
  ];

  return aggregationPipeline;
};

module.exports = {
  addRecurringExpenses,
  validCategoryOrSource,
  handleRecurring,
  fetchRecurringById,
  pipelineForRecur,
};
