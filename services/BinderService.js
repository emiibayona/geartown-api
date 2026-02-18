const { CollectionBinders } = require("../database");
const cacheService = require("./cacheService")(86400);
const { generateKey, prefixes } = require("../utils/CacheUtils");

const service = {
  getByCollection: async (collection) => {
    try {
      if (!collection) throw "collection required";
      return await cacheService.getOrSet(
        generateKey(prefixes.BinderService, "gac", { collection }),
        () =>
          CollectionBinders.findOne({ where: { collectionId: collection } }),
      );
    } catch (error) {
      return error;
    }
  },
  createBinder: async (binder) => {
    try {
      if (!binder) throw "collection required";
      return await CollectionBinders.create(binder);
    } catch (error) {
      return error;
    }
  },
};

module.exports = service;
