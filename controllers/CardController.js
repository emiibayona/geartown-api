const service = require("../services/CardService");

const controller = {};

controller.getAll = async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await service.getAllCards({ page, limit });

    res.json({
      total: result.count,
      pages: Math.ceil(result.count / limit),
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

controller.getById = async function (req, res) {
  try {
    const card = await service.getCardById(req.params.id);
    card ? res.json(card) : res.status(404).json({ error: "Card not found" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

controller.doubleFace = async function (req, res) {
  try {
    const card = await service.doubleFace(req.body);
    card ? res.json(card) : res.status(404).json({ error: "Card not found" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = controller;
