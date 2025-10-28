const fs = require("fs").promises;
const path = require("path");

const EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour

async function cleanup(directory) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > EXPIRATION_TIME) {
        await fs.unlink(filePath);
        console.log(`Deleted expired file: ${file}`);
      }
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

module.exports = cleanup;
