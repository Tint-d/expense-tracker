const moment = require("moment");
const isValidCurrency = (currency) => {
  if (!currency || currency === "") {
    return true;
  }
  const allowedCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD"];

  return allowedCurrencies.includes(currency);
};

const isValidType = (type) => {
  if (!type || type === "") {
    return true;
  }
  const lowercaseType = type.toLowerCase();
  const allowedType = ["expense", "income"];
  return allowedType.includes(lowercaseType);
};

const validateType = (type) => {
  const lowercaseType = type.toLowerCase();
  if (!isValidType(lowercaseType)) {
    throw new BadRequest("Type is not allowed!");
  }
  return lowercaseType;
};

const formatDateWithMoment = (inputDate) => {
  return moment(inputDate, "DD-MM-YYYY").format("DD-MM-YYYY");
};

function formatDate(inputDate) {
  return inputDate
    ? formatDateWithMoment(inputDate)
    : moment().format("DD-MM-YYYY");
}

const isValidFrequency = (frequency) => {
  if (!frequency || frequency === "") {
    return true;
  }
  const allowedFrequency = ["Daily", "Weekly", "Monthly", "Yearly"];

  return allowedFrequency.includes(frequency);
};

module.exports = {
  isValidCurrency,
  formatDateWithMoment,
  isValidType,
  formatDate,
  validateType,
  isValidFrequency,
};
