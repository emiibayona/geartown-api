const controller = {};
const { addProducts, getProducts } = require("../services/ProductService");
const { parseCSV } = require("../utils/CsvParser");

controller.addProducts = async function (req, res) {
  try {
    if (!req.file || !req.body) {
      return res.status(400).json({ error: "CSV file or body is required" });
    }
    let rows = [];
    if (req.file) {
      // 1. Convert buffer to stream
      const bufferStream = new require("stream").PassThrough();
      bufferStream.end(req.file.buffer);

      // 2. Parse CSV
      rows = await parseCSV(bufferStream);
    } else {
      rows = req.body;
    }

    // 3. Add to Database
    const result = await addProducts(rows);

    return res.status(200).json({
      success: true,
      message: "Products added successfully",
      result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Failed to add products", message: error });
  }
};

controller.getProducts = async function (req, res) {
  try {
    const { type } = req.params;
    const result = await getProducts(type);

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve products" });
  }
};
module.exports = controller;
