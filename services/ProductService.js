const { Products } = require("../database");
const { prefixes, generateKey } = require("../utils/CacheUtils");
const cacheService = require("./CacheService");
const service = {};

service.addProducts = async function (products) {};
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
