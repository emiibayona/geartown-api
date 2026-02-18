const { syncCards, syncSets } = require("../services/SyncService");

const controller = {};

controller.syncCards = async (req, res) => {
  try {
    const result = await syncCards();
    res.json({ message: "Database updated!", ...result });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
};
controller.syncSets = async (req, res) => {
  try {
    const result = await syncSets();
    res.json({ message: "Database updated!", ...result });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
};

module.exports = controller;
