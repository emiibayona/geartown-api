const { clearAll } = require("../services/cacheService");

controller = {};

controller.flushAll = () => {
  clearAll();
};
module.exports = controller;
