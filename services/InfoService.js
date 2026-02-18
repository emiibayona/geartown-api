const { Set } = require("../database");
const cacheService = require("./cacheService")(86400 * 7);
const { generateKey, prefixes } = require("../utils/CacheUtils");

class InfoService {
  async getAllSets() {
    try {
      return await cacheService.getOrSet(
        generateKey(prefixes.InfoService, "gas"),
        () =>
          Set.findAll({
            order: [["name", "ASC"]], // Good practice to have a default sort
          }),
      );
    } catch (error) {
      return error;
    }
  }

  async getSetsByCode(code) {
    try {
      return await cacheService.getOrSet(
        generateKey(prefixes.InfoService, "gsbc", { code }),
        () =>
          Set.findAll({
            where: { code },
            order: [["name", "ASC"]], // Good practice to have a default sort
          }),
      );
    } catch (error) {
      return error;
    }
  }

  async getCardById(id) {
    return await cacheService.getOrSet(
      generateKey(prefixes.InfoService, "gsbi", { id }),
      () => Set.findByPk(id),
    );
  }
}

module.exports = new InfoService();
