const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

let dbInstance;

async function connectDB() {
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    console.log("Connect Mongo");

    dbInstance = client.db(dbName);
    return dbInstance;
  } catch (err) {
    console.log("Error connecting to mongodb", err);
    throw err;
  }
}

function getDB() {
  if (!dbInstance) {
    throw new Error("DB not initialized");
  }
  return dbInstance;
}

module.exports = { connectDB, getDB };
