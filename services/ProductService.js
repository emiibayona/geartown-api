const { Products, sequelize } = require("../database");
const { prefixes, generateKey } = require("../utils/CacheUtils");
const cacheService = require("./cacheService");
const service = {};

service.addProducts = async function (products) {
  if (!products?.length) return "Ningun producto provisto para agregarse";
  const transaction = await sequelize.transaction();
  try {
    const productsGrouped = Object.groupBy(products, (product) => product.type);
    const cache = [];
    for (prods of Object.keys(productsGrouped)) {
      await Products.bulkCreate(productsGrouped[prods], { transaction });
      cache.push(
        new Promise((resolve) => {
          resolve(
            cacheService.invalidate(
              generateKey(prefixes.ProductsService, "gp", {
                type: prods,
              }),
            ),
          );
        }),
      );
    }

    await transaction.commit();
    await Promise.all(cache);
    return productsGrouped;
  } catch (error) {
    await transaction?.rollback();
    throw error;
  }
};
service.getProducts = async function (type, query = {}) {
  if (!type) {
    return "Type is required";
  }

  return await cacheService.getOrSet(
    generateKey(prefixes.ProductsService, "gp", {
      type,
    }),
    { query },
    () =>
      Products.findAndCountAll({
        where: { type, ...query },
        order: [["updatedAt", "DESC"]],
      }),
  );
};
service.updateProduct = async (body) => {
  try {
    if (!body) throw "Body required";
    const res = await Products.update(body, { where: { id: body.id } });

    if (res >= 1) {
      cacheService.invalidate(
        generateKey(prefixes.ProductsService, "gp", {
          type: body.type,
        }),
      );
    }
    return body;
  } catch (error) {
    throw error;
  }
};
service.deleteProduct = async ({ id, type }) => {
  try {
    if (!id || !type) throw "Id and type required";
    const res = await Products.destroy({ where: { id } });
    if (res >= 1) {
      cacheService.invalidate(
        generateKey(prefixes.ProductsService, "gp", {
          type,
        }),
      );
    }
    return res;
  } catch (error) {
    throw error;
  }
};
module.exports = service;
