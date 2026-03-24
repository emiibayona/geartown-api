const { syncCards,
  syncSets,
  yugiohSyncCards,
  yugiohSyncSets,
  yugiohSyncArchetypes } = require("../services/SyncService");
const { getGame } = require("../utils/Utils");

const controller = {};

// ----------------------------------
// MAGIC
// ----------------------------------


controller.syncCards = async (req, res) => {
  try {
    const result = await syncCards(getGame(req) || 'magic');
    res.json({ message: "Database updated!", ...result });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
};
controller.syncSets = async (req, res) => {
  try {
    const result = await syncSets(getGame(req) || 'magic');
    res.json({ message: "Database updated!", ...result });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
};

// ----------------------------------
// YU GI OH 
// ----------------------------------

controller.syncYugiohCards = async (req, res) => {
  try {
    const result = await yugiohSyncCards(getGame(req));
    res.json({ message: "Database updated!", ...result });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
};
controller.syncYugiohSets = async (req, res) => {
  try {
    const result = await yugiohSyncSets(getGame(req));
    res.json({ message: "Database updated!", ...result });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
};
controller.syncYugiohArchetypes = async (req, res) => {
  try {
    const result = await yugiohSyncArchetypes(getGame(req));
    res.json({ message: "Database updated!", ...result });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
};




module.exports = controller;
