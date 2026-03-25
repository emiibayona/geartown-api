const express = require("express");
const router = express.Router();
const controller = require("../controllers/CartController");


router.get("/:type", controller.getCartOrWishlist)
router.post("/", controller.create)
router.patch("/:id", controller.update)
router.post("/sync", controller.sync)

module.exports = router;
