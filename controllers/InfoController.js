const {
  getAllSets,
  getSetById,
  getSetsByCode,
} = require("../services/InfoService");

const controller = {};

controller.getSets = async (req, res) => {
  try {
    const result = await getAllSets();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
};
controller.getSetsByCode = async (req, res) => {
  try {
    const result = await getSetsByCode(req.params.code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
};
controller.getSetByid = async (req, res) => {
  try {
    const result = await getSetById(req.params.id);
    res.json({ message: "Database updated!", ...result });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

module.exports = controller;
