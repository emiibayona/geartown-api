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
    for (qprods of Object.keys(productsGrouped)) {
      console.log(productsGrouped);
      console.log(prods);
      await Products.bulkCreate(productsGrouped[prods], { transaction });
      cache.push(
        cacheService.invalidate(
          generateKey(prefixes.ProductsService, "gp", {
            type: prods,
          }),
        ),
      );
    }

    await transaction.commit();
    await Promise.all(cache);
    return productsGrouped;
  } catch (error) {
    await transaction?.rollback();
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
    () => Products.findAndCountAll({ where: { type, ...query } }),
  );
};
module.exports = service;
