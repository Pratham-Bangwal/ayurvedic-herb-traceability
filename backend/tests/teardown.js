const mongoose = require('mongoose');

module.exports = async () => {
  if (global.__SKIP_DB__) return;
  try {
    await mongoose.connection.dropDatabase();
  } catch (e) {
    /* ignore drop failure in memory mode */
  }
  try {
    await mongoose.disconnect();
  } catch (e) {
    /* ignore disconnect failure in memory mode */
  }
};
