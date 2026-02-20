const { User } = require("../database");
const { generateKey, prefixes } = require("../utils/CacheUtils");
const CacheService = require("./cacheService");
const service = {};

service.create = async function (body) {
  if (!body) return "User coulnd't be created, body is required";
  return await User.create(body);
};
service.findUserByEmail = async function (email) {
  try {
    if (!email) return "Email is required";

    return await CacheService.getOrSet(
      generateKey(prefixes.CollectionService, "fcbube", { email }),
      {},
      () => User.findOne({ where: { email } }),
    );
  } catch (error) {
    return error;
  }
};

module.exports = service;
