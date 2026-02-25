const { Binders } = require("../database");
const cacheService = require("./cacheService");
const { generateKey, prefixes } = require("../utils/CacheUtils");

const service = {
  getAllByCollection: async (collection) => {
    try {
      if (!collection) throw "collection required";
      return await cacheService.getOrSet(
        generateKey(prefixes.BinderService, "gabc", { collection }),
        {},
        () =>
          Binders.findAll({ where: { collectionId: collection } }),
      );
    } catch (error) {
      return error;
    }
  },
  getByName: async (name, collection) => {
    try {
      if (!collection) throw "collection required";
      return await cacheService.getOrSet(
        generateKey(prefixes.BinderService, "gbcn", { collection }),
        { name },
        () =>
          Binders.findOne({
            where: { collectionId: collection, name },
          }),
      );
    } catch (error) {
      return error;
    }
  },
  createBinder: async (binder) => {
    try {
      if (!binder) throw "collection required";
      const result = await Binders.create(binder);

      if (result) {
        cacheService.invalidate(
          generateKey(prefixes.BinderService, "gabc", {
            collection: result.collectionId,
          }),
        );
        cacheService.invalidate(
          generateKey(prefixes.BinderService, "gbcn", {
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
