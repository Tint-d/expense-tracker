const { ObjectId } = require("mongodb");
const { NotFound } = require("../utils/AppError");

const fetchSourceById = async (collection, id) => {
  const existSource = await collection.findOne({
    _id: new ObjectId(id),
  });

  if (!existSource) {
    throw new NotFound("Category does not exist!");
  }
  return existSource;
};

module.exports = { fetchSourceById };
