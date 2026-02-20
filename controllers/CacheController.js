const cache = require("../services/cacheService");

controller = {};

controller.flushAll = (req, res) => {
  try {
    cache.clearAll();
    return res.status(200);
  } catch (error) {
    return res.status(500);
  }
};

controller.getCache = (req, res) => {
  try {
    const cached = cache.getCache();
    return res.status(200).json({ cached });
  } catch (error) {
    res.status(500);
  }
};
module.exports = controller;
