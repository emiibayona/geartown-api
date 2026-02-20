const {
  addRowsToCollection,
  findCollectionByUser,
  getCardsByCollection,
  clearCollectionCache,
} = require("../services/CollectionService");
const { parseCSV } = require("../utils/CsvParser");
const controller = {};

controller.initCollection = async function (req, res) {
  try {
    if (!req.file) return res.status(400).send("No file uploaded.");
    const collection = await findCollectionByUser(req.body.user);
    // 1. Convert buffer to stream
    const bufferStream = new require("stream").PassThrough();
    bufferStream.end(req.file.buffer);

    // 2. Parse
    const rows = await parseCSV(bufferStream);

    // 3. Process to Database

    const result = await addRowsToCollection(
      rows,
      req.params.collectionId || collection.collectionId,
    );

    return res.status(200).json({
      message: "Import complete",
      result: { ...result, email: req.body.user },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process CSV" });
  }
};

const getCardsCollection = async (params, query) => {
  try {
    const result = await getCardsByCollection(params.collectionId, query);

    return {
      total: result.count,
      pages: Math.ceil(result.count / (query.limit || 20)),
      data: result.rows,
    };
  } catch (error) {
    res.status(500).json({ error: "Failed on retrieve collection cards" });
  }
};

controller.cardsByCollection = async function (req, res) {
  try {
    const result = await getCardsCollection(req.params, req.query);
    return res.status(200).json(result);
  } catch (error) {}
};

controller.cardsByUser = async function (req, res) {
  try {
    const collection = await findCollectionByUser(req.params.user);
    if (collection) {
      const result = await getCardsCollection(
        { collectionId: collection.collectionId },
        req.query,
      );

      return res.status(200).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed on retrieve collection cards" });
  }
};

controller.flushCache = async (req, res) => {
  try {
    await clearCollectionCache();
    return res.status(200).json("clean");
  } catch (error) {
    return res.status(500);
  }
};
module.exports = controller;
