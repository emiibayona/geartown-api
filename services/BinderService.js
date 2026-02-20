const { CollectionBinders } = require("../database");
const cacheService = require("./cacheService");
const { generateKey, prefixes } = require("../utils/CacheUtils");

const service = {
  getByCollection: async (collection) => {
    try {
      if (!collection) throw "collection required";
      return await cacheService.getOrSet(
        generateKey(prefixes.BinderService, "gac", { collection }),
        {},
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
      const result = await CollectionBinders.create(binder);

      if (result) {
        cacheService.invalidate(
          generateKey(prefixes.BinderService, "gac", {
            collection: result.collectionId,
          }),
        );
      }
      return result;
    } catch (error) {
      return error;
    }
  },
};

module.exports = service;
