const { ObjectId } = require("mongodb");
const { NotFound } = require("../utils/AppError");

const fetchCategoryById = async (collection, userId) => {
  const existCategory = await collection.findOne({
    _id: new ObjectId(userId),
  });

  if (!existCategory) {
    throw new NotFound("Category does not exist!");
  }
  return existCategory;
};

module.exports = { fetchCategoryById };
