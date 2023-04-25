const { createAdapter } = require('@socket.io/mongo-adapter');
const { MongoClient } = require('mongodb');
const COLLECTION = 'socket.io-adapter-events';
const DB = 'ssk';
const mongoClient = new MongoClient(process.env.MONGO_URL, {
  useUnifiedTopology: true,
});
const main = async (io) => {
  console.log('Connecting adapter');
  await mongoClient.connect();
  try {
    await mongoClient.db(DB).createCollection(COLLECTION, {
      capped: true,
      size: 1e6,
    });
  } catch (e) {
    // collection already exists
  }
  const mongoCollection = mongoClient.db(DB).collection(COLLECTION);
  io.adapter(createAdapter(mongoCollection));
  console.log('Connected mongo adapter');
};
module.exports = main;
