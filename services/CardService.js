const { Card, CardFace } = require("../database");
const cacheService = require("./cacheService");
const { generateKey, prefixes } = require("../utils/CacheUtils");
const { getBoundaries } = require("../utils/Utils");

class CardsService {
  async getAllCards(params) {
    try {
      const { limit, offset } = getBoundaries(params);
      return await cacheService.getOrSet(
        generateKey(prefixes.CardService, "gac"),
        { params },
        () =>
          Card.findAndCountAll({
            offset,
            limit,
            order: [["released_at", "DESC"]], // Good practice to have a default sort
            where: params?.where || {},
          }),
      );
    } catch (error) {
      throw error;
    }
  }

  async getCardById(id) {
    return await cacheService.getOrSet(
      generateKey(prefixes.CardService, "gcbi", { id }),
      {},
      () => Card.findByPk(id),
    );
  }

  async doubleFace(ids) {
    return await cacheService.getOrSet(
      generateKey(prefixes.CardService, "gdfbi"),
      { ids },
      () => CardFace.findAll({ where: { cardid: ids } }),
    );
  }
}

module.exports = new CardsService();
