const csv = require("csv-parser");
const stream = require("stream");

/**
 * Parses a CSV stream into an array of JSON objects.
 * @param {ReadableStream} fileStream
 * @returns {Promise<Array>}
 */
const parseCSV = (fileStream) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fileStream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("error", (err) => reject(err))
      .on("end", () => resolve(results));
  });
};

module.exports = { parseCSV };
