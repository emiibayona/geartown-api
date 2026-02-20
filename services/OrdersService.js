const cacheService = require("./CacheService");
class OrdersService {
  //   async getAllCards(params = { page: 1, limit: 20 }) {
  //     let { offset, limit } = params;
  //     limit = parseInt(limit) || 20;
  //     return await cacheService.getOrSet(
  //       generateKey(prefixes.CardService, "gac", { offset, limit }),
  //       () =>
  //         Card.findAndCountAll({
  //           limit,
  //           offset,
  //           order: [["released_at", "DESC"]], // Good practice to have a default sort
  //         }),
  //     );
  //   }
  //   async getCardById(id) {
  //     return await cacheService.getOrSet(
  //       generateKey(prefixes.CardService, "gcbi", { id }),
  //       () => Card.findByPk(id),
  //     );
  //   }

  async getOrders({ game, order, query }) {}
  async createOrder({ game, order }) {}
  async updateOrder({ game, order }) {}
}

module.exports = new OrdersService();
