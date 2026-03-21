const { User } = require("../database");
const { generateKey, prefixes } = require("../utils/CacheUtils");
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
      const base = {
        tenant: body.tenant,
        email: body.email,
        data: "[]",
        game: 'magic',
      };

      await CartService.create({ ...base, type: 'cart' })
      await CartService.create({ ...base, type: 'wishlist' })
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
