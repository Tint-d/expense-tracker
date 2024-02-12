const { ObjectId } = require("mongodb");
const { fetchUserById } = require("../services/userService");
const { BadRequest, NotFound } = require("../utils/AppError");
const { getCollections } = require("../utils/handleCollection");
const { tryCatch } = require("../utils/tryCatch");
const {
  formatDateWithMoment,
  isValidCurrency,
  isValidFrequency,
} = require("../utils/validate");
const moment = require("moment");
const {
  handleRecurring,
  validCategoryOrSource,
  fetchRecurringById,
} = require("../services/recurringService");

exports.getRecurring = tryCatch(async (req, res) => {
  const { paginationResult, totalCount } = req.pagination;
  res.status(200).json({
    message: true,
    totalRecur: totalCount,
    Recurring: paginationResult,
  });
});

exports.setRecurring = tryCatch(async (req, res) => {
  const { recurringCollection, userCollection } = await getCollections();
  const {
    title,
    amount,
    frequency,
    categoryOrSourceId,
    startDate,
    endDate,
    recurType,
    description,
    currency,
  } = req.body;

  const userId = req.userId;

  await fetchUserById(userCollection, userId);

  if (recurType !== "expense" && recurType !== "income") {
    throw new BadRequest("Invalid recurring type");
  }

  const categoryOrSource = await validCategoryOrSource(
    recurType,
    categoryOrSourceId
  );
  const recurringStartDate = startDate
    ? formatDateWithMoment(startDate)
    : moment().format("DD-MM-YYYY");
  const recurringEndDate = endDate
    ? formatDateWithMoment(endDate)
    : moment().format("DD-MM-YYYY");

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }

  if (!isValidFrequency(frequency)) {
    throw new BadRequest("Frequency is not allowed!");
  }

  const recurringCurrency = currency || "USD";

  const newRecur = {
    title: title || "default title",
    frequency,
    userId: new ObjectId(userId),
    amount,
    currency: recurringCurrency,
    recurType,
    startDate: recurringStartDate,
    endDate: recurringEndDate,
    description: description || "default description",
    categoryOrSourceId: new ObjectId(categoryOrSourceId),
    paused: false,
  };

  await recurringCollection.insertOne(newRecur);

  await handleRecurring(frequency, startDate, endDate);

  const response = {
    title,
    frequency,
    amount,
    currency: recurringCurrency,
    recurType,
    startDate: recurringStartDate,
    endDate: recurringEndDate,
    description,
    categoryOrSource: categoryOrSource.name,
  };

  res
    .status(201)
    .json({ message: "Recurring created successfully", Recur: response });
});

exports.modifyRecurring = tryCatch(async (req, res) => {
  const { recurringCollection, userCollection } = await getCollections();
  const {
    title,
    amount,
    frequency,
    categoryOrSourceId,
    startDate,
    endDate,
    recurType,
    description,
    currency,
  } = req.body;

  const userId = req.userId;

  const id = req.params.id;

  const existRecur = await fetchRecurringById(recurringCollection, id);
  await fetchUserById(userCollection, userId);
  if (recurType && recurType !== "expense" && recurType !== "income") {
    throw new BadRequest("Invalid recurring type");
  }

  await validCategoryOrSource(
    recurType,
    categoryOrSourceId
      ? categoryOrSourceId
      : existRecur.categoryOrSourceId.toString(),
    existRecur.recurType
  );
  const recurringStartDate = startDate
    ? formatDateWithMoment(startDate)
    : moment().format("DD-MM-YYYY");
  const recurringEndDate = endDate
    ? formatDateWithMoment(endDate)
    : moment().format("DD-MM-YYYY");

  if (!isValidCurrency(currency)) {
    throw new BadRequest("Currency is not allowed!");
  }

  if (!isValidFrequency(frequency)) {
    throw new BadRequest("Frequency is not allowed!");
  }

  const recurringCurrency = currency || "USD";

  const newRecur = {
    title: title ? title : existRecur.title,
    frequency: frequency ? frequency : existRecur.frequency,
    userId: new ObjectId(userId),
    amount: amount ? amount : existRecur.amount,
    currency: currency ? recurringCurrency : existRecur.currency,
    recurType: recurType ? recurType : existRecur.recurType,
    startDate: startDate ? recurringStartDate : existRecur.startDate,
    endDate: endDate ? recurringEndDate : existRecur.endDate,
    description: description ? description : existRecur.description,
    categoryOrSourceId: categoryOrSourceId
      ? new ObjectId(categoryOrSourceId)
      : existRecur.categoryOrSourceId,
  };

  const updatedRecur = await recurringCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: newRecur }
  );

  if (updatedRecur.modifiedCount === 0) {
    return res.status(400).json({ message: "Update fail" });
  }

  res
    .status(201)
    .json({ message: "Recurring updated successfully", Recur: newRecur });
});

exports.pauseRecurring = tryCatch(async (req, res) => {
  const { recurringCollection } = await getCollections();
  const { recurringId } = req.params;

  const updatedRecur = await recurringCollection.updateOne(
    { _id: new ObjectId(recurringId) },
    { $set: { paused: true } }
  );

  if (!updatedRecur) {
    throw new NotFound({ message: "Recurring expense not found" });
  }

  res.status(200).json({ message: "Recurring expense paused successfully" });
});

exports.resumeRecurring = tryCatch(async (req, res) => {
  const { recurringCollection } = await getCollections();
  const { recurringId } = req.params;

  await recurringCollection.updateOne(
    { _id: new ObjectId(recurringId) },
    { $set: { paused: false } }
  );

  const recurringExpense = await recurringCollection.findOne({
    _id: new ObjectId(recurringId),
  });

  if (!recurringExpense) {
    throw new NotFound({ message: "Recurring expense not found" });
  }

  if (!recurringExpense.paused) {
    await handleRecurring(
      recurringExpense.frequency,
      recurringExpense.startDate,
      recurringExpense.endDate
    );
  }

  res.status(200).json({ message: "Recurring expense resumed successfully" });
});

exports.deleteAllRecurring = tryCatch(async (req, res) => {
  const { recurringCollection } = await getCollections();
  await recurringCollection.deleteMany();

  res.status(200).json({ message: "Delete Successfully!" });
});
