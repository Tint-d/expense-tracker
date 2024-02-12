const { ObjectId } = require("mongodb");
const { NotFound } = require("../utils/AppError");

const fetchCategoryById = async (collection, categoryId) => {
  try {
    const existCategory = await collection.findOne({
      _id: new ObjectId(categoryId),
    });

    if (!existCategory) {
      throw new NotFound("Category does not exist!");
    }

    return existCategory;
  } catch (error) {
    console.error("Error in fetchCategoryById:", error);
    throw error;
  }
};

module.exports = { fetchCategoryById };
