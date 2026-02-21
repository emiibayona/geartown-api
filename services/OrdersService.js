const { prefixes, generateKey } = require("../utils/CacheUtils");
const cacheService = require("./cacheService");
const { BuyOrders, sequelize } = require("../database");
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
  async getOrdersResume(game) {
    try {
      if (!game) throw "Game is required";
      return await cacheService.getOrSet(
        generateKey(prefixes.OrdersService, "gores", { game }),
        {},
        () =>
          BuyOrders.findAll({
            attributes: [
              "status",
              [sequelize.fn("COUNT", sequelize.col("status")), "total"],
            ],
            where: game,
            group: ["status"],
            raw: true,
          }),
      );
    } catch (error) {
      return error;
    }
  }
  async createOrder({ game, order }) {
    try {
      if (!order) throw "Order required";
      if (!order?.contact) throw "Contacto es requerido";

      const res = await BuyOrders.create({
        ...order,
        cart:
          typeof order?.cart === "string"
            ? order.cart
            : JSON.stringify(order.cart),
        game,
      });

      cacheService.invalidate(
        generateKey(prefixes.OrdersService, "gos", { game }),
      );
      cacheService.invalidate(
        generateKey(prefixes.OrdersService, "gores", { game }),
      );

      return res;
    } catch (error) {
      throw error;
    }
  }
  async updateOrder({ game, order }) {
    try {
      if (!order) throw "Order requerida";
      if (!order?.name) throw "Nombre requerido";
      if (!order?.contact) throw "Contacto requerido";

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
