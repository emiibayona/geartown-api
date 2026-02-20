const { clearAll, getCache } = require("../services/cacheService");

controller = {};

controller.flushAll = (req, res) => {
  try {
    clearAll();
    return res.status(200);
  } catch (error) {}
};

controller.getCache = (req, res) => {
  try {
    const cache = getCache();
    return res.status(200).json({ cache });
  } catch (error) {
    res.status(500);
  }
};
module.exports = controller;
