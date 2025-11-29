/**
 * Teardown file for Jest tests
 * Runs after all tests have completed
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('Cleaning up test environment...');

  // Clean up test database unless we deliberately skipped connecting
  if (!global.__SKIP_DB__) {
    try {
      await mongoose.connection.dropDatabase();
      console.log('Test database dropped');
    } catch (e) {
      /* ignore drop failure in memory mode */
    }
    try {
      await mongoose.disconnect();
      console.log('Disconnected from test database');
    } catch (e) {
      /* ignore disconnect failure in memory mode */
    }
  }

  // Clean up test uploads (always)
  const testUploadsDir = path.join(__dirname, '..', 'uploads', 'test');
  if (fs.existsSync(testUploadsDir)) {
    const testFiles = fs.readdirSync(testUploadsDir);
    testFiles.forEach((file) => {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(testUploadsDir, file));
      }
    });
    console.log('Test uploads cleaned');
  }
};
