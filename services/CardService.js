const { Card } = require("../database");
const cacheService = require("./cacheService");
const { generateKey, prefixes } = require("../utils/CacheUtils");

class CardsService {
  async getAllCards(params = { page: 1, limit: 20 }) {
    let { offset, limit } = params;
    limit = parseInt(limit) || 20;

    return await cacheService.getOrSet(
      generateKey(prefixes.CardService, "gac"),
      { offset, limit },
      () =>
        Card.findAndCountAll({
          limit,
          offset,
          order: [["released_at", "DESC"]], // Good practice to have a default sort
        }),
    );
  }

  async getCardById(id) {
    return await cacheService.getOrSet(
      generateKey(prefixes.CardService, "gcbi", { id }),
      {},
      () => Card.findByPk(id),
    );
  }
}

module.exports = new CardsService();
