const { User } = require("../database");
const { generateKey, prefixes } = require("../utils/CacheUtils");
const { Games } = require("../utils/constants");
const CacheService = require("./cacheService");
const CartService = require("./CartService")
const service = {};

service.create = async function (body) {
  try {

    let user = await service.findUserByEmail(body.email)
    if (!user) {
      if (!body) return "User coulnd't be created, body is required";
      user = await User.create(body);
    }

    if (user) {
      await service.createCartsForUser(body)
    }

    return user;
  } catch (err) {
    throw err;
  }

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
