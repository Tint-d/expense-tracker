const { ObjectId } = require("mongodb");
const { NotFound } = require("../utils/AppError");

const fetchSourceById = async (collection, id) => {
  const existSource = await collection.findOne({
    _id: new ObjectId(id),
  });
  console.log(existSource);

  if (!existSource) {
    throw new NotFound("Source does not exist!");
  }
  return existSource;
};

module.exports = { fetchSourceById };
