const { ObjectId } = require("mongodb");
const { NotFound } = require("../utils/AppError");

const fetchUserById = async (collection, userId) => {
  const existingUser = await collection.findOne({
    _id: new ObjectId(userId),
  });

  if (!existingUser) {
    throw new NotFound("User not found!");
  }

  return existingUser;
};

module.exports = { fetchUserById };
