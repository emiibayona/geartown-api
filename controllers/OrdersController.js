const service = require("../services/OrdersService");

const controller = {};

const getGame = (req) => req.params.game;

controller.getOrders = async (req, res) => {
  try {
    const result = await service.getOrders({
      game: getGame(req),
      query: req.query,
    });
    return res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};
controller.getOrdersResumen = async (req, res) => {
  try {
    const result = await service.getOrdersResume({
      game: getGame(req),
    });
    return res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};
controller.getOrderById = async (req, res) => {
  try {
    const result = await service.getOrders({
      game: getGame(req),
      order: req.params.orderId,
      query: req.query,
    });
    return res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};
controller.createOrder = async (req, res) => {
  try {
    const result = await service.createOrder({
      game: getGame(req),
      order: req.body,
    });
    return res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};
controller.updateOrder = async (req, res) => {
  try {
    const result = await service.updateOrder({
      game: getGame(req),
      order: req.body,
    });
    return res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = controller;
