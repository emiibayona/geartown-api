const { prefixes, generateKey } = require("../utils/CacheUtils");
const cacheService = require("./CacheService");
const { BuyOrders } = require("../database");
const { getBoundaries } = require("../utils/Utils");
const { removeCardsFromCollection } = require("./CollectionService");
class OrdersService {
  async getOrders({ game, order, query }) {
    try {
      if (!game) throw "Game is required";
      if (order) {
        return await cacheService.getOrSet(
          generateKey(prefixes.OrdersService, "gobi", { game }),
          { order },
          () => BuyOrders.findByPk(order),
        );
      } else {
        const where = {
          game: game,
          status: query?.status || "",
        };
        if (!query?.status) {
          delete where.status;
        }
        return await cacheService.getOrSet(
          generateKey(prefixes.OrdersService, "gos", { game }),
          { query },
          () =>
            BuyOrders.findAll({
              where,
              order: [["createdAt", "ASC"]],
            }),
        );
      }
    } catch (error) {
      throw error;
    }
  }
  async createOrder({ game, order }) {
    try {
      if (!order) throw "Order required";
      if (!order?.contact) throw "Contacto es requerido";

      return await BuyOrders.create({ ...order, game });
    } catch (error) {
      throw error;
    }
  }
  async updateOrder({ game, order }) {
    try {
      if (!order) throw "Order requerida";
      //   if (!order?.cards )
      //     throw "Minimo una carta es requerida para procesar la orden";

      const result = await removeCardsFromCollection(order);

      if (result?.length) {
        await BuyOrders.update(
          {
            cart: JSON.stringify(result),
            status:
              order.cart.length === result.length ? "complete" : "incomplete",
          },
          { where: { id: order.id } },
        );
        cacheService.invalidate(
          generateKey(prefixes.OrdersService, "gobi", { game }),
          { order: order.id },
        );
      }
      return;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OrdersService();
