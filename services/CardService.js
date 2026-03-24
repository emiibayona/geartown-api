const { Card, CardFace, yugioh: YugiohModels } = require("../database");
const cacheService = require("./cacheService");
const { generateKey, prefixes } = require("../utils/CacheUtils");
const { getBoundaries } = require("../utils/Utils");
const { Games } = require("../utils/constants");

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

  async getLocalImage({ id, game }) {
    const local = async () => {
      switch (game) {
        case Games.YUGIOH:
          const cdImg = await YugiohModels.Card.findOne({ where: { name: id }, attributes: ["local_url", "id", "name"] })
          return cdImg?.local_url;
        case Games.MAGIC:

          break;
        case Games.POKEMON:

          break;
        case Games.RIFTBOUND:

          break;

        default:
          break;
      }
    }

    return await cacheService.getOrSet(
      generateKey(prefixes.CardService, "gcibg", { game, id }),
      {},
      () => local(),
    );
  }
  async updateLocalImage({ id, game }, url) {
    if (game === Games.YUGIOH) {
      await YugiohModels.Card.update({ local_url: url }, { where: { name: id } })
      cacheService.invalidate(
        generateKey(prefixes.CardService, "gcibg", { game, id })
      );
      return;
    }
  }
}

module.exports = new CardsService();
