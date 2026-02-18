const { User } = require("../database");
const service = {};

service.create = async function (body) {
  if (!body) return "User coulnd't be created, body is required";
  return await User.create(body);
};

module.exports = service;
