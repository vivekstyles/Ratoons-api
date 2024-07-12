const mongoose = require('mongoose');

mongoose.connection.on('error', (err) => {
  console.log('Connection error', err);
});
module.exports = async () => {
  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(process.env.MONGO_URL);
    // console.log('DB connected successfully');
  } catch (error) {
    console.error('db connect error: ', error);
  }
};
