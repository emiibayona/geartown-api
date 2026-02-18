const service = require("../services/UserService");

const controller = {};

controller.create = async (req, res) => {
  try {
    const result = await service.create(req.body);
    res.json({ message: "User created", result });
  } catch (error) {
    console.error("Error on creating", error.message);
    throw error;
  }
};

module.exports = controller;
