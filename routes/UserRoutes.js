const express = require("express");
const router = express.Router();
const controller = require("../controllers/UserController");

router.get("/", async (req, res) => {
  //   try {
  //     const page = parseInt(req.query.page) || 1;
  //     const limit = parseInt(req.query.limit) || 20;
  //     const result = await CardsService.getAllCards({ page, limit });
  //     res.status(201).json({
  //       total: result.count,
  //       pages: Math.ceil(result.count / limit),
  //       data: result.rows,
  //     });
  //   } catch (error) {
  //     res.status(500).json({ error: "Internal Server Error" });
  //   }
});

router.post("/", controller.create);

router.get("/:id", async (req, res) => {
  try {
    const card = await CardsService.getCardById(req.params.id);
    card
      ? res.status(201).json(card)
      : res.status(404).json({ error: "Card not found" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
