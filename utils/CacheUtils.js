const util = {};

util.prefixes = Object.freeze({
  CardService: "CS",
  UserService: "US",
  CollectionService: "ClS",
  SyncService: "SS",
  InfoService: "IS",
  ProductsService: "PS",
  BinderService: "BS",
});
/**
 * Generates a stable cache key from an object of parameters
 */
util.generateKey = function generateKey(prefix, method, params = {}) {
  // Sort keys so {limit:20, page:1} and {page:1, limit:20} result in the same key
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join(":");
  return `${prefix}:${method}:${sortedParams}`;
};

module.exports = util;
